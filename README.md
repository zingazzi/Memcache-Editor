# Memcache Editor

A comprehensive web-based management panel for Memcached operations with advanced bulk management capabilities.

## Features

### Core Operations
- **Read Keys**: Retrieve and display memcache key values with metadata
- **Set Keys**: Store new key-value pairs with optional TTL
- **Delete Keys**: Remove keys from memcache with confirmation
- **Health Check**: Monitor memcache server status

### Advanced Features ✨
- **Bulk Operations**: Perform multiple operations simultaneously
  - **Bulk Read**: Read up to 100 keys at once
  - **Bulk Set**: Set multiple key-value pairs with JSON support
  - **Bulk Delete**: Delete multiple keys with safety confirmation
  - **Bulk Export**: Export keys to JSON file with metadata
- **Real-time Statistics**: Live memcache performance monitoring
  - Memory usage visualization with progress bars
  - Hit rate monitoring with color-coded indicators
  - Auto-refresh functionality (every 5 seconds)
  - Live activity logging
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live status monitoring

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Vanilla JavaScript with Bootstrap 5.3.0
- **Cache**: Memcached
- **Code Quality**: ESLint with Airbnb configuration
- **Testing**: Jest with comprehensive test suite (30+ tests)
- **Icons**: Font Awesome 6.4.0

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Memcached server running

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd memcacheEditor
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (optional):
```bash
cp env.example .env
# Edit .env with your memcache settings
```

4. Start the application:
```bash
npm start
```

5. Open your browser to `http://localhost:3000`

## Development

### Available Scripts

```bash
# Start the application
npm start

# Development mode with auto-restart
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check linting status
npm run lint:check
```

### Code Quality

The project uses ESLint with Airbnb configuration for consistent code style:

- **Configuration**: `.eslintrc.js`
- **Ignore File**: `.eslintignore`
- **Documentation**: `LINTING.md`

### Testing

Comprehensive test suite with Jest:

- **Unit Tests**: Server-side API testing (30+ tests)
- **Coverage**: High test coverage for all endpoints
- **Mocking**: External dependencies mocked
- **Documentation**: `TESTING.md`

#### Test Commands
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## API Endpoints

### Core Operations

#### GET /api/read/:key
Retrieve a key from memcache.

**Response:**
```json
{
  "success": true,
  "key": "example_key",
  "value": "example_value",
  "valueType": "string",
  "valueSize": 13,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### POST /api/set
Set a key in memcache.

**Request Body:**
```json
{
  "key": "example_key",
  "value": "example_value",
  "ttl": 3600
}
```

**Response:**
```json
{
  "success": true,
  "message": "Key 'example_key' set successfully",
  "key": "example_key",
  "value": "example_value",
  "ttl": 3600,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### DELETE /api/delete/:key
Delete a key from memcache.

**Response:**
```json
{
  "success": true,
  "message": "Key 'example_key' deleted successfully"
}
```

#### GET /api/health
Check memcache server health.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "memcache": "connected",
  "stats": {
    "server": "localhost:11211",
    "pid": 1,
    "uptime": 100
  }
}
```

### Advanced Operations

#### GET /api/stats
Get comprehensive real-time memcache statistics.

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "servers": {
    "localhost:11211": {
      "connection": { "status": "connected", "server": "localhost:11211" },
      "memory": { "total": 134217728, "used": 1048576, "usagePercent": "0.78" },
      "performance": { "hits": 4500, "misses": 500, "hitRate": "90.00%" },
      "items": { "total": 100, "totalConnections": 2 }
    }
  },
  "summary": {
    "totalServers": 1,
    "totalMemory": 134217728,
    "usedMemory": 1048576,
    "totalKeys": 100,
    "totalHits": 4500,
    "totalMisses": 500
  }
}
```

#### POST /api/bulk/read
Read multiple keys simultaneously (up to 100 keys).

**Request Body:**
```json
{
  "keys": ["key1", "key2", "key3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk read completed: 2 successful, 1 failed",
  "total": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "key": "key1",
      "success": true,
      "value": "value1",
      "valueType": "string",
      "valueSize": 6
    },
    {
      "key": "key2",
      "success": false,
      "error": "Key not found"
    }
  ],
  "hasErrors": true
}
```

#### POST /api/bulk/set
Set multiple key-value pairs in one operation (up to 100 operations).

**Request Body:**
```json
{
  "operations": [
    {
      "key": "user:123",
      "value": "John Doe",
      "ttl": 3600
    },
    {
      "key": "session:456",
      "value": {"id": 456, "active": true},
      "ttl": 1800
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk set completed: 2 successful, 0 failed",
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "key": "user:123",
      "success": true,
      "message": "Key 'user:123' set successfully",
      "ttl": 3600
    }
  ],
  "hasErrors": false
}
```

#### POST /api/bulk/delete
Delete multiple keys with confirmation (up to 100 keys).

**Request Body:**
```json
{
  "keys": ["key1", "key2", "key3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk delete completed: 2 successful, 1 failed",
  "total": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "key": "key1",
      "success": true,
      "message": "Key 'key1' deleted successfully"
    },
    {
      "key": "key2",
      "success": false,
      "error": "Key not found or already deleted"
    }
  ],
  "hasErrors": true
}
```

#### GET /api/bulk/export
Export multiple keys to JSON file.

**Query Parameters:**
- `keys`: Comma-separated list of keys to export

**Response:** JSON file download with metadata

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=3000

# Memcache Configuration
MEMCACHE_HOST=localhost:11211

# Node Environment
NODE_ENV=development
```

### Docker Support

The project includes Docker configuration:

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t memcache-editor .
docker run -p 3000:3000 memcache-editor
```

## Project Structure

```
memcacheEditor/
├── public/                 # Static files
│   ├── index.html         # Main HTML file with bulk operations UI
│   ├── script.js          # Client-side JavaScript with bulk operations
│   └── styles.css         # CSS styles
├── tests/                 # Test files
│   ├── setup.js          # Jest setup
│   ├── unit/             # Unit tests (30+ tests)
│   └── README.md         # Test documentation
├── server.js             # Express server with bulk operations endpoints
├── package.json          # Dependencies and scripts
├── jest.config.js        # Jest configuration
├── .eslintrc.js         # ESLint configuration
├── .eslintignore        # ESLint ignore file
├── TESTING.md           # Testing documentation
├── LINTING.md           # Linting documentation
├── CHANGELOG.md         # Version history and changes
└── README.md            # This file
```

## User Interface

### Navigation
- **Read Key**: Individual key retrieval
- **Set Key**: Individual key-value storage
- **Delete Key**: Individual key removal
- **Real-time Stats**: Live performance monitoring
- **Health Check**: Server status monitoring
- **Bulk Operations**: Advanced multi-key management

### Bulk Operations Interface
- **Tabbed Interface**: Separate tabs for Read, Set, Delete, and Export
- **Input Validation**: Real-time validation and error handling
- **Progress Tracking**: Loading states and progress indicators
- **Result Display**: Detailed success/failure reporting
- **Export Functionality**: Automatic file downloads

### Real-time Statistics Dashboard
- **Performance Metrics**: Memory usage, hit rates, command statistics
- **Visual Indicators**: Progress bars and color-coded status
- **Auto-refresh**: 5-second automatic updates
- **Activity Log**: Live operation tracking

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Run tests**: `npm test`
5. **Run linting**: `npm run lint`
6. **Commit your changes**
7. **Submit a pull request**

### Code Standards

- **Linting**: All code must pass ESLint
- **Testing**: New features require tests
- **Coverage**: Maintain high test coverage
- **Documentation**: Update docs for new features

### Testing Guidelines

- Write unit tests for new features
- Test both success and error scenarios
- Use descriptive test names
- Follow the existing test patterns
- See `TESTING.md` for detailed guidelines

## Troubleshooting

### Common Issues

1. **Memcache Connection Failed**
   - Ensure memcache server is running
   - Check `MEMCACHE_HOST` environment variable
   - Verify network connectivity

2. **Port Already in Use**
   - Change `PORT` environment variable
   - Kill existing process on port 3000

3. **Tests Failing**
   - Run `npm install` to ensure dependencies
   - Check Jest configuration
   - See `TESTING.md` for debugging tips

4. **Linting Errors**
   - Run `npm run lint:fix` to auto-fix
   - Check `.eslintrc.js` configuration
   - See `LINTING.md` for guidelines

5. **Bulk Operations Issues**
   - Check input format (newline-separated for read/delete, JSON for set)
   - Verify key count limits (max 100 operations)
   - Ensure proper JSON format for bulk set operations

## Version History

See `CHANGELOG.md` for detailed version history:

- **v1.2.0**: Bulk operations feature
- **v1.1.0**: Real-time statistics dashboard
- **v1.0.0**: Initial release with core CRUD operations

### Technical Implementation

#### Code Quality & Standards
- **ESLint Configuration**
  - Airbnb style guide integration
  - Custom rule overrides for server, client, and test environments
  - Maximum line length set to 200 characters
  - Comprehensive linting rules for code consistency

#### Testing Framework
- **Jest Test Suite**
  - Unit tests for all API endpoints
  - Mocked memcached client for isolated testing
  - Test environment isolation (port 3002)
  - Comprehensive error handling tests

#### Development Tools
- **Scripts**
  - `npm start` - Production server
  - `npm run dev` - Development with nodemon
  - `npm test` - Run test suite
  - `npm run test:watch` - Watch mode for tests
  - `npm run test:coverage` - Coverage report
  - `npm run lint` - Lint code
  - `npm run lint:fix` - Auto-fix linting issues

#### Configuration
- **Environment Variables**
  - `PORT` - Server port (default: 3000)
  - `MEMCACHE_HOST` - Memcache server (default: localhost:11211)
  - `NODE_ENV` - Environment mode

#### Dependencies
- **Production**
  - `express` - Web framework
  - `memcached` - Memcache client
  - `cors` - Cross-origin resource sharing
  - `dotenv` - Environment variable management

- **Development**
  - `eslint` - Code linting
  - `eslint-config-airbnb-base` - Airbnb style guide
  - `eslint-plugin-import` - Import/export linting
  - `jest` - Testing framework
  - `supertest` - HTTP testing
  - `nodemon` - Development server

### Metrics & Performance
- **Test Coverage**: 19 comprehensive tests
- **API Endpoints**: 5 endpoints with full CRUD operations
- **Error Handling**: Comprehensive error responses
- **Code Quality**: Zero linting errors, Airbnb standards

### Architecture
- **Frontend**: Vanilla JavaScript with Bootstrap
- **Backend**: Node.js with Express.js
- **Database**: Memcached for caching
- **Testing**: Jest with mocked dependencies
- **Linting**: ESLint with Airbnb configuration

### Security
- Input validation for all endpoints
- Error message sanitization
- CORS configuration for cross-origin requests
- Environment variable protection

### Scalability
- Modular code structure
- Separation of concerns
- Extensible API design
- Testable components

### Documentation
- Comprehensive README with setup instructions
- API endpoint documentation
- Testing guidelines
- Linting configuration guide

### Deployment
- Docker support with docker-compose
- Environment variable configuration
- Production-ready server setup
- Health check endpoints

### Future Enhancements
- Authentication system
- Rate limiting
- Advanced filtering
- Export/import functionality
- **NEW** Planned features:
  - Client-side tests with jsdom
  - Integration tests with real memcache
  - E2E tests with Playwright
  - Performance benchmarks
  - Load testing

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check `TESTING.md` and `LINTING.md`
- **Code Quality**: Follow the established patterns
- **Features**: See `CHANGELOG.md` for latest updates
