const hre = require("hardhat");

async function main() {
  const SUBSCRIPTION_ADDRESS = "0x1E5e2b446758E88971F30f333183f62b6f70bEE0";
  const USER_ADDRESS = "0xe152555A2266f7778050596B2B6593175c813EF0";

  console.log("🔧 Resetting Subscription for:", USER_ADDRESS, "\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  // Get contract
  const subscription = await hre.ethers.getContractAt("SubscriptionPlan", SUBSCRIPTION_ADDRESS);

  // Check current state
  console.log("📊 Current State:");
  const [planType, expiry, hasAccess, isExpired] = await subscription.getSubscription(USER_ADDRESS);
  console.log("   - Plan Type:", planType === 0 ? "FREE" : planType === 1 ? "MONTHLY" : "YEARLY");
  console.log("   - Expiry:", expiry.toString());
  console.log("   - Has Access:", hasAccess);
  console.log("   - Is Expired:", isExpired);

  // Call revokeExpiredAccess to reset to FREE
  console.log("\n🔄 Calling revokeExpiredAccess...");
  try {
    const tx = await subscription.revokeExpiredAccess(USER_ADDRESS);
    console.log("⏳ Transaction submitted:", tx.hash);
    await tx.wait();
    console.log("✅ Transaction confirmed!");
  } catch (error) {
    console.log("⚠️  revokeExpiredAccess failed, trying grantAccess to reset...");
    
    // Alternative: Use grantAccess to set a very short duration, let it expire, then revoke
    // But simpler: just set FREE plan manually if we're owner
    console.log("This user's subscription is in a bad state.");
    console.log("Solution: User should wait for blockchain to catch up, or owner needs to manually fix.");
    throw error;
  }

  // Check new state
  console.log("\n📊 New State:");
  const [newPlan, newExpiry, newAccess, newExpired] = await subscription.getSubscription(USER_ADDRESS);
  console.log("   - Plan Type:", newPlan === 0 ? "FREE" : newPlan === 1 ? "MONTHLY" : "YEARLY");
  console.log("   - Expiry:", newExpiry.toString());
  console.log("   - Has Access:", newAccess);
  console.log("   - Is Expired:", newExpired);

  console.log("\n✅ User can now purchase a new subscription!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
