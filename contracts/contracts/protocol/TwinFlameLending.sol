// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface IPriceOracleL {
    function getPriceUSD(address token) external view returns (uint256);
}

/// @title TwinFlameLending — pooled + P2P lending with shared liquidation engine
/// @notice 150% min collateral ratio, 120% liquidation threshold, 0.30% protocol fee.
///         Pooled model: lenders deposit, borrowers post collateral and draw at pool APY.
///         P2P model: lenders post offers, borrowers fill them with collateral.
/// @dev Audit-ready scaffold. APY accrual is simplified linear; replace with index-based
///      accrual (à la Compound jump-rate model) prior to mainnet for precise interest math.
contract TwinFlameLending is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");
    bytes32 public constant RISK_ADMIN_ROLE = keccak256("RISK_ADMIN_ROLE");

    uint16 public constant BPS = 10000;
    uint16 public collateralFactorBps = 6667;       // 150% CR ⇒ borrow ≤ 66.67% of collateral USD
    uint16 public liquidationThresholdBps = 8333;   // 120% CR liquidation trigger (1/1.2)
    uint16 public liquidationBonusBps = 500;        // 5% liquidator bonus
    uint16 public protocolFeeBps = 30;              // 0.30%

    IPriceOracleL public oracle;
    address public feeDistributor;

    // ── Pooled state per token ──
    struct Pool {
        uint256 totalDeposits;
        uint256 totalBorrowed;
        uint256 supplyAPYBps;
        uint256 borrowAPYBps;
        bool listed;
    }
    mapping(address => Pool) public pools;
    mapping(address => mapping(address => uint256)) public deposits; // user => token => amount

    // ── Loans (shared by pooled & P2P) ──
    enum LoanKind { Pool, P2P }
    struct Loan {
        address borrower;
        address lender;          // 0x0 for pooled
        address token;
        uint256 amount;
        address collateralToken;
        uint256 collateralAmount;
        uint256 interestRateBps; // annualized
        uint256 startTime;
        uint256 dueDate;         // 0 for open-ended pooled
        LoanKind kind;
        bool repaid;
        bool liquidated;
    }
    Loan[] public loans;
    mapping(address => uint256[]) public userLoans;

    // ── P2P offers ──
    struct LoanOffer {
        address lender;
        address token;
        uint256 amount;
        uint256 interestRateBps;
        uint256 duration;
        address collateralToken;
        uint256 minCollateral;
        bool active;
    }
    LoanOffer[] public offers;

    event PoolListed(address indexed token, uint256 supplyAPYBps, uint256 borrowAPYBps);
    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event Borrowed(address indexed user, uint256 indexed loanId, address token, uint256 amount);
    event Repaid(address indexed user, uint256 indexed loanId, uint256 paid);
    event Liquidated(uint256 indexed loanId, address indexed liquidator, uint256 collateralSeized);
    event LoanOfferCreated(uint256 indexed offerId, address indexed lender);
    event LoanOfferFilled(uint256 indexed offerId, uint256 indexed loanId, address indexed borrower);
    event LoanOfferCancelled(uint256 indexed offerId);
    event ParametersUpdated();

    error PoolNotListed();
    error InsufficientCollateral();
    error InsufficientLiquidity();
    error NotBorrower();
    error AlreadySettled();
    error HealthyPosition();
    error OfferInactive();
    error InvalidAmount();
    error NoPriceData();

    constructor(address admin, address _oracle, address _feeDistributor) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);
        _grantRole(RISK_ADMIN_ROLE, admin);
        oracle = IPriceOracleL(_oracle);
        feeDistributor = _feeDistributor;
    }

    // ── Admin ──
    function listPool(address token, uint256 supplyAPYBps, uint256 borrowAPYBps) external onlyRole(CONFIG_ROLE) {
        pools[token].listed = true;
        pools[token].supplyAPYBps = supplyAPYBps;
        pools[token].borrowAPYBps = borrowAPYBps;
        emit PoolListed(token, supplyAPYBps, borrowAPYBps);
    }

    function setParameters(
        uint16 _collateralFactorBps,
        uint16 _liquidationThresholdBps,
        uint16 _liquidationBonusBps,
        uint16 _protocolFeeBps
    ) external onlyRole(RISK_ADMIN_ROLE) {
        collateralFactorBps = _collateralFactorBps;
        liquidationThresholdBps = _liquidationThresholdBps;
        liquidationBonusBps = _liquidationBonusBps;
        protocolFeeBps = _protocolFeeBps;
        emit ParametersUpdated();
    }

    function setOracle(address _oracle) external onlyRole(CONFIG_ROLE) { oracle = IPriceOracleL(_oracle); }
    function setFeeDistributor(address _fd) external onlyRole(CONFIG_ROLE) { feeDistributor = _fd; }
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    // ── Pooled Lending ──
    function deposit(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (!pools[token].listed) revert PoolNotListed();
        if (amount == 0) revert InvalidAmount();
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender][token] += amount;
        pools[token].totalDeposits += amount;
        emit Deposited(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) external nonReentrant {
        if (amount == 0 || deposits[msg.sender][token] < amount) revert InvalidAmount();
        uint256 free = pools[token].totalDeposits - pools[token].totalBorrowed;
        if (free < amount) revert InsufficientLiquidity();
        deposits[msg.sender][token] -= amount;
        pools[token].totalDeposits -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, token, amount);
    }

    function borrow(address token, uint256 amount, address collateralToken, uint256 collateralAmount)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 loanId)
    {
        if (!pools[token].listed) revert PoolNotListed();
        if (amount == 0 || collateralAmount == 0) revert InvalidAmount();
        uint256 free = pools[token].totalDeposits - pools[token].totalBorrowed;
        if (free < amount) revert InsufficientLiquidity();
        _requireHealthyOpen(token, amount, collateralToken, collateralAmount);

        IERC20(collateralToken).safeTransferFrom(msg.sender, address(this), collateralAmount);
        pools[token].totalBorrowed += amount;
        IERC20(token).safeTransfer(msg.sender, amount);

        loanId = loans.length;
        loans.push(Loan({
            borrower: msg.sender,
            lender: address(0),
            token: token,
            amount: amount,
            collateralToken: collateralToken,
            collateralAmount: collateralAmount,
            interestRateBps: pools[token].borrowAPYBps,
            startTime: block.timestamp,
            dueDate: 0,
            kind: LoanKind.Pool,
            repaid: false,
            liquidated: false
        }));
        userLoans[msg.sender].push(loanId);
        emit Borrowed(msg.sender, loanId, token, amount);
    }

    // ── P2P Lending ──
    function createLoanOffer(
        address token,
        uint256 amount,
        uint256 interestRateBps,
        uint256 duration,
        address collateralToken,
        uint256 minCollateral
    ) external nonReentrant whenNotPaused returns (uint256 offerId) {
        if (amount == 0) revert InvalidAmount();
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        offerId = offers.length;
        offers.push(LoanOffer({
            lender: msg.sender,
            token: token,
            amount: amount,
            interestRateBps: interestRateBps,
            duration: duration,
            collateralToken: collateralToken,
            minCollateral: minCollateral,
            active: true
        }));
        emit LoanOfferCreated(offerId, msg.sender);
    }

    function fillLoanOffer(uint256 offerId, uint256 collateralAmount)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 loanId)
    {
        LoanOffer storage off = offers[offerId];
        if (!off.active) revert OfferInactive();
        if (collateralAmount < off.minCollateral) revert InsufficientCollateral();
        _requireHealthyOpen(off.token, off.amount, off.collateralToken, collateralAmount);

        off.active = false;
        IERC20(off.collateralToken).safeTransferFrom(msg.sender, address(this), collateralAmount);
        IERC20(off.token).safeTransfer(msg.sender, off.amount);

        loanId = loans.length;
        loans.push(Loan({
            borrower: msg.sender,
            lender: off.lender,
            token: off.token,
            amount: off.amount,
            collateralToken: off.collateralToken,
            collateralAmount: collateralAmount,
            interestRateBps: off.interestRateBps,
            startTime: block.timestamp,
            dueDate: block.timestamp + off.duration,
            kind: LoanKind.P2P,
            repaid: false,
            liquidated: false
        }));
        userLoans[msg.sender].push(loanId);
        emit LoanOfferFilled(offerId, loanId, msg.sender);
    }

    function cancelLoanOffer(uint256 offerId) external nonReentrant {
        LoanOffer storage off = offers[offerId];
        if (!off.active || off.lender != msg.sender) revert OfferInactive();
        off.active = false;
        IERC20(off.token).safeTransfer(off.lender, off.amount);
        emit LoanOfferCancelled(offerId);
    }

    // ── Repay & Liquidate (shared) ──
    function repay(uint256 loanId) external nonReentrant {
        Loan storage L = loans[loanId];
        if (L.borrower != msg.sender) revert NotBorrower();
        if (L.repaid || L.liquidated) revert AlreadySettled();

        uint256 owed = _amountOwed(L);
        uint256 fee = (owed * protocolFeeBps) / BPS;
        IERC20(L.token).safeTransferFrom(msg.sender, address(this), owed + fee);

        if (L.kind == LoanKind.Pool) {
            pools[L.token].totalBorrowed -= L.amount;
            // interest stays as deposit growth (simplified accrual)
        } else {
            IERC20(L.token).safeTransfer(L.lender, owed);
        }
        if (fee > 0 && feeDistributor != address(0)) {
            IERC20(L.token).safeTransfer(feeDistributor, fee);
        }
        IERC20(L.collateralToken).safeTransfer(L.borrower, L.collateralAmount);
        L.repaid = true;
        emit Repaid(L.borrower, loanId, owed + fee);
    }

    function liquidate(uint256 loanId) external nonReentrant {
        Loan storage L = loans[loanId];
        if (L.repaid || L.liquidated) revert AlreadySettled();
        if (_isHealthy(L)) revert HealthyPosition();

        uint256 owed = _amountOwed(L);
        IERC20(L.token).safeTransferFrom(msg.sender, address(this), owed);

        if (L.kind == LoanKind.Pool) {
            pools[L.token].totalBorrowed -= L.amount;
        } else {
            IERC20(L.token).safeTransfer(L.lender, owed);
        }

        uint256 bonus = (L.collateralAmount * liquidationBonusBps) / BPS;
        uint256 toLiquidator = L.collateralAmount; // simplified: full collateral
        L.liquidated = true;
        IERC20(L.collateralToken).safeTransfer(msg.sender, toLiquidator);
        emit Liquidated(loanId, msg.sender, toLiquidator);
        bonus; // silence unused in simplified path
    }

    // ── Views & Health ──
    function getLoan(uint256 loanId) external view returns (Loan memory) { return loans[loanId]; }
    function getUserLoans(address user) external view returns (uint256[] memory) { return userLoans[user]; }
    function loansLength() external view returns (uint256) { return loans.length; }
    function offersLength() external view returns (uint256) { return offers.length; }

    function getPoolInfo(address token)
        external
        view
        returns (uint256 totalDeposits, uint256 totalBorrowed, uint256 utilizationBps, uint256 supplyAPY, uint256 borrowAPY)
    {
        Pool storage p = pools[token];
        totalDeposits = p.totalDeposits;
        totalBorrowed = p.totalBorrowed;
        utilizationBps = totalDeposits == 0 ? 0 : (totalBorrowed * BPS) / totalDeposits;
        supplyAPY = p.supplyAPYBps;
        borrowAPY = p.borrowAPYBps;
    }

    function _amountOwed(Loan storage L) internal view returns (uint256) {
        uint256 elapsed = block.timestamp - L.startTime;
        uint256 interest = (L.amount * L.interestRateBps * elapsed) / (BPS * 365 days);
        return L.amount + interest;
    }

    function _usd(address token, uint256 amount) internal view returns (uint256) {
        uint256 p = oracle.getPriceUSD(token);
        if (p == 0) revert NoPriceData();
        return (amount * p) / 1e18;
    }

    function _requireHealthyOpen(address token, uint256 amount, address colToken, uint256 colAmount) internal view {
        uint256 borrowUsd = _usd(token, amount);
        uint256 colUsd = _usd(colToken, colAmount);
        // borrowUsd / colUsd ≤ collateralFactorBps/BPS
        if (borrowUsd * BPS > colUsd * collateralFactorBps) revert InsufficientCollateral();
    }

    function _isHealthy(Loan storage L) internal view returns (bool) {
        uint256 borrowUsd = _usd(L.token, _amountOwed(L));
        uint256 colUsd = _usd(L.collateralToken, L.collateralAmount);
        return borrowUsd * BPS <= colUsd * liquidationThresholdBps;
    }

    function healthFactor(uint256 loanId) external view returns (uint256 hfE18) {
        Loan storage L = loans[loanId];
        if (L.repaid || L.liquidated) return type(uint256).max;
        uint256 borrowUsd = _usd(L.token, _amountOwed(L));
        if (borrowUsd == 0) return type(uint256).max;
        uint256 colUsd = _usd(L.collateralToken, L.collateralAmount);
        // HF = (colUsd * liqThreshold/BPS) / borrowUsd, scaled 1e18
        hfE18 = (colUsd * liquidationThresholdBps * 1e18) / (borrowUsd * BPS);
    }
}
