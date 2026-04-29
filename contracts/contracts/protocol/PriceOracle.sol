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

    event PriceUpdated(address indexed token, uint256 priceE18, uint256 timestamp);

    error StalePrice();

    uint256 public maxStaleness = 1 hours;

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(FEEDER_ROLE, admin);
    }

    function setMaxStaleness(uint256 s) external onlyRole(DEFAULT_ADMIN_ROLE) { maxStaleness = s; }

    function setPriceUSD(address token, uint256 priceE18) external onlyRole(FEEDER_ROLE) {
        manualPriceE18[token] = priceE18;
        lastUpdated[token] = block.timestamp;
        emit PriceUpdated(token, priceE18, block.timestamp);
    }

    function batchSetPriceUSD(address[] calldata tokens, uint256[] calldata pricesE18)
        external
        onlyRole(FEEDER_ROLE)
    {
        require(tokens.length == pricesE18.length, "len");
        for (uint256 i; i < tokens.length; ++i) {
            manualPriceE18[tokens[i]] = pricesE18[i];
            lastUpdated[tokens[i]] = block.timestamp;
            emit PriceUpdated(tokens[i], pricesE18[i], block.timestamp);
        }
    }

    function getPriceUSD(address token) external view returns (uint256) {
        uint256 p = manualPriceE18[token];
        if (p == 0) return 0;
        if (block.timestamp - lastUpdated[token] > maxStaleness) revert StalePrice();
        return p;
    }
}
