const hre = require("hardhat");

async function main() {
  const txHash = "0x337add8fcee6cfcac4bb38e15f5276d52286bb2af4e5e195d67801557e0a30c6";
  
  console.log("🔍 Checking Transaction Receipt\n");
  const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
  
  console.log("Status:", receipt.status === 1 ? "✅ SUCCESS" : "❌ FAILED");
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Number of logs:", receipt.logs.length);
  
  if (receipt.logs.length > 0) {
    console.log("\n📄 Transaction Logs:");
    receipt.logs.forEach((log, i) => {
      console.log(`\nLog ${i}:`);
      console.log("  Contract:", log.address);
      console.log("  Topics:", log.topics.length, "topics");
      log.topics.forEach((topic, j) => {
        console.log(`    Topic ${j}:`, topic);
      });
      console.log("  Data:", log.data);
    });
  }

  // Decode the PlanPurchased event
  const subscription = await hre.ethers.getContractAt("SubscriptionPlan", "0x1E5e2b446758E88971F30f333183f62b6f70bEE0");
  const iface = subscription.interface;
  
  console.log("\n🔍 Decoded Events:");
  receipt.logs.forEach((log, i) => {
    try {
      const parsed = iface.parseLog(log);
      console.log(`\nEvent ${i}: ${parsed.name}`);
      console.log("  Args:", parsed.args);
    } catch (e) {
      // Not a subscription contract event
    }
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
