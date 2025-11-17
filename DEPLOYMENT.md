# Deployment Guide

## Prerequisites

- Docker 24.x or higher
- Docker Compose 2.x or higher
- Node.js 18.x or higher
- Rust 1.70 or higher
- PostgreSQL 14.x or higher
- Redis 7.x or higher

## Local Development

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/energidot.git
cd energidot
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and add your API keys for:
- NREL_API_KEY
- EIA_API_KEY
- ENTSOE_API_KEY
- NOAA_API_KEY
- OPENWEATHER_API_KEY

### 3. Start Services with Docker Compose
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Substrate node (ports 9944, 9945, 30333)
- API Gateway (port 3001)
- Data Aggregator
- Frontend (port 3000)

### 4. Initialize Database
```bash
# The database will be automatically initialized on first run
# If needed, you can manually run migrations:
docker-compose exec api-gateway npm run migrate
```

### 5. Access Applications

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Substrate Node RPC**: ws://localhost:9945

### 6. Check Service Health
```bash
# API Gateway health
curl http://localhost:3001/health

# Check logs
docker-compose logs -f api-gateway
docker-compose logs -f substrate-node
docker-compose logs -f data-aggregator
```

## Production Deployment

### Option 1: Docker Compose (Single Server)

#### 1. Prepare Production Server
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Configure Production Environment
```bash
cp .env.example .env
# Edit .env with production values
nano .env
```

Set production values:
```bash
NODE_ENV=production
API_HOST=0.0.0.0
CORS_ORIGIN=https://energidot.io
LOG_LEVEL=warn
```

#### 3. Deploy with Docker Compose
```bash
docker-compose -f docker-compose.yml up -d
```

#### 4. Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d api.energidot.io

# Configure Nginx
sudo nano /etc/nginx/sites-available/energidot
```

Nginx configuration:
```nginx
server {
    listen 443 ssl http2;
    server_name api.energidot.io;

    ssl_certificate /etc/letsencrypt/live/api.energidot.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.energidot.io/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Kubernetes (Scalable Production)

#### 1. Setup Kubernetes Cluster
```bash
# Using Google Kubernetes Engine (GKE)
gcloud container clusters create energidot-cluster \
    --num-nodes=3 \
    --machine-type=n1-standard-4 \
    --zone=us-central1-a

# Or using AWS EKS, Azure AKS, etc.
```

#### 2. Create Kubernetes Secrets
```bash
kubectl create secret generic energidot-secrets \
    --from-literal=database-url='postgresql://user:pass@postgres:5432/energidot' \
    --from-literal=jwt-secret='your-jwt-secret' \
    --from-literal=nrel-api-key='your-nrel-key' \
    --from-literal=eia-api-key='your-eia-key' \
    --from-literal=entsoe-api-key='your-entsoe-key' \
    --from-literal=noaa-api-key='your-noaa-key' \
    --from-literal=openweather-api-key='your-openweather-key'
```

#### 3. Deploy to Kubernetes
```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
```

#### 4. Monitor Deployments
```bash
# Check logs
kubectl logs -f deployment/api-gateway
kubectl logs -f deployment/substrate-node

# Scale deployments
kubectl scale deployment api-gateway --replicas=5
```

### Option 3: Polkadot Cloud (Parachain Deployment)

#### 1. Build Parachain Runtime
```bash
cd backend/substrate-node
cargo build --release
```

#### 2. Generate Chain Specification
```bash
./target/release/energidot-node build-spec --chain local --disable-default-bootnode > chain-spec-plain.json

# Convert to raw format
./target/release/energidot-node build-spec --chain chain-spec-plain.json --raw --disable-default-bootnode > chain-spec.json
```

#### 3. Generate Parachain Genesis State
```bash
./target/release/energidot-node export-genesis-state --chain chain-spec.json > genesis-state

./target/release/energidot-node export-genesis-wasm --chain chain-spec.json > genesis-wasm
```

#### 4. Register on Rococo Testnet
```bash
# Connect to Rococo relay chain
# Use Polkadot.js Apps: https://polkadot.js.org/apps

# 1. Register parachain ID
# 2. Upload genesis-state and genesis-wasm
# 3. Start collator node
./target/release/energidot-node \
    --collator \
    --chain chain-spec.json \
    --base-path /data \
    --port 30333 \
    --ws-port 9945 \
    -- \
    --chain rococo \
    --port 30334 \
    --ws-port 9946
```

#### 5. Bid for Mainnet Slot
```bash
# Once tested on Rococo:
# 1. Prepare crowdloan campaign
# 2. Lock DOT tokens
# 3. Participate in slot auction
# 4. Win parachain slot
# 5. Deploy to Polkadot mainnet
```

## Monitoring and Maintenance

### Setup Prometheus Monitoring
```bash
# Deploy Prometheus
kubectl apply -f k8s/monitoring/prometheus.yaml

# Deploy Grafana
kubectl apply -f k8s/monitoring/grafana.yaml
```

### Configure Alerts
```yaml
# alerts.yaml
groups:
  - name: energidot
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        annotations:
          summary: "High error rate detected"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        annotations:
          summary: "PostgreSQL database is down"
```

### Backup Strategy

#### Database Backups
```bash
# Automated daily backups
docker-compose exec postgres pg_dump -U energidot energidot > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T postgres psql -U energidot energidot < backup_20250101.sql
```

#### Blockchain State Backups
```bash
# Backup substrate node data
tar -czf substrate-backup_$(date +%Y%m%d).tar.gz /var/lib/substrate/

# Restore
tar -xzf substrate-backup_20250101.tar.gz -C /
```

### Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/energidot
```
```
/var/log/energidot/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 energidot energidot
    sharedscripts
}
```

### Security Hardening

#### 1. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 30333/tcp   # P2P
sudo ufw enable
```

#### 2. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

#### 3. SSL/TLS Configuration
```bash
# Use strong ciphers
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers on;
```

## Troubleshooting

### Common Issues

#### Issue: Substrate node won't sync
```bash
# Check node logs
docker-compose logs substrate-node

# Reset node data
docker-compose down
docker volume rm energidot_substrate_data
docker-compose up -d substrate-node
```

#### Issue: API Gateway connection errors
```bash
# Check database connection
docker-compose exec postgres psql -U energidot -c "SELECT 1"

# Check Redis connection
docker-compose exec redis redis-cli ping

# Restart API Gateway
docker-compose restart api-gateway
```

#### Issue: Data aggregator not collecting data
```bash
# Check API keys in .env file
cat .env | grep API_KEY

# Check aggregator logs
docker-compose logs data-aggregator

# Manually test API endpoints
curl "https://developer.nrel.gov/api/solar/data_query/v1.json?api_key=YOUR_KEY"
```

### Performance Optimization

#### Database Query Optimization
```bash
# Analyze slow queries
docker-compose exec postgres psql -U energidot -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10"

# Add missing indexes
docker-compose exec postgres psql -U energidot -c "CREATE INDEX idx_trades_created_at ON trade_history(created_at)"
```

#### Redis Cache Tuning
```bash
# Increase maxmemory
docker-compose exec redis redis-cli CONFIG SET maxmemory 2gb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Scaling

### Horizontal Scaling
```bash
# Scale API Gateway
docker-compose up -d --scale api-gateway=3

# Or with Kubernetes
kubectl scale deployment api-gateway --replicas=5
```

### Database Replication
```bash
# Setup PostgreSQL read replicas
# Edit postgresql.conf
wal_level = replica
max_wal_senders = 3
```

### Load Balancing
```bash
# Nginx load balancer configuration
upstream api_backend {
    server api-gateway-1:3001;
    server api-gateway-2:3001;
    server api-gateway-3:3001;
}
```

## Rollback Procedures

### Rollback Docker Deployment
```bash
# Stop current version
docker-compose down

# Restore previous images
docker-compose pull --ignore-pull-failures
docker-compose up -d
```

### Rollback Kubernetes Deployment
```bash
# Rollback to previous version
kubectl rollout undo deployment/api-gateway

# Rollback to specific revision
kubectl rollout undo deployment/api-gateway --to-revision=2
```

## Support

For deployment issues:
- GitHub Issues: https://github.com/yourusername/energidot/issues
- Discord: https://discord.gg/energidot
- Email: support@energidot.io