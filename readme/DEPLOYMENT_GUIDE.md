# 🚀 VaultStaking Contract Deployment Guide

## Quick Start

### 1. Deploy Contract

```bash
cd web3
npx hardhat run scripts/deploy-vault-staking.js --network baseSepolia
```

### 2. Contract Will Auto-Deploy With:

- ✅ Base APY: 8%
- ✅ Lock Durations: 30, 60, 90, 180, 365 days
- ✅ APY Multipliers configured
- ✅ 10 ERC20 tokens added (USDC, BTC, SOL, BNB, XRP, TON, AVAX, TRON, CARDANO, DOGE)
- ✅ ETH staking enabled

### 3. Update Frontend

After deployment, update the contract address:

**File:** `Frontend/Landingpage/src/pages/vault/services/vaultService.ts`

```typescript
// Line 9
export const VAULT_STAKING_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";
```

### 4. Test Contract

```bash
npx hardhat test test/VaultStaking.test.js
```

Expected: ✅ All 30+ tests should pass

---

## 🔒 Security Features

### Already Implemented:

- ✅ **ReentrancyGuard**: Prevents reentrancy attacks
- ✅ **Pausable**: Emergency pause mechanism
- ✅ **Ownable**: Admin access control
- ✅ **Individual Stakes**: Users can only access their own stakes
- ✅ **Time-Locks**: Enforced on-chain with blockchain timestamp
- ✅ **SafeERC20**: Secure token transfers
- ✅ **Penalty System**: Automatic calculation for early withdrawals

### Attack Prevention:

- ✅ Reentrancy attacks blocked
- ✅ Unauthorized access prevented
- ✅ Double withdrawal impossible
- ✅ Integer overflow protection
- ✅ Front-running resistant

---

## 📊 How It Works

### User Flow:

**1. Stake ETH/Tokens:**

```solidity
// User stakes 1 ETH for 90 days
vaultStaking.stakeETH(90, { value: "1 ETH" });
// APY: 8% × 100% multiplier = 8% effective APY
// Expected yield after 90 days: ~0.0197 ETH
```

**2. Wait for Lock Period:**

- Stake is locked on-chain
- Yield calculated based on:
  - Amount staked
  - Lock duration
  - APY with multiplier

**3. Withdraw (Two Options):**

**Option A: Normal Withdrawal (After Lock Period)**

```solidity
vaultStaking.withdraw(stakeId);
// Returns: Principal + Full Yield
// Example: 1 ETH + 0.0197 ETH = 1.0197 ETH
```

**Option B: Early Withdrawal (Before Lock Period)**

```solidity
vaultStaking.withdrawEarly(stakeId);
// Penalty applied based on remaining time
// Example at 50% completion:
// - Earned: 0.00985 ETH
// - Penalty: 0.00492 ETH (50% of earned)
// - Receive: 1 ETH + 0.00493 ETH
```

### Penalty Formula:

```
penalty = (remainingTime / totalLockTime) × earnedYield

Example:
- Lock: 90 days
- Elapsed: 45 days (50%)
- Remaining: 45 days (50%)
- Earned Yield: 0.00985 ETH
- Penalty: 0.50 × 0.00985 = 0.00492 ETH
- User Gets: 1 ETH + 0.00493 ETH
```

---

## 🎯 APY Multipliers

| Duration | Multiplier | Base APY | Effective APY |
| -------- | ---------- | -------- | ------------- |
| 30 days  | 70%        | 8.00%    | **5.60%**     |
| 60 days  | 85%        | 8.00%    | **6.80%**     |
| 90 days  | 100%       | 8.00%    | **8.00%**     |
| 180 days | 115%       | 8.00%    | **9.20%**     |
| 365 days | 130%       | 8.00%    | **10.40%**    |

---

## 🧪 Testing Checklist

Run before deployment:

```bash
# Full test suite
npx hardhat test

# Coverage report
npx hardhat coverage

# Gas report
REPORT_GAS=true npx hardhat test
```

**Expected Results:**

- ✅ 30+ tests passing
- ✅ 100% function coverage
- ✅ All security tests passing
- ✅ Penalty calculations accurate

---

## 📝 Frontend Integration

### Update VaultPage.tsx

The VaultPage is already updated to work with the contract. Just need to:

1. ✅ Deploy contract
2. ✅ Update `VAULT_STAKING_ADDRESS` in vaultService.ts
3. ✅ Test staking flow
4. ✅ Test withdrawal flow

### Contract Functions Used by Frontend:

**Staking:**

```typescript
// ETH
await vaultStaking.stakeETH(lockDuration, { value: amount });

// ERC20
await token.approve(vaultStaking, amount);
await vaultStaking.stakeToken(tokenAddress, amount, lockDuration);
```

**Withdrawal:**

```typescript
// Normal
await vaultStaking.withdraw(stakeId);

// Early (with penalty)
await vaultStaking.withdrawEarly(stakeId);
```

**View Functions:**

```typescript
// Get user stakes
const stakeIds = await vaultStaking.getUserStakes(userAddress);

// Get stake details
const stake = await vaultStaking.getStake(stakeId);

// Calculate penalty before withdrawing
const [penalty, amountAfterPenalty] = await vaultStaking.calculatePenalty(
  stakeId
);
```

---

## ⚠️ Important Notes

### Before Mainnet Deployment:

1. **Get Security Audit** - Professional audit required
2. **Extended Testing** - Test on testnet for 1+ weeks
3. **Multisig Ownership** - Transfer ownership to multisig wallet
4. **Emergency Plan** - Document emergency procedures
5. **Monitor Contract** - Set up monitoring and alerts

### Current Limitations:

- Contract yields are paid from collected penalties + owner deposits
- Owner must fund contract with tokens for yield distribution
- Consider adding automated yield distribution mechanism

### Recommended Next Steps:

1. Deploy to testnet
2. Test with real users
3. Monitor for issues
4. Get audit
5. Deploy to mainnet
6. Announce contract address

---

## 🆘 Emergency Procedures

### If Issue Detected:

**Step 1: Pause Contract**

```bash
npx hardhat run scripts/pause-contract.js --network baseSepolia
```

**Step 2: Enable Emergency Withdrawals**

```bash
npx hardhat run scripts/enable-emergency.js --network baseSepolia
```

**Step 3: Notify Users**

- Post announcement
- Users can call `emergencyWithdraw()` to get principal back

---

## 📞 Support

**Security Issues:**

- Create private security advisory on GitHub
- Email: security@project.com

**General Questions:**

- GitHub Issues
- Documentation
- Discord Community

---

## ✅ Deployment Checklist

- [ ] Contract compiled successfully
- [ ] All tests passing
- [ ] Gas costs acceptable
- [ ] Security review completed
- [ ] Testnet deployment successful
- [ ] Frontend integration tested
- [ ] Documentation updated
- [ ] Emergency procedures documented
- [ ] Multisig wallet ready
- [ ] Monitoring setup complete
- [ ] Ready for mainnet! 🚀

---

**Contract Repository:** `web3/contracts/VaultStaking.sol`
**Tests:** `web3/test/VaultStaking.test.js`
**Deployment Script:** `web3/scripts/deploy-vault-staking.js`
**Frontend Service:** `Frontend/Landingpage/src/pages/vault/services/vaultService.ts`
