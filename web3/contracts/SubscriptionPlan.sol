// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SubscriptionPlan
 * @dev Manages user subscriptions with Free, Monthly, and Yearly plans
 * @notice Free users cannot access DCA features, paid subscribers get full access
 */
contract SubscriptionPlan is Ownable, ReentrancyGuard {
    // Plan Types
    enum PlanType {
        FREE,
        MONTHLY,
        YEARLY
    }

    // Plan Details
    struct Plan {
        PlanType planType;
        uint256 price; // Price in USDC (6 decimals)
        uint256 duration; // Duration in seconds
        bool isActive;
    }

    // User Subscription
    struct Subscription {
        PlanType planType;
        uint256 expiryTimestamp;
        bool hasAccess;
    }

    // State Variables
    mapping(PlanType => Plan) public plans;
    mapping(address => Subscription) public subscriptions;
    mapping(address => address) public userOwners; // Maps user address to their owner address

    IERC20 public usdcToken;
    address public treasury;

    // Events
    event PlanPurchased(
        address indexed user,
        PlanType planType,
        uint256 expiryTimestamp
    );
    event PlanExpired(address indexed user, PlanType previousPlan);
    event PlanUpdated(PlanType planType, uint256 price, uint256 duration);
    event TreasuryUpdated(address indexed newTreasury);
    event OwnerSet(address indexed user, address indexed owner);
    event AccessRevoked(address indexed user);

    /**
     * @dev Constructor initializes plan prices and durations
     * @param _usdcToken Address of USDC token contract
     * @param _treasury Address to receive subscription payments
     */
    constructor(address _usdcToken, address _treasury) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_treasury != address(0), "Invalid treasury address");

        usdcToken = IERC20(_usdcToken);
        treasury = _treasury;

        // Initialize plans
        // FREE Plan - $0, no duration limit, restricted access
        plans[PlanType.FREE] = Plan({
            planType: PlanType.FREE,
            price: 0,
            duration: 0,
            isActive: true
        });

        // MONTHLY Plan - $2/month
        plans[PlanType.MONTHLY] = Plan({
            planType: PlanType.MONTHLY,
            price: 2 * 10 ** 6, // $2 in USDC (6 decimals)
            duration: 30 days,
            isActive: true
        });

        // YEARLY Plan - $20/year
        plans[PlanType.YEARLY] = Plan({
            planType: PlanType.YEARLY,
            price: 20 * 10 ** 6, // $20 in USDC (6 decimals)
            duration: 365 days,
            isActive: true
        });
    }

    /**
     * @dev Purchase a subscription plan
     * @param planType The type of plan to purchase (MONTHLY or YEARLY)
     */
    function purchasePlan(PlanType planType) external nonReentrant {
        require(planType != PlanType.FREE, "Cannot purchase free plan");
        require(plans[planType].isActive, "Plan not active");

        Plan memory plan = plans[planType];
        Subscription storage userSub = subscriptions[msg.sender];

        // Transfer USDC from user to treasury
        require(
            usdcToken.transferFrom(msg.sender, treasury, plan.price),
            "Payment failed"
        );

        // Calculate new expiry timestamp
        uint256 newExpiry;
        if (userSub.expiryTimestamp > block.timestamp) {
            // Extend existing subscription
            newExpiry = userSub.expiryTimestamp + plan.duration;
        } else {
            // New subscription or expired subscription
            newExpiry = block.timestamp + plan.duration;
        }

        // Update user subscription
        userSub.planType = planType;
        userSub.expiryTimestamp = newExpiry;
        userSub.hasAccess = true;

        // Set owner as the user themselves by default
        if (userOwners[msg.sender] == address(0)) {
            userOwners[msg.sender] = msg.sender;
        }

        emit PlanPurchased(msg.sender, planType, newExpiry);
    }

    /**
     * @dev Check if user has access to DCA features
     * @param user Address of the user to check
     * @return hasAccess Whether user has active subscription
     */
    function checkAccess(address user) external view returns (bool) {
        Subscription memory userSub = subscriptions[user];

        // Free users have no access
        if (userSub.planType == PlanType.FREE) {
            return false;
        }

        // Check if subscription is still valid
        if (userSub.expiryTimestamp > block.timestamp) {
            return true;
        }

        return false;
    }

    /**
     * @dev Get user subscription details
     * @param user Address of the user
     * @return planType Current plan type
     * @return expiryTimestamp When the subscription expires
     * @return hasAccess Current access status
     * @return isExpired Whether the subscription has expired
     */
    function getSubscription(
        address user
    )
        external
        view
        returns (
            PlanType planType,
            uint256 expiryTimestamp,
            bool hasAccess,
            bool isExpired
        )
    {
        Subscription memory userSub = subscriptions[user];

        planType = userSub.planType;
        expiryTimestamp = userSub.expiryTimestamp;

        // Check if expired
        bool expired = userSub.planType != PlanType.FREE &&
            userSub.expiryTimestamp <= block.timestamp;

        hasAccess = !expired && userSub.planType != PlanType.FREE;
        isExpired = expired;

        return (planType, expiryTimestamp, hasAccess, isExpired);
    }

    /**
     * @dev Revoke access for expired subscriptions (can be called by anyone)
     * @param user Address of the user to check
     */
    function revokeExpiredAccess(address user) external {
        Subscription storage userSub = subscriptions[user];

        require(userSub.planType != PlanType.FREE, "User is on free plan");
        require(
            userSub.expiryTimestamp <= block.timestamp,
            "Subscription still active"
        );
        require(userSub.hasAccess, "Access already revoked");

        PlanType previousPlan = userSub.planType;

        // Reset to free plan
        userSub.planType = PlanType.FREE;
        userSub.hasAccess = false;

        emit PlanExpired(user, previousPlan);
        emit AccessRevoked(user);
    }

    /**
     * @dev Set owner for the calling user's subscription
     * @param owner Address to set as owner
     */
    function setOwner(address owner) external {
        require(owner != address(0), "Invalid owner address");
        require(
            subscriptions[msg.sender].planType != PlanType.FREE,
            "Only paid users can set owner"
        );
        require(
            subscriptions[msg.sender].expiryTimestamp > block.timestamp,
            "Subscription expired"
        );

        userOwners[msg.sender] = owner;
        emit OwnerSet(msg.sender, owner);
    }

    /**
     * @dev Get owner of a user's subscription
     * @param user Address of the user
     * @return owner Address of the owner
     */
    function getOwner(address user) external view returns (address) {
        return userOwners[user];
    }

    // Admin Functions

    /**
     * @dev Update plan details (only owner)
     * @param planType Type of plan to update
     * @param price New price in USDC
     * @param duration New duration in seconds
     * @param isActive Whether plan is active
     */
    function updatePlan(
        PlanType planType,
        uint256 price,
        uint256 duration,
        bool isActive
    ) external onlyOwner {
        require(
            planType != PlanType.FREE || price == 0,
            "Free plan must have 0 price"
        );

        plans[planType].price = price;
        plans[planType].duration = duration;
        plans[planType].isActive = isActive;

        emit PlanUpdated(planType, price, duration);
    }

    /**
     * @dev Update treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    /**
     * @dev Grant premium access to a user (only owner, for testing/promotions)
     * @param user Address of the user
     * @param planType Plan type to grant
     * @param duration Duration of access
     */
    function grantAccess(
        address user,
        PlanType planType,
        uint256 duration
    ) external onlyOwner {
        require(planType != PlanType.FREE, "Cannot grant free plan");

        Subscription storage userSub = subscriptions[user];

        uint256 newExpiry = block.timestamp + duration;
        userSub.planType = planType;
        userSub.expiryTimestamp = newExpiry;
        userSub.hasAccess = true;

        if (userOwners[user] == address(0)) {
            userOwners[user] = user;
        }

        emit PlanPurchased(user, planType, newExpiry);
    }

    /**
     * @dev Get plan details
     * @param planType Type of plan
     * @return price Price of the plan
     * @return duration Duration of the plan
     * @return isActive Whether plan is active
     */
    function getPlanDetails(
        PlanType planType
    ) external view returns (uint256 price, uint256 duration, bool isActive) {
        Plan memory plan = plans[planType];
        return (plan.price, plan.duration, plan.isActive);
    }
}
