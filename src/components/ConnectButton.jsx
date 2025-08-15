import React from 'react'
import { ensureConnected, getAccountAddressBase58 } from '../lib/tron'

export default function ConnectButton({ onConnected }) {
  const [addr, setAddr] = React.useState(null)
  const [busy, setBusy] = React.useState(false)

  const connect = async () => {
    setBusy(true)
    try {
      await ensureConnected()
      const a = await getAccountAddressBase58()
      setAddr(a)
      onConnected?.(a)
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(false)
    }
  }

  React.useEffect(() => {
    (async () => {
      const a = await getAccountAddressBase58()
      if (a) setAddr(a)
    })()
  }, [])

  return (
    <button onClick={connect} disabled={busy} style={{
      padding: '10px 16px', borderRadius: 12, border: '1px solid #ccc',
      background: '#111', color: 'white', cursor: 'pointer'
    }}>
      {addr ? `Connected: ${addr.slice(0,6)}...${addr.slice(-4)}` : (busy ? 'Connecting…' : 'Connect TronLink')}
    </button>
  )
}
