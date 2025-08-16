import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
// Support both CJS and ESM shapes of tronweb export
const TronWebModule = require('tronweb')
const TronWebCtor = TronWebModule?.TronWeb || TronWebModule?.default || TronWebModule

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---- Config ----
const PORT = Number(process.env.PORT || 8787)
const FULLHOST = process.env.TRONGRID_URL
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS
const GATEWAY = (process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud').replace(/\/+$/,'')
const ALLOWED = (process.env.ALLOWED_ORIGIN || '').split(',').map(s=>s.trim()).filter(Boolean)
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev'

// ---- TronWeb (read-only) ----
if (!FULLHOST) {
  console.error('TRONGRID_URL missing in .env')
  process.exit(1)
}
if (!CONTRACT_ADDRESS) {
  console.error('CONTRACT_ADDRESS missing in .env')
  process.exit(1)
}
const tronWeb = new TronWebCtor({ fullHost: FULLHOST })

// ---- Load ABI ----
const abiPath = path.join(__dirname, 'abi', 'Music1155.js')
if (!fs.existsSync(abiPath)) {
  console.error('Missing ABI at backend/abi/Music1155.js')
  process.exit(1)
}
const { default: ABI } = await import(`file://${abiPath}`)
const contract = await tronWeb.contract(ABI, CONTRACT_ADDRESS)

// ---- App ----
const app = express()
app.use(morgan('dev'))
app.use(express.json())

// Strict CORS to your frontend(s)
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true) // allow curl/postman
    const ok = ALLOWED.some(pat => {
      if (pat.includes('*')) {
        const re = new RegExp('^' + pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
        return re.test(origin)
      }
      return pat === origin
    })
    return ok ? cb(null, true) : cb(new Error('CORS: origin not allowed'))
  },
  credentials: false
}))

// ---- In-memory nonce + session store (dev-simple) ----
const nonces = new Map()        // addr -> { nonce, exp }
const sessions = new Map()      // token -> { addr, exp }
const TTL_NONCE_MS = 5 * 60 * 1000
const TTL_SESSION_MS = 30 * 60 * 1000

function mkNonce() { return crypto.randomBytes(16).toString('hex') }
function mkToken() { return crypto.createHmac('sha256', SESSION_SECRET).update(crypto.randomBytes(16)).digest('hex') }

setInterval(() => {
  const now = Date.now()
  for (const [k,v] of nonces) if (v.exp < now) nonces.delete(k)
  for (const [k,v] of sessions) if (v.exp < now) sessions.delete(k)
}, 60 * 1000)

// ---- Signature helpers (TronLink uses message V1/V2; try both) ----
async function verifySignature(addrBase58, message, signature) {
  try {
    if (tronWeb.trx.verifyMessageV2) {
      const ok = await tronWeb.trx.verifyMessageV2(message, signature, addrBase58)
      if (ok) return true
    }
  } catch {}
  try {
    if (tronWeb.trx.verifyMessage) {
      const ok = await tronWeb.trx.verifyMessage(message, signature, addrBase58)
      if (ok) return true
    }
  } catch {}
  return false
}

// Utility: resolve JSON for a token id and extract audio
async function resolveAudioUrl(id) {
  const uri = await contract.uri(id).call()
  const url = String(uri).replace(/^ipfs:\/\//, `${GATEWAY}/ipfs/`)
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Meta ${r.status}`)
  const meta = await r.json()
  const audio = meta.animation_url || meta.audio || meta.track || meta.music || meta.file
  if (!audio) throw new Error('No audio in metadata')
  return String(audio).startsWith('ipfs://') ? `${GATEWAY}/ipfs/${audio.slice(7)}` : audio
}

// ---- Routes ----
app.get('/health', (req,res)=>res.json({ ok:true }))

// 1) Get nonce
app.get('/auth/nonce', (req,res) => {
  const addr = String(req.query.addr || '')
  if (!/^T[A-Za-z0-9]{33,34}$/.test(addr)) return res.status(400).json({ error: 'Bad address' })
  const nonce = mkNonce()
  nonces.set(addr, { nonce, exp: Date.now()+TTL_NONCE_MS })
  const message = `Strinz login\nAddr:${addr}\nNonce:${nonce}`
  res.json({ nonce, message })
})

// 2) Verify signature -> issue session token
app.post('/auth/verify', async (req,res) => {
  const { addr, signature, nonce } = req.body || {}
  if (!/^T[A-Za-z0-9]{33,34}$/.test(addr)) return res.status(400).json({ error: 'Bad address' })
  const rec = nonces.get(addr)
  if (!rec || rec.nonce !== nonce || rec.exp < Date.now()) return res.status(400).json({ error: 'Nonce invalid/expired' })
  const message = `Strinz login\nAddr:${addr}\nNonce:${nonce}`

  const ok = await verifySignature(addr, message, signature)
  if (!ok) return res.status(401).json({ error: 'Signature invalid' })

  nonces.delete(addr)
  const token = mkToken()
  sessions.set(token, { addr, exp: Date.now()+TTL_SESSION_MS })
  res.json({ token, expiresIn: TTL_SESSION_MS/1000 })
})

// 3) Stream (holders only)
app.get('/stream/:id', async (req,res) => {
  try {
    const id = Number(req.params.id)
    const token = String(req.query.token || '')
    const sess = sessions.get(token)
    if (!sess || sess.exp < Date.now()) return res.status(401).json({ error: 'Token invalid/expired' })
    const addr = sess.addr

    // Check holder balance
    const bal = await contract.balanceOf(addr, id).call()
    if (Number(bal) <= 0) return res.status(403).json({ error: 'Not a holder' })

    // Resolve audio URL (IPFS gateway) and proxy with Range support
    const audioUrl = await resolveAudioUrl(id)
    const headers = {}
    if (req.headers.range) headers.Range = req.headers.range
    const r = await fetch(audioUrl, { headers })
    if (!r.ok && r.status !== 206) {
      return res.status(r.status).end(await r.text())
    }

    // Pass through important headers
    res.status(r.status)
    for (const [k,v] of r.headers) {
      if (['content-type','content-length','accept-ranges','content-range'].includes(k.toLowerCase())) {
        res.setHeader(k, v)
      }
    }
    res.setHeader('Cache-Control', 'no-store')
    r.body.pipe(res)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Stream error' })
  }
})

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
