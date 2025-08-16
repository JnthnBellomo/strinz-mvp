export function ipfsToHttp(uri) {
  if (!uri) return null
  if (uri.startsWith('ipfs://')) {
    const path = uri.replace('ipfs://', '')
    return `https://gateway.pinata.cloud/ipfs/${path}`
  }
  return uri
}
