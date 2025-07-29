# Memcache Editor

A simple, lightweight web-based panel for managing Memcache keys. This tool provides an intuitive interface to read and delete memcache keys with detailed information display.

## Features

- **Read Keys**: Retrieve memcache keys with detailed information (value, type, size, timestamp)
- **Set Keys**: Create or update memcache keys with custom values and TTL (Time To Live)
- **Delete Keys**: Safely delete memcache keys with confirmation
- **Health Check**: Monitor memcache connection status and statistics
- **Modern UI**: Responsive design with Bootstrap 5 and Font Awesome icons
- **Real-time Updates**: Auto-refresh health status
- **Error Handling**: Comprehensive error handling and user feedback

## Technology Stack

- **Backend**: Node.js + Express.js
- **Memcache Client**: memcached npm package
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome 6
- **Containerization**: Docker & Docker Compose
- **Memcache Server**: memcached 1.6-alpine

## Prerequisites

### For Docker Compose (Recommended)
- Docker
- Docker Compose

### For Manual Installation
- Node.js (v14 or higher)
- Memcache server running
- npm or yarn package manager

## Quick Start with Docker Compose (Recommended)

The easiest way to get started is using Docker Compose, which includes both the memcache server and the editor application.

### Why Docker Compose?

✅ **Zero Configuration**: No need to install Node.js or memcache separately
✅ **Isolated Environment**: Everything runs in containers
✅ **Consistent Setup**: Works the same on any machine
✅ **Easy Deployment**: One command to start everything
✅ **Built-in Memcache**: No need to install/configure memcache server
✅ **Production Ready**: Same setup for development and production

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd memcacheEditor
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

4. **Stop the application**
   ```bash
   docker-compose down
   ```

## Manual Installation

If you prefer to run without Docker or need to connect to an existing memcache server:

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd memcacheEditor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your memcache configuration:
   ```env
   PORT=3000
   MEMCACHE_HOST=localhost:11211
   ```

4. **Start the application**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Usage

### Reading Keys
1. Navigate to the "Read Key" section
2. Enter the memcache key name
3. Click "Read Key" or press Ctrl+Enter
4. View the key's value and detailed information

### Setting Keys
1. Navigate to the "Set Key" section
2. Enter the memcache key name
3. Enter the value (supports text, numbers, or JSON objects)
4. Set TTL (Time To Live) in seconds (0 = no expiration)
5. Click "Set Key" or press Ctrl+Enter

### Deleting Keys
1. Navigate to the "Delete Key" section
2. Enter the memcache key name to delete
3. Click "Delete Key" or press Ctrl+Enter
4. Confirm the deletion when prompted

### Health Check
1. Navigate to the "Health Check" section
2. Click "Check Health" to view memcache status
3. Health status auto-refreshes every 30 seconds

## API Endpoints

### GET /api/read/:key
Retrieve a memcache key and its information.

**Response:**
```json
{
  "success": true,
  "key": "example_key",
  "value": "example_value",
  "valueType": "string",
  "valueSize": 13,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### POST /api/set
Set a memcache key with value and optional TTL.

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
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### DELETE /api/delete/:key
Delete a memcache key.

**Response:**
```json
{
  "success": true,
  "message": "Key 'example_key' deleted successfully"
}
```

### GET /api/health
Check memcache connection health.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "memcache": "connected",
  "stats": { ... }
}
```

## Configuration

### Docker Compose Configuration

The `docker-compose.yml` file includes:
- **memcache-editor**: The main application
- **memcache**: Memcache server (1.6-alpine)
- **Network**: Isolated network for services
- **Volumes**: Log persistence

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `MEMCACHE_HOST` | `memcache:11211` | Memcache server address (Docker) |
| `MEMCACHE_TIMEOUT` | `5000` | Connection timeout (ms) |
| `DEBUG` | `false` | Enable debug logging |

### Multiple Memcache Servers

To connect to multiple memcache servers, use comma-separated values:
```env
MEMCACHE_HOST=server1:11211,server2:11211,server3:11211
```

### Customizing Docker Compose

You can modify the `docker-compose.yml` file to:
- Change ports: `"8080:3000"` for different external port
- Add environment variables
- Modify memcache memory: `memcached -m 256` for 256MB
- Add persistent volumes for memcache data

## Deployment

### Docker Compose (Recommended)

#### Local Development
```bash
# Start with auto-reload for development
docker-compose -f docker-compose.dev.yml up -d

# Or use the standard compose file
docker-compose up -d
```

#### Production Deployment

1. **Build and start the application**
   ```bash
   docker-compose up -d --build
   ```

2. **View logs**
   ```bash
   docker-compose logs -f memcache-editor
   ```

3. **Stop the application**
   ```bash
   docker-compose down
   ```

### Manual Deployment

#### Local Development
```bash
npm run dev
```

#### Production Deployment

1. **Install dependencies**
   ```bash
   npm install --production
   ```

2. **Set environment variables**
   ```bash
   export PORT=3000
   export MEMCACHE_HOST=your-memcache-server:11211
   ```

3. **Start the application**
   ```bash
   npm start
   ```

### EC2 Deployment

#### Option 1: Docker Compose (Recommended)

1. **Install Docker on EC2**
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose
   sudo usermod -aG docker $USER
   # Log out and back in for group changes to take effect
   ```

2. **Clone and deploy**
   ```bash
   git clone <repository-url>
   cd memcacheEditor
   docker-compose up -d
   ```

3. **Configure firewall**
   ```bash
   sudo ufw allow 3000
   sudo ufw allow 11211
   ```

#### Option 2: Manual Installation

1. **Install Node.js on EC2**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone and setup the application**
   ```bash
   git clone <repository-url>
   cd memcacheEditor
   npm install --production
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your memcache server details
   ```

4. **Run with PM2 (recommended)**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "memcache-editor"
   pm2 startup
   pm2 save
   ```

5. **Configure firewall**
   ```bash
   sudo ufw allow 3000
   ```

## Security Considerations

- **Network Security**: Ensure memcache server is not exposed to public internet
- **Authentication**: Consider adding authentication for production use
- **HTTPS**: Use HTTPS in production environments
- **Firewall**: Configure firewall rules appropriately

## Troubleshooting

### Docker Compose Issues

1. **Container won't start**
   ```bash
   # Check logs
   docker-compose logs memcache-editor
   docker-compose logs memcache

   # Restart services
   docker-compose restart
   ```

2. **Port already in use**
   ```bash
   # Check what's using the port
   sudo lsof -i :3000

   # Or change the port in docker-compose.yml
   ports:
     - "8080:3000"  # Use port 8080 instead
   ```

3. **Memcache connection issues**
   ```bash
   # Check if memcache container is running
   docker-compose ps

   # Test memcache connection
   docker-compose exec memcache-editor node -e "
   const Memcached = require('memcached');
   const mc = new Memcached('memcache:11211');
   mc.get('test', console.log);
   "
   ```

### Manual Installation Issues

1. **Connection Refused**
   - Verify memcache server is running
   - Check `MEMCACHE_HOST` configuration
   - Ensure firewall allows connections

2. **Key Not Found**
   - Verify the key exists in memcache
   - Check key name spelling
   - Ensure memcache server has the key

3. **Port Already in Use**
   - Change `PORT` in environment variables
   - Kill existing process using the port

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=true
```

### Useful Docker Commands

```bash
# View all containers
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# Stop all services
docker-compose down

# Remove volumes (clears memcache data)
docker-compose down -v
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Create an issue in the repository
