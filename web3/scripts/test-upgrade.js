const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing Upgrade from MONTHLY to YEARLY\n");

  const [signer] = await hre.ethers.getSigners();
  console.log("👤 Testing with account:", signer.address);

  const USDC_ADDRESS = "0xBEE08798a3634e29F47e3d277C9d11507D55F66a";
  const SUBSCRIPTION_ADDRESS = "0x1E5e2b446758E88971F30f333183f62b6f70bEE0";

  const usdc = await hre.ethers.getContractAt("MockUSDC", USDC_ADDRESS);
  const subscription = await hre.ethers.getContractAt("SubscriptionPlan", SUBSCRIPTION_ADDRESS);

  // Check current state
  console.log("\n📊 Current State:");
  const currentSub = await subscription.getSubscription(signer.address);
  console.log("  Current Plan:", currentSub.planType === 1n ? "MONTHLY" : currentSub.planType === 2n ? "YEARLY" : "FREE");
  console.log("  Current Expiry:", new Date(Number(currentSub.expiryTimestamp) * 1000).toLocaleString());
  console.log("  Has Access:", currentSub.hasAccess);

  // Get yearly plan details
  const yearlyPlan = await subscription.getPlanDetails(2);
  console.log("\n💰 Yearly Plan:");
  console.log("  Price:", hre.ethers.formatUnits(yearlyPlan.price, 6), "USDC");
  console.log("  Duration:", Number(yearlyPlan.duration) / 86400, "days");

  // Check balance and allowance
  const balance = await usdc.balanceOf(signer.address);
  const allowance = await usdc.allowance(signer.address, SUBSCRIPTION_ADDRESS);
  console.log("\n💳 Wallet:");
  console.log("  Balance:", hre.ethers.formatUnits(balance, 6), "USDC");
  console.log("  Allowance:", hre.ethers.formatUnits(allowance, 6), "USDC");

  // Try to purchase yearly plan
  console.log("\n⏳ Attempting to purchase YEARLY plan...");
  try {
    const tx = await subscription.purchasePlan(2); // 2 = YEARLY
    const receipt = await tx.wait();
    console.log("✅ Purchase successful!");
    console.log("📝 Transaction hash:", receipt.hash);

    // Check new state
    const newSub = await subscription.getSubscription(signer.address);
    console.log("\n📊 New State:");
    console.log("  New Plan:", newSub.planType === 2n ? "YEARLY" : "OTHER");
    console.log("  New Expiry:", new Date(Number(newSub.expiryTimestamp) * 1000).toLocaleString());
    console.log("  Has Access:", newSub.hasAccess);

    const newBalance = await usdc.balanceOf(signer.address);
    console.log("\n💰 Final Balance:", hre.ethers.formatUnits(newBalance, 6), "USDC");
    console.log("💸 Spent:", hre.ethers.formatUnits(balance - newBalance, 6), "USDC");
  } catch (error) {
    console.error("❌ Purchase failed:", error.message);
    
    // Try to get revert reason
    if (error.data) {
      console.log("\n🔍 Revert data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
