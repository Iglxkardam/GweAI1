const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing Subscription Purchase Flow\n");

  const [signer] = await hre.ethers.getSigners();
  console.log("👤 Testing with account:", signer.address);

  const USDC_ADDRESS = "0x19F538a41bB5Ac3398366c65E88dC1Fe9AeD0514";
  const SUBSCRIPTION_ADDRESS = "0x93250ca5Dc252a398Cb33D440e072032ca86408B";

  // Get contracts
  const usdc = await hre.ethers.getContractAt("MockUSDC", USDC_ADDRESS);
  const subscription = await hre.ethers.getContractAt("SubscriptionPlan", SUBSCRIPTION_ADDRESS);

  // Check USDC balance
  console.log("\n📊 Checking balances...");
  const balance = await usdc.balanceOf(signer.address);
  console.log("💰 USDC Balance:", hre.ethers.formatUnits(balance, 6), "USDC");

  // Check plan details
  console.log("\n📋 Checking plan details...");
  const monthlyPlan = await subscription.getPlanDetails(1);
  console.log("💳 Monthly Plan Price:", hre.ethers.formatUnits(monthlyPlan.price, 6), "USDC");
  console.log("⏰ Monthly Plan Duration:", Number(monthlyPlan.duration) / 86400, "days");
  console.log("✅ Monthly Plan Active:", monthlyPlan.isActive);

  // Step 1: Approve USDC
  console.log("\n⏳ Step 1/2: Approving USDC...");
  const approveTx = await usdc.approve(SUBSCRIPTION_ADDRESS, monthlyPlan.price);
  await approveTx.wait();
  console.log("✅ Approval successful");

  // Check allowance
  const allowance = await usdc.allowance(signer.address, SUBSCRIPTION_ADDRESS);
  console.log("💰 Allowance:", hre.ethers.formatUnits(allowance, 6), "USDC");

  // Step 2: Purchase subscription
  console.log("\n⏳ Step 2/2: Purchasing Monthly subscription...");
  const purchaseTx = await subscription.purchasePlan(1); // 1 = MONTHLY
  const receipt = await purchaseTx.wait();
  console.log("✅ Purchase successful!");
  console.log("📝 Transaction hash:", receipt.hash);

  // Verify subscription
  console.log("\n📋 Verifying subscription...");
  const sub = await subscription.getSubscription(signer.address);
  console.log("Plan Type:", sub.planType === 1n ? "MONTHLY" : "OTHER");
  console.log("Expiry:", new Date(Number(sub.expiryTimestamp) * 1000).toLocaleString());
  console.log("Has Access:", sub.hasAccess);
  console.log("Is Expired:", sub.isExpired);

  console.log("\n✅ Test completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
