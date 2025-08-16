// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract MusicEditions1155 is ERC1155, Ownable, ReentrancyGuard, IERC2981 {
    using Strings for uint256;

    struct Track {
        uint256 totalSupply;
        uint256 minted;
        uint256 price;          // in Sun (1 TRX = 1e6 Sun)
        address payable artist;
        uint96 royaltyBps;      // 10000 = 100%
    }

    uint256 public nextTrackId;
    mapping(uint256 => Track) public tracks;

    constructor(string memory baseURI) ERC1155(baseURI) Ownable(msg.sender) {}

    // --- Admin ---

    /// @notice Update base metadata URI (e.g. ipfs://CID/)
    function setBaseURI(string memory newBase) external onlyOwner {
        _setURI(newBase);
    }

    // --- Tracks (editions) ---

    function createTrack(
        uint256 supply,
        uint256 price,
        address payable artist,
        uint96 royaltyBps
    ) external onlyOwner {
        require(supply > 0, "Supply must be > 0");
        require(artist != address(0), "Invalid artist");
        require(royaltyBps <= 1000, "Max 10%");

        uint256 trackId = nextTrackId++;
        tracks[trackId] = Track({
            totalSupply: supply,
            minted: 0,
            price: price,
            artist: artist,
            royaltyBps: royaltyBps
        });
    }

    // --- Primary sale (mint) ---

    /// @notice Buy one copy of the track (send exact price in Sun via {callValue})
    function buy(uint256 trackId) external payable nonReentrant {
        Track storage track = tracks[trackId];
        require(track.minted < track.totalSupply, "Sold out");
        // On Tron, msg.value is set from {callValue}
        require(msg.value == track.price, "Incorrect price");

        track.minted += 1;
        _mint(msg.sender, trackId, 1, "");

        // Pay artist
        (bool sent, ) = track.artist.call{value: msg.value}("");
        require(sent, "Payment failed");
    }

    // --- Royalties (EIP-2981) ---

    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address, uint256)
    {
        Track storage track = tracks[tokenId];
        uint256 royaltyAmount = (salePrice * track.royaltyBps) / 10000;
        return (track.artist, royaltyAmount);
    }

    // --- Metadata ---

    /// @dev token URI = baseURI + "<id>.json"
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(super.uri(tokenId), tokenId.toString(), ".json"));
    }

    // --- Interface support ---

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}

