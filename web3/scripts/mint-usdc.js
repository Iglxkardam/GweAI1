const hre = require("hardhat");

async function main() {
  const MOCK_USDC_ADDRESS = "0x96a35f2e2f998143382dDd41335319C2b8fB32eD";
  const YOUR_WALLET = "0xdAc363D23f911066467A05FC2405B0f76ff17CdB";
  const AMOUNT = "100"; // 100 USDC

  console.log("💰 Minting MockUSDC tokens...\n");
  console.log("Contract:", MOCK_USDC_ADDRESS);
  console.log("Recipient:", YOUR_WALLET);
  console.log("Amount:", AMOUNT, "USDC\n");

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = MockUSDC.attach(MOCK_USDC_ADDRESS);

  const tx = await usdc.mint(YOUR_WALLET, hre.ethers.parseUnits(AMOUNT, 6));
  console.log("⏳ Transaction sent:", tx.hash);
  
  await tx.wait();
  console.log("✅ Tokens minted successfully!");

  const balance = await usdc.balanceOf(YOUR_WALLET);
  console.log("\n💰 New USDC balance:", hre.ethers.formatUnits(balance, 6), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
