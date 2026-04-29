// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title EMBER — uncapped reward / utility token
/// @notice Mintable only by MINTER_ROLE (Swap router rewards distributor, lending pool, staking).
///         Used for staker rewards and dual-conversion mechanics with BLAZE.
contract EmberToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant LIMIT_ADMIN_ROLE = keccak256("LIMIT_ADMIN_ROLE");

    uint16 public maxTxBps = 100; // 1% anti-whale
    mapping(address => bool) public limitExempt;

    event MaxTxBpsUpdated(uint16 newBps);
    event LimitExemptionUpdated(address indexed account, bool exempt);

    error ExceedsTxLimit(uint256 amount, uint256 limit);
    error InvalidBps();

    constructor(address admin) ERC20("TwinFlame Ember", "EMBER") ERC20Permit("TwinFlame Ember") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(LIMIT_ADMIN_ROLE, admin);
        limitExempt[admin] = true;
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

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
        uint256 supply = totalSupply();
        if (supply == 0) return type(uint256).max;
        return (supply * maxTxBps) / 10_000;
    }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        if (from != address(0) && to != address(0)) {
            if (!limitExempt[from] && !limitExempt[to]) {
                uint256 limit = maxTxAmount();
                if (value > limit) revert ExceedsTxLimit(value, limit);
            }
        }
        super._update(from, to, value);
    }
}
