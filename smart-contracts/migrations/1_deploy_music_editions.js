const MusicEditions1155 = artifacts.require("MusicEditions1155");

module.exports = async function (deployer, network, accounts) {
  // Base URI for metadata (we'll use ipfs:// and append <id>.json)
  const baseURI = "ipfs://";
  await deployer.deploy(MusicEditions1155, baseURI);
};
