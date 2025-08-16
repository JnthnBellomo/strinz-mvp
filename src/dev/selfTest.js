import abi from '../abi/Music1155.js'
import { ipfsToHttp } from '../utils/ipfs'
import { toSun } from '../lib/tron'

try {
  const names = new Set(abi.map(x => x.name))
  console.assert(Array.isArray(abi), 'ABI must be an array')
  console.assert(names.has('uri'), 'ABI must have uri(uint256)')
  console.assert(names.has('buy'), 'ABI must have buy(uint256,uint256)')
  console.assert(names.has('balanceOf'), 'ABI must have balanceOf(address,uint256)')
  console.assert(ipfsToHttp('ipfs://QmX/0.json').includes('pinata.cloud/ipfs/'), 'ipfsToHttp converts ipfs://')
  console.assert(toSun(15) === 15000000, 'toSun 15 TRX')
  console.assert(toSun('15') === 15000000, 'toSun numeric string')
  console.assert(toSun(0.000001) === 1, 'toSun floor to 1 Sun')
  console.log('✅ selfTest ok')
} catch (e) { console.error('❌ selfTest failed', e) }
