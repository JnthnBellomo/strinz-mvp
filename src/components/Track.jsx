import React from 'react'
import { getActiveTronWeb, getContract, ensureConnected, toSun } from '../lib/tron'
import { ipfsToHttp } from '../utils/ipfs'
import { CONFIG } from '../config'
import Player from './Player'

export default function Track({ tokenId = CONFIG.DEFAULT_TOKEN_ID }) {
  const [meta, setMeta] = React.useState(null)
  const [priceTRX, setPriceTRX] = React.useState(CONFIG.FALLBACK_PRICE_TRX)
  const [balance, setBalance] = React.useState(0)
  const [buying, setBuying] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  const load = React.useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const tw = getActiveTronWeb()
      const c = await getContract(tw)

      // Load metadata
      const uri = await c.uri(tokenId).call()
      const url = ipfsToHttp(uri)
      const res = await fetch(url)
      const json = await res.json()
      setMeta(json)
      if (json.priceTRX) setPriceTRX(Number(json.priceTRX))

      // Price from contract (if exposed)
      try {
        if (c.price) {
          const p = await c.price(tokenId).call(); setPriceTRX(Number(p)/1_000_000)
        } else if (c.getTrackPrice) {
          const p = await c.getTrackPrice(tokenId).call(); setPriceTRX(Number(p)/1_000_000)
        } else if (c.tracks) {
          const t = await c.tracks(tokenId).call(); const p = t.price ?? t[1]; if (p) setPriceTRX(Number(p)/1_000_000)
        }
      } catch {}

      // Holder balance
      try {
        const addr = tw.defaultAddress?.base58
        if (addr && c.balanceOf) {
          const b = await c.balanceOf(addr, tokenId).call(); setBalance(Number(b))
        }
      } catch {}
    } catch (e) {
      console.error(e)
      setError('Could not load track metadata. Check Base URI and 0.json.')
    } finally {
      setLoading(false)
    }
  }, [tokenId])

  React.useEffect(() => { load() }, [load])

  const buy = async () => {
    setBuying(true)
    try {
      const tw = await ensureConnected()
      const c = await getContract(tw)
      const callValue = toSun(priceTRX)
      await c.buy(tokenId, 1).send({ callValue })
      const b = await c.balanceOf(tw.defaultAddress.base58, tokenId).call(); setBalance(Number(b))
      alert('Purchase submitted! Check TronLink for status.')
    } catch (e) { console.error(e); alert(e?.message || 'Buy failed') }
    finally { setBuying(false) }
  }

  const cover = ipfsToHttp(meta?.image) || '/placeholder-cover.svg'
  const canPlayFull = balance > 0
  const fullSrc = meta?.animation_url || meta?.audio
  const previewSrc = meta?.preview // optional; Player will still gate 30s even if absent

  if (loading) {
    return (
      <div style={{ maxWidth: 560, margin: '40px auto', padding: 20, border: '1px solid #222', borderRadius: 16, background: '#0b0b0b', color: 'white' }}>
        <div style={{display:'flex', gap:16}}>
          <div style={{width:160, height:160, borderRadius:12, background:'#1a1a1a', animation:'pulse 1.2s infinite'}}/>
          <div style={{flex:1}}>
            <div style={{height:18, width:120, background:'#1a1a1a', borderRadius:8, margin:'4px 0', animation:'pulse 1.2s infinite'}}/>
            <div style={{height:28, width:260, background:'#1a1a1a', borderRadius:8, margin:'8px 0', animation:'pulse 1.2s infinite'}}/>
            <div style={{height:14, width:180, background:'#1a1a1a', borderRadius:8, margin:'8px 0', animation:'pulse 1.2s infinite'}}/>
            <div style={{height:36, width:160, background:'#1a1a1a', borderRadius:10, marginTop:12, animation:'pulse 1.2s infinite'}}/>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560, margin: '40px auto', padding: 20, border: '1px solid #222', borderRadius: 16, background: '#0b0b0b', color: 'white' }}>
      {error && (
        <div style={{background:'#3b0d0d', border:'1px solid #792222', padding:10, borderRadius:10, marginBottom:12}}>
          {error}
        </div>
      )}

      <div style={{display:'flex', gap:16}}>
        <img src={cover} alt="cover" style={{width:160, height:160, objectFit:'cover', borderRadius: 12}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:18, opacity:0.8}}>Track #{tokenId}</div>
          <h1 style={{margin:'4px 0 8px 0'}}>{meta?.name || 'Untitled'}</h1>
          <div style={{opacity:0.8, fontSize:14}}>{meta?.artist || meta?.attributes?.artist || ''}</div>
          <div style={{marginTop:12}}>Price: <strong>{priceTRX} TRX</strong></div>
          <div style={{marginTop:8}}>You own: <strong>{balance}</strong></div>
          <div style={{display:'flex', gap:12, marginTop:12}}>
            <button onClick={buy} disabled={buying} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #ccc', background: '#23a36f', color: 'white', cursor: 'pointer' }}>
              {buying ? 'Buying…' : `Buy for ${priceTRX} TRX`}
            </button>
          </div>
        </div>
      </div>

      <div style={{marginTop:16, lineHeight:1.6}}>
        <p>{meta?.description}</p>
      </div>

      <div style={{marginTop:16}}>
        <h3>Listen</h3>
        <Player fullSrc={fullSrc} previewSrc={previewSrc} canPlayFull={canPlayFull} />
      </div>
    </div>
  )
}
