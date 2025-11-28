const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking New User State...\n");

  const NEW_USER = "0xD9d82ad1EffC9198cd69e7356cE1efFB062a610D";
  const USDC_ADDRESS = "0xBEE08798a3634e29F47e3d277C9d11507D55F66a";
  const SUBSCRIPTION_ADDRESS = "0x1E5e2b446758E88971F30f333183f62b6f70bEE0";

  // Get contracts
  const USDC = await hre.ethers.getContractAt("MockUSDC", USDC_ADDRESS);
  const Subscription = await hre.ethers.getContractAt(
    "SubscriptionPlan",
    SUBSCRIPTION_ADDRESS
  );

  // Check USDC balance
  const balance = await USDC.balanceOf(NEW_USER);
  console.log(`💰 User Balance: ${hre.ethers.formatUnits(balance, 6)} USDC`);

  // Check allowance
  const allowance = await USDC.allowance(NEW_USER, SUBSCRIPTION_ADDRESS);
  console.log(
    `📝 Allowance to Subscription: ${hre.ethers.formatUnits(
      allowance,
      6
    )} USDC`
  );

  // Check subscription
  const sub = await Subscription.getSubscription(NEW_USER);
  console.log(`\n📊 Subscription:`);
  console.log(`   - Plan Type: ${sub[0]} (0=FREE, 1=MONTHLY, 2=YEARLY)`);
  console.log(`   - Expiry: ${sub[1].toString()}`);
  console.log(`   - Has Access: ${sub[2]}`);
  console.log(`   - Is Expired: ${sub[3]}`);

  // Check MONTHLY plan
  const plan = await Subscription.plans(1); // MONTHLY
  console.log(`\n📋 MONTHLY Plan:`);
  console.log(`   - Price: ${hre.ethers.formatUnits(plan.price, 6)} USDC`);
  console.log(`   - Active: ${plan.isActive}`);

  // Try to simulate the transferFrom
  console.log(`\n🔬 Simulating transferFrom...`);
  try {
    const treasury = await Subscription.treasury();
    console.log(`   - Treasury: ${treasury}`);
    console.log(`   - From: ${NEW_USER}`);
    console.log(`   - To: ${treasury}`);
    console.log(`   - Amount: ${hre.ethers.formatUnits(plan.price, 6)} USDC`);

    // Check if user has enough balance
    if (balance < plan.price) {
      console.log(`   ❌ Insufficient balance!`);
    } else if (allowance < plan.price) {
      console.log(`   ❌ Insufficient allowance!`);
    } else {
      console.log(`   ✅ Balance and allowance OK`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
