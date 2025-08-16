// scripts/pin-folder-axios.js
// Pins a LOCAL FOLDER to Pinata and returns a **FOLDER CID**
// so your NFT URI can be: ipfs://<FOLDER_CID>/0.json
//
// This version ensures files are pinned at the CID **root** (no extra /root prefix).

require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const PINATA_JWT = process.env.PINATA_JWT;
if (!PINATA_JWT) {
  console.error("Missing PINATA_JWT in .env");
  process.exit(1);
}

// Recursively add all files from `dir`, preserving relative paths, so 0.json ends up at /0.json.
function appendFolderToForm(form, dir, relBase = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const rel = path.join(relBase, ent.name);
    if (ent.isDirectory()) {
      appendFolderToForm(form, full, rel); // go deeper
    } else {
      // KEY LINE: set filepath to the relative path we want inside the CID
      // Example: "0.json" stays "0.json" at the root
      form.append("file", fs.createReadStream(full), { filepath: rel });
    }
  }
}

async function pinFolder(localDir) {
  const abs = path.resolve(localDir);
  if (!fs.existsSync(abs)) throw new Error(`Folder not found: ${abs}`);

  const form = new FormData();
  appendFolderToForm(form, abs, "");

  // Ask Pinata to wrap files into a directory and return that directory's CID (CIDv1)
  form.append("pinataOptions", JSON.stringify({ wrapWithDirectory: true, cidVersion: 1 }));
  form.append("pinataMetadata", JSON.stringify({ name: `tronmusic-${Date.now()}` }));

  const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", form, {
    maxBodyLength: Infinity,
    headers: { Authorization: `Bearer ${PINATA_JWT}`, ...form.getHeaders() }
  });

  // This is the **folder** CID
  return res.data.IpfsHash;
}

(async () => {
  try {
    // Default folder that contains 0.json
    const dir = process.argv[2] || "./ipfs-metadata/ed0";
    const cid = await pinFolder(dir);

    console.log("FOLDER CID:", cid);
    console.log("Test these links (should show your 0.json):");
    console.log(`  https://gateway.pinata.cloud/ipfs/${cid}/0.json`);
    console.log(`  https://cloudflare-ipfs.com/ipfs/${cid}/0.json`);
    console.log(`  https://ipfs.io/ipfs/${cid}/0.json`);
    console.log("\nUse this as baseURI (NOTE the trailing slash):");
    console.log(`  ipfs://${cid}/`);
  } catch (e) {
    console.error(e.response?.data || e.message);
    process.exit(1);
  }
})();

