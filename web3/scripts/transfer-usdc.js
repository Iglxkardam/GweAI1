const hre = require("hardhat");

async function main() {
  console.log("💸 USDC Transfer Script\n");

  const USDC_ADDRESS = "0xBEE08798a3634e29F47e3d277C9d11507D55F66a";
  
  // Get your wallet
  const [sender] = await hre.ethers.getSigners();
  console.log("📤 From:", sender.address);

  // CONFIGURE THESE:
  const RECIPIENT = "0x11b77202E0daEbFeB9Bc950d0cF82CaF2CD35187";
  const AMOUNT = "10000"; // Amount in USDC (e.g., "100" = 100 USDC)

  if (RECIPIENT === "0x0000000000000000000000000000000000000000") {
    console.error("\n❌ ERROR: Please set the RECIPIENT address in the script!");
    console.log("Edit this file and change the RECIPIENT variable to your destination address.");
    process.exit(1);
  }

  console.log("📥 To:", RECIPIENT);
  console.log("💰 Amount:", AMOUNT, "USDC\n");

  // Get USDC contract
  const usdc = await hre.ethers.getContractAt("MockUSDC", USDC_ADDRESS);

  // Check balance
  const balance = await usdc.balanceOf(sender.address);
  console.log("💳 Your Balance:", hre.ethers.formatUnits(balance, 6), "USDC");

  const amountWei = hre.ethers.parseUnits(AMOUNT, 6);
  
  if (balance < amountWei) {
    console.error("\n❌ ERROR: Insufficient balance!");
    process.exit(1);
  }

  // Transfer
  console.log("\n⏳ Sending USDC...");
  const tx = await usdc.transfer(RECIPIENT, amountWei);
  console.log("📝 Transaction submitted:", tx.hash);
  
  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log("✅ Transfer confirmed!");
  console.log("📝 Transaction hash:", receipt.hash);

  // Check new balances
  const newBalance = await usdc.balanceOf(sender.address);
  const recipientBalance = await usdc.balanceOf(RECIPIENT);
  
  console.log("\n📊 Final Balances:");
  console.log("  Your balance:", hre.ethers.formatUnits(newBalance, 6), "USDC");
  console.log("  Recipient balance:", hre.ethers.formatUnits(recipientBalance, 6), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Transfer failed:", error);
    process.exit(1);
  });
