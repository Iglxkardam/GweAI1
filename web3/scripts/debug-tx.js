const hre = require("hardhat");

async function main() {
  const purchaseTxHash = "0xe734ed5942270b03ed40a2103a02b1c62ba0e46157949f1f46018edfa363923d";
  const approveTxHash = "0x8e812e05ccb617e2e7f00eeedc48ed8ade14862730ed5f0464af2b2d7c6c1612";

  console.log("🔍 Checking Approval Transaction...\n");
  const approveReceipt = await hre.ethers.provider.getTransactionReceipt(approveTxHash);
  console.log("Status:", approveReceipt.status === 1 ? "✅ SUCCESS" : "❌ FAILED");
  console.log("Gas used:", approveReceipt.gasUsed.toString());
  console.log("Logs:", approveReceipt.logs.length);

  console.log("\n🔍 Checking Purchase Transaction...\n");
  const purchaseReceipt = await hre.ethers.provider.getTransactionReceipt(purchaseTxHash);
  console.log("Status:", purchaseReceipt.status === 1 ? "✅ SUCCESS" : "❌ FAILED");
  console.log("Gas used:", purchaseReceipt.gasUsed.toString());
  console.log("Logs:", purchaseReceipt.logs.length);

  if (purchaseReceipt.logs.length > 0) {
    console.log("\n📄 Transaction Logs:");
    purchaseReceipt.logs.forEach((log, i) => {
      console.log(`  Log ${i}:`);
      console.log(`    Address: ${log.address}`);
      console.log(`    Topics: ${log.topics.length}`);
      console.log(`    Data: ${log.data}`);
    });
  }

  // Check current state
  console.log("\n📊 Current State:");
  const subscription = await hre.ethers.getContractAt("SubscriptionPlan", "0x1E5e2b446758E88971F30f333183f62b6f70bEE0");
  const usdc = await hre.ethers.getContractAt("MockUSDC", "0xBEE08798a3634e29F47e3d277C9d11507D55F66a");
  
  const userAddress = "0xdAc363D23f911066467A05FC2405B0f76ff17CdB";
  const sub = await subscription.getSubscription(userAddress);
  const balance = await usdc.balanceOf(userAddress);
  const allowance = await usdc.allowance(userAddress, "0x1E5e2b446758E88971F30f333183f62b6f70bEE0");

  console.log("  USDC Balance:", hre.ethers.formatUnits(balance, 6));
  console.log("  USDC Allowance:", hre.ethers.formatUnits(allowance, 6));
  console.log("  Plan Type:", sub.planType.toString());
  console.log("  Expiry Timestamp:", sub.expiryTimestamp.toString());
  console.log("  Has Access:", sub.hasAccess);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
