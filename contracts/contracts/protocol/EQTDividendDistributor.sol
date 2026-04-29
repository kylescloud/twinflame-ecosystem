// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title EQTDividendDistributor — pull-based USDC dividend distribution to EQT holders
/// @notice Snapshot-per-epoch model. Operator deposits USDC and snapshots EQT balances.
///         Holders pull their pro-rata share. Avoids gas griefing of push distributions.
/// @dev Holders must be tracked via the EQT KYC registry to ensure compliance.
contract EQTDividendDistributor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    IERC20 public immutable eqt;
    IERC20 public immutable usdc;

    struct Epoch {
        uint256 totalUSDC;
        uint256 totalEQTSupplyAtSnapshot;
        uint256 timestamp;
    }
    Epoch[] public epochs;

    /// epoch => holder => balance snapshotted (set off-chain via setSnapshotBalances)
    mapping(uint256 => mapping(address => uint256)) public balanceAt;
    /// epoch => holder => claimed
    mapping(uint256 => mapping(address => bool)) public claimed;

    event EpochCreated(uint256 indexed epochId, uint256 totalUSDC, uint256 totalSupply);
    event SnapshotBalancesSet(uint256 indexed epochId, uint256 holderCount);
    event Claimed(uint256 indexed epochId, address indexed holder, uint256 amount);

    error AlreadyClaimed();
    error NoBalance();
    error LengthMismatch();
    error NoEpoch();

    constructor(address admin, address _eqt, address _usdc) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        eqt = IERC20(_eqt);
        usdc = IERC20(_usdc);
    }

    /// @notice Operator pulls accumulated USDC and creates a new dividend epoch.
    function createEpoch(uint256 usdcAmount, uint256 totalEQTSupply)
        external
        onlyRole(OPERATOR_ROLE)
        returns (uint256 epochId)
    {
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        epochId = epochs.length;
        epochs.push(Epoch({
            totalUSDC: usdcAmount,
            totalEQTSupplyAtSnapshot: totalEQTSupply,
            timestamp: block.timestamp
        }));
        emit EpochCreated(epochId, usdcAmount, totalEQTSupply);
    }

    /// @notice Operator submits balance snapshot for the specified epoch (chunked).
    function setSnapshotBalances(uint256 epochId, address[] calldata holders, uint256[] calldata balances)
        external
        onlyRole(OPERATOR_ROLE)
    {
        if (holders.length != balances.length) revert LengthMismatch();
        if (epochId >= epochs.length) revert NoEpoch();
        for (uint256 i; i < holders.length; ++i) {
            balanceAt[epochId][holders[i]] = balances[i];
        }
        emit SnapshotBalancesSet(epochId, holders.length);
    }

    function claimable(uint256 epochId, address holder) public view returns (uint256) {
        if (claimed[epochId][holder]) return 0;
        Epoch storage e = epochs[epochId];
        uint256 bal = balanceAt[epochId][holder];
        if (bal == 0 || e.totalEQTSupplyAtSnapshot == 0) return 0;
        return (e.totalUSDC * bal) / e.totalEQTSupplyAtSnapshot;
    }

    function claim(uint256 epochId) external nonReentrant {
        uint256 amt = claimable(epochId, msg.sender);
        if (amt == 0) revert NoBalance();
        if (claimed[epochId][msg.sender]) revert AlreadyClaimed();
        claimed[epochId][msg.sender] = true;
        usdc.safeTransfer(msg.sender, amt);
        emit Claimed(epochId, msg.sender, amt);
    }

    function claimMany(uint256[] calldata epochIds) external nonReentrant {
        for (uint256 i; i < epochIds.length; ++i) {
            uint256 epochId = epochIds[i];
            if (claimed[epochId][msg.sender]) continue;
            uint256 amt = claimable(epochId, msg.sender);
            if (amt == 0) continue;
            claimed[epochId][msg.sender] = true;
            usdc.safeTransfer(msg.sender, amt);
            emit Claimed(epochId, msg.sender, amt);
        }
    }

    function epochCount() external view returns (uint256) { return epochs.length; }
}
