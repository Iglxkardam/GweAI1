const hre = require("hardhat");

async function main() {
  const txHash = "0xae940d6b6d55a3ea43e270592b04bdc1c59ae8af4d853761089ace6c32fdf9a6";
  
  console.log("🔍 Analyzing Failed Transaction...\n");
  console.log(`📍 TX: ${txHash}\n`);

  try {
    const tx = await hre.ethers.provider.getTransaction(txHash);
    const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);

    console.log("📤 Transaction Details:");
    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to}`);
    console.log(`   Value: ${hre.ethers.formatEther(tx.value)} ETH`);
    console.log(`   Gas Limit: ${tx.gasLimit.toString()}`);
    console.log(`   Data: ${tx.data}`);

    console.log("\n📥 Receipt:");
    console.log(`   Status: ${receipt.status === 1 ? "SUCCESS" : "FAILED"}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Logs: ${receipt.logs.length}`);

    // Decode the function call
    const iface = new hre.ethers.Interface([
      "function purchasePlan(uint8 planType)"
    ]);
    
    try {
      const decoded = iface.parseTransaction({ data: tx.data });
      console.log("\n🔍 Decoded Function Call:");
      console.log(`   Function: ${decoded.name}`);
      console.log(`   Plan Type: ${decoded.args[0]} (1=MONTHLY, 2=YEARLY)`);
    } catch (e) {
      console.log("\n❌ Could not decode function call");
    }

    // Try to replay the transaction
    console.log("\n🔄 Attempting to replay transaction...");
    try {
      const result = await hre.ethers.provider.call({
        from: tx.from,
        to: tx.to,
        data: tx.data,
        value: tx.value,
        gasLimit: tx.gasLimit,
      });
      console.log(`   ✅ Replay succeeded: ${result}`);
    } catch (error) {
      console.log(`   ❌ Replay failed: ${error.message}`);
      
      // Try to get revert reason
      if (error.data) {
        console.log(`   📝 Error data: ${error.data}`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
