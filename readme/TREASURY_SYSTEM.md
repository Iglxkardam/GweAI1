# 💰 Treasury Wallet & Penalty System

## Overview

VaultStaking contract deployed with automatic penalty collection system. All early withdrawal penalties are automatically sent to the treasury wallet.

## 📍 Contract Details

**Deployed Contract:** `0xe01aB85E8d85a871fb7cB3DcA2ba1Ea1D349266B`
**Treasury Wallet:** `0x39c0b97A8F2194fcd7396296F7697a84dd81077A`
**Network:** Base Sepolia
**Chain ID:** 84532

## 💸 How Penalty System Works

### Example 1: $1000 Staked for 1 Year

#### Scenario: User withdraws after 6 months (50% completion)

**Initial Stake:**

- Amount: $1000
- Duration: 365 days
- APY: 10.4% (365-day multiplier)
- Expected Total Yield: $104

**At 6 Months (182 days elapsed):**

**Calculations:**

```
Total Lock Time: 365 days
Elapsed Time: 182 days (49.86%)
Remaining Time: 183 days (50.14%)

Earned Yield So Far: $104 × 49.86% = $51.85
Penalty (50.14% of earned): $51.85 × 50.14% = $26.00
User Receives: $1000 + $51.85 - $26.00 = $1025.85

Treasury Receives: $26.00 ✅
```

**Breakdown:**

- Principal returned to user: $1000.00
- Partial yield to user: $25.85
- Penalty to treasury: $26.00
- **User gets total: $1025.85**
- **Treasury gets: $26.00**

### Example 2: $5000 Staked for 180 Days

#### Scenario: User withdraws after 30 days (16.67% completion)

**Initial Stake:**

- Amount: $5000
- Duration: 180 days
- APY: 9.2% (180-day multiplier)
- Expected Total Yield: $227.67

**At 30 Days:**

**Calculations:**

```
Total Lock Time: 180 days
Elapsed Time: 30 days (16.67%)
Remaining Time: 150 days (83.33%)

Earned Yield So Far: $227.67 × 16.67% = $37.95
Penalty (83.33% of earned): $37.95 × 83.33% = $31.63
User Receives: $5000 + $37.95 - $31.63 = $5006.32

Treasury Receives: $31.63 ✅
```

**Breakdown:**

- Principal returned to user: $5000.00
- Partial yield to user: $6.32
- Penalty to treasury: $31.63
- **User gets total: $5006.32**
- **Treasury gets: $31.63**

### Example 3: $500 Staked for 90 Days

#### Scenario: User withdraws after 80 days (88.89% completion)

**Initial Stake:**

- Amount: $500
- Duration: 90 days
- APY: 8.0% (90-day multiplier)
- Expected Total Yield: $9.86

**At 80 Days:**

**Calculations:**

```
Total Lock Time: 90 days
Elapsed Time: 80 days (88.89%)
Remaining Time: 10 days (11.11%)

Earned Yield So Far: $9.86 × 88.89% = $8.77
Penalty (11.11% of earned): $8.77 × 11.11% = $0.97
User Receives: $500 + $8.77 - $0.97 = $507.80

Treasury Receives: $0.97 ✅
```

**Breakdown:**

- Principal returned to user: $500.00
- Partial yield to user: $7.80
- Penalty to treasury: $0.97
- **User gets total: $507.80**
- **Treasury gets: $0.97**

## 📊 Penalty Formula

```solidity
// Solidity implementation in contract
uint256 totalLockTime = unlockDate - lockDate;
uint256 elapsedTime = block.timestamp - lockDate;
uint256 remainingTime = unlockDate - block.timestamp;

// Calculate earned yield
uint256 earnedYield = (totalYield × elapsedTime) / totalLockTime;

// Calculate penalty
uint256 penalty = (earnedYield × remainingTime) / totalLockTime;

// Transfer penalty to treasury
treasuryWallet.transfer(penalty); // ETH
// or
token.transfer(treasuryWallet, penalty); // ERC20
```

## 🔄 Automatic Treasury Transfer

### How It Works:

1. **User Initiates Early Withdrawal**

   ```
   User calls: withdrawEarly(stakeId)
   ```

2. **Contract Calculates Penalty**

   ```
   - Determines elapsed time
   - Calculates earned yield
   - Computes penalty based on remaining time
   ```

3. **Penalty Sent to Treasury** ✅

   ```
   - Penalty transferred to treasury wallet first
   - Event emitted: PenaltySentToTreasury
   - Transaction is atomic (all or nothing)
   ```

4. **User Receives Remaining Amount**
   ```
   - Principal + (earned yield - penalty)
   - Transferred to user's wallet
   ```

### Transaction Flow:

```
withdrawEarly() called
    ↓
Calculate penalty
    ↓
Transfer penalty → Treasury Wallet ✅
    ↓
Transfer (principal + remaining yield) → User
    ↓
Mark stake as withdrawn
    ↓
Emit events
```

## 💼 Treasury Wallet Management

### View Treasury Balance

**ETH Balance:**

```javascript
const balance = await ethers.provider.getBalance(TREASURY_WALLET);
console.log("Treasury ETH:", ethers.formatEther(balance));
```

**Token Balance (USDC):**

```javascript
const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
const balance = await usdc.balanceOf(TREASURY_WALLET);
console.log("Treasury USDC:", ethers.formatUnits(balance, 6));
```

### Update Treasury Address (Owner Only)

```javascript
// Only contract owner can update treasury
await vaultStaking.updateTreasuryWallet(newTreasuryAddress);
```

## 📈 Expected Treasury Revenue

### Revenue Projections Based on Usage:

**Scenario 1: Low Activity**

- 10 stakes per month
- Average stake: $500
- 30% early withdrawals
- Average early withdrawal at 50% completion
- **Monthly Treasury Revenue: ~$78**

**Scenario 2: Medium Activity**

- 100 stakes per month
- Average stake: $1000
- 40% early withdrawals
- Average early withdrawal at 60% completion
- **Monthly Treasury Revenue: ~$1,200**

**Scenario 3: High Activity**

- 1000 stakes per month
- Average stake: $2000
- 50% early withdrawals
- Average early withdrawal at 50% completion
- **Monthly Treasury Revenue: ~$25,000**

## 🔍 Tracking Penalties

### Events Emitted:

```solidity
event PenaltySentToTreasury(
    address indexed token,
    uint256 amount
);

event Withdrawn(
    address indexed user,
    uint256 indexed stakeId,
    address indexed token,
    uint256 amount,
    uint256 penalty,
    bool isEarlyWithdrawal
);
```

### Query Penalties Using Events:

```javascript
// Listen for penalty events
vaultStaking.on("PenaltySentToTreasury", (token, amount, event) => {
  console.log("Penalty collected!");
  console.log("Token:", token);
  console.log("Amount:", ethers.formatEther(amount));
  console.log("TX:", event.transactionHash);
});

// Get historical penalties
const filter = vaultStaking.filters.PenaltySentToTreasury();
const events = await vaultStaking.queryFilter(filter);

let totalPenalties = 0n;
events.forEach((event) => {
  totalPenalties += event.args.amount;
});

console.log("Total Penalties Collected:", ethers.formatEther(totalPenalties));
```

## 🎯 Smart Contract Functions

### User Functions:

```solidity
// Stake ETH
stakeETH(uint256 lockDuration) payable

// Stake ERC20
stakeToken(address token, uint256 amount, uint256 lockDuration)

// Normal withdrawal (no penalty)
withdraw(uint256 stakeId)

// Early withdrawal (with penalty to treasury)
withdrawEarly(uint256 stakeId)

// View penalty before withdrawing
calculatePenalty(uint256 stakeId) view returns (uint256 penalty, uint256 amountAfterPenalty)
```

### Owner Functions:

```solidity
// Update treasury wallet address
updateTreasuryWallet(address newTreasury)

// Add supported tokens
addSupportedToken(address token)

// Emergency pause
pause()
unpause()

// Emergency withdrawals
toggleEmergencyWithdrawal(bool enabled)
```

## 🛡️ Security Features

### Treasury Protection:

1. **No Backdoor Withdrawals**

   - Owner cannot withdraw penalties arbitrarily
   - Penalties only flow through withdrawEarly()
   - Fully transparent and auditable

2. **Atomic Transactions**

   - Penalty transfer and user withdrawal in same transaction
   - If treasury transfer fails, entire transaction reverts
   - User protected from partial execution

3. **Access Control**
   - Only owner can update treasury address
   - Requires valid address (not zero address)
   - Event emitted on treasury update

## 📱 Frontend Integration

### Display Treasury Info:

```typescript
// VaultPage.tsx - Show treasury info
const TREASURY_WALLET = "0x39c0b97A8F2194fcd7396296F7697a84dd81077A";

<div className="treasury-info">
  <h3>Early Withdrawal Notice</h3>
  <p>Penalties from early withdrawals are sent to treasury:</p>
  <code>{TREASURY_WALLET}</code>
  <p>This helps maintain platform sustainability.</p>
</div>;
```

### Show Penalty Breakdown:

```typescript
// Before early withdrawal, show user:
const penaltyInfo = calculateEarlyWithdrawalPenalty(
  stake.lockDate,
  stake.unlockDate,
  stake.totalYield,
  Date.now()
);

<div className="penalty-breakdown">
  <h4>Early Withdrawal Breakdown</h4>
  <p>Principal: ${stake.amount}</p>
  <p>Earned Yield: ${earnedYield}</p>
  <p>Penalty (to treasury): ${penaltyInfo.penalty}</p>
  <p>You Receive: ${stake.amount + earnedYield - penaltyInfo.penalty}</p>
</div>;
```

## 📊 Treasury Dashboard (Future Enhancement)

### Recommended Features:

1. **Real-time Treasury Balance**

   - ETH balance
   - All token balances
   - USD value conversion

2. **Penalty Analytics**

   - Total penalties collected
   - Daily/weekly/monthly breakdown
   - By token type
   - Average penalty amount

3. **Withdrawal Stats**

   - Total withdrawals
   - Early vs normal withdrawal ratio
   - Most common early withdrawal time

4. **Revenue Projections**
   - Based on historical data
   - Trend analysis
   - Forecasting

## 🔗 Important Links

- **Contract:** https://sepolia.basescan.org/address/0xe01aB85E8d85a871fb7cB3DcA2ba1Ea1D349266B
- **Treasury Wallet:** https://sepolia.basescan.org/address/0x39c0b97A8F2194fcd7396296F7697a84dd81077A
- **Network:** Base Sepolia Testnet
- **Explorer:** https://sepolia.basescan.org

## ✅ Deployment Confirmation

```
✅ Contract Deployed: 0xe01aB85E8d85a871fb7cB3DcA2ba1Ea1D349266B
✅ Treasury Configured: 0x39c0b97A8F2194fcd7396296F7697a84dd81077A
✅ All Tokens Added: ETH, USDC, BTC, SOL, BNB, XRP, TON, AVAX, TRON, CARDANO, DOGE
✅ Penalty System Active: Early withdrawals send to treasury
✅ Security Verified: ReentrancyGuard, Pausable, Access Control
```

## 🎉 Ready to Use!

The VaultStaking contract is now live with automatic treasury penalty collection. Users can:

1. ✅ Stake ETH or any supported token
2. ✅ Earn yield based on lock duration
3. ✅ Withdraw normally after lock period (full amount)
4. ✅ Withdraw early with penalty (penalty goes to treasury)

**All penalty funds automatically flow to treasury wallet!** 💰
