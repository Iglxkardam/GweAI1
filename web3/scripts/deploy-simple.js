const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy MockUSDC (for testnet only)
  console.log("📦 Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress);

  // Wait a bit for the transaction to be mined
  console.log("⏳ Waiting for confirmation...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Set treasury address (use deployer for now, change in production)
  const treasuryAddress = deployer.address;
  console.log("💎 Treasury address:", treasuryAddress);

  // Deploy SubscriptionPlan
  console.log("\n📦 Deploying SubscriptionPlan...");
  const SubscriptionPlan = await hre.ethers.getContractFactory("SubscriptionPlan");
  const subscription = await SubscriptionPlan.deploy(
    usdcAddress,
    treasuryAddress
  );
  await subscription.waitForDeployment();
  const subscriptionAddress = await subscription.getAddress();
  console.log("✅ SubscriptionPlan deployed to:", subscriptionAddress);

  // Wait for confirmation
  console.log("⏳ Waiting for confirmation...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log("\n✅ Deployment complete!");
  console.log("\n📝 Contract Addresses:");
  console.log("========================");
  console.log("MockUSDC:", usdcAddress);
  console.log("SubscriptionPlan:", subscriptionAddress);
  console.log("Owner:", deployer.address);
  console.log("Treasury:", treasuryAddress);
  console.log("\n💡 Update these addresses in your .env.local file!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
