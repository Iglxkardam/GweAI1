// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReentrancyAttacker
 * @dev Contract to test reentrancy protection
 */
contract ReentrancyAttacker {
    address public targetContract;
    uint256 public attackCount;
    
    constructor(address _target) {
        targetContract = _target;
    }
    
    // Fallback function to attempt reentrancy
    receive() external payable {
        if (attackCount < 3) {
            attackCount++;
            // Try to call purchasePlan again
            (bool success,) = targetContract.call(
                abi.encodeWithSignature("purchasePlan(uint8)", 1)
            );
            require(!success, "Reentrancy should fail");
        }
    }
    
    function attack(uint8 planType) external {
        attackCount = 0;
        (bool success,) = targetContract.call(
            abi.encodeWithSignature("purchasePlan(uint8)", planType)
        );
        require(success, "Initial call should succeed");
    }
}
