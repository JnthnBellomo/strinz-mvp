import React from 'react'
import { ipfsToHttp } from '../utils/ipfs'

export default function Player({ fullSrc, previewSrc, canPlayFull }) {
  const src = canPlayFull ? fullSrc : (previewSrc || fullSrc)
  const [audioEl, setAudioEl] = React.useState(null)

  React.useEffect(() => {
    if (!audioEl) return
    const onTime = () => {
      if (!canPlayFull && audioEl.currentTime >= 30) audioEl.pause()
    }
    audioEl.addEventListener('timeupdate', onTime)
    return () => audioEl.removeEventListener('timeupdate', onTime)
  }, [audioEl, canPlayFull])

  return (
    <div style={{marginTop:12}}>
      <audio ref={setAudioEl} controls src={ipfsToHttp(src)} style={{ width: '100%' }} />
      {!canPlayFull && (
        <div style={{fontSize:12, opacity:0.8, marginTop:4}}>
          Preview limited to ~30s. Buy to unlock full track.
        </div>
      )}
    </div>
  )
}
