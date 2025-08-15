export const CONFIG = {
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS,
  DEFAULT_TOKEN_ID: Number(import.meta.env.VITE_DEFAULT_TOKEN_ID ?? 0),
  FALLBACK_PRICE_TRX: Number(import.meta.env.VITE_FALLBACK_PRICE_TRX ?? 15),
  TRACK_IDS: (import.meta.env.VITE_TRACK_IDS ?? '0')
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => Number.isFinite(n)),
  SOFT_PREVIEW: String(import.meta.env.VITE_SOFT_PREVIEW ?? 'true').toLowerCase() !== 'false',
  NODES: {
    fullHost: import.meta.env.VITE_TRON_FULLNODE,
    solidityNode: import.meta.env.VITE_TRON_SOLIDITY,
    eventServer: import.meta.env.VITE_TRON_EVENTSERVER,
  },
};
