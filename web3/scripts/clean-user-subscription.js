const hre = require("hardhat");

async function main() {
  const SUBSCRIPTION_ADDRESS = "0x1E5e2b446758E88971F30f333183f62b6f70bEE0";
  const USER_ADDRESS = "0xe152555A2266f7778050596B2B6593175c813EF0";

  console.log("🧹 Cleaning user subscription state...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using owner account:", deployer.address);

  const subscription = await hre.ethers.getContractAt("SubscriptionPlan", SUBSCRIPTION_ADDRESS);

  // Check current state
  const [planType, expiry, hasAccess, isExpired] = await subscription.getSubscription(USER_ADDRESS);
  console.log("📊 Current State:");
  console.log("   - Plan Type:", planType.toString());
  console.log("   - Expiry:", expiry.toString());
  console.log("   - Has Access:", hasAccess);
  console.log("   - Is Expired:", isExpired);

  // Grant 1 second access then wait for it to expire
  console.log("\n🎁 Granting 1-second MONTHLY access...");
  const tx = await subscription.grantAccess(USER_ADDRESS, 1, 1); // MONTHLY, 1 second
  console.log("⏳ Transaction:", tx.hash);
  await tx.wait();
  console.log("✅ Granted!");

  // Wait 2 seconds
  console.log("\n⏳ Waiting 5 seconds for expiry...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Revoke
  console.log("\n🔄 Revoking expired access...");
  const revokeTx = await subscription.revokeExpiredAccess(USER_ADDRESS);
  console.log("⏳ Transaction:", revokeTx.hash);
  await revokeTx.wait();
  console.log("✅ Revoked!");

  // Check new state
  const [newPlan, newExpiry, newAccess, newExpired] = await subscription.getSubscription(USER_ADDRESS);
  console.log("\n📊 New State:");
  console.log("   - Plan Type:", newPlan.toString());
  console.log("   - Expiry:", newExpiry.toString());
  console.log("   - Has Access:", newAccess);
  console.log("   - Is Expired:", newExpired);

  console.log("\n✅ User subscription cleaned! User can now purchase normally.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
