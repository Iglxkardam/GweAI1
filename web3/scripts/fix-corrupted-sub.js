const hre = require("hardhat");

async function main() {
  const SUBSCRIPTION_ADDRESS = "0x1E5e2b446758E88971F30f333183f62b6f70bEE0";
  const USER_ADDRESS = "0xe152555A2266f7778050596B2B6593175c813EF0";

  console.log("🔧 Fixing corrupted subscription state...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using owner account:", deployer.address);

  const subscription = await hre.ethers.getContractAt("SubscriptionPlan", SUBSCRIPTION_ADDRESS);

  // Grant a 1-second MONTHLY access to reset the state properly
  console.log("🎁 Granting 1-second MONTHLY access to reset state...");
  const tx = await subscription.grantAccess(USER_ADDRESS, 1, 1); // MONTHLY plan, 1 second
  console.log("⏳ Transaction:", tx.hash);
  await tx.wait();
  console.log("✅ State reset - subscription will expire in 1 second!");

  // Check new state
  const [planType, expiry, hasAccess, isExpired] = await subscription.getSubscription(USER_ADDRESS);
  console.log("\n📊 New State:");
  console.log("   - Plan Type:", planType === 0 ? "FREE" : planType === 1 ? "MONTHLY" : "YEARLY");
  console.log("   - Expiry:", expiry.toString());
  console.log("   - Has Access:", hasAccess);
  console.log("   - Is Expired:", isExpired);

  console.log("\n✅ User can now purchase a subscription normally!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
