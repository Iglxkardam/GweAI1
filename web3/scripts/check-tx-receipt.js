const hre = require("hardhat");

async function main() {
  // Replace with your actual transaction hash from console
  const txHash = process.argv[2];
  
  if (!txHash) {
    console.log("Usage: npx hardhat run scripts/check-tx-receipt.js --network baseSepolia <tx_hash>");
    process.exit(1);
  }

  console.log("🔍 Checking Transaction:", txHash, "\n");

  const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
  
  if (!receipt) {
    console.log("❌ Transaction not found or not mined yet");
    return;
  }

  console.log("📊 Transaction Receipt:");
  console.log("   - Status:", receipt.status === 1 ? "✅ SUCCESS" : "❌ FAILED");
  console.log("   - Block Number:", receipt.blockNumber);
  console.log("   - Gas Used:", receipt.gasUsed.toString());
  console.log("   - From:", receipt.from);
  console.log("   - To:", receipt.to);
  
  console.log("\n📝 Logs:");
  if (receipt.logs.length === 0) {
    console.log("   ⚠️  No events emitted! This means the transaction reverted internally.");
  } else {
    receipt.logs.forEach((log, i) => {
      console.log(`   Log ${i}:`, log.topics[0]);
    });
  }

  // Try to get transaction details
  const tx = await hre.ethers.provider.getTransaction(txHash);
  console.log("\n📤 Transaction Input:");
  console.log("   - Data:", tx.data.substring(0, 66), "...");
  console.log("   - Value:", hre.ethers.formatEther(tx.value), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
