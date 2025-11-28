const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to Base Sepolia...\n");

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

  // Deploy MockUSDC (for testnet only)
  console.log("📦 Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress);

  // Wait for confirmation
  console.log("⏳ Waiting for 3 confirmations...");
  await usdc.deploymentTransaction().wait(3);

  // Set treasury address - 0xdac363d23f911066467a05fc2405b0f76ff17cdb
  const treasuryAddress = "0xdac363d23f911066467a05fc2405b0f76ff17cdb";
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
  console.log("⏳ Waiting for 3 confirmations...");
  await subscription.deploymentTransaction().wait(3);

  console.log("\n✅ Deployment complete!");
  console.log("\n📝 Contract Addresses:");
  console.log("========================");
  console.log("MockUSDC:", usdcAddress);
  console.log("SubscriptionPlan:", subscriptionAddress);
  console.log("Owner:", deployer.address);
  console.log("Treasury:", treasuryAddress);
  console.log("\n💡 Update these addresses in your .env.local file!");

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const usdcCode = await hre.ethers.provider.getCode(usdcAddress);
  const subCode = await hre.ethers.provider.getCode(subscriptionAddress);
  console.log("MockUSDC has bytecode:", usdcCode.length > 10);
  console.log("Subscription has bytecode:", subCode.length > 10);

  if (usdcCode.length > 10 && subCode.length > 10) {
    console.log("\n✅ Contracts successfully deployed and verified!");
  } else {
    throw new Error("Contract deployment verification failed!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
