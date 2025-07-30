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

// Bulk operations endpoints
app.post('/api/bulk/read', (req, res) => {
  const { keys } = req.body;

  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Keys array is required and must not be empty',
    });
  }

  if (keys.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 100 keys allowed per bulk operation',
    });
  }

  const results = [];
  let completed = 0;
  let hasError = false;

  keys.forEach((key, index) => {
    memcached.get(key, (err, data) => {
      completed += 1;

      if (err) {
        hasError = true;
        results[index] = {
          key,
          success: false,
          error: err.message,
        };
      } else if (data === undefined) {
        results[index] = {
          key,
          success: false,
          error: 'Key not found',
        };
      } else {
        results[index] = {
          key,
          success: true,
          value: data,
          valueType: typeof data,
          valueSize: JSON.stringify(data).length,
        };
      }

      if (completed === keys.length) {
        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.length - successCount;

        res.json({
          success: true,
          message: `Bulk read completed: ${successCount} successful, ${failureCount} failed`,
          total: keys.length,
          successful: successCount,
          failed: failureCount,
          results,
          hasErrors: hasError,
        });
      }
    });
  });
});

app.post('/api/bulk/set', (req, res) => {
  const { operations } = req.body;

  if (!operations || !Array.isArray(operations) || operations.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Operations array is required and must not be empty',
    });
  }

  if (operations.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 100 operations allowed per bulk operation',
    });
  }

  // Validate each operation
  for (let i = 0; i < operations.length; i += 1) {
    const op = operations[i];
    if (!op.key || op.value === undefined || op.value === null) {
      return res.status(400).json({
        success: false,
        error: `Invalid operation at index ${i}: key and value are required`,
      });
    }
  }

  const results = [];
  let completed = 0;
  let hasError = false;

  operations.forEach((operation, index) => {
    const { key, value, ttl = 0 } = operation;
    const expirationTime = parseInt(ttl, 10) || 0;

    memcached.set(key, value, expirationTime, (err, result) => {
      completed += 1;

      if (err) {
        hasError = true;
        results[index] = {
          key,
          success: false,
          error: err.message,
        };
      } else if (result) {
        results[index] = {
          key,
          success: true,
          message: `Key '${key}' set successfully`,
          ttl: expirationTime,
        };
      } else {
        hasError = true;
        results[index] = {
          key,
          success: false,
          error: 'Failed to set key',
        };
      }

      if (completed === operations.length) {
        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.length - successCount;

        res.json({
          success: true,
          message: `Bulk set completed: ${successCount} successful, ${failureCount} failed`,
          total: operations.length,
          successful: successCount,
          failed: failureCount,
          results,
          hasErrors: hasError,
        });
      }
    });
  });
});

app.post('/api/bulk/delete', (req, res) => {
  const { keys } = req.body;

  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Keys array is required and must not be empty',
    });
  }

  if (keys.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 100 keys allowed per bulk operation',
    });
  }

  const results = [];
  let completed = 0;
  let hasError = false;

  keys.forEach((key, index) => {
    memcached.del(key, (err, result) => {
      completed += 1;

      if (err) {
        hasError = true;
        results[index] = {
          key,
          success: false,
          error: err.message,
        };
      } else if (result) {
        results[index] = {
          key,
          success: true,
          message: `Key '${key}' deleted successfully`,
        };
      } else {
        results[index] = {
          key,
          success: false,
          error: 'Key not found or already deleted',
        };
      }

      if (completed === keys.length) {
        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.length - successCount;

        res.json({
          success: true,
          message: `Bulk delete completed: ${successCount} successful, ${failureCount} failed`,
          total: keys.length,
          successful: successCount,
          failed: failureCount,
          results,
          hasErrors: hasError,
        });
      }
    });
  });
});

app.get('/api/bulk/export', (req, res) => {
  const { keys } = req.query;

  if (!keys) {
    return res.status(400).json({
      success: false,
      error: 'Keys parameter is required (comma-separated)',
    });
  }

  const keyArray = keys.split(',').map((k) => k.trim()).filter((k) => k);
  if (keyArray.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one valid key is required',
    });
  }

  if (keyArray.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 100 keys allowed per export',
    });
  }

  const results = [];
  let completed = 0;

  keyArray.forEach((key) => {
    memcached.get(key, (err, data) => {
      completed += 1;

      if (err || data === undefined) {
        results.push({
          key,
          success: false,
          error: err ? err.message : 'Key not found',
        });
      } else {
        results.push({
          key,
          success: true,
          value: data,
          valueType: typeof data,
          valueSize: JSON.stringify(data).length,
        });
      }

      if (completed === keyArray.length) {
        const exportData = {
          exportedAt: new Date().toISOString(),
          totalKeys: keyArray.length,
          successfulExports: results.filter((r) => r.success).length,
          failedExports: results.filter((r) => !r.success).length,
          data: results,
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="memcache-export-${Date.now()}.json"`);
        res.json(exportData);
      }
    });
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
