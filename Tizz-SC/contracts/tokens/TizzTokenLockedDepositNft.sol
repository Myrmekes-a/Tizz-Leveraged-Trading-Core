// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ERC721, ERC721Enumerable} from "../external/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {IERC20Metadata} from "../external/@openzeppelin/contracts/interfaces/IERC20Metadata.sol";
import {IERC4626} from "../external/@openzeppelin/contracts/interfaces/IERC4626.sol";

import "../interfaces/ITizzTokenLockedDepositNft.sol";

/**
 * @custom:version 6.3
 */
contract TizzTokenLockedDepositNft is
    ERC721Enumerable,
    ITizzTokenLockedDepositNft
{
    address public immutable vaultToken;
    ITizzTokenLockedDepositNftDesign public design;

    uint8 public designDecimals;

    constructor(
        string memory _name,
        string memory _symbol,
        address _vaultToken,
        ITizzTokenLockedDepositNftDesign _design,
        uint8 _designDecimals
    ) ERC721(_name, _symbol) {
        require(
            _vaultToken != address(0) && address(_design) != address(0),
            "WRONG_PARAMS"
        );
        vaultToken = _vaultToken;
        design = _design;
        designDecimals = _designDecimals;
    }

    modifier onlyTizzVaultToken() {
        require(msg.sender == vaultToken, "ONLY_TTOKEN");
        _;
    }

    modifier onlyTizzVaultTokenManager() {
        require(
            msg.sender == ITizzVaultToken(vaultToken).manager(),
            "ONLY_MANAGER"
        );
        _;
    }

    function updateDesign(
        ITizzTokenLockedDepositNftDesign newValue
    ) external onlyTizzVaultTokenManager {
        design = newValue;
        emit DesignUpdated(newValue);
    }

    function updateDesignDecimals(
        uint8 newValue
    ) external onlyTizzVaultTokenManager {
        designDecimals = newValue;
        emit DesignDecimalsUpdated(newValue);
    }

    function mint(address to, uint256 tokenId) external onlyTizzVaultToken {
        _safeMint(to, tokenId);
    }

    function burn(uint256 tokenId) external onlyTizzVaultToken {
        _burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireMinted(tokenId);

        return
            design.buildTokenURI(
                tokenId,
                ITizzVaultToken(vaultToken).getLockedDeposit(tokenId),
                IERC20Metadata(vaultToken).symbol(),
                IERC20Metadata(IERC4626(vaultToken).asset()).symbol(),
                IERC20Metadata(vaultToken).decimals(),
                designDecimals
            );
    }
}
