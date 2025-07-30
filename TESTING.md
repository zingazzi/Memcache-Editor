# Testing Documentation

This document describes the testing setup for the Memcache Editor project.

## Test Structure

```
tests/
├── setup.js                 # Jest setup configuration
├── unit/                    # Unit tests
│   └── server.test.js      # Server-side unit tests
└── README.md               # Test documentation
```

## Test Coverage

### Current Coverage
- **Server Code**: 90.76% coverage
- **API Endpoints**: Fully tested
- **Error Handling**: Fully tested
- **Input Validation**: Fully tested

### Coverage Thresholds
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

### Test Output Examples

#### Successful Test Run
```
 PASS  tests/unit/server.test.js
  Server Setup
    ✓ should create express app (3 ms)
  API Endpoints
    GET /api/read/:key
      ✓ should return 404 when key is missing (32 ms)
      ✓ should return 404 when key not found (16 ms)
      ✓ should return key data when found (7 ms)
      ✓ should handle memcache errors (4 ms)
    POST /api/set
      ✓ should return 400 when key is missing (19 ms)
      ✓ should return 400 when value is missing (5 ms)
      ✓ should set key successfully (5 ms)
      ✓ should handle memcache errors (3 ms)
      ✓ should handle set failure (6 ms)
    DELETE /api/delete/:key
      ✓ should return 404 when key is missing (5 ms)
      ✓ should delete key successfully (4 ms)
      ✓ should return 404 when key not found (2 ms)
      ✓ should handle memcache errors (3 ms)
    GET /api/health
      ✓ should return healthy status when memcache is connected (4 ms)
      ✓ should return unhealthy status when memcache is not available (4 ms)
  Error Handling
    ✓ should handle general server errors (25 ms)

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
```

#### Coverage Report
```
-----------|---------|----------|---------|---------|----------------------
File       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s    
-----------|---------|----------|---------|---------|----------------------
All files  |   90.76 |    82.35 |   84.61 |   90.76 |                      
 server.js |   90.76 |    82.35 |   84.61 |   90.76 | 30,38,59,125,172-173 
-----------|---------|----------|---------|---------|----------------------
```

## Test Categories

### Unit Tests
- **Server Tests**: Test individual server functions and API endpoints
- **Mocked Dependencies**: Uses mocks for external dependencies (memcache)
- **Fast Execution**: No external dependencies required

### Test Types Covered

#### API Endpoint Tests
- ✅ **GET /api/read/:key**
  - Missing key validation
  - Key not found scenarios
  - Successful key retrieval
  - Error handling

- ✅ **POST /api/set**
  - Missing key validation
  - Missing value validation
  - Successful key setting
  - Error handling
  - Set failure scenarios

- ✅ **DELETE /api/delete/:key**
  - Missing key validation
  - Successful key deletion
  - Key not found scenarios
  - Error handling

- ✅ **GET /api/health**
  - Healthy status when connected
  - Unhealthy status when disconnected

#### Error Handling Tests
- ✅ **General Server Errors**
  - Middleware error handling
  - Response structure validation

## Test Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'server.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!public/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
  verbose: true,
};
```

### Test Setup (`tests/setup.js`)
- Environment configuration
- Mock setup
- Global test utilities
- Console mocking

## Mocking Strategy

### Memcache Mocking
```javascript
const mockMemcached = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  stats: jest.fn(),
};

jest.mock('memcached', () => {
  return jest.fn().mockImplementation(() => mockMemcached);
});
```

### Test Utilities
```javascript
// Global test utilities
global.testUtils = {
  createTestKey: (key, value, ttl) => ({ key, value, ttl }),
  createMockResponse: () => ({ status: jest.fn(), json: jest.fn() }),
  createMockRequest: (params, body, query) => ({ params, body, query }),
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
};
```

## Best Practices

### Test Organization
1. **Arrange**: Set up test data and mocks
2. **Act**: Execute the function being tested
3. **Assert**: Verify the expected results

### Naming Conventions
- Test files: `*.test.js`
- Test descriptions: Clear and descriptive
- Variable names: `testData`, `mockResponse`, etc.

### Mocking Guidelines
- Mock external dependencies (memcache)
- Don't mock the code you're testing
- Use realistic mock data
- Clear mocks between tests

### Error Testing
- Test both success and failure scenarios
- Test edge cases and invalid inputs
- Verify error messages are helpful

## Writing New Tests

### Example Test Structure
```javascript
describe('Feature Name', () => {
  test('should handle normal case', async () => {
    // Arrange
    const testData = { key: 'test', value: 'value' };
    mockMemcached.set.mockImplementation((key, value, ttl, callback) => {
      callback(null, true);
    });

    // Act
    const response = await request(app)
      .post('/api/set')
      .send(testData);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('should handle error case', async () => {
    // Arrange
    mockMemcached.set.mockImplementation((key, value, ttl, callback) => {
      callback(new Error('Test error'));
    });

    // Act
    const response = await request(app)
      .post('/api/set')
      .send({ key: 'test', value: 'value' });

    // Assert
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
```

### Test Data Patterns
```javascript
// Good: Clear, descriptive test data
const testData = {
  key: 'test_key',
  value: 'test_value',
  ttl: 3600,
};

// Good: Realistic error scenarios
const mockError = new Error('Connection failed');

// Good: Comprehensive assertions
expect(response.status).toBe(200);
expect(response.body.success).toBe(true);
expect(response.body.key).toBe('test_key');
```

## Debugging Tests

### Running Single Test
```bash
npm test -- --testNamePattern="specific test name"
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Verbose Output
```bash
npm test -- --verbose
```

### Coverage Analysis
```bash
# Generate HTML coverage report
npm run test:coverage

# View uncovered lines
npm test -- --coverage --verbose
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

### Pre-commit Hook
```bash
# Add to package.json scripts
"precommit": "npm test && npm run lint"
```

## Performance

### Test Execution Time
- **Unit Tests**: ~1 second total
- **Individual Test**: ~5-30ms each
- **Coverage Report**: ~1.5 seconds

### Optimization Tips
- Use `--runInBand` for faster execution
- Mock heavy operations
- Clean up resources in `afterAll`
- Avoid unnecessary async operations

## Troubleshooting

### Common Issues

1. **Test Timeout**
   ```bash
   # Increase timeout in jest.config.js
   testTimeout: 15000
   ```

2. **Mock Issues**
   ```javascript
   // Clear mocks in beforeEach
   jest.clearAllMocks();
   mockMemcached.get.mockReset();
   ```

3. **Environment Issues**
   ```javascript
   // Check environment variables in tests/setup.js
   process.env.NODE_ENV = 'test';
   process.env.PORT = '3001';
   ```

4. **Coverage Issues**
   ```javascript
   // Check coverage thresholds in jest.config.js
   coverageThreshold: {
     global: {
       branches: 80,
       functions: 80,
       lines: 80,
       statements: 80,
     },
   }
   ```

### Getting Help
- **Jest Documentation**: https://jestjs.io/
- **Supertest Documentation**: https://github.com/visionmedia/supertest
- **Project Issues**: Check the project's issue tracker

## Future Enhancements

### Planned Improvements
- [ ] Client-side tests with jsdom
- [ ] Integration tests with real memcache
- [ ] E2E tests with Playwright
- [ ] Performance benchmarks
- [ ] Load testing

### Test Categories to Add
- [ ] Database integration tests
- [ ] Authentication tests
- [ ] Rate limiting tests
- [ ] Logging tests
- [ ] Configuration tests

## Contributing

When adding new tests:

1. **Follow the existing patterns**
2. **Test both success and failure cases**
3. **Use descriptive test names**
4. **Maintain coverage thresholds**
5. **Update documentation**

### Test Checklist
- [ ] Test covers the main functionality
- [ ] Test covers error scenarios
- [ ] Test uses appropriate mocks
- [ ] Test has clear assertions
- [ ] Test follows naming conventions
- [ ] Test doesn't break existing tests 