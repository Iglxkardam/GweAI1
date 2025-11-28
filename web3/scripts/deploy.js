const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy MockUSDC (for testnet only)
  console.log("📦 Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log("✅ MockUSDC deployed to:", await usdc.getAddress());

  // Set treasury address (use deployer for now, change in production)
  const treasuryAddress = deployer.address;
  console.log("💎 Treasury address:", treasuryAddress);

  // Deploy SubscriptionPlan
  console.log("\n📦 Deploying SubscriptionPlan...");
  const SubscriptionPlan = await hre.ethers.getContractFactory("SubscriptionPlan");
  const subscription = await SubscriptionPlan.deploy(
    await usdc.getAddress(),
    treasuryAddress
  );
  await subscription.waitForDeployment();
  console.log("✅ SubscriptionPlan deployed to:", await subscription.getAddress());

  // Verify plan details
  console.log("\n📋 Verifying plan configuration...");
  const freePlan = await subscription.getPlanDetails(0);
  const monthlyPlan = await subscription.getPlanDetails(1);
  const yearlyPlan = await subscription.getPlanDetails(2);

  console.log("  FREE Plan:", {
    price: hre.ethers.formatUnits(freePlan.price, 6),
    duration: freePlan.duration.toString(),
    isActive: freePlan.isActive
  });
  console.log("  MONTHLY Plan:", {
    price: hre.ethers.formatUnits(monthlyPlan.price, 6),
    duration: (Number(monthlyPlan.duration) / 86400).toString() + " days",
    isActive: monthlyPlan.isActive
  });
  console.log("  YEARLY Plan:", {
    price: hre.ethers.formatUnits(yearlyPlan.price, 6),
    duration: (Number(yearlyPlan.duration) / 86400).toString() + " days",
    isActive: yearlyPlan.isActive
  });

  console.log("\n✅ Deployment complete!");
  console.log("\n📝 Contract Addresses:");
  console.log("========================");
  console.log("MockUSDC:", await usdc.getAddress());
  console.log("SubscriptionPlan:", await subscription.getAddress());
  console.log("Owner:", deployer.address);
  console.log("Treasury:", treasuryAddress);
  console.log("\n💡 Save these addresses for your frontend integration!");

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 To verify contracts on block explorer, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${await usdc.getAddress()}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${await subscription.getAddress()} ${await usdc.getAddress()} ${treasuryAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
