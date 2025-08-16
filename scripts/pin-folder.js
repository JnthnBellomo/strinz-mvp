const pinataSDK = require("pinata-sdk");
const path = require("path");
require("dotenv").config();

(async () => {
  try {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) throw new Error("Missing PINATA_JWT in .env");
    const pinata = new (pinataSDK).default({ pinataJWTKey: jwt });

    const folderPath = path.resolve(process.argv[2] || "./ipfs-metadata/ed0");
    const res = await pinata.pinFromFS(folderPath, {
      pinataMetadata: { name: "music-track-0-folder" }
    });

    console.log("Pinned folder CID:", res.IpfsHash);
    console.log("Your baseURI should be: ipfs://" + res.IpfsHash + "/");
    console.log("Token 0 URI will be:  ipfs://" + res.IpfsHash + "/0.json");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

