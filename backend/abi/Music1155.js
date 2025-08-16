const abi = [
  { type: 'function', name: 'uri', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ name: '', type: 'string' }] },
  { type: 'function', name: 'buy', stateMutability: 'payable', inputs: [{ name: 'id', type: 'uint256' }, { name: 'qty', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },

  { type: 'function', name: 'price', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'getTrackPrice', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },

  { type: 'function', name: 'tracks', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [
    { name: 'supply', type: 'uint256' },
    { name: 'price', type: 'uint256' },
    { name: 'artist', type: 'address' },
    { name: 'royaltyBps', type: 'uint96' }
  ] },

  { type: 'function', name: 'createTrack', stateMutability: 'nonpayable', inputs: [
    { name: 'id', type: 'uint256' },
    { name: 'supply', type: 'uint256' },
    { name: 'price', type: 'uint256' },
    { name: 'artist', type: 'address' },
    { name: 'royaltyBps', type: 'uint96' }
  ], outputs: [] },

  { type: 'function', name: 'setBaseURI', stateMutability: 'nonpayable', inputs: [
    { name: 'newBase', type: 'string' }
  ], outputs: [] },
];
export default abi;
