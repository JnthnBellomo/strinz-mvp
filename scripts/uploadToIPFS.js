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

async function uploadFile(filePath) {
  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));

  const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
    maxBodyLength: Infinity,
    headers: {
      "Authorization": `Bearer ${PINATA_JWT}`,
      ...data.getHeaders(),
    },
  });

  return `ipfs://${res.data.IpfsHash}`;
}

async function uploadJSON(json) {
  const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", json, {
    headers: {
      "Authorization": `Bearer ${PINATA_JWT}`,
      "Content-Type": "application/json",
    },
  });
  return `ipfs://${res.data.IpfsHash}`;
}

(async () => {
  const audioPath = path.join(__dirname, "../ipfs-assets/Avena CeSoM.mp3"); // change if different name
  const imagePath = path.join(__dirname, "../ipfs-assets/cover.jpg"); // change if different name

  console.log("Uploading audio...");
  const audioURI = await uploadFile(audioPath);
  console.log("Audio URI:", audioURI);

  console.log("Uploading image...");
  const imageURI = await uploadFile(imagePath);
  console.log("Image URI:", imageURI);

  const metadata = {
    name: "Track #0",
    description: "First TronMusic NFT track",
    image: imageURI,
    audio: audioURI,
    artist: "Your Artist Name",
  };

  console.log("Uploading metadata...");
  const metadataURI = await uploadJSON(metadata);
  console.log("Metadata URI:", metadataURI);
})();

