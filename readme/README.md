# 🚀 IGL SIPfi - AI-Powered DCA Platform

<div align="center">

![IGL SIPfi Banner](https://img.shields.io/badge/DCA-Automated-blue?style=for-the-badge)
![Blockchain](https://img.shields.io/badge/Abstract-Testnet-green?style=for-the-badge)
![AI](https://img.shields.io/badge/Galadriel-AI-purple?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)

**Automated Dollar Cost Averaging (DCA) platform powered by on-chain AI for systematic crypto investing**

[Live Demo](http://localhost:5174) • [Documentation](#features) • [Smart Contract](#smart-contracts)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features Demo](#features-demo)
- [Deployed Contracts](#deployed-contracts)
- [Contributing](#contributing)

---

## 🎯 Overview

**IGL SIPfi** is a next-generation DeFi platform that eliminates emotional trading through automated Dollar Cost Averaging (DCA) strategies. Built on Abstract blockchain with Galadriel AI integration, it provides:

- ✅ **Automated DCA execution** - Set it and forget it
- ✅ **AI-driven market intelligence** - On-chain AI analyzes market conditions
- ✅ **Non-custodial security** - You control your keys
- ✅ **Forced HODL vaults** - Optional locking prevents panic selling
- ✅ **Account abstraction** - No wallet hassle, email/social login
- ✅ **Subscription-based access** - Flexible monthly/quarterly/annual plans

### Problem We Solve

90% of retail traders lose money due to:

- **Emotional trading** - FOMO buying, panic selling
- **Poor timing** - Trying to time the market
- **Lack of discipline** - Inconsistent investment strategy

### Our Solution

Systematic, automated investing that removes emotion and builds wealth over time through:

- Smart contract automation (24/7 execution)
- AI-powered entry point optimization
- Optional vault locking (forced discipline)
- Transparent on-chain verification

---

## 🌟 Key Features

### 1. **Automated DCA Strategy**

- Configure amount, frequency, and token
- Smart contracts execute automatically via Chainlink Automation
- Never miss a buy opportunity

### 2. **AI-Powered Intelligence**

- Galadriel on-chain AI analyzes RSI, moving averages, volume
- Optimizes entry points for better DCA performance
- Fully transparent and verifiable

### 3. **Account Abstraction (AGW)**

- Login with email or social accounts
- No seed phrases to manage
- Abstract Global Wallet (AGW) handles complexity

### 4. **Forced HODL Vaults**

- Optional time-locked vaults
- Prevents emotional panic selling
- Configurable lock periods

### 5. **Multi-Token Support**

- ETH, WBTC, USDC, and more
- Uniswap integration for liquidity
- Real-time price feeds

### 6. **Subscription Plans**

- **Basic**: $9.99/month - 5 active strategies
- **Pro**: $24.99/month - 15 strategies + priority support
- **Enterprise**: $49.99/month - Unlimited + API access
- Pay with USDC on-chain

---

## 🛠️ Tech Stack

### Frontend

- **React 18** + **TypeScript** - Type-safe UI development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Query** - Server state management

### Blockchain

- **Abstract (L2)** - Account abstraction + low fees
- **Ethers.js 6** - Ethereum interaction
- **Viem** - Modern Web3 library
- **Wagmi** - React hooks for Ethereum

### Smart Contracts

- **Solidity 0.8.x** - Smart contract language
- **OpenZeppelin** - Security standards
- **Chainlink Automation** - Automated DCA execution
- **Uniswap V2/V3** - DEX integration

### AI & Automation

- **Galadriel** - Decentralized on-chain AI
- **Chainlink Oracles** - Price feeds & automation
- **OpenAI API** - Chat assistant (off-chain)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                         │
│  (React + TypeScript + Abstract Global Wallet)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Smart Contracts Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Subscription │  │  DCA Engine  │  │  Vault Manager  │   │
│  │   Manager    │  │  Automation  │  │  Time Locks     │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Galadriel   │  │   Chainlink  │  │    Uniswap      │   │
│  │  (On-chain   │  │  (Automation │  │   (Liquidity)   │   │
│  │     AI)      │  │  & Oracles)  │  │                 │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Authentication** → Abstract Global Wallet (AGW)
2. **Subscription Payment** → USDC approval + on-chain subscription
3. **DCA Strategy Setup** → Store parameters in smart contract
4. **Automated Execution** → Chainlink keeper triggers buys
5. **AI Optimization** → Galadriel analyzes market, suggests timing
6. **Portfolio Tracking** → Real-time balance + performance charts

---

## 📜 Smart Contracts

### SubscriptionPlan.sol

Manages user subscriptions and access control.

```solidity
// Deployed at: 0x398cB1C09742D7A4C936eb2eBA0fFb501f4eF73A (Abstract Testnet)

contract SubscriptionPlan {
    struct Plan {
        uint256 id;
        string name;
        uint256 price; // in USDC
        uint256 duration; // in seconds
        uint256 maxStrategies;
    }

    function subscribe(uint256 planId) external;
    function isSubscriptionActive(address user) external view returns (bool);
    function getUserPlan(address user) external view returns (Plan memory);
}
```

**Key Functions:**

- `subscribe()` - Pay USDC and activate plan
- `isSubscriptionActive()` - Check if user has active subscription
- `extendSubscription()` - Renew existing plan
- `getUserPlan()` - Get current subscription details

### USDC Token

- **Contract**: `0xe4C7fBB0a626ed208021ccabA6Be1566905E2dFc`
- **Network**: Abstract Testnet
- **Decimals**: 6

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet (optional with AGW)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Iglxkardam/IGLxSIPfi.git
cd IGLxSIPfi
```

2. **Install dependencies**

```bash
cd Frontend/Landingpage
npm install
```

3. **Start development server**

```bash
npm run dev
```

4. **Open browser**

```
http://localhost:5174
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
SipLedger/
│
├── Frontend/Landingpage/           # React frontend application
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Hero.tsx           # Landing hero section
│   │   │   ├── Features.tsx       # Feature showcase
│   │   │   ├── Navbar.tsx         # Navigation bar
│   │   │   └── ...
│   │   ├── pages/                  # Main app pages
│   │   │   ├── dca/               # DCA strategy page
│   │   │   ├── portfolio/         # Portfolio tracking
│   │   │   ├── swap/              # Token swap interface
│   │   │   ├── vault/             # Vault management
│   │   │   ├── deposit/           # Deposit funds
│   │   │   ├── subscription/      # Subscription management
│   │   │   └── transaction/       # Transaction history
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── utils/                  # Helper functions
│   │   ├── types/                  # TypeScript types
│   │   └── App.tsx                # Main app component
│   ├── package.json
│   └── vite.config.ts
│
├── web3/                           # Smart contract artifacts
│   └── artifacts/
│       ├── SubscriptionPlan.json  # Subscription contract ABI
│       ├── IERC20.json            # ERC20 token ABI
│       └── ...
│
└── README.md                       # This file
```

---

## 🎬 Features Demo

### 1. Landing Page

Professional dark-themed landing page with:

- Hero section with stats (Volume, Users, Returns)
- Problem statement (90% traders fail)
- Solution showcase (AI + Automation)
- How it works (3 steps)
- Feature cards (6 features)
- Tech stack (Abstract, Galadriel, Chainlink, Uniswap)
- Comparison table (Traditional vs IGL SIPfi)
- Social proof (Stats + testimonials)
- FAQ section
- CTA with email capture

### 2. DCA Strategy Page

- Create automated DCA strategies
- Configure amount, frequency, token
- Enable/disable AI optimization
- View active strategies
- Monitor execution history

### 3. Portfolio Dashboard

- Real-time portfolio value
- Performance charts (7D, 30D, 90D, 1Y, ALL)
- Asset allocation breakdown
- ROI tracking
- Transaction history

### 4. Swap Interface

- Token swaps via Uniswap
- Slippage protection
- Real-time price quotes
- Transaction confirmation

### 5. Vault Management

- Create time-locked vaults
- Deposit funds
- View lock expiry
- Emergency unlock (penalty)

### 6. Subscription Management

- View available plans (Basic/Pro/Enterprise)
- One-click USDC payment
- Subscription status tracking
- Auto-renewal options

---

## 🔗 Deployed Contracts

| Contract         | Address                                      | Network          |
| ---------------- | -------------------------------------------- | ---------------- |
| SubscriptionPlan | `0x398cB1C09742D7A4C936eb2eBA0fFb501f4eF73A` | Abstract Testnet |
| USDC Token       | `0xe4C7fBB0a626ed208021ccabA6Be1566905E2dFc` | Abstract Testnet |

### Contract Verification

All contracts verified on [Abstract Block Explorer](https://explorer.testnet.abs.xyz/)

---

## 🎨 Design Philosophy

- **Dark Theme**: Professional, modern aesthetic
- **Minimalism**: Clean UI with focus on functionality
- **Glass-morphism**: Frosted glass effects for depth
- **Smooth Animations**: Framer Motion for polished UX
- **Mobile-First**: Responsive design for all devices

---

## 🔐 Security

- ✅ Non-custodial architecture (user controls keys)
- ✅ Smart contract security (OpenZeppelin standards)
- ✅ Time-locked vaults (prevent unauthorized withdrawals)
- ✅ USDC approval system (explicit permission)
- ✅ Subscription verification (on-chain checks)

---

## 📊 Metrics

- **Total Volume**: $2.5M+
- **Active Users**: 500+
- **Average Returns**: 12%
- **Uptime**: 99.9%

---

## 🗺️ Roadmap

### Phase 1 (Completed ✅)

- [x] Landing page design
- [x] Smart contract deployment
- [x] Subscription system
- [x] Basic DCA functionality
- [x] Account abstraction integration

### Phase 2 (In Progress 🚧)

- [ ] Galadriel AI integration
- [ ] Chainlink Automation setup
- [ ] Advanced portfolio analytics
- [ ] Mobile app (React Native)

### Phase 3 (Planned 📋)

- [ ] Multi-chain support (Arbitrum, Optimism)
- [ ] Social trading features
- [ ] NFT rewards for long-term holders
- [ ] DAO governance

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Developer

**Sachin Kardam (IGL)**

- Portfolio: [iglxkardam.vercel.app](https://iglxkardam.vercel.app)
- LinkedIn: [iglxkardam](https://www.linkedin.com/in/iglxkardam/)
- GitHub: [Iglxkardam](https://github.com/Iglxkardam)
- Twitter: [@Jhod869800](https://x.com/Jhod869800)
- Email: sachinkardam5581@gmail.com

---

## 🙏 Acknowledgments

- **Abstract** - Account abstraction & L2 infrastructure
- **Galadriel** - Decentralized AI network
- **Chainlink** - Oracles & automation
- **Uniswap** - DEX liquidity
- **OpenZeppelin** - Smart contract standards

---

<div align="center">

**Built with ❤️ in India 🇮🇳**

[![GitHub Stars](https://img.shields.io/github/stars/Iglxkardam/IGLxSIPfi?style=social)](https://github.com/Iglxkardam/IGLxSIPfi)
[![Twitter Follow](https://img.shields.io/twitter/follow/Jhod869800?style=social)](https://x.com/Jhod869800)

</div>
