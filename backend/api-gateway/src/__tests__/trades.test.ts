//### Path: `backend/api-gateway/src/__tests__/trades.test.ts`

// backend/api-gateway/src/__tests__/trades.test.ts
// API Gateway unit tests

import request from 'supertest';
import app from '../server';

describe('Trades API', () => {
  describe('GET /api/v1/trades/active', () => {
    it('should return active orders', async () => {
      const response = await request(app)
        .get('/api/v1/trades/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by grid zone', async () => {
      const response = await request(app)
        .get('/api/v1/trades/active?gridZone=NorthAmerica')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/trades/create', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/trades/create')
        .send({
          energyAmount: 100,
          pricePerKwh: '0.0001',
          gridZone: 'NorthAmerica',
          energySource: 'Solar',
          expiresInBlocks: 1000
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('healthy');
  });
});
