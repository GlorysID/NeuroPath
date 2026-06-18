// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NeuroPathCredential is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event CredentialMinted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("NeuroPath Credential", "NPC") Ownable(msg.sender) {}

    function mintCredential(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit CredentialMinted(to, tokenId, uri);
        
        return tokenId;
    }
}
