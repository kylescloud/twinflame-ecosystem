// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IEmberMint {
    function mint(address to, uint256 amount) external;
}

/// @title EmberRewardsDistributor — staker rewards in EMBER
/// @notice Receives EMBER (or other reward assets) from FeeDistributor and distributes
///         pro-rata to BLAZE/EQT stakers via a Synthetix-style accRewardPerShare model.
contract EmberRewardsDistributor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant FUNDER_ROLE = keccak256("FUNDER_ROLE");
    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");

    IERC20 public immutable rewardToken; // EMBER
    IERC20 public stakeToken;            // BLAZE (initially)

    uint256 public totalStaked;
    uint256 public accRewardPerShareE18;

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pending;
    }
    mapping(address => UserInfo) public users;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    event RewardsAdded(uint256 amount);
    event StakeTokenUpdated(address indexed token);

    error ZeroAmount();
    error InsufficientStake();
    error NoStake();

    constructor(address admin, address _rewardToken, address _stakeToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(FUNDER_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);
        rewardToken = IERC20(_rewardToken);
        stakeToken = IERC20(_stakeToken);
    }

    function setStakeToken(address t) external onlyRole(CONFIG_ROLE) {
        require(totalStaked == 0, "active stakes");
        stakeToken = IERC20(t);
        emit StakeTokenUpdated(t);
    }

    function notifyRewardAmount(uint256 amount) external onlyRole(FUNDER_ROLE) {
        if (amount == 0) revert ZeroAmount();
        if (totalStaked == 0) {
            // hold until first staker; rewards accrue on first stake
            return;
        }
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        accRewardPerShareE18 += (amount * 1e18) / totalStaked;
        emit RewardsAdded(amount);
    }

    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        UserInfo storage u = users[msg.sender];
        if (u.amount > 0) {
            uint256 pend = (u.amount * accRewardPerShareE18) / 1e18 - u.rewardDebt;
            u.pending += pend;
        }
        stakeToken.safeTransferFrom(msg.sender, address(this), amount);
        u.amount += amount;
        totalStaked += amount;
        u.rewardDebt = (u.amount * accRewardPerShareE18) / 1e18;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        UserInfo storage u = users[msg.sender];
        if (amount == 0 || amount > u.amount) revert InsufficientStake();
        uint256 pend = (u.amount * accRewardPerShareE18) / 1e18 - u.rewardDebt;
        u.pending += pend;
        u.amount -= amount;
        totalStaked -= amount;
        u.rewardDebt = (u.amount * accRewardPerShareE18) / 1e18;
        stakeToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function claim() external nonReentrant {
        UserInfo storage u = users[msg.sender];
        uint256 pend = (u.amount * accRewardPerShareE18) / 1e18 - u.rewardDebt + u.pending;
        if (pend == 0) revert NoStake();
        u.pending = 0;
        u.rewardDebt = (u.amount * accRewardPerShareE18) / 1e18;
        rewardToken.safeTransfer(msg.sender, pend);
        emit Claimed(msg.sender, pend);
    }

    function pendingRewards(address user) external view returns (uint256) {
        UserInfo storage u = users[user];
        return (u.amount * accRewardPerShareE18) / 1e18 - u.rewardDebt + u.pending;
    }
}
