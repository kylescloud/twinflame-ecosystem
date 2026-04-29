// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @title EQT — regulated security token (KYC-gated, ERC-1404-style restrictions)
/// @notice 1,000,000 fixed cap. Transfers restricted to KYC-approved & non-sanctioned addresses.
///         Pays USDC dividends from protocol revenue (see EQTDividendDistributor).
contract EQTToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, AccessControl, Pausable {
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000 ether;

    mapping(address => bool) public kycApproved;
    mapping(address => bool) public sanctioned;

    // ERC-1404 restriction codes
    uint8 public constant SUCCESS = 0;
    uint8 public constant FAILURE_FROM_NOT_KYC = 1;
    uint8 public constant FAILURE_TO_NOT_KYC = 2;
    uint8 public constant FAILURE_FROM_SANCTIONED = 3;
    uint8 public constant FAILURE_TO_SANCTIONED = 4;
    uint8 public constant FAILURE_PAUSED = 5;

    event KYCStatusChanged(address indexed account, bool approved);
    event SanctionStatusChanged(address indexed account, bool sanctioned);

    error ExceedsMaxSupply();
    error TransferRestricted(uint8 code);

    constructor(address admin) ERC20("TwinFlame Equity", "EQT") ERC20Permit("TwinFlame Equity") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(COMPLIANCE_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        kycApproved[admin] = true;
    }

    // ── Compliance admin ──
    function setKYC(address account, bool approved) external onlyRole(COMPLIANCE_ROLE) {
        kycApproved[account] = approved;
        emit KYCStatusChanged(account, approved);
    }

    function batchSetKYC(address[] calldata accounts, bool approved) external onlyRole(COMPLIANCE_ROLE) {
        for (uint256 i; i < accounts.length; ++i) {
            kycApproved[accounts[i]] = approved;
            emit KYCStatusChanged(accounts[i], approved);
        }
    }

    function setSanctioned(address account, bool _sanctioned) external onlyRole(COMPLIANCE_ROLE) {
        sanctioned[account] = _sanctioned;
        emit SanctionStatusChanged(account, _sanctioned);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        _mint(to, amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // ── ERC-1404 restriction interface ──
    function detectTransferRestriction(address from, address to, uint256 /*value*/)
        public view returns (uint8)
    {
        if (paused()) return FAILURE_PAUSED;
        if (from != address(0) && !kycApproved[from]) return FAILURE_FROM_NOT_KYC;
        if (to != address(0) && !kycApproved[to]) return FAILURE_TO_NOT_KYC;
        if (sanctioned[from]) return FAILURE_FROM_SANCTIONED;
        if (sanctioned[to]) return FAILURE_TO_SANCTIONED;
        return SUCCESS;
    }

    function messageForTransferRestriction(uint8 code) external pure returns (string memory) {
        if (code == SUCCESS) return "OK";
        if (code == FAILURE_FROM_NOT_KYC) return "Sender not KYC-approved";
        if (code == FAILURE_TO_NOT_KYC) return "Recipient not KYC-approved";
        if (code == FAILURE_FROM_SANCTIONED) return "Sender sanctioned";
        if (code == FAILURE_TO_SANCTIONED) return "Recipient sanctioned";
        if (code == FAILURE_PAUSED) return "Transfers paused";
        return "Unknown restriction";
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        // Allow mint (from==0) and burn (to==0) without KYC checks on the zero side
        uint8 code = detectTransferRestriction(from, to, value);
        if (code != SUCCESS) revert TransferRestricted(code);
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
