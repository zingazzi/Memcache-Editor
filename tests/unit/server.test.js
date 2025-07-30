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
        'localhost:11211': {
          'curr_items': '100',
          'total_items': '1000',
          'bytes': '1048576',
          'cmd_get': '5000',
          'get_hits': '4500',
          'get_misses': '500',
          'evictions': '10',
          'uptime': '3600',
        },
      };

      mockMemcached.stats.mockImplementation((callback) => {
        callback(null, mockStats);
      });

      const response = await request(app).get('/api/stats');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.servers).toBeDefined();
      expect(response.body.summary).toBeDefined();
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

  describe('POST /api/bulk/read', () => {
    test('should return 400 when keys array is missing', async () => {
      const response = await request(app).post('/api/bulk/read')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Keys array is required and must not be empty');
    });

    test('should return 400 when keys array is empty', async () => {
      const response = await request(app).post('/api/bulk/read')
        .send({ keys: [] });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Keys array is required and must not be empty');
    });

    test('should return 400 when too many keys', async () => {
      const keys = Array.from({ length: 101 }, (_, i) => `key${i}`);
      const response = await request(app).post('/api/bulk/read')
        .send({ keys });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Maximum 100 keys allowed per bulk operation');
    });

    test('should read multiple keys successfully', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const mockData = { value: 'test' };

      mockMemcached.get.mockImplementation((key, callback) => {
        if (key === 'key1') {
          callback(null, mockData);
        } else if (key === 'key2') {
          callback(null, undefined);
        } else {
          callback(null, mockData);
        }
      });

      const response = await request(app).post('/api/bulk/read')
        .send({ keys });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(3);
      expect(response.body.successful).toBe(2);
      expect(response.body.failed).toBe(1);
      expect(response.body.results).toHaveLength(3);
    });
  });

  describe('POST /api/bulk/set', () => {
    test('should return 400 when operations array is missing', async () => {
      const response = await request(app).post('/api/bulk/set')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Operations array is required and must not be empty');
    });

    test('should return 400 when operation is invalid', async () => {
      const operations = [
        { key: 'key1', value: 'value1' },
        { key: 'key2' }, // missing value
      ];
      const response = await request(app).post('/api/bulk/set')
        .send({ operations });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid operation at index 1');
    });

    test('should set multiple keys successfully', async () => {
      const operations = [
        { key: 'key1', value: 'value1', ttl: 3600 },
        { key: 'key2', value: { data: 'test' }, ttl: 1800 },
      ];

      mockMemcached.set.mockImplementation((key, value, ttl, callback) => {
        callback(null, true);
      });

      const response = await request(app).post('/api/bulk/set')
        .send({ operations });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(2);
      expect(response.body.successful).toBe(2);
      expect(response.body.failed).toBe(0);
      expect(response.body.results).toHaveLength(2);
    });
  });

  describe('POST /api/bulk/delete', () => {
    test('should return 400 when keys array is missing', async () => {
      const response = await request(app).post('/api/bulk/delete')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Keys array is required and must not be empty');
    });

    test('should delete multiple keys successfully', async () => {
      const keys = ['key1', 'key2', 'key3'];

      mockMemcached.del.mockImplementation((key, callback) => {
        if (key === 'key1') {
          callback(null, true);
        } else if (key === 'key2') {
          callback(null, false);
        } else {
          callback(null, true);
        }
      });

      const response = await request(app).post('/api/bulk/delete')
        .send({ keys });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(3);
      expect(response.body.successful).toBe(2);
      expect(response.body.failed).toBe(1);
      expect(response.body.results).toHaveLength(3);
    });
  });

  describe('GET /api/bulk/export', () => {
    test('should return 400 when keys parameter is missing', async () => {
      const response = await request(app).get('/api/bulk/export');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Keys parameter is required (comma-separated)');
    });

    test('should export keys successfully', async () => {
      const keys = 'key1,key2,key3';
      const mockData = { value: 'test' };

      mockMemcached.get.mockImplementation((key, callback) => {
        if (key === 'key1') {
          callback(null, mockData);
        } else if (key === 'key2') {
          callback(null, undefined);
        } else {
          callback(null, mockData);
        }
      });

      const response = await request(app).get(`/api/bulk/export?keys=${keys}`);
      expect(response.status).toBe(200);
      expect(response.body.exportedAt).toBeDefined();
      expect(response.body.totalKeys).toBe(3);
      expect(response.body.successfulExports).toBe(2);
      expect(response.body.failedExports).toBe(1);
      expect(response.body.data).toHaveLength(3);
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
