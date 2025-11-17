const hre = require("hardhat");

async function main() {
  const SUBSCRIPTION_ADDRESS = "0x1E5e2b446758E88971F30f333183f62b6f70bEE0";
  const USDC_ADDRESS = "0xBEE08798a3634e29F47e3d277C9d11507D55F66a";
  const USER_ADDRESS = "0xe152555A2266f7778050596B2B6593175c813EF0";

  console.log("🔍 Checking Contract Configuration...\n");

  // Get contracts
  const subscription = await hre.ethers.getContractAt("SubscriptionPlan", SUBSCRIPTION_ADDRESS);
  const usdc = await hre.ethers.getContractAt("MockUSDC", USDC_ADDRESS);

  // Check subscription contract config
  const contractUsdc = await subscription.usdcToken();
  const treasury = await subscription.treasury();
  
  console.log("📍 Subscription Contract:", SUBSCRIPTION_ADDRESS);
  console.log("   - USDC Token:", contractUsdc);
  console.log("   - Treasury:", treasury);
  
  // Check if USDC address matches
  if (contractUsdc.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
    console.log("\n❌ ERROR: Contract is configured with different USDC address!");
    console.log("   Frontend using:", USDC_ADDRESS);
    console.log("   Contract using:", contractUsdc);
  } else {
    console.log("   ✅ USDC address matches!");
  }

  // Check monthly plan details
  console.log("\n📋 Monthly Plan Details:");
  const [price, duration, isActive] = await subscription.getPlanDetails(1); // MONTHLY = 1
  console.log("   - Price:", hre.ethers.formatUnits(price, 6), "USDC");
  console.log("   - Duration:", duration.toString(), "seconds");
  console.log("   - Active:", isActive);

  // Check user's current subscription
  console.log("\n👤 User Subscription:", USER_ADDRESS);
  const [planType, expiry, hasAccess, isExpired] = await subscription.getSubscription(USER_ADDRESS);
  console.log("   - Plan Type:", planType === 0 ? "FREE" : planType === 1 ? "MONTHLY" : "YEARLY");
  console.log("   - Expiry:", expiry.toString());
  console.log("   - Has Access:", hasAccess);
  console.log("   - Is Expired:", isExpired);

  // Check user's USDC balance and allowance
  console.log("\n💰 User's USDC Status:");
  const balance = await usdc.balanceOf(USER_ADDRESS);
  const allowance = await usdc.allowance(USER_ADDRESS, SUBSCRIPTION_ADDRESS);
  console.log("   - Balance:", hre.ethers.formatUnits(balance, 6), "USDC");
  console.log("   - Allowance:", hre.ethers.formatUnits(allowance, 6), "USDC");

  if (allowance < price) {
    console.log("\n⚠️  WARNING: Allowance is less than monthly plan price!");
    console.log("   User needs to approve at least:", hre.ethers.formatUnits(price, 6), "USDC");
  } else {
    console.log("\n   ✅ Allowance is sufficient!");
  }

  // Check treasury balance
  console.log("\n💎 Treasury Balance:");
  const treasuryBalance = await usdc.balanceOf(treasury);
  console.log("   - USDC:", hre.ethers.formatUnits(treasuryBalance, 6));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
