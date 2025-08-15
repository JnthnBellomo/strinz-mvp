import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, useParams, Link } from 'react-router-dom'
import ConnectButton from './components/ConnectButton'
import Track from './components/Track'
import { CONFIG } from './config'

function TrackPage() {
  const { id } = useParams()
  const tokenId = Number(id)
  return <Track tokenId={Number.isFinite(tokenId) ? tokenId : CONFIG.DEFAULT_TOKEN_ID} />
}

function Nav() {
  const linkStyle = ({ isActive }) => ({
    padding: '8px 10px', borderRadius: 10, textDecoration: 'none',
    color: isActive ? '#fff' : '#bbb', background: isActive ? '#1f2937' : 'transparent'
  })
  return (
    <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #1b1b1b' }}>
      <div style={{fontWeight:700}}><Link to="/" style={{color:'#fff', textDecoration:'none'}}>Strinz</Link></div>
      <nav style={{display:'flex', gap:10}}>
        <NavLink to="/" style={linkStyle} end>Home</NavLink>
        <NavLink to="/tracks" style={linkStyle}>Tracks</NavLink>
        <NavLink to="/profile" style={linkStyle}>Profile</NavLink>
      </nav>
      <ConnectButton />
    </header>
  )
}

export default function App() {
  return (
    <div style={{minHeight:'100vh', background:'#000', color:'#fff'}}>
      <BrowserRouter>
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<Track tokenId={CONFIG.DEFAULT_TOKEN_ID} />} />
            <Route path="/track/:id" element={<TrackPage />} />
            <Route path="/tracks" element={<Tracks />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <footer style={{textAlign:'center', padding:20, opacity:0.6, fontSize:12}}>Shasta testnet • ERC‑1155‑style music editions on TRON</footer>
      </BrowserRouter>
    </div>
  )
}

function Tracks() {
  const [items, setItems] = React.useState([])
  React.useEffect(() => {
    (async () => {
      try {
        const { getActiveTronWeb } = await import('./lib/tron')
        const { ipfsToHttp } = await import('./utils/ipfs')
        const tw = getActiveTronWeb()
        const { default: abi } = await import('./abi/Music1155.js')
        const c = await tw.contract(abi, CONFIG.CONTRACT_ADDRESS)
        const rows = await Promise.all(CONFIG.TRACK_IDS.map(async (id) => {
          try {
            const u = await c.uri(id).call();
            const meta = await fetch(ipfsToHttp(u)).then(r=>r.json()).catch(()=>null)
            return { id, meta }
          } catch { return { id, meta: null } }
        }))
        setItems(rows)
      } catch (e) { console.error(e) }
    })()
  }, [])
  return (
    <div style={{ maxWidth: 960, margin: '30px auto', padding: '0 20px'}}>
      <h1>Tracks</h1>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16}}>
        {items.map(({id, meta}) => (
          <Link key={id} to={`/track/${id}`} style={{ textDecoration:'none', color:'#fff' }}>
            <div style={{border:'1px solid #222', borderRadius:12, padding:12}}>
              <img src={(meta && meta.image) ? ipfsToHttp(meta.image) : '/placeholder-cover.svg'} alt="cover" style={{width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:8}}/>
              <div style={{marginTop:8, fontWeight:700}}>{meta?.name ?? `Track #${id}`}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Profile() {
  const [addr, setAddr] = React.useState(null)
  const [items, setItems] = React.useState([])
  React.useEffect(() => {
    (async () => {
      try {
        const { getActiveTronWeb } = await import('./lib/tron')
        const { ipfsToHttp } = await import('./utils/ipfs')
        const tw = getActiveTronWeb()
        const a = tw?.defaultAddress?.base58; setAddr(a)
        if (!a) return
        const { default: abi } = await import('./abi/Music1155.js')
        const c = await tw.contract(abi, CONFIG.CONTRACT_ADDRESS)
        const rows = []
        for (const id of CONFIG.TRACK_IDS) {
          try {
            const b = await c.balanceOf(a, id).call()
            const owned = Number(b)
            if (owned > 0) {
              const u = await c.uri(id).call()
              const meta = await fetch(ipfsToHttp(u)).then(r=>r.json()).catch(()=>null)
              rows.push({ id, owned, meta })
            }
          } catch {}
        }
        setItems(rows)
      } catch (e) { console.error(e) }
    })()
  }, [])
  return (
    <div style={{ maxWidth: 960, margin: '30px auto', padding: '0 20px'}}>
      <h1>Profile</h1>
      <div style={{opacity:0.8, marginBottom:10}}>Address: {addr ?? 'Not connected'}</div>
      {items.length === 0 ? (
        <div>You don’t own any editions yet.</div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:16}}>
          {items.map(({id, owned, meta}) => (
            <div key={id} style={{border:'1px solid #222', borderRadius:12, padding:12}}>
              <img src={(meta && meta.image) ? ipfsToHttp(meta.image) : '/placeholder-cover.svg'} alt="cover" style={{width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:8}}/>
              <div style={{marginTop:8, fontWeight:700}}>{meta?.name ?? `Track #${id}`}</div>
              <div style={{opacity:0.8}}>Owned: {owned}</div>
              <div style={{marginTop:8}}><Link to={`/track/${id}`} style={{color:'#4ade80'}}>Open</Link></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
