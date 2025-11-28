const hre = require("hardhat");

async function testContract() {
  const SUBSCRIPTION_ADDRESS = "0x886892Eb87b8b78Fd42d4F5aC409b4982fC8cE86";
  const USDC_ADDRESS = "0x96a35f2e2f998143382dDd41335319C2b8fB32eD";
  const YOUR_WALLET = "0xdAc363D23f911066467A05FC2405B0f76ff17CdB";

  console.log("🧪 Testing Subscription Contract\n");

  // Get contracts
  const SubscriptionPlan = await hre.ethers.getContractFactory("SubscriptionPlan");
  const subscription = SubscriptionPlan.attach(SUBSCRIPTION_ADDRESS);
  
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = MockUSDC.attach(USDC_ADDRESS);

  try {
    // Check USDC balance
    const balance = await usdc.balanceOf(YOUR_WALLET);
    console.log("💰 USDC Balance:", hre.ethers.formatUnits(balance, 6), "USDC");

    // Check allowance
    const allowance = await usdc.allowance(YOUR_WALLET, SUBSCRIPTION_ADDRESS);
    console.log("✅ Allowance:", hre.ethers.formatUnits(allowance, 6), "USDC");

    // Get plan details
    console.log("\n📋 Plan Details:");
    try {
      const plan = await subscription.getPlanDetails(1); // MONTHLY
      console.log("Monthly Plan:", {
        price: hre.ethers.formatUnits(plan.price, 6),
        duration: plan.duration.toString(),
        isActive: plan.isActive
      });
    } catch (err) {
      console.log("❌ Cannot get plan details:", err.message);
    }

    // Try to check subscription
    console.log("\n📝 Current Subscription:");
    try {
      const sub = await subscription.getSubscription(YOUR_WALLET);
      console.log({
        planType: sub.planType.toString(),
        expiryTimestamp: sub.expiryTimestamp.toString(),
        hasAccess: sub.hasAccess,
        isExpired: sub.isExpired
      });
    } catch (err) {
      console.log("❌ Cannot get subscription:", err.message);
    }

    // Approve USDC
    console.log("\n⏳ Approving USDC...");
    const approveTx = await usdc.approve(SUBSCRIPTION_ADDRESS, hre.ethers.parseUnits("10", 6));
    await approveTx.wait();
    console.log("✅ Approved!");

    // Try to purchase
    console.log("\n💳 Attempting to purchase monthly plan...");
    const purchaseTx = await subscription.purchasePlan(1);
    await purchaseTx.wait();
    console.log("✅ Purchase successful!");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
    }
  }
}

testContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
