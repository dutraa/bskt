// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StablecoinERC20
 * @notice Simple Ownable + role-gated mint/burn token used by ACE consumers.
 * @dev Owner can grant/revoke roles. MintingConsumerWithACE will be granted both roles.
 */
contract StablecoinERC20 is ERC20, Ownable {
    mapping(address => bool) public isMinter;
    mapping(address => bool) public isBurner;

    event MintRoleGranted(address indexed account);
    event BurnRoleGranted(address indexed account);
    event MintRoleRevoked(address indexed account);
    event BurnRoleRevoked(address indexed account);

    error NotMinter();
    error NotBurner();

    constructor(
        string memory name_,
        string memory symbol_,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {}

    // --- Admin role management (owner only) ---
    function grantMintRole(address account) external onlyOwner {
        isMinter[account] = true;
        emit MintRoleGranted(account);
    }

    function revokeMintRole(address account) external onlyOwner {
        isMinter[account] = false;
        emit MintRoleRevoked(account);
    }

    function grantBurnRole(address account) external onlyOwner {
        isBurner[account] = true;
        emit BurnRoleGranted(account);
    }

    function revokeBurnRole(address account) external onlyOwner {
        isBurner[account] = false;
        emit BurnRoleRevoked(account);
    }

    // --- Mint/Burn (role gated) ---
    function mint(address to, uint256 amount) external {
        if (!isMinter[msg.sender]) revert NotMinter();
        _mint(to, amount);
    }

    function burnFrom(address from, uint256 amount) external {
        if (!isBurner[msg.sender]) revert NotBurner();
        _burn(from, amount);
    }
}
