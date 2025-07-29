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
  console.error('Memcache error:', err);
  res.status(500).json({
    success: false,
    error: 'Memcache connection error',
    details: err.message
  });
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
      error: 'Key is required'
    });
  }

  memcached.get(key, (err, data) => {
    if (err) {
      return handleMemcacheError(err, res);
    }

    if (data === undefined) {
      return res.status(404).json({
        success: false,
        error: 'Key not found'
      });
    }

    // Get additional key information
    memcached.stats((statsErr, stats) => {
      if (statsErr) {
        console.warn('Could not retrieve stats:', statsErr);
      }

      const response = {
        success: true,
        key: key,
        value: data,
        valueType: typeof data,
        valueSize: JSON.stringify(data).length,
        timestamp: new Date().toISOString()
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
      error: 'Key is required'
    });
  }

  if (value === undefined || value === null) {
    return res.status(400).json({
      success: false,
      error: 'Value is required'
    });
  }

  // Default TTL to 0 (no expiration) if not provided
  const expirationTime = ttl ? parseInt(ttl) : 0;

  memcached.set(key, value, expirationTime, (err, result) => {
    if (err) {
      return handleMemcacheError(err, res);
    }

    if (result) {
      res.json({
        success: true,
        message: `Key '${key}' set successfully`,
        key: key,
        value: value,
        ttl: expirationTime,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to set key'
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
      error: 'Key is required'
    });
  }

  memcached.del(key, (err, result) => {
    if (err) {
      return handleMemcacheError(err, res);
    }

    if (result) {
      res.json({
        success: true,
        message: `Key '${key}' deleted successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Key not found or already deleted'
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
        details: err.message
      });
    }

    res.json({
      success: true,
      status: 'healthy',
      memcache: 'connected',
      stats: stats
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Memcache Editor running on http://localhost:${PORT}`);
  console.log(`Memcache host: ${process.env.MEMCACHE_HOST || 'localhost:11211'}`);
});
