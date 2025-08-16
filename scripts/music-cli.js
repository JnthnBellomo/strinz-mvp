// scripts/music-cli.js
// Small CLI for your deployed MusicEditions1155 contract using TronWeb.
// Actions: setBaseURI, createTrack, buy, info, uri, balance
//
// Examples:
//   node scripts/music-cli.js --action setBaseURI --baseURI "ipfs://<CID>/"
//   node scripts/music-cli.js --action createTrack --supply 1000 --price 15000000 --artist "T..." --royalty 500
//   node scripts/music-cli.js --action buy --id 0 --price 15000000
//   node scripts/music-cli.js --action info --id 0
//   node scripts/music-cli.js --action uri --id 0
//   node scripts/music-cli.js --action balance --id 0 --owner "T..."

require("dotenv").config();
let TronWebLib = require("tronweb");
const TronWeb = TronWebLib.TronWeb || TronWebLib.default || TronWebLib;
const path = require("path");
const fs = require("fs");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

// Read needed config from .env
const {
  PRIVATE_KEY,                              // your Shasta test wallet private key
  TRON_FULL_HOST = "https://api.shasta.trongrid.io",
  CONTRACT_ADDR                             // deployed MusicEditions1155 (T-addr)
} = process.env;

if (!PRIVATE_KEY) { console.error("Missing PRIVATE_KEY in .env"); process.exit(1); }
if (!CONTRACT_ADDR) { console.error("Missing CONTRACT_ADDR in .env"); process.exit(1); }

// TronWeb signs transactions with your private key
const tronWeb = new TronWeb({ fullHost: TRON_FULL_HOST, privateKey: PRIVATE_KEY });

// Load ABI from TronBox build
const abiPath = path.join(__dirname, "..", "smart-contracts", "build", "contracts", "MusicEditions1155.json");
if (!fs.existsSync(abiPath)) {
  console.error("ABI not found at:", abiPath, "\nRun: cd smart-contracts && npx tronbox compile");
  process.exit(1);
}
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;

// Helper to get a contract object
async function getContract() {
  return await tronWeb.contract(abi, CONTRACT_ADDR);
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option("action",  { type: "string", demandOption: true })
    .option("baseURI", { type: "string" })
    .option("supply",  { type: "number" })
    .option("price",   { type: "number" }) // in Sun (1 TRX = 1_000_000 Sun)
    .option("artist",  { type: "string" }) // T-address
    .option("royalty", { type: "number" }) // bps (500 = 5%)
    .option("id",      { type: "number" }) // trackId
    .option("owner",   { type: "string" }) // T-address
    .help().argv;

  const c = await getContract();

  switch (argv.action) {
    case "setBaseURI": {
      // Set contract-wide baseURI (must end with '/')
      if (!argv.baseURI) throw new Error("Provide --baseURI ipfs://<FOLDER_CID>/");
      console.log("Setting baseURI to:", argv.baseURI);
      const tx = await c.setBaseURI(argv.baseURI).send();
      console.log("✅ baseURI set. tx:", tx);
      break;
    }
    case "createTrack": {
      // Create an edition (supply, price in Sun, artist wallet, royalty bps)
      if (argv.supply == null || argv.price == null || !argv.artist || argv.royalty == null) {
        throw new Error("Provide --supply --price --artist --royalty");
      }
      console.log("Creating track:", argv);
      const tx = await c.createTrack(argv.supply, argv.price, argv.artist, argv.royalty).send();
      console.log("✅ track created. tx:", tx);
      break;
    }
    case "buy": {
      // Primary purchase: TRON uses { callValue } to send TRX (Sun)
      if (argv.id == null || argv.price == null) throw new Error("Provide --id --price (Sun)");
      console.log(`Buying 1 copy of track ${argv.id} for ${argv.price} Sun`);
      const tx = await c.buy(argv.id).send({ callValue: argv.price });
      console.log("✅ buy ok. tx:", tx);
      break;
    }
    case "info": {
      if (argv.id == null) throw new Error("Provide --id");
      const t = await c.tracks(argv.id).call();
      console.log("Track", argv.id, {
        totalSupply: t.totalSupply.toString(),
        minted: t.minted.toString(),
        price: t.price.toString(),
        artist: t.artist,
        royaltyBps: t.royaltyBps.toString(),
      });
      break;
    }
    case "uri": {
      if (argv.id == null) throw new Error("Provide --id");
      const u = await c.uri(argv.id).call();
      console.log("URI", argv.id, "→", u);
      break;
    }
    case "balance": {
      if (argv.id == null || !argv.owner) throw new Error("Provide --id --owner");
      const b = await c.balanceOf(argv.owner, argv.id).call();
      console.log("Balance of", argv.owner, "track", argv.id, "=", b.toString());
      break;
    }
    default:
      throw new Error("Unknown --action");
  }
}

main().catch((e) => {
  console.error("❌ Error:", e?.response?.data || e.message);
  process.exit(1);
});

