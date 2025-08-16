// smart-contracts/tronbox.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

module.exports = {
  networks: {
    shasta: {
      privateKey: process.env.PRIVATE_KEY,
      consume_user_resource_percent: 30,
      fee_limit: 1_000_000_000,
      fullHost: process.env.TRON_FULL_HOST || "https://api.shasta.trongrid.io",
      network_id: "2",
      eventServer: process.env.EVENT_SERVER || "https://event.shasta.trongrid.io",
    },
  },

  contracts_directory: path.join(__dirname, "contracts"),
  migrations_directory: path.join(__dirname, "migrations"),
  contracts_build_directory: path.join(__dirname, "build", "contracts"),

  // Explicitly use a supported compiler
  compilers: {
    solc: {
      version: "0.8.22",
      settings: {
        optimizer: { enabled: true, runs: 200 },
      },
    },
  },
};


