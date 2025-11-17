## STEP 7: Documentation
### Path: `docs/ARCHITECTURE.md`

# EnergiDot Architecture

## Overview

EnergiDot is a production-ready DePIN (Decentralized Physical Infrastructure Networks) + DAG energy grid management system built as a Polkadot parachain.

## System Architecture

### Three-Layer Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React)                    │
│  - Polkadot.js Integration (Talisman/SubWallet)            │
│  - Real-time Trading Dashboard                              │
│  - Device Management UI                                      │
│  - Analytics Visualization                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/WS
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer (Node.js)                │
│  - REST API Endpoints                                        │
│  - Substrate RPC Communication                               │
│  - PostgreSQL + Redis Caching                                │
│  - Authentication & Rate Limiting                            │
└─────────────────────────────────────────────────────────────┘
                            ↓ RPC
┌─────────────────────────────────────────────────────────────┐
│              Parachain Runtime (Substrate FRAME)             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ pallet-energy-market                                  │  │
│  │ - P2P energy trading with ENTSO-E/EIA data          │  │
│  │ - Order matching and settlement                      │  │
│  │ - Device verification via DID                        │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ pallet-dag-consensus                                  │  │
│  │ - Fast DAG-based local coordination                  │  │
│  │ - Low-latency transaction finalization              │  │
│  │ - Grid node heartbeat mechanism                      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ pallet-incentives                                     │  │
│  │ - Token staking and rewards                          │  │
│  │ - Reputation NFT minting                             │  │
│  │ - Leaderboard management                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ Data Feed
┌─────────────────────────────────────────────────────────────┐
│            Data Aggregator Layer (Python)                    │
│  - NREL: Solar/Wind production data                         │
│  - EIA: US grid load and pricing                            │
│  - ENTSO-E: European grid transparency                      │
│  - NOAA: Weather and climate data                           │
│  - OpenWeatherMap: Real-time forecasts                      │
│  - Copernicus: Environmental data                           │
└─────────────────────────────────────────────────────────────┘


# Core Components

## 1. Substrate Parachain Runtime
Purpose: Blockchain logic for energy trading, DAG consensus, and tokenomics

Key Pallets:

pallet-energy-market: Manages energy orders, device registration, grid pricing
pallet-dag-consensus: Implements DAG overlay for fast local settlements
pallet-incentives: Handles staking, rewards, and reputation NFTs

Consensus: Hybrid GRANDPA + DAG

GRANDPA for global finality
DAG for local energy node coordination

Cross-Chain: XCM v3 for interoperability with other parachains

## 2. API Gateway (Node.js + Express)
Purpose: REST API layer bridging frontend and blockchain
Features:

Polkadot.js API integration
PostgreSQL for caching and off-chain data
Redis for high-performance caching
JWT authentication
Rate limiting

Endpoints:

/api/v1/trades/* - Energy trading operations
/api/v1/users/* - User management
/api/v1/devices/* - Device registration
/api/v1/staking/* - Staking and rewards
/api/v1/analytics/* - Data visualization

## 3. Data Aggregator (Python)
Purpose: Collect real-time energy data from external sources
Data Sources:

NREL: PVDAQ, NSRDB, WIND Toolkit for solar/wind data
EIA: US electricity grid load and generation
ENTSO-E: European grid transparency platform
NOAA: Weather and climate observations
OpenWeatherMap: Real-time weather forecasts
Copernicus: ERA5 environmental data
Pecan Street: Smart meter data
Open Charge Map: EV charging infrastructure

Collection Frequency:

Solar/Wind: Every 5 minutes
Grid Load: Every 1 minute
Weather: Every 10 minutes

## 4. Frontend (React + TypeScript)
Purpose: User-facing dApp for energy trading
Features:

Polkadot wallet integration (Talisman, SubWallet)
Real-time trading dashboard
Device registration and verification
Staking interface
Gamified leaderboard
Analytics visualization

Tech Stack:

React 18 with TypeScript
Polkadot.js extension integration
Chart.js for visualizations
TailwindCSS for styling
Vite for build tooling

#Data Flow
## Energy Trading Flow
1. User registers device → pallet-energy-market (DID verification)
2. User creates sell order → API Gateway → Substrate RPC
3. Order stored on-chain → pallet-energy-market
4. Buyer purchases energy → Transaction signed with wallet
5. Payment transferred → Currency pallet
6. Order status updated → Event emitted
7. Trade cached in PostgreSQL → API Gateway
8. Frontend updates in real-time → WebSocket subscription

## Data Aggregation Flow
1. Python scheduler triggers collection
2. Collectors fetch from external APIs (NREL, EIA, etc.)
3. Data processors transform raw data
4. Processed data stored in PostgreSQL
5. API Gateway serves cached data to frontend
6. Charts visualize real-time metrics

## DAG Consensus Flow
1. Grid node creates DAG vertex
2. Vertex references multiple parents
3. Other grid nodes confirm vertex
4. After 3 confirmations → Vertex finalized
5. Finalized data used for settlements

# Security Considerations

## On-Chain Security

Multi-signature requirements for critical functions
Time-locks for large transactions
Device verification via DID pallet
Reputation system to prevent abuse

## API Security

JWT token authentication
Rate limiting (100 requests/hour per IP)
Input validation with Joi
CORS configuration
SQL injection prevention (parameterized queries)

## Data Integrity

External data signed by oracle nodes
Multiple data source verification
Outlier detection algorithms
Historical data consistency checks

# Scalability

## Horizontal Scaling

API Gateway: Load balanced across multiple instances
Database: PostgreSQL read replicas
Redis: Cluster mode for caching
Frontend: CDN distribution

## Vertical Scaling

Substrate node: Optimized WASM runtime
DAG consensus: Parallel transaction processing
Database: Indexed queries, connection pooling

# Deployment
## Development
bashdocker-compose up

## Production (Kubernetes)
kubectl apply -f k8s/
```

### Parachain Deployment
1. Build runtime: `cargo build --release`
2. Generate chain spec: `./target/release/energidot-node build-spec`
3. Register parachain on Rococo testnet
4. Start collator node
5. Bid for mainnet slot auction

## Monitoring

- Prometheus metrics collection
- Grafana dashboards
- Substrate Telemetry
- Custom alerting for:
  - High transaction failure rate
  - Data aggregation errors
  - Node synchronization issues
  - API response time degradation

## Future Enhancements

- Phala Network integration for privacy-preserving data
- AI optimization agent for trading strategies
- Carbon credit integration via XCM
- Mobile app (React Native)
- IoT device SDK (Arduino/Raspberry Pi)
- Governance via on-chain voting
```

### Path: `docs/API_REFERENCE.md`
```markdown
# API Reference

## Base URL
```
Development: http://localhost:3001
Production: https://api.energidot.io
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>

# Endpoints

## Health Check

GET /health
Returns API health status.
Response:
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "version": "1.0.0"
}

Trades
POST /api/v1/trades/create
Create a new energy sell order.
Authentication: Required
Request Body:
{
  "energyAmount": 100,
  "pricePerKwh": "0.0001",
  "gridZone": "NorthAmerica",
  "energySource": "Solar",
  "expiresInBlocks": 1000
}
Response:
{
  "success": true,
  "data": {"orderId": "0x1234...",
"status": "pending",
"message": "Sell order created successfully"
}
}


#### POST /api/v1/trades/buy

Purchase energy from an existing order.

**Authentication**: Required

**Request Body**:
```json
{
  "orderId": "0x1234..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transactionHash": "0xabcd...",
    "orderId": "0x1234...",
    "message": "Energy purchased successfully"
  }
}
```

#### GET /api/v1/trades/history

Get user's trade history.

**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Number of trades to return (default: 50)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "order_id": "0x1234...",
      "seller_account_id": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "buyer_account_id": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      "energy_amount": 100,
      "price_per_kwh": "0.0001",
      "total_price": "0.01",
      "grid_zone": "NorthAmerica",
      "energy_source": "Solar",
      "status": "Completed",
      "created_at": "2025-01-01T00:00:00.000Z",
      "completed_at": "2025-01-01T00:05:00.000Z"
    }
  ],
  "cached": false
}
```

#### GET /api/v1/trades/active

Get all active sell orders.

**Query Parameters**:
- `gridZone` (optional): Filter by grid zone
- `energySource` (optional): Filter by energy source

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "order_id": "0x1234...",
      "seller_account_id": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "energy_amount": 100,
      "price_per_kwh": "0.0001",
      "total_price": "0.01",
      "grid_zone": "NorthAmerica",
      "energy_source": "Solar",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/v1/trades/:orderId

Get specific order details.

**Response**:
```json
{
  "success": true,
  "data": {
    "order_id": "0x1234...",
    "seller": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "buyer": null,
    "energy_amount": 100,
    "price_per_kwh": "0.0001",
    "status": "Open"
  }
}
```

---

### Users

#### POST /api/v1/users/register

Register a new user.

**Request Body**:
```json
{
  "accountId": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "email": "user@example.com",
  "username": "energyuser"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "account_id": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "email": "user@example.com",
    "username": "energyuser",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/v1/users/profile

Get user profile.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "account_id": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "email": "user@example.com",
    "username": "energyuser",
    "onChainStats": {
      "staked_amount": "1000",
      "reward_accumulated": "50",
      "energy_contributed_kwh": 5000,
      "data_contributions": 10
    }
  }
}
```

#### GET /api/v1/users/stats

Get user trading statistics.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "total_sales": 25,
    "total_purchases": 10,
    "total_energy_sold": 2500,
    "total_energy_bought": 1000,
    "total_revenue": "2.5",
    "total_spent": "1.0"
  }
}
```

---

### Devices

#### POST /api/v1/devices/register

Register an energy-producing device.

**Authentication**: Required

**Request Body**:
```json
{
  "deviceType": "Solar",
  "capacityKwh": 10,
  "didReference": "did:polkadot:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x1234...",
    "deviceType": "Solar",
    "capacityKwh": 10,
    "message": "Device registered successfully. Awaiting verification."
  }
}
```

#### GET /api/v1/devices/list

Get user's registered devices.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "owner_account_id": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "device_type": "Solar",
      "capacity_kwh": 10,
      "verified": true,
      "did_reference": "did:polkadot:5GrwvaEF...",
      "registered_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/v1/devices/production

Record energy production data.

**Authentication**: Required

**Request Body**:
```json
{
  "deviceId": 1,
  "energyKwh": 5.5,
  "timestamp": "2025-01-01T12:00:00.000Z",
  "dataSource": "NREL"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "device_id": 1,
    "energy_kwh": 5.5,
    "timestamp": "2025-01-01T12:00:00.000Z",
    "verified": false
  }
}
```

---

### Staking

#### POST /api/v1/staking/stake

Stake ENRG tokens.

**Authentication**: Required

**Request Body**:
```json
{
  "amount": "1000"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x1234...",
    "amount": "1000",
    "message": "Tokens staked successfully"
  }
}
```

#### POST /api/v1/staking/claim

Claim staking rewards.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x1234...",
    "message": "Rewards claimed successfully"
  }
}
```

#### GET /api/v1/staking/info

Get staking information.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "staked_amount": "1000",
    "reward_accumulated": "50",
    "last_claim_block": 12345,
    "energy_contributed_kwh": 5000,
    "data_contributions": 10,
    "is_active": true
  }
}
```

#### GET /api/v1/staking/leaderboard

Get top contributors leaderboard.

**Query Parameters**:
- `limit` (optional): Number of entries (default: 100)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "account_id": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "username": "energyking",
      "total_energy_kwh": 50000,
      "total_trades": 200,
      "reputation_tier": "Platinum",
      "rank": 1
    }
  ]
}
```

---

### Analytics

#### GET /api/v1/analytics/dashboard

Get dashboard summary metrics.

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_energy_traded": "100000",
      "total_trades": "500",
      "unique_sellers": "150",
      "unique_buyers": "200"
    },
    "byEnergySource": [
      {
        "energy_source": "Solar",
        "total_energy": "40000",
        "trade_count": "200",
        "percentage": "40.00"
      }
    ],
    "recentTrades": [],
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/v1/analytics/grid-performance

Get grid performance metrics.

**Query Parameters**:
- `gridZone` (optional): Grid zone filter
- `hours` (optional): Time range in hours (default: 24)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "data_type": "solar_production",
      "avg_value": 25.5,
      "min_value": 10.0,
      "max_value": 45.0,
      "unit": "kW",
      "hour": "2025-01-01T12:00:00.000Z"
    }
  ]
}
```

#### GET /api/v1/analytics/price-trends

Get price trend data.

**Query Parameters**:
- `gridZone` (optional): Grid zone filter
- `days` (optional): Time range in days (default: 7)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "day": "2025-01-01",
      "avg_price": "0.0001",
      "min_price": "0.00008",
      "max_price": "0.00012",
      "total_volume": 10000
    }
  ]
}
```

#### GET /api/v1/analytics/energy-mix

Get renewable energy mix distribution.

**Query Parameters**:
- `period` (optional): day, week, month (default: day)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "energy_source": "Solar",
      "total_energy": "40000",
      "trade_count": 200,
      "percentage": "40.00"
    }
  ]
}
```

---

### Grid

#### GET /api/v1/grid/status

Get current grid status.

**Query Parameters**:
- `gridZone` (optional): Grid zone filter

**Response**:
```json
{
  "success": true,
  "data": {
    "gridZone": "NorthAmerica",
    "metrics": [
      {
        "data_type": "solar_production",
        "value": 25.5,
        "unit": "kW",
        "timestamp": "2025-01-01T12:00:00.000Z",
        "data_source": "NREL"
      }
    ],
    "lastUpdated": "2025-01-01T12:00:00.000Z"
  }
}
```

#### GET /api/v1/grid/prices

Get current grid prices.

**Query Parameters**:
- `gridZone` (required): Grid zone

**Response**:
```json
{
  "success": true,
  "data": {
    "gridZone": "NorthAmerica",
    "price": "0.0001",
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
```

#### GET /api/v1/grid/zones

Get all available grid zones.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "grid_zone": "NorthAmerica",
      "trade_count": 500
    },
    {
      "grid_zone": "Europe",
      "trade_count": 300
    }
  ]
}
```

---

## Error Responses

All endpoints may return error responses in the following format:
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

- **Limit**: 100 requests per hour per IP address
- **Headers**: 
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets

## Data Sources

All analytics endpoints aggregate data from:
- **NREL**: Solar and wind production data
- **EIA**: US grid load and pricing
- **ENTSO-E**: European grid transparency
- **NOAA**: Weather and climate data
- **OpenWeatherMap**: Real-time forecasts
- **Copernicus**: Environmental data








