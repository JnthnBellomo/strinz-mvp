import TronWeb from 'tronweb'
import abi from '../abi/Music1155.js'
import { CONFIG } from '../config'

let readonlyTronWeb

export function getReadonlyTronWeb() {
  if (!readonlyTronWeb) {
    readonlyTronWeb = new TronWeb({
      fullHost: CONFIG.NODES.fullHost,
      solidityNode: CONFIG.NODES.solidityNode,
      eventServer: CONFIG.NODES.eventServer,
      headers: { 'TRON-PRO-API-KEY': '' },
    })
  }
  return readonlyTronWeb
}

export function getInjected() {
  if (window.tronWeb && window.tronWeb.ready) return window.tronWeb
  return null
}

export function getActiveTronWeb() {
  return getInjected() || getReadonlyTronWeb()
}

export async function ensureConnected() {
  if (window.tronWeb?.ready) return window.tronWeb
  if (window.tronLink?.request) {
    try {
      await window.tronLink.request({ method: 'tron_requestAccounts' })
      if (window.tronWeb?.ready) return window.tronWeb
    } catch (e) {
      throw new Error('User rejected connection in TronLink')
    }
  }
  throw new Error('TronLink not found. Please install/enable it.')
}

export async function getAccountAddressBase58() {
  const tw = getInjected()
  return tw?.defaultAddress?.base58 || null
}

export async function getContract(tw = getActiveTronWeb()) {
  if (!CONFIG.CONTRACT_ADDRESS) throw new Error('Missing CONTRACT_ADDRESS')
  const contract = await tw.contract(abi, CONFIG.CONTRACT_ADDRESS)
  return contract
}

export function toSun(trx) {
  const n = Number(trx)
  return Number.isFinite(n) ? Math.floor(n * 1_000_000) : NaN
}
