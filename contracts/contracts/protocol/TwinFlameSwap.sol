// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface IPriceOracle {
    /// @return priceE18 Price of token in USD scaled to 1e18
    function getPriceUSD(address token) external view returns (uint256 priceE18);
}

/// @title TwinFlameSwap — protocol AMM-less swap router
/// @notice Constant-rate router using a price oracle. For native trinity pairs
///         (BLAZE/EMBER/EQT) hardcoded protocol rates apply per whitepaper.
///         0.30% protocol fee on every swap, routed to FeeDistributor.
/// @dev Liquidity is held by this contract per token. Anyone can `provideLiquidity`,
///      LP shares are tracked for proportional withdrawal. This is a simplified
///      router; a production deployment should integrate Uniswap V3 / Balancer for
///      deeper liquidity. Audit-ready scaffold.
contract TwinFlameSwap is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");
    bytes32 public constant LP_ADMIN_ROLE = keccak256("LP_ADMIN_ROLE");

    uint16 public constant FEE_BPS = 30; // 0.30%
    uint16 public constant BPS_DENOMINATOR = 10000;
    uint16 public constant MAX_SLIPPAGE_BPS = 500; // 5% sanity ceiling

    address public immutable blaze;
    address public immutable ember;
    address public immutable eqt;

    IPriceOracle public oracle;
    address public feeDistributor;

    /// fixedRate[tokenIn][tokenOut] in 1e18 units. 0 = use oracle.
    mapping(address => mapping(address => uint256)) public fixedRateE18;

    /// LP share accounting: per-token, total shares & user shares
    mapping(address => uint256) public totalShares;
    mapping(address => mapping(address => uint256)) public sharesOf;

    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );
    event LiquidityProvided(address indexed user, address indexed token, uint256 amount, uint256 shares);
    event LiquidityWithdrawn(address indexed user, address indexed token, uint256 amount, uint256 shares);
    event OracleUpdated(address indexed oracle);
    event FeeDistributorUpdated(address indexed dist);
    event FixedRateUpdated(address indexed tokenIn, address indexed tokenOut, uint256 rateE18);

    error ZeroAmount();
    error ZeroAddress();
    error InsufficientOutput(uint256 got, uint256 min);
    error InsufficientLiquidity();
    error NoPriceData();
    error SameToken();
    error InsufficientShares();

    constructor(
        address admin,
        address _blaze,
        address _ember,
        address _eqt,
        address _oracle,
        address _feeDistributor
    ) {
        if (_blaze == address(0) || _ember == address(0) || _eqt == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);
        _grantRole(LP_ADMIN_ROLE, admin);

        blaze = _blaze;
        ember = _ember;
        eqt = _eqt;
        oracle = IPriceOracle(_oracle);
        feeDistributor = _feeDistributor;

        // Whitepaper-fixed trinity rates (1e18 scaled)
        fixedRateE18[_blaze][_ember] = 1.05e18;
        fixedRateE18[_ember][_blaze] = 0.9e18;
        fixedRateE18[_blaze][_eqt]   = 0.1e18;
        fixedRateE18[_eqt][_blaze]   = 10e18;
        fixedRateE18[_ember][_eqt]   = 0.105e18;
        fixedRateE18[_eqt][_ember]   = 9.5e18;
    }

    // ── Admin ──
    function setOracle(address _oracle) external onlyRole(CONFIG_ROLE) {
        if (_oracle == address(0)) revert ZeroAddress();
        oracle = IPriceOracle(_oracle);
        emit OracleUpdated(_oracle);
    }

    function setFeeDistributor(address _fd) external onlyRole(CONFIG_ROLE) {
        if (_fd == address(0)) revert ZeroAddress();
        feeDistributor = _fd;
        emit FeeDistributorUpdated(_fd);
    }

    function setFixedRate(address tokenIn, address tokenOut, uint256 rateE18) external onlyRole(CONFIG_ROLE) {
        fixedRateE18[tokenIn][tokenOut] = rateE18;
        emit FixedRateUpdated(tokenIn, tokenOut, rateE18);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    // ── Quote ──
    function getRate(address tokenIn, address tokenOut) public view returns (uint256 rateE18) {
        if (tokenIn == tokenOut) return 1e18;
        uint256 fixedR = fixedRateE18[tokenIn][tokenOut];
        if (fixedR != 0) return fixedR;
        uint256 pIn = oracle.getPriceUSD(tokenIn);
        uint256 pOut = oracle.getPriceUSD(tokenOut);
        if (pIn == 0 || pOut == 0) revert NoPriceData();
        return (pIn * 1e18) / pOut;
    }

    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn)
        public
        view
        returns (uint256 amountOut, uint256 fee)
    {
        if (amountIn == 0) revert ZeroAmount();
        uint256 rate = getRate(tokenIn, tokenOut);
        uint256 gross = (amountIn * rate) / 1e18;
        fee = (gross * FEE_BPS) / BPS_DENOMINATOR;
        amountOut = gross - fee;
    }

    // ── Swap ──
    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 amountOut)
    {
        if (tokenIn == tokenOut) revert SameToken();
        if (amountIn == 0) revert ZeroAmount();

        (uint256 out, uint256 fee) = getAmountOut(tokenIn, tokenOut, amountIn);
        if (out < minAmountOut) revert InsufficientOutput(out, minAmountOut);
        if (IERC20(tokenOut).balanceOf(address(this)) < out) revert InsufficientLiquidity();

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(msg.sender, out);

        // Forward output-denominated fee to FeeDistributor; off-chain keeper splits 50/30/20.
        if (fee > 0 && feeDistributor != address(0)) {
            // Fee was already deducted from `out`. We hold it; send the equivalent to the distributor.
            IERC20(tokenOut).safeTransfer(feeDistributor, fee);
        }

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, out, fee);
        return out;
    }

    // ── Liquidity ──
    function provideLiquidity(address token, uint256 amount) external nonReentrant whenNotPaused returns (uint256 shares) {
        if (amount == 0) revert ZeroAmount();
        uint256 reserve = IERC20(token).balanceOf(address(this));
        uint256 supply = totalShares[token];

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        if (supply == 0 || reserve == 0) {
            shares = amount;
        } else {
            shares = (amount * supply) / reserve;
        }
        totalShares[token] = supply + shares;
        sharesOf[token][msg.sender] += shares;
        emit LiquidityProvided(msg.sender, token, amount, shares);
    }

    function withdrawLiquidity(address token, uint256 shares) external nonReentrant returns (uint256 amount) {
        if (shares == 0) revert ZeroAmount();
        uint256 userShares = sharesOf[token][msg.sender];
        if (shares > userShares) revert InsufficientShares();

        uint256 reserve = IERC20(token).balanceOf(address(this));
        uint256 supply = totalShares[token];
        amount = (reserve * shares) / supply;

        sharesOf[token][msg.sender] = userShares - shares;
        totalShares[token] = supply - shares;

        IERC20(token).safeTransfer(msg.sender, amount);
        emit LiquidityWithdrawn(msg.sender, token, amount, shares);
    }

    function reserveOf(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
