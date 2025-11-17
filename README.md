# EnergiDot – DePIN + DAG Energy Grid Management Parachain

A Polkadot parachain implementation for decentralized energy grid management, combining DePIN (Decentralized Physical Infrastructure Networks) with DAG-based consensus for real-time energy trading and grid coordination.

## Overview

EnergiDot enables households, EV owners and solar producers to own, trade and optimize energy directly through Web3 infrastructure on the Polkadot ecosystem.

### Key Features

- **Real-time Energy Trading**: Peer-to-peer microgrid trading with live data integration
- **DAG-Based Consensus**: Low-latency settlements for rapid grid response
- **Cross-Chain Interoperability**: XCM v3 integration for multi-parachain energy markets
- **DePIN Incentives**: Token rewards for verified renewable energy contributions
- **Privacy-Preserving Analytics**: Phala Network integration for sensitive meter data
- **Web3 Identity**: On-chain DID/SSI for device verification

## Links

- **Live Site Demo**: https://samirasamrose.github.io/EnergiDot/
- **Source Code**: https://github.com/SamiraSamrose/EnergiDot
- **Video Demo**: https://youtu.be/Jk3UIlxm67k

## Architecture

### Three-Tier System

1. **User-Centric dApp Layer** (React + Polkadot.js)
2. **Parachain Runtime** (Substrate FRAME pallets)
3. **Data Integration Layer** (Real-time energy datasets)

## Tech Stack

### Blockchain Layer
- Polkadot SDK (Substrate FRAME)
- GRANDPA + Custom DAG consensus
- XCM v3 for cross-chain communication
- Polkadot.js API

### Backend Services
- Node.js API Gateway
- Python Data Aggregator
- PostgreSQL + Redis
- Docker containers

### Frontend
- React 18 with TypeScript
- Polkadot.js extension integration
- Chart.js for visualizations
- TailwindCSS

### Data Sources
- NREL (Solar/Wind data)
- OPSD (European grid data)
- EIA (US energy data)
- ENTSO-E (Grid transparency)
- NOAA (Weather data)
- Copernicus (Climate data)
- Pecan Street (Smart meter data)
- Open Charge Map (EV infrastructure)
- OpenWeatherMap (Forecasts)

## Quick Start

### Prerequisites

```bash
# Required versions
Node.js >= 18.x
Python >= 3.10
Rust >= 1.70
Docker >= 24.x
PostgreSQL >= 14.x
```

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/energidot.git
cd energidot

# Install dependencies
npm run install:all

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Start development environment
docker-compose up -d

# Run substrate node
cd backend/substrate-node
cargo build --release
./target/release/energidot-node --dev

# Start API gateway
cd backend/api-gateway
npm install
npm run dev

# Start data aggregator
cd backend/data-aggregator
pip install -r requirements.txt
python src/main.py

# Start frontend
cd frontend
npm install
npm start
```

## API Keys Required

Obtain free API keys from:
- NREL Developer Network: https://developer.nrel.gov/signup/
- EIA Open Data: https://www.eia.gov/opendata/register.php
- ENTSO-E: https://transparency.entsoe.eu/
- NOAA: https://www.ncdc.noaa.gov/cdo-web/token
- OpenWeatherMap: https://openweathermap.org/api

## Project Structure

```
energidot/
├── backend/
│   ├── substrate-node/          # Polkadot parachain runtime
│   │   ├── pallets/             # Custom FRAME pallets
│   │   │   ├── energy-market/  # P2P trading logic
│   │   │   ├── dag-consensus/  # DAG overlay consensus
│   │   │   └── incentives/     # Tokenomics & staking
│   │   ├── runtime/            # Parachain runtime config
│   │   └── node/               # Node implementation
│   ├── api-gateway/            # REST API service
│   │   ├── src/
│   │   │   ├── controllers/   # API endpoints
│   │   │   ├── services/      # Business logic
│   │   │   └── middleware/    # Auth & validation
│   │   └── package.json
│   └── data-aggregator/        # External data integration
│       ├── src/
│       │   ├── collectors/    # Data source collectors
│       │   ├── processors/    # Data transformation
│       │   └── schedulers/    # Cron jobs
│       └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API clients
│   │   ├── utils/            # Helper functions
│   │   └── App.tsx
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT.md
│   └── TOKENOMICS.md
├── scripts/
│   ├── deploy-parachain.sh
│   ├── setup-db.sh
│   └── generate-keys.sh
├── docker/
│   ├── Dockerfile.node
│   ├── Dockerfile.api
│   └── Dockerfile.aggregator
├── docker-compose.yml
├── .env.example-----------------------
├── .gitignore
└── package.json
```

## Development Workflow

### Running Tests

```bash
# Substrate tests
cd backend/substrate-node
cargo test

# API tests
cd backend/api-gateway
npm test

# Frontend tests
cd frontend
npm test

# Integration tests
npm run test:integration
```

### Building for Production

```bash
# Build all components
npm run build:all

# Build substrate node
cd backend/substrate-node
cargo build --release

# Build API gateway
cd backend/api-gateway
npm run build

# Build frontend
cd frontend
npm run build
```

## Deployment

### Local Development

```bash
docker-compose -f docker-compose.dev.yml up
```

### Production (Polkadot Cloud)

```bash
# Deploy parachain
./scripts/deploy-parachain.sh --network polkadot

# Deploy services
kubectl apply -f k8s/
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## Core Features Implementation

### Step I: User-Centric Apps

**Location**: `frontend/src/`

- Polkadot.js wallet integration (Talisman, SubWallet)
- Real-time energy trading dashboard
- Token staking for energy contributors
- Gamified leaderboard system
- DID-based device verification

### Step II: Parachain Architecture

**Location**: `backend/substrate-node/`

- **pallet-energy-market**: P2P microgrid trading with live ENTSO-E/EIA data
- **pallet-dag-consensus**: Fast DAG consensus for local coordination
- **pallet-incentives**: DePIN tokenomics and staking
- **GRANDPA + DAG hybrid**: Low-latency settlement engine
- **XCM v3 integration**: Cross-chain energy token swaps

### Step III: Polkadot Tinkerers

**Location**: Multiple components

- SubQuery indexing for grid metrics visualization
- Phala Network for privacy-preserving meter data processing
- XCM trading with Bitgreen/Energy Web parachains
- AssetHub integration for ENRG token minting
- IoT trigger simulation (Arduino/Raspberry Pi compatible)

## Advanced Features

### DePIN Incentive System
- ENRG token for verified contributions
- Reputation NFTs for sustainable users
- Staking mechanisms for grid participation

### AI Optimization
- Off-chain prediction model (Phala-hosted)
- Optimal trading time recommendations
- Energy storage strategy optimization

### Privacy & Security
- Zero-knowledge proofs for meter data
- Trusted execution environments (TEE)
- Multi-signature wallet support

## API Endpoints

### Energy Trading
```
POST   /api/v1/trades/create
GET    /api/v1/trades/history
GET    /api/v1/market/prices
```

### User Management
```
POST   /api/v1/users/register
GET    /api/v1/users/profile
POST   /api/v1/devices/verify
```

### Data Analytics
```
GET    /api/v1/grid/status
GET    /api/v1/analytics/dashboard
GET    /api/v1/leaderboard
```

See [API_REFERENCE.md](docs/API_REFERENCE.md) for complete documentation.

## Configuration

### Environment Variables

```bash
# Substrate Node
NODE_ENV=development
CHAIN_SPEC=dev
RPC_PORT=9944
WS_PORT=9945

# API Gateway
API_PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/energidot
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key

# Data Aggregator
NREL_API_KEY=your-nrel-key
EIA_API_KEY=your-eia-key
ENTSOE_API_KEY=your-entsoe-key
NOAA_API_KEY=your-noaa-key
OPENWEATHER_API_KEY=your-openweather-key

# Frontend
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:9945
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: https://docs.energidot.io
- Discord: https://discord.gg/energidot
- Issues: https://github.com/yourusername/energidot/issues

## Acknowledgments

- Polkadot SDK team
- Substrate builders community
- NREL for open energy data
- All contributing data providers

## Roadmap

### Q1 2025
- Testnet launch on Rococo
- SubQuery indexer deployment
- Mobile app beta

### Q2 2025
- Mainnet parachain slot auction
- Phala integration completion
- Cross-chain bridges (3 parachains)

### Q3 2025
- AI optimization agent launch
- 10,000+ verified devices
- Enterprise partnerships

### Q4 2025
- Global expansion (5 continents)
- Carbon credit integration
- DAO governance activation
