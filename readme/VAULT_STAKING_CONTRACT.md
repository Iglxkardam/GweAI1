# VaultStaking Contract - Security & Implementation Guide

## 🔐 Security Features

### 1. **ReentrancyGuard Protection**

```solidity
contract VaultStaking is ReentrancyGuard {
    function withdraw(uint256 stakeId) external nonReentrant {
        // Protected from reentrancy attacks
    }
}
```

- Prevents attackers from calling withdraw() recursively
- Uses OpenZeppelin's battle-tested implementation
- All withdrawal functions are protected

### 2. **Individual Stake Tracking**

```solidity
mapping(address => uint256[]) public userStakes;
mapping(uint256 => Stake) public stakes;

function _isUserStake(address user, uint256 stakeId) internal view returns (bool) {
    // Verifies stake ownership before any action
}
```

- Each user can only access their own stakes
- Impossible for attackers to withdraw others' funds
- Stake ownership verified on every operation

### 3. **Time-Locked Withdrawals**

```solidity
require(block.timestamp >= stake.unlockDate, "Still locked");
```

- Lock periods enforced on-chain (blockchain timestamp)
- Cannot be bypassed by attackers
- Automatic unlock date calculation

### 4. **Pausable Emergency Mechanism**

```solidity
contract VaultStaking is Pausable {
    function pause() external onlyOwner {
        _pause();
    }
}
```

- Owner can pause all staking in emergency
- Existing stakes remain safe
- Can be unpaused after issue is resolved

### 5. **SafeERC20 Implementation**

```solidity
using SafeERC20 for IERC20;

IERC20(token).safeTransferFrom(user, address(this), amount);
IERC20(token).safeTransfer(user, amount);
```

- Prevents token transfer vulnerabilities
- Handles non-standard ERC20 tokens correctly
- Reverts on failed transfers

## 📊 Contract Features

### Staking Options

| Duration | APY Multiplier | Effective APY |
| -------- | -------------- | ------------- |
| 30 days  | 70%            | 5.6%          |
| 60 days  | 85%            | 6.8%          |
| 90 days  | 100%           | 8.0%          |
| 180 days | 115%           | 9.2%          |
| 365 days | 130%           | 10.4%         |

### Penalty Calculation

```
Formula: penalty = (remainingTime / totalLockTime) × earnedYield

Example (90-day stake, 45 days elapsed):
- Total Lock Time: 90 days
- Elapsed Time: 45 days (50%)
- Remaining Time: 45 days (50%)
- Earned Yield: 4 tokens (50% of 8 tokens)
- Penalty: 2 tokens (50% of earned yield)
- User Receives: Principal + 2 tokens
```

## 🛡️ Attack Prevention

### 1. **Reentrancy Attack**

**Attack Vector:** Malicious contract tries to recursively call withdraw()

**Prevention:**

```solidity
function withdraw(uint256 stakeId) external nonReentrant {
    stake.withdrawn = true; // State change before transfer
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "ETH transfer failed");
}
```

- `nonReentrant` modifier blocks recursive calls
- State updated before external call (checks-effects-interactions pattern)

### 2. **Unauthorized Withdrawal**

**Attack Vector:** Attacker tries to withdraw other users' stakes

**Prevention:**

```solidity
require(_isUserStake(msg.sender, stakeId), "Not your stake");
```

- Every withdrawal verifies stake ownership
- No way to bypass ownership check

### 3. **Double Withdrawal**

**Attack Vector:** User tries to withdraw same stake multiple times

**Prevention:**

```solidity
require(!stake.withdrawn, "Already withdrawn");
stake.withdrawn = true;
```

- Stake marked as withdrawn immediately
- Cannot be withdrawn again

### 4. **Integer Overflow/Underflow**

**Prevention:**

- Solidity 0.8.20 has built-in overflow protection
- All arithmetic operations revert on overflow
- No unchecked blocks used

### 5. **Front-Running**

**Prevention:**

- Each user's stakes are independent
- No shared pool pricing that could be manipulated
- Yield calculated based on stake creation time

## 🚀 Deployment Guide

### Step 1: Deploy Contract

```bash
cd web3
npx hardhat run scripts/deploy-vault-staking.js --network baseSepolia
```

### Step 2: Verify on BaseScan

```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

### Step 3: Add Supported Tokens

The deployment script automatically adds:

- USDC, BTC, SOL, BNB, XRP
- TON, AVAX, TRON, CARDANO, DOGE

### Step 4: Update Frontend

Update contract address in:

```typescript
// vaultService.ts
export const VAULT_STAKING_ADDRESS = "YOUR_CONTRACT_ADDRESS";
```

## 📝 Contract Functions

### User Functions

#### `stakeETH(uint256 lockDuration)`

```solidity
// Stake ETH with lock period
vaultStaking.stakeETH(90, { value: ethers.parseEther("1") });
```

#### `stakeToken(address token, uint256 amount, uint256 lockDuration)`

```solidity
// Stake ERC20 tokens
// 1. Approve tokens first
token.approve(vaultStaking, amount);
// 2. Stake
vaultStaking.stakeToken(tokenAddress, amount, 90);
```

#### `withdraw(uint256 stakeId)`

```solidity
// Withdraw after lock period (no penalty)
vaultStaking.withdraw(stakeId);
```

#### `withdrawEarly(uint256 stakeId)`

```solidity
// Withdraw before lock period (with penalty)
vaultStaking.withdrawEarly(stakeId);
```

#### `calculatePenalty(uint256 stakeId)`

```solidity
// View penalty before withdrawing
(uint256 penalty, uint256 amountAfterPenalty) = vaultStaking.calculatePenalty(stakeId);
```

### Owner Functions

#### `addSupportedToken(address token)`

```solidity
// Add new supported token
vaultStaking.addSupportedToken(tokenAddress);
```

#### `pause() / unpause()`

```solidity
// Emergency pause
vaultStaking.pause();
// Resume operations
vaultStaking.unpause();
```

#### `toggleEmergencyWithdrawal(bool enabled)`

```solidity
// Enable emergency withdrawals (returns only principal)
vaultStaking.toggleEmergencyWithdrawal(true);
```

#### `withdrawPenalties(address token, uint256 amount)`

```solidity
// Collect penalties from early withdrawals
vaultStaking.withdrawPenalties(ethers.ZeroAddress, amount); // ETH
vaultStaking.withdrawPenalties(tokenAddress, amount); // ERC20
```

## 🧪 Testing

### Run All Tests

```bash
npx hardhat test test/VaultStaking.test.js
```

### Test Coverage

```bash
npx hardhat coverage
```

### Expected Test Results

- ✅ 30+ tests covering all functions
- ✅ Security attack scenarios
- ✅ Edge cases and error conditions
- ✅ Multiple stake management
- ✅ Penalty calculations

## 📊 Gas Optimization

### Estimated Gas Costs (Base Sepolia)

- Stake ETH: ~100,000 gas
- Stake ERC20: ~120,000 gas
- Withdraw: ~80,000 gas
- Early Withdraw: ~85,000 gas
- Calculate Penalty: Free (view function)

## 🔍 Audit Checklist

- ✅ No recursive calls without reentrancy protection
- ✅ All external calls use checks-effects-interactions pattern
- ✅ State changes before external transfers
- ✅ No delegatecall to user-controlled addresses
- ✅ All user inputs validated
- ✅ Access control on admin functions
- ✅ Emergency pause mechanism
- ✅ Proper event emissions
- ✅ SafeERC20 for token transfers
- ✅ Overflow protection (Solidity 0.8.x)
- ✅ No selfdestruct or dangerous opcodes
- ✅ Timestamp usage appropriate for time-locks

## 🎯 Production Checklist

Before deploying to mainnet:

1. **Security Audit**

   - [ ] Get professional security audit
   - [ ] Run automated security scanners (Slither, Mythril)
   - [ ] Test on testnet for 1+ weeks

2. **Testing**

   - [ ] 100% test coverage
   - [ ] Stress test with large amounts
   - [ ] Test all attack scenarios
   - [ ] Verify penalty calculations

3. **Documentation**

   - [ ] User guide complete
   - [ ] Contract verified on explorer
   - [ ] Emergency procedures documented

4. **Deployment**
   - [ ] Deploy to mainnet
   - [ ] Verify contract
   - [ ] Add supported tokens
   - [ ] Transfer ownership to multisig
   - [ ] Announce contract address

## 🆘 Emergency Procedures

### If Contract is Compromised:

1. **Immediately pause contract**

   ```solidity
   vaultStaking.pause();
   ```

2. **Enable emergency withdrawals**

   ```solidity
   vaultStaking.toggleEmergencyWithdrawal(true);
   ```

3. **Notify users to withdraw**

   - Users can call `emergencyWithdraw()` to get principal back
   - Yield is forfeited but principal is safe

4. **Deploy new contract**
   - Fix vulnerability
   - Redeploy with new address
   - Migrate remaining funds

## 📞 Support & Contact

For security issues:

- Create private security advisory on GitHub
- Email: security@yourproject.com

For general questions:

- GitHub Issues
- Discord Community
- Documentation Site

## ⚖️ License

MIT License - See LICENSE file for details

---

**⚠️ Important Notes:**

1. This contract handles real funds - always test thoroughly
2. Get professional security audit before mainnet deployment
3. Use multisig wallet for contract ownership
4. Have emergency procedures ready
5. Monitor contract activity continuously
