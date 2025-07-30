# Test Suite Documentation

This directory contains comprehensive tests for the Memcache Editor application.

## Test Structure

```
tests/
├── setup.js                 # Jest setup configuration
├── README.md               # This documentation
├── unit/                   # Unit tests
│   ├── server.test.js      # Server-side unit tests
│   └── client.test.js      # Client-side unit tests
└── integration/            # Integration tests
    └── api.test.js         # API integration tests
```

## Test Types

### Unit Tests (`tests/unit/`)
- **Server Tests**: Test individual server functions and API endpoints
- **Client Tests**: Test client-side JavaScript functions and UI interactions
- **Mocked Dependencies**: Uses mocks for external dependencies

### Integration Tests (`tests/integration/`)
- **API Tests**: Test complete API workflows with real memcache server
- **End-to-End**: Test complete CRUD operations
- **Real Dependencies**: Uses actual memcache server

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Types
```bash
# Unit tests only
npm test -- --testPathPattern="unit"

# Integration tests only
npm test -- --testPathPattern="integration"

# Server tests only
npm test -- --testPathPattern="server"

# Client tests only
npm test -- --testPathPattern="client"
```

### Test Modes
```bash
# Watch mode (development)
npm run test:watch

# Coverage report
npm run test:coverage

# Verbose output
npm run test:verbose
```

## Test Configuration

### Jest Configuration
- **Test Environment**: Node.js for server tests, jsdom for client tests
- **Coverage Threshold**: 70% minimum coverage
- **Timeout**: 10 seconds for async operations
- **Setup**: Automatic setup via `tests/setup.js`

### Environment Variables
Tests use different environment variables:
- `NODE_ENV=test`
- `PORT=3001` (different from development)
- `MEMCACHE_HOST=localhost:11212` (different memcache port)

## Test Coverage

### Server Coverage
- ✅ API endpoints (GET, POST, DELETE)
- ✅ Error handling
- ✅ Input validation
- ✅ Memcache operations
- ✅ Health checks

### Client Coverage
- ✅ Form handlers
- ✅ API calls
- ✅ UI updates
- ✅ Error display
- ✅ Utility functions

### Integration Coverage
- ✅ Complete CRUD workflows
- ✅ Real memcache operations
- ✅ Error scenarios
- ✅ Performance tests

## Writing Tests

### Unit Test Example
```javascript
describe('Function Name', () => {
  test('should handle normal case', () => {
    const result = functionName('input');
    expect(result).toBe('expected');
  });

  test('should handle error case', () => {
    expect(() => functionName(null)).toThrow();
  });
});
```

### Integration Test Example
```javascript
describe('API Endpoint', () => {
  test('should work with real data', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send(testData);

    expect(response.status).toBe(200);
  });
});
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
- Mock external dependencies (memcache, fetch)
- Don't mock the code you're testing
- Use realistic mock data

### Error Testing
- Test both success and failure scenarios
- Test edge cases and invalid inputs
- Verify error messages are helpful

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

## Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: npm test

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Pre-commit Hook
```bash
# Add to package.json scripts
"precommit": "npm test && npm run lint"
```

## Troubleshooting

### Common Issues

1. **Test Timeout**
   - Increase timeout in `jest.config.js`
   - Check for hanging promises

2. **Mock Issues**
   - Clear mocks in `beforeEach`
   - Reset modules with `jest.resetModules()`

3. **Environment Issues**
   - Check environment variables in `tests/setup.js`
   - Verify test ports don't conflict

4. **Coverage Issues**
   - Check coverage thresholds in `jest.config.js`
   - Ensure all code paths are tested

### Performance Tips
- Use `--runInBand` for faster execution
- Mock heavy operations
- Clean up resources in `afterAll`

## Future Improvements

### Planned Enhancements
- [ ] E2E tests with Playwright
- [ ] Performance benchmarks
- [ ] Load testing
- [ ] Security testing
- [ ] Accessibility testing

### Test Categories to Add
- [ ] Database integration tests
- [ ] Authentication tests
- [ ] Rate limiting tests
- [ ] Logging tests
- [ ] Configuration tests
