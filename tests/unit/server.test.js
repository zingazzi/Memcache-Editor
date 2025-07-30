const request = require('supertest');

// Mock memcached
const mockMemcached = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  stats: jest.fn(),
};

jest.mock('memcached', () => {
  return jest.fn().mockImplementation(() => mockMemcached);
});

// Import the server app after mocking
let app;
let server;

beforeAll(async () => {
  // Clear module cache to ensure fresh import
  jest.resetModules();

  // Import the server
  const serverModule = require('../../server');
  app = serverModule.app;

  // Start server manually for testing
  server = app.listen(process.env.PORT || 3002);
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Reset mock implementations
  mockMemcached.get.mockReset();
  mockMemcached.set.mockReset();
  mockMemcached.del.mockReset();
  mockMemcached.stats.mockReset();
});

describe('Server Setup', () => {
  test('should create express app', () => {
    expect(app).toBeDefined();
    expect(typeof app.get).toBe('function');
    expect(typeof app.post).toBe('function');
    expect(typeof app.delete).toBe('function');
  });
});

describe('API Endpoints', () => {
  describe('GET /api/read/:key', () => {
    test('should return 404 when key is missing', async () => {
      const response = await request(app).get('/api/read/');
      expect(response.status).toBe(404);
    });

    test('should return 404 when key not found', async () => {
      mockMemcached.get.mockImplementation((key, callback) => {
        callback(null, undefined);
      });

      const response = await request(app).get('/api/read/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Key not found');
    });

    test('should return key data when found', async () => {
      const testData = { test: 'value' };
      mockMemcached.get.mockImplementation((key, callback) => {
        callback(null, testData);
      });
      mockMemcached.stats.mockImplementation((callback) => {
        callback(null, {});
      });

      const response = await request(app).get('/api/read/test_key');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.key).toBe('test_key');
      expect(response.body.value).toEqual(testData);
      expect(response.body.valueType).toBe('object');
      expect(response.body.valueSize).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    test('should handle memcache errors', async () => {
      mockMemcached.get.mockImplementation((key, callback) => {
        callback(new Error('Connection failed'));
      });

      const response = await request(app).get('/api/read/test_key');
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Memcache connection error');
    });
  });

  describe('POST /api/set', () => {
    test('should return 400 when key is missing', async () => {
      const response = await request(app)
        .post('/api/set')
        .send({ value: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Key is required');
    });

    test('should return 400 when value is missing', async () => {
      const response = await request(app)
        .post('/api/set')
        .send({ key: 'test_key' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Value is required');
    });

    test('should set key successfully', async () => {
      mockMemcached.set.mockImplementation((key, value, ttl, callback) => {
        callback(null, true);
      });

      const testData = {
        key: 'test_key',
        value: 'test_value',
        ttl: 3600,
      };

      const response = await request(app)
        .post('/api/set')
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.key).toBe('test_key');
      expect(response.body.value).toBe('test_value');
      expect(response.body.ttl).toBe(3600);
      expect(response.body.timestamp).toBeDefined();
    });

    test('should handle memcache errors', async () => {
      mockMemcached.set.mockImplementation((key, value, ttl, callback) => {
        callback(new Error('Set failed'));
      });

      const response = await request(app)
        .post('/api/set')
        .send({ key: 'test_key', value: 'test_value' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Memcache connection error');
    });

    test('should handle set failure', async () => {
      mockMemcached.set.mockImplementation((key, value, ttl, callback) => {
        callback(null, false);
      });

      const response = await request(app)
        .post('/api/set')
        .send({ key: 'test_key', value: 'test_value' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to set key');
    });
  });

  describe('DELETE /api/delete/:key', () => {
    test('should return 404 when key is missing', async () => {
      const response = await request(app).delete('/api/delete/');
      expect(response.status).toBe(404);
    });

    test('should delete key successfully', async () => {
      mockMemcached.del.mockImplementation((key, callback) => {
        callback(null, true);
      });

      const response = await request(app).delete('/api/delete/test_key');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Key \'test_key\' deleted successfully');
    });

    test('should return 404 when key not found', async () => {
      mockMemcached.del.mockImplementation((key, callback) => {
        callback(null, false);
      });

      const response = await request(app).delete('/api/delete/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Key not found or already deleted');
    });

    test('should handle memcache errors', async () => {
      mockMemcached.del.mockImplementation((key, callback) => {
        callback(new Error('Delete failed'));
      });

      const response = await request(app).delete('/api/delete/test_key');
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Memcache connection error');
    });
  });

  describe('GET /api/stats', () => {
    test('should return stats when memcache is connected', async () => {
      const mockStats = {
        '0': {
          'server': 'localhost:11211',
          'pid': 1,
          'uptime': 100,
          'limit_maxbytes': 134217728,
          'bytes': 1024,
          'curr_items': 5,
          'curr_connections': 2,
          'connection_structures': 3,
          'cmd_get': 100,
          'cmd_set': 50,
          'cmd_delete': 10,
          'cmd_flush': 0,
          'get_hits': 80,
          'get_misses': 20,
          'evictions': 0,
          'expired_unfetched': 0,
          'evicted_unfetched': 0,
        },
      };

      mockMemcached.stats.mockImplementation((callback) => {
        callback(null, mockStats);
      });

      const response = await request(app).get('/api/stats');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.servers).toBeDefined();
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.totalServers).toBe(1);
      expect(response.body.summary.totalKeys).toBe(5);
    });

    test('should return error when memcache is not available', async () => {
      mockMemcached.stats.mockImplementation((callback) => {
        callback(new Error('Connection failed'));
      });

      const response = await request(app).get('/api/stats');
      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Memcache not available');
    });
  });

  describe('GET /api/health', () => {
    test('should return healthy status when memcache is connected', async () => {
      const mockStats = {
        'server': 'localhost:11211',
        'pid': 1,
        'uptime': 100,
      };

      mockMemcached.stats.mockImplementation((callback) => {
        callback(null, mockStats);
      });

      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      expect(response.body.memcache).toBe('connected');
      expect(response.body.stats).toEqual(mockStats);
    });

    test('should return unhealthy status when memcache is not available', async () => {
      mockMemcached.stats.mockImplementation((callback) => {
        callback(new Error('Connection failed'));
      });

      const response = await request(app).get('/api/health');
      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Memcache not available');
    });
  });
});

describe('Error Handling', () => {
  test('should handle general server errors', async () => {
    // Create a route that throws an error
    app.get('/test-error', (req, res, next) => {
      next(new Error('Test error'));
    });

    const response = await request(app).get('/test-error');
    expect(response.status).toBe(500);
    // Check that the response has the expected structure
    expect(response.body).toBeDefined();
    expect(typeof response.body).toBe('object');
  });
});
