// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title PriceOracle — manual + Chainlink-compatible price feed registry
/// @notice Admin sets manual prices; future revision can wire Chainlink AggregatorV3 feeds.
contract PriceOracle is AccessControl {
    bytes32 public constant FEEDER_ROLE = keccak256("FEEDER_ROLE");

    /// price scaled to 1e18 USD
    mapping(address => uint256) public manualPriceE18;
    mapping(address => uint256) public lastUpdated;

    /// Enumerable registry of tokens that have ever had a price set
    address[] public tokens;
    mapping(address => bool) public registered;

    event PriceUpdated(address indexed token, uint256 priceE18, uint256 timestamp);
    event TokenRegistered(address indexed token);

    error StalePrice();

    uint256 public maxStaleness = 1 hours;

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(FEEDER_ROLE, admin);
    }

    function setMaxStaleness(uint256 s) external onlyRole(DEFAULT_ADMIN_ROLE) { maxStaleness = s; }

    function _register(address token) internal {
        if (!registered[token]) {
            registered[token] = true;
            tokens.push(token);
            emit TokenRegistered(token);
        }
    }

    function setPriceUSD(address token, uint256 priceE18) external onlyRole(FEEDER_ROLE) {
        _register(token);
        manualPriceE18[token] = priceE18;
        lastUpdated[token] = block.timestamp;
        emit PriceUpdated(token, priceE18, block.timestamp);
    }

    function batchSetPriceUSD(address[] calldata _tokens, uint256[] calldata pricesE18)
        external
        onlyRole(FEEDER_ROLE)
    {
        require(_tokens.length == pricesE18.length, "len");
        for (uint256 i; i < _tokens.length; ++i) {
            _register(_tokens[i]);
            manualPriceE18[_tokens[i]] = pricesE18[i];
            lastUpdated[_tokens[i]] = block.timestamp;
            emit PriceUpdated(_tokens[i], pricesE18[i], block.timestamp);
        }
    }

    function getPriceUSD(address token) external view returns (uint256) {
        uint256 p = manualPriceE18[token];
        if (p == 0) return 0;
        if (block.timestamp - lastUpdated[token] > maxStaleness) revert StalePrice();
        return p;
    }

    /// @notice Return all registered tokens (for admin UI enumeration)
    function getTokens() external view returns (address[] memory) { return tokens; }

    function tokensLength() external view returns (uint256) { return tokens.length; }

    /// @notice Full feed snapshot for the admin panel
    function getFeed(address token)
        external
        view
        returns (uint256 priceE18, uint256 updatedAt, bool stale)
    {
        priceE18 = manualPriceE18[token];
        updatedAt = lastUpdated[token];
        stale = priceE18 == 0 || (block.timestamp - updatedAt > maxStaleness);
    }
}
