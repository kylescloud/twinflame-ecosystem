// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @title BLAZE — fixed-supply deflationary governance token
/// @notice 10,000,000 fixed cap. 1% per-tx anti-whale limit (configurable, exemptable).
///         Burn-only after mint; protocol uses transfer-then-burn for buyback-and-burn.
/// @dev Audit-ready scaffold. Requires professional audit before mainnet.
contract BlazeToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, AccessControl, Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant LIMIT_ADMIN_ROLE = keccak256("LIMIT_ADMIN_ROLE");

    uint256 public constant MAX_SUPPLY = 10_000_000 ether;

    /// @notice Max single transfer as bps of total supply. 100 = 1%.
    uint16 public maxTxBps = 100;
    /// @notice Addresses exempt from anti-whale limits (DEX router, lending pool, treasury, etc.)
    mapping(address => bool) public limitExempt;

    event MaxTxBpsUpdated(uint16 newBps);
    event LimitExemptionUpdated(address indexed account, bool exempt);

    error ExceedsMaxSupply();
    error ExceedsTxLimit(uint256 amount, uint256 limit);
    error InvalidBps();

    constructor(address admin, address initialMintTo)
        ERC20("TwinFlame Blaze", "BLAZE")
        ERC20Permit("TwinFlame Blaze")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(LIMIT_ADMIN_ROLE, admin);

        limitExempt[admin] = true;
        limitExempt[initialMintTo] = true;

        _mint(initialMintTo, MAX_SUPPLY);
    }

    // ── Admin ──
    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function setMaxTxBps(uint16 newBps) external onlyRole(LIMIT_ADMIN_ROLE) {
        if (newBps == 0 || newBps > 10_000) revert InvalidBps();
        maxTxBps = newBps;
        emit MaxTxBpsUpdated(newBps);
    }

    function setLimitExempt(address account, bool exempt) external onlyRole(LIMIT_ADMIN_ROLE) {
        limitExempt[account] = exempt;
        emit LimitExemptionUpdated(account, exempt);
    }

    function maxTxAmount() public view returns (uint256) {
        return (totalSupply() * maxTxBps) / 10_000;
    }

    // ── Hooks ──
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
        whenNotPaused
    {
        if (from != address(0) && to != address(0)) {
            if (!limitExempt[from] && !limitExempt[to]) {
                uint256 limit = maxTxAmount();
                if (value > limit) revert ExceedsTxLimit(value, limit);
            }
        }
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
