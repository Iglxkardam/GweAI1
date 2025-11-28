const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to Base Sepolia with new treasury...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());
  console.log("📝 Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (network.chainId !== 84532n) {
    throw new Error(`Wrong network! Expected Base Sepolia (84532), got ${network.chainId}`);
  }

  // Use existing MockUSDC address
  const usdcAddress = "0xBEE08798a3634e29F47e3d277C9d11507D55F66a";
  console.log("📦 Using existing MockUSDC at:", usdcAddress);

  // Verify USDC exists
  const usdcCode = await hre.ethers.provider.getCode(usdcAddress);
  if (usdcCode.length <= 10) {
    throw new Error("MockUSDC contract not found at specified address!");
  }
  console.log("✅ MockUSDC verified\n");

  // New treasury address
  const treasuryAddress = "0xdac363d23f911066467a05fc2405b0f76ff17cdb";
  console.log("💎 Treasury address:", treasuryAddress);
  console.log("🔑 Owner address:", deployer.address);

  // Deploy SubscriptionPlan with new treasury
  console.log("\n📦 Deploying SubscriptionPlan with new treasury...");
  const SubscriptionPlan = await hre.ethers.getContractFactory("SubscriptionPlan");
  const subscription = await SubscriptionPlan.deploy(
    usdcAddress,
    treasuryAddress
  );
  await subscription.waitForDeployment();
  const subscriptionAddress = await subscription.getAddress();
  console.log("✅ SubscriptionPlan deployed to:", subscriptionAddress);

  // Wait for confirmation
  console.log("⏳ Waiting for 5 confirmations...");
  await subscription.deploymentTransaction().wait(5);

  console.log("\n✅ Deployment complete!");
  console.log("\n📝 Contract Addresses:");
  console.log("========================");
  console.log("MockUSDC (existing):", usdcAddress);
  console.log("SubscriptionPlan (NEW):", subscriptionAddress);
  console.log("Owner:", deployer.address);
  console.log("Treasury:", treasuryAddress);
  console.log("\n💡 Update SUBSCRIPTION_CONTRACT_ADDRESS in contractService.ts!");
  console.log("   OLD: 0x1E5e2b446758E88971F30f333183f62b6f70bEE0");
  console.log("   NEW:", subscriptionAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const subCode = await hre.ethers.provider.getCode(subscriptionAddress);
  console.log("Subscription has bytecode:", subCode.length > 10);

  if (subCode.length > 10) {
    console.log("\n✅ Contract successfully deployed and verified!");
    
    // Verify contract parameters
    console.log("\n🔍 Verifying contract configuration...");
    const sub = await hre.ethers.getContractAt("SubscriptionPlan", subscriptionAddress);
    const actualUSDC = await sub.usdcToken();
    const actualTreasury = await sub.treasury();
    const actualOwner = await sub.owner();
    
    console.log("USDC Token:", actualUSDC);
    console.log("Treasury:", actualTreasury);
    console.log("Owner:", actualOwner);
    
    if (actualUSDC.toLowerCase() === usdcAddress.toLowerCase() &&
        actualTreasury.toLowerCase() === treasuryAddress.toLowerCase()) {
      console.log("\n✅ All parameters correctly set!");
      
      // Check plan prices
      console.log("\n📋 Checking plan configurations...");
      const monthlyPlan = await sub.plans(1); // MONTHLY
      const yearlyPlan = await sub.plans(2); // YEARLY
      
      console.log("Monthly Plan: $" + (Number(monthlyPlan.price) / 1e6) + " for", Number(monthlyPlan.duration) / 86400, "days");
      console.log("Yearly Plan: $" + (Number(yearlyPlan.price) / 1e6) + " for", Number(yearlyPlan.duration) / 86400, "days");
      
    } else {
      throw new Error("Contract parameters mismatch!");
    }
  } else {
    throw new Error("Contract deployment verification failed!");
  }
  
  console.log("\n🎉 Deployment successful! Ready to update frontend.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
