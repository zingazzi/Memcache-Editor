# Memcache Editor

A simple web-based management panel for Memcached key operations.

## Features

- **Read Keys**: Retrieve and display memcache key values
- **Set Keys**: Store new key-value pairs with optional TTL
- **Delete Keys**: Remove keys from memcache
- **Health Check**: Monitor memcache server status
- **Real-time Updates**: Live status monitoring
- **Responsive Design**: Works on desktop and mobile

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Vanilla JavaScript with Bootstrap
- **Cache**: Memcached
- **Code Quality**: ESLint with Airbnb configuration
- **Testing**: Jest with comprehensive test suite

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

- **Unit Tests**: Server-side API testing
- **Coverage**: 90.76% server code coverage
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

### GET /api/read/:key
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

### POST /api/set
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

### DELETE /api/delete/:key
Delete a key from memcache.

**Response:**
```json
{
  "success": true,
  "message": "Key 'example_key' deleted successfully"
}
```

### GET /api/health
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
│   ├── index.html         # Main HTML file
│   ├── script.js          # Client-side JavaScript
│   └── styles.css         # CSS styles
├── tests/                 # Test files
│   ├── setup.js          # Jest setup
│   ├── unit/             # Unit tests
│   └── README.md         # Test documentation
├── server.js             # Express server
├── package.json          # Dependencies and scripts
├── jest.config.js        # Jest configuration
├── .eslintrc.js         # ESLint configuration
├── .eslintignore        # ESLint ignore file
├── TESTING.md           # Testing documentation
├── LINTING.md           # Linting documentation
└── README.md            # This file
```

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
- **Coverage**: Maintain 80%+ test coverage
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

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check `TESTING.md` and `LINTING.md`
- **Code Quality**: Follow the established patterns
