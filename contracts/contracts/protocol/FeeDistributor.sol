// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

interface IEmberMintable {
    function mint(address to, uint256 amount) external;
}

/// @title FeeDistributor — routes protocol fees per 50/30/20 whitepaper rule
/// @notice 50% → BLAZE buyback-and-burn, 30% → EMBER staker rewards, 20% → EQT dividend pool (USDC)
/// @dev Fees arrive in arbitrary tokens. The distributor swaps to USDC via an external router
///      for the dividend share, burns BLAZE for the burn share, and forwards EMBER share
///      to the rewards distributor. For tokens that are not BLAZE/EMBER/USDC, an off-chain
///      keeper calls `convertAndDistribute` after performing swaps to canonical assets.
contract FeeDistributor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");

    uint16 public constant BURN_BPS = 5000;     // 50%
    uint16 public constant REWARD_BPS = 3000;   // 30%
    uint16 public constant DIVIDEND_BPS = 2000; // 20%
    uint16 public constant BPS_DENOMINATOR = 10000;

    ERC20Burnable public immutable blaze;
    IERC20 public immutable ember;
    IERC20 public immutable usdc;

    address public rewardsDistributor; // receives EMBER for stakers
    address public dividendDistributor; // EQTDividendDistributor (USDC)

    event FeesDistributed(address indexed token, uint256 burned, uint256 rewarded, uint256 dividends);
    event RewardsDistributorUpdated(address indexed addr);
    event DividendDistributorUpdated(address indexed addr);

    error ZeroAddress();
    error UnsupportedToken();

    constructor(
        address admin,
        address _blaze,
        address _ember,
        address _usdc,
        address _rewardsDistributor,
        address _dividendDistributor
    ) {
        if (_blaze == address(0) || _ember == address(0) || _usdc == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(KEEPER_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);

        blaze = ERC20Burnable(_blaze);
        ember = IERC20(_ember);
        usdc = IERC20(_usdc);
        rewardsDistributor = _rewardsDistributor;
        dividendDistributor = _dividendDistributor;
    }

    function setRewardsDistributor(address addr) external onlyRole(CONFIG_ROLE) {
        if (addr == address(0)) revert ZeroAddress();
        rewardsDistributor = addr;
        emit RewardsDistributorUpdated(addr);
    }

    function setDividendDistributor(address addr) external onlyRole(CONFIG_ROLE) {
        if (addr == address(0)) revert ZeroAddress();
        dividendDistributor = addr;
        emit DividendDistributorUpdated(addr);
    }

    /// @notice Distribute pre-converted fees: BLAZE burned, EMBER to rewards, USDC to dividends.
    /// @dev Caller (typically the swap router) must have transferred the three asset
    ///      amounts to this contract before calling, OR call individual `distributeX`.
    function distributePreConverted(uint256 blazeAmount, uint256 emberAmount, uint256 usdcAmount)
        external
        nonReentrant
        onlyRole(KEEPER_ROLE)
    {
        if (blazeAmount > 0) blaze.burn(blazeAmount);
        if (emberAmount > 0) ember.safeTransfer(rewardsDistributor, emberAmount);
        if (usdcAmount > 0) usdc.safeTransfer(dividendDistributor, usdcAmount);
        emit FeesDistributed(address(0), blazeAmount, emberAmount, usdcAmount);
    }

    /// @notice Pull fees in any single token already swapped 50/30/20 by an off-chain keeper.
    function distributeSplit(address token, uint256 burnAmt, uint256 rewardAmt, uint256 divAmt)
        external
        nonReentrant
        onlyRole(KEEPER_ROLE)
    {
        if (token == address(blaze) && burnAmt > 0) {
            blaze.burn(burnAmt);
        } else if (burnAmt > 0) {
            // tokens that aren't BLAZE: send to dead address as treasury sink
            IERC20(token).safeTransfer(address(0xdead), burnAmt);
        }
        if (rewardAmt > 0) IERC20(token).safeTransfer(rewardsDistributor, rewardAmt);
        if (divAmt > 0) IERC20(token).safeTransfer(dividendDistributor, divAmt);
        emit FeesDistributed(token, burnAmt, rewardAmt, divAmt);
    }

    /// @notice View helper to compute the 50/30/20 split for a given gross fee amount.
    function splitOf(uint256 grossFee) external pure returns (uint256 burnAmt, uint256 rewardAmt, uint256 divAmt) {
        burnAmt = (grossFee * BURN_BPS) / BPS_DENOMINATOR;
        rewardAmt = (grossFee * REWARD_BPS) / BPS_DENOMINATOR;
        divAmt = grossFee - burnAmt - rewardAmt;
    }

    /// @notice Emergency sweep — admin only.
    function rescue(address token, address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).safeTransfer(to, amount);
    }
}
