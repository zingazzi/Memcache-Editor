// Jest setup file for Memcache Editor tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002'; // Use different port for testing
process.env.MEMCACHE_HOST = 'localhost:11212'; // Use different memcache port for testing

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Helper to create test data
  createTestKey: (key = 'test_key', value = 'test_value', ttl = 0) => ({
    key,
    value,
    ttl,
  }),

  // Helper to create mock response
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.sendFile = jest.fn().mockReturnValue(res);
    return res;
  },

  // Helper to create mock request
  createMockRequest: (params = {}, body = {}, query = {}) => ({
    params,
    body,
    query,
    headers: {},
  }),

  // Helper to wait for async operations
  wait: (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms)),
};
