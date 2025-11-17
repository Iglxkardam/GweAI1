const hre = require("hardhat");

async function main() {
  console.log("🪙 Minting MockUSDC tokens...\n");

  const USDC_ADDRESS = "0xBEE08798a3634e29F47e3d277C9d11507D55F66a";
  const RECIPIENT = "0xdAc363D23f911066467A05FC2405B0f76ff17CdB";

  const usdc = await hre.ethers.getContractAt("MockUSDC", USDC_ADDRESS);
  const amount = hre.ethers.parseUnits("1000000000", 6); // 1 billion USDC

  console.log("📍 MockUSDC Address:", USDC_ADDRESS);
  console.log("👤 Recipient:", RECIPIENT);
  console.log("💰 Amount to mint:", hre.ethers.formatUnits(amount, 6), "USDC\n");

  console.log("⏳ Minting tokens...");
  const tx = await usdc.mint(RECIPIENT, amount);
  await tx.wait();
  console.log("✅ Mint transaction confirmed:", tx.hash);

  // Wait a bit and check balance
  await new Promise(resolve => setTimeout(resolve, 5000));
  const balance = await usdc.balanceOf(RECIPIENT);
  console.log("\n💰 Final balance:", hre.ethers.formatUnits(balance, 6), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Mint failed:", error);
    process.exit(1);
  });
