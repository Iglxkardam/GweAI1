# VaultStaking Contract - Deployment Summary

## 🎉 Deployment Complete

The VaultStaking contract has been successfully deployed to Base Sepolia and integrated into the frontend!

### 📋 Contract Details

**Contract Address:** `0xB156a66521BCB5A903daA42879A3e562E402Fa41`

**Network:** Base Sepolia

**Treasury Wallet:** `0x39c0b97A8F2194fcd7396296F7697a84dd81077A`

**Liquidity Pool:** `0xDEEd6a61940bD4162f9955aeBb477C3bDABf6078`

### 💰 Supported Tokens & APYs

The contract supports staking for the following tokens with optimized APY rates:

| Token    | Address                                      | Base APY | Decimals |
| -------- | -------------------------------------------- | -------- | -------- |
| **BTC**  | `0x7d9E31f5cCac4b9c8566f343A6bD6f3263DFcC91` | **10%**  | 8        |
| **SOL**  | `0x241ECE6Dce0E0825F9992410B3fA5d4b8fC8d199` | **9%**   | 8        |
| **USDC** | `0xBEE08798a3634e29F47e3d277C9d11507D55F66a` | **6%**   | 6        |

### 📊 Lock Duration Multipliers

The effective APY is calculated based on lock duration:

| Duration | Multiplier | Effective APY (BTC) | Effective APY (SOL) | Effective APY (USDC) |
| -------- | ---------- | ------------------- | ------------------- | -------------------- |
| 30 days  | 0.7x       | 7.0%                | 6.3%                | 4.2%                 |
| 60 days  | 0.85x      | 8.5%                | 7.65%               | 5.1%                 |
| 90 days  | 1.0x       | 10.0%               | 9.0%                | 6.0%                 |
| 180 days | 1.15x      | 11.5%               | 10.35%              | 6.9%                 |
| 365 days | 1.3x       | 13.0%               | 11.7%               | 7.8%                 |

### 🔐 Security Features

1. **ReentrancyGuard** - Prevents reentrancy attacks
2. **Pausable** - Emergency pause mechanism
3. **Individual Stake Tracking** - Each user controls only their own stakes
4. **Time-Locked Withdrawals** - Enforces lock periods on-chain
5. **Penalty System** - Automatic penalty calculation for early withdrawals
6. **SafeERC20** - Prevents token transfer vulnerabilities

### ⚡ Key Functions

#### Staking Functions

- `stakeETH(uint256 lockDuration)` - Stake ETH (not currently used)
- `stakeToken(address token, uint256 amount, uint256 lockDuration)` - Stake ERC20 tokens

#### Withdrawal Functions

- `withdraw(uint256 stakeId)` - Withdraw after lock period (no penalty)
- `withdrawEarly(uint256 stakeId)` - Early withdrawal with penalty
- `emergencyWithdraw(uint256 stakeId)` - Emergency withdrawal (when enabled by owner)

#### View Functions

- `getUserStakes(address user)` - Get all stake IDs for a user
- `getStake(uint256 stakeId)` - Get stake details
- `calculatePenalty(uint256 stakeId)` - Calculate early withdrawal penalty
- `getContractBalance(address token)` - Get contract token balance

### 📱 Frontend Integration

#### Updated Files

1. **Environment Variables** (`.env.local`)

   ```env
   VITE_VAULT_STAKING_ADDRESS="0xB156a66521BCB5A903daA42879A3e562E402Fa41"
   ```

2. **Vault Service** (`src/pages/vault/services/vaultService.ts`)

   - Updated contract address
   - Added token APYs configuration
   - Fixed token decimals (8 for all trading tokens)

3. **Vault Page** (`src/pages/vault/VaultPage.tsx`)

   - Added BTC and SOL staking pools
   - Updated balance handling for BTC/SOL
   - Fixed function selectors for stakeETH and stakeToken
   - Updated contract addresses throughout

4. **Contract ABI** (`src/contracts/VaultStakingABI.json`)
   - Copied from compiled artifacts

### 🎯 User Flow

1. **Connect Wallet** - User connects their wallet
2. **View Pools** - See available staking pools (BTC, SOL, USDC)
3. **Select Pool** - Choose which token to stake
4. **Choose Duration** - Select lock period (30-365 days)
5. **Enter Amount** - Specify amount to stake
6. **Approve (ERC20 only)** - Approve contract to spend tokens
7. **Stake** - Execute stake transaction
8. **Track Progress** - View real-time yield accumulation
9. **Withdraw** - Claim rewards after lock period or early with penalty

### ⚠️ Early Withdrawal Penalty

The penalty system is designed to be fair:

**Formula:**

```
earnedYield = (elapsedTime / totalLockTime) * totalYield
penalty = totalYield - earnedYield
amountReturned = principal - penalty
```

**Example:**

- Stake: 1 BTC for 180 days at 11.5% APY
- Expected yield: 0.0628 BTC
- Withdraw after 90 days (50% elapsed)
- Earned yield: 0.0314 BTC
- Penalty: 0.0314 BTC (deducted from principal)
- Amount returned: 0.9686 BTC

**Note:** Penalties are sent to the treasury wallet

### 🔄 Liquidity Management

The VaultStaking contract is designed to work with the LiquidityPool contract for optimal liquidity management:

1. **Staked Funds** - User deposits go into VaultStaking contract
2. **Yield Generation** - Contract tracks yield based on APY and duration
3. **Withdrawals** - Contract holds sufficient funds to pay out principal + yield
4. **Treasury Revenue** - Early withdrawal penalties accumulate in treasury wallet

### 📈 APY Optimization

APY rates are optimized based on:

- **Token volatility** - BTC (highest) > SOL > USDC (stable)
- **Lock duration** - Longer locks = higher multipliers
- **Market conditions** - Can be adjusted by owner via `setTokenAPY()`

### 🔧 Admin Functions

Only contract owner can:

- Add/remove supported tokens
- Update APY rates
- Update treasury wallet
- Pause/unpause contract
- Toggle emergency withdrawal
- Withdraw accumulated penalties

### 🧪 Testing Checklist

Before using in production:

- [ ] Test BTC staking with all durations
- [ ] Test SOL staking with all durations
- [ ] Test USDC staking with all durations
- [ ] Test normal withdrawal after lock period
- [ ] Test early withdrawal with penalty calculation
- [ ] Verify penalty goes to treasury wallet
- [ ] Test with different amounts
- [ ] Verify real-time yield calculations
- [ ] Test wallet disconnect/reconnect
- [ ] Verify localStorage sync

### 📝 Contract Verification

To verify the contract on BaseScan:

```bash
npx hardhat verify --network baseSepolia 0xB156a66521BCB5A903daA42879A3e562E402Fa41 \
  "0x39c0b97A8F2194fcd7396296F7697a84dd81077A" \
  "0xDEEd6a61940bD4162f9955aeBb477C3bDABf6078"
```

### 🎨 Frontend Features

- ✅ Real-time yield tracking (updates every second)
- ✅ Countdown timers for unlock dates
- ✅ Penalty calculator for early withdrawals
- ✅ Pool statistics (TVL, participants, APY)
- ✅ Wallet-specific localStorage (per-user data)
- ✅ Auto-sync with contract on load
- ✅ Transaction status tracking
- ✅ Toast notifications for all actions
- ✅ Responsive design with animations
- ✅ Filter and search functionality

### 🚀 Deployment Script

The deployment script (`scripts/deployVaultStaking.js`) automatically:

1. Deploys VaultStaking contract
2. Adds supported tokens (BTC, SOL, USDC)
3. Sets optimized APY for each token
4. Saves deployment info to JSON file
5. Provides .env.local configuration

### 🔗 Contract Interactions

All contract interactions use:

- **Function selectors** - Calculated from function signatures
- **ABI encoding** - Manual encoding for AGW wallet compatibility
- **Transaction tracking** - StakeId fetched from contract post-deployment
- **Error handling** - Comprehensive try-catch with user-friendly messages

### 💡 Best Practices Implemented

1. **Secure staking** - Time-locked, non-custodial
2. **Transparent penalties** - Clear penalty calculation shown upfront
3. **Real-time updates** - Live yield tracking
4. **User control** - Can withdraw early if needed (with penalty)
5. **Gas optimization** - Minimal storage usage
6. **Event logging** - All actions emit events for tracking
7. **Modular design** - Easy to add new tokens

### 🎯 Next Steps

1. **Test thoroughly** - Use Base Sepolia testnet
2. **Monitor transactions** - Check BaseScan for all interactions
3. **Gather feedback** - User testing on testnet
4. **Optimize APYs** - Adjust based on market conditions
5. **Add more tokens** - Expand to other supported tokens if needed
6. **Audit** - Security audit before mainnet deployment

---

## 📞 Support

For issues or questions:

- Check contract on BaseScan: https://sepolia.basescan.org/address/0xB156a66521BCB5A903daA42879A3e562E402Fa41
- Review deployment logs: `web3/vault-staking-deployment.json`
- Check frontend console for debug logs

---

**Deployment Date:** November 27, 2025
**Deployed By:** Development Team
**Status:** ✅ Ready for Testing
