const express = require('express');
const Memcached = require('memcached');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Memcache configuration
const memcached = new Memcached(process.env.MEMCACHE_HOST || 'localhost:11211');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Utility function to handle memcache errors
const handleMemcacheError = (err, res) => {
  // eslint-disable-next-line no-console
  console.error('Memcache error:', err);
  res.status(500).json({
    success: false,
    error: 'Memcache connection error',
    details: err.message,
  });
};

// Utility function to format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`;
};

// Utility function to calculate hit rate
const calculateHitRate = (hits, misses) => {
  const total = hits + misses;
  if (total === 0) return '0%';
  return `${((hits / total) * 100).toFixed(2)}%`;
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Read key endpoint
app.get('/api/read/:key', (req, res) => {
  const { key } = req.params;

  if (!key) {
    return res.status(400).json({
      success: false,
      error: 'Key is required',
    });
  }

  memcached.get(key, (err, data) => {
    if (err) {
      return handleMemcacheError(err, res);
    }

    if (data === undefined) {
      return res.status(404).json({
        success: false,
        error: 'Key not found',
      });
    }

    // Get additional key information
    memcached.stats((statsErr, _stats) => {
      if (statsErr) {
        // eslint-disable-next-line no-console
        console.warn('Could not retrieve stats:', statsErr);
      }

      const response = {
        success: true,
        key,
        value: data,
        valueType: typeof data,
        valueSize: JSON.stringify(data).length,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    });
  });
});

// Set key endpoint
app.post('/api/set', (req, res) => {
  const { key, value, ttl } = req.body;

  if (!key) {
    return res.status(400).json({
      success: false,
      error: 'Key is required',
    });
  }

  if (value === undefined || value === null) {
    return res.status(400).json({
      success: false,
      error: 'Value is required',
    });
  }

  // Default TTL to 0 (no expiration) if not provided
  const expirationTime = ttl ? parseInt(ttl, 10) : 0;

  memcached.set(key, value, expirationTime, (err, result) => {
    if (err) {
      return handleMemcacheError(err, res);
    }

    if (result) {
      res.json({
        success: true,
        message: `Key '${key}' set successfully`,
        key,
        value,
        ttl: expirationTime,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to set key',
      });
    }
  });
});

// Delete key endpoint
app.delete('/api/delete/:key', (req, res) => {
  const { key } = req.params;

  if (!key) {
    return res.status(400).json({
      success: false,
      error: 'Key is required',
    });
  }

  memcached.del(key, (err, result) => {
    if (err) {
      return handleMemcacheError(err, res);
    }

    if (result) {
      res.json({
        success: true,
        message: `Key '${key}' deleted successfully`,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Key not found or already deleted',
      });
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  memcached.stats((err, stats) => {
    if (err) {
      return res.status(503).json({
        success: false,
        error: 'Memcache not available',
        details: err.message,
      });
    }

    res.json({
      success: true,
      status: 'healthy',
      memcache: 'connected',
      stats,
    });
  });
});

// Detailed statistics endpoint
app.get('/api/stats', (req, res) => {
  memcached.stats((err, stats) => {
    if (err) {
      return res.status(503).json({
        success: false,
        error: 'Memcache not available',
        details: err.message,
      });
    }

    try {
      // Parse and format statistics
      const parsedStats = {};
      Object.keys(stats).forEach((server) => {
        const serverStats = stats[server];
        const serverStatLimitMaxBytes = parseInt(serverStats.limit_maxbytes || 0, 10);
        const serverStatBytes = parseInt(serverStats.bytes || 0, 10);
        parsedStats[server] = {
          // Connection info
          connection: {
            status: 'connected',
            server: serverStats.server || server,
            pid: serverStats.pid || 'N/A',
            uptime: serverStats.uptime || 0,
          },

          // Memory usage
          memory: {
            total: parseInt(serverStats.limit_maxbytes || 0, 10),
            used: parseInt(serverStats.bytes || 0, 10),
            free: serverStatLimitMaxBytes - serverStatBytes,
            formatted: {
              total: formatBytes(parseInt(serverStats.limit_maxbytes || 0, 10)),
              used: formatBytes(parseInt(serverStats.bytes || 0, 10)),
              free: formatBytes(serverStatLimitMaxBytes - serverStatBytes),
            },
            usagePercent: serverStats.limit_maxbytes
              ? ((parseInt(serverStats.bytes || 0, 10) / parseInt(serverStats.limit_maxbytes, 10)) * 100).toFixed(2) : '0',
          },

          // Performance metrics
          performance: {
            hits: parseInt(serverStats.get_hits || 0, 10),
            misses: parseInt(serverStats.get_misses || 0, 10),
            hitRate: calculateHitRate(
              parseInt(serverStats.get_hits || 0, 10),
              parseInt(serverStats.get_misses || 0, 10),
            ),
            evictions: parseInt(serverStats.evictions || 0, 10),
            expired: parseInt(serverStats.expired_unfetched || 0, 10),
            evicted: parseInt(serverStats.evicted_unfetched || 0, 10),
          },

          // Item statistics
          items: {
            total: parseInt(serverStats.curr_items || 0, 10),
            totalConnections: parseInt(serverStats.curr_connections || 0, 10),
            maxConnections: parseInt(serverStats.connection_structures || 0, 10),
          },

          // Command statistics
          commands: {
            get: parseInt(serverStats.cmd_get || 0, 10),
            set: parseInt(serverStats.cmd_set || 0, 10),
            delete: parseInt(serverStats.cmd_delete || 0, 10),
            flush: parseInt(serverStats.cmd_flush || 0, 10),
          },

          // Raw stats for advanced users
          raw: serverStats,
        };
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        servers: parsedStats,
        summary: {
          totalServers: Object.keys(parsedStats).length,
          totalMemory: Object.values(parsedStats).reduce((sum, server) => sum + server.memory.total, 0),
          usedMemory: Object.values(parsedStats).reduce((sum, server) => sum + server.memory.used, 0),
          totalKeys: Object.values(parsedStats).reduce((sum, server) => sum + server.items.total, 0),
          totalHits: Object.values(parsedStats).reduce((sum, server) => sum + server.performance.hits, 0),
          totalMisses: Object.values(parsedStats).reduce((sum, server) => sum + server.performance.misses, 0),
        },
      });
    } catch (parseError) {
      // eslint-disable-next-line no-console
      console.error('Error parsing stats:', parseError);
      res.status(500).json({
        success: false,
        error: 'Error parsing statistics',
        details: parseError.message,
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server only if not in test environment
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Memcache Editor running on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`Memcache host: ${process.env.MEMCACHE_HOST || 'localhost:11211'}`);
  });
}

// Export for testing
module.exports = { app, server };
