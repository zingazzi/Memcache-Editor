// Memcache Editor JavaScript

// Global variables
let autoRefreshInterval;
let autoRefreshEnabled = false;

// Initialize loading modal
const modalElement = document.getElementById('loadingModal');
if (modalElement && typeof window.bootstrap !== 'undefined') {
  // eslint-disable-next-line no-unused-vars
  const loadingModal = new window.bootstrap.Modal(modalElement, {
    backdrop: 'static',
    keyboard: false,
  });
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading() {
  const currentModalElement = document.getElementById('loadingModal');
  if (currentModalElement) {
    currentModalElement.classList.add('show');
    currentModalElement.setAttribute('data-start-time', Date.now().toString());
  }
}

function hideLoading() {
  const currentModalElement = document.getElementById('loadingModal');
  if (currentModalElement) {
    currentModalElement.classList.remove('show');
  }
}

function clearResults() {
  const resultContainers = document.querySelectorAll('.result-container');
  resultContainers.forEach((el) => {
    // eslint-disable-next-line no-param-reassign
    el.innerHTML = '<p class="text-muted">Results cleared</p>';
  });
}

function showError(containerId, message) {
  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    const newContent = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Error:</strong> ${escapeHtml(message)}
      </div>
    `;
    containerElement.innerHTML = newContent;
  }
}

// API call function
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`API Error: ${error.message}`);
  }
}

// Display functions
function displayReadResult(data) {
  const container = document.getElementById('read-result');
  if (!container) return;

  const valueDisplay = typeof data.value === 'object'
    ? `<pre>${escapeHtml(JSON.stringify(data.value, null, 2))}</pre>`
    : `<code>${escapeHtml(data.value)}</code>`;

  container.innerHTML = `
    <div class="alert alert-success">
      <h6><i class="fas fa-check-circle"></i> Key Found</h6>
      <p><strong>Key:</strong> <code>${escapeHtml(data.key)}</code></p>
      <p><strong>Value Type:</strong> <span class="badge bg-info">${data.valueType}</span></p>
      <p><strong>Size:</strong> <span class="badge bg-secondary">${data.valueSize} bytes</span></p>
      <p><strong>Timestamp:</strong> <small>${new Date(data.timestamp).toLocaleString()}</small></p>
      <hr>
      <h6>Value:</h6>
      ${valueDisplay}
    </div>
  `;
}

function displaySetResult(data) {
  const container = document.getElementById('set-result');
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-success">
      <h6><i class="fas fa-check-circle"></i> Key Set Successfully</h6>
      <p><strong>Key:</strong> <code>${escapeHtml(data.key)}</code></p>
      <p><strong>Value:</strong> <code>${escapeHtml(data.value)}</code></p>
      <p><strong>TTL:</strong> <span class="badge bg-info">${data.ttl} seconds</span></p>
      <p><strong>Timestamp:</strong> <small>${new Date(data.timestamp).toLocaleString()}</small></p>
    </div>
  `;
}

function displayDeleteResult(data) {
  const container = document.getElementById('delete-result');
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-success">
      <h6><i class="fas fa-check-circle"></i> Success</h6>
      <p>${escapeHtml(data.message)}</p>
    </div>
  `;
}

function displayHealthResult(data) {
  const container = document.getElementById('health-result');
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-success">
      <h6><i class="fas fa-heartbeat"></i> Healthy</h6>
      <p><strong>Status:</strong> <span class="badge bg-success">${data.status}</span></p>
      <p><strong>Memcache:</strong> <span class="badge bg-info">${data.memcache}</span></p>
      <p><strong>Timestamp:</strong> <small>${new Date().toLocaleString()}</small></p>
    </div>
  `;
}

// Real-time stats functions
function addActivityLog(message, type = 'info') {
  const activityLog = document.getElementById('activity-log');
  if (!activityLog) return;

  const timestamp = new Date().toLocaleTimeString();
  let iconClass;
  if (type === 'error') {
    iconClass = 'fas fa-exclamation-triangle text-danger';
  } else if (type === 'success') {
    iconClass = 'fas fa-check-circle text-success';
  } else if (type === 'warning') {
    iconClass = 'fas fa-exclamation-triangle text-warning';
  } else {
    iconClass = 'fas fa-info-circle text-info';
  }

  const logEntry = document.createElement('div');
  logEntry.className = 'd-flex align-items-center mb-1';
  logEntry.innerHTML = `
    <i class="${iconClass} me-2"></i>
    <span class="flex-grow-1">${escapeHtml(message)}</span>
    <small class="text-muted">${timestamp}</small>
  `;

  activityLog.insertBefore(logEntry, activityLog.firstChild);

  // Keep only last 50 entries
  const entries = activityLog.querySelectorAll('div');
  if (entries.length > 50) {
    entries[entries.length - 1].remove();
  }
}

function displayStatsResult(data) {
  if (!data.success) {
    showError('stats-result', data.error);
    return;
  }

  // eslint-disable-next-line no-unused-vars
  const { summary } = data;
  const firstServer = Object.values(data.servers)[0];

  // Update connection status
  const connectionStatus = document.getElementById('connection-status');
  if (connectionStatus) {
    connectionStatus.textContent = 'Connected';
    connectionStatus.className = 'badge bg-success';
  }

  // Update memory usage
  const memoryUsage = document.getElementById('memory-usage');
  if (memoryUsage && firstServer) {
    const { memory } = firstServer;
    let progressBarClass;
    if (memory.usagePercent > 80) {
      progressBarClass = 'bg-danger';
    } else if (memory.usagePercent > 60) {
      progressBarClass = 'bg-warning';
    } else {
      progressBarClass = 'bg-success';
    }
    memoryUsage.innerHTML = `
      <div class="mb-1">
        <strong>${memory.formatted.used}</strong> / ${memory.formatted.total}
      </div>
      <div class="progress" style="height: 6px;">
        <div class="progress-bar ${progressBarClass}"
             style="width: ${memory.usagePercent}%"></div>
      </div>
      <small class="text-muted">${memory.usagePercent}% used</small>
    `;
  }

  // Update hit rate
  const hitRate = document.getElementById('hit-rate');
  if (hitRate && firstServer) {
    const { performance } = firstServer;
    const hitRatePercent = parseFloat(performance.hitRate);
    let hitRateProgressClass;
    if (hitRatePercent > 80) {
      hitRateProgressClass = 'bg-success';
    } else if (hitRatePercent > 50) {
      hitRateProgressClass = 'bg-warning';
    } else {
      hitRateProgressClass = 'bg-danger';
    }
    hitRate.innerHTML = `
      <div class="mb-1">
        <strong>${performance.hitRate}</strong>
      </div>
      <div class="progress" style="height: 6px;">
        <div class="progress-bar ${hitRateProgressClass}"
             style="width: ${hitRatePercent}%"></div>
      </div>
      <small class="text-muted">${performance.hits} hits, ${performance.misses} misses</small>
    `;
  }

  // Update total keys
  const totalKeys = document.getElementById('total-keys');
  if (totalKeys && firstServer) {
    totalKeys.innerHTML = `
      <div class="h4 mb-1">${firstServer.items.total.toLocaleString()}</div>
      <small class="text-muted">active keys</small>
    `;
  }

  // Update performance stats
  const performanceStats = document.getElementById('performance-stats');
  if (performanceStats && firstServer) {
    const perf = firstServer.performance;
    const { items } = firstServer;
    performanceStats.innerHTML = `
      <div class="row">
        <div class="col-6">
          <div class="d-flex justify-content-between">
            <span>Hit Rate:</span>
            <strong>${perf.hitRate}</strong>
          </div>
        </div>
        <div class="col-6">
          <div class="d-flex justify-content-between">
            <span>Evictions:</span>
            <strong>${perf.evictions.toLocaleString()}</strong>
          </div>
        </div>
      </div>
      <hr>
      <div class="row">
        <div class="col-6">
          <div class="d-flex justify-content-between">
            <span>Expired:</span>
            <strong>${perf.expired.toLocaleString()}</strong>
          </div>
        </div>
        <div class="col-6">
          <div class="d-flex justify-content-between">
            <span>Evicted:</span>
            <strong>${perf.evicted.toLocaleString()}</strong>
          </div>
        </div>
      </div>
      <hr>
      <div class="row">
        <div class="col-6">
          <div class="d-flex justify-content-between">
            <span>Total Keys:</span>
            <strong>${items.total.toLocaleString()}</strong>
          </div>
        </div>
        <div class="col-6">
          <div class="d-flex justify-content-between">
            <span>Connections:</span>
            <strong>${items.totalConnections}</strong>
          </div>
        </div>
      </div>
    `;
  }

  // Update server info
  const serverInfo = document.getElementById('server-info');
  if (serverInfo && firstServer) {
    const { connection } = firstServer;
    const { commands } = firstServer;
    serverInfo.innerHTML = `
      <div class="row">
        <div class="col-6">
          <div class="d-flex justify-content-between">
            <span>Server:</span>
            <strong>${connection.server}</strong>
          </div>
        </div>
        <div class="col-6">
          <div class="d-flex justify-content-between">
            <span>PID:</span>
            <strong>${connection.pid}</strong>
          </div>
        </div>
      </div>
      <hr>
      <div class="row">
        <div class="col-6">
          <div class="d-flex justify-content-between">
            <span>Uptime:</span>
            <strong>${Math.floor(connection.uptime / 3600)}h ${Math.floor((connection.uptime % 3600) / 60)}m</strong>
          </div>
        </div>
        <div class="col-6">
          <div class="d-flex justify-content-between">
            <span>Max Connections:</span>
            <strong>${firstServer.items.maxConnections}</strong>
          </div>
        </div>
      </div>
      <hr>
      <div class="row">
        <div class="col-6">
          <div class="d-flex justify-content-between">
            <span>GET Commands:</span>
            <strong>${commands.get.toLocaleString()}</strong>
          </div>
        </div>
        <div class="col-6">
          <div class="d-flex justify-content-between">
            <span>SET Commands:</span>
            <strong>${commands.set.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    `;
  }

  // Add to activity log
  addActivityLog('Stats refreshed', 'info');
}

function refreshStats() {
  showLoading();
  apiCall('/api/stats')
    .then((data) => {
      displayStatsResult(data);
      hideLoading();
    })
    .catch((error) => {
      showError('stats-result', error.message);
      hideLoading();
      addActivityLog(`Stats refresh failed: ${error.message}`, 'error');
    });
}

// eslint-disable-next-line no-unused-vars
function toggleAutoRefresh() {
  autoRefreshEnabled = !autoRefreshEnabled;
  const statusElement = document.getElementById('auto-refresh-status');
  const button = document.getElementById('auto-refresh-btn');

  if (autoRefreshEnabled) {
    statusElement.textContent = 'On';
    button.classList.remove('btn-outline-primary');
    button.classList.add('btn-primary');
    autoRefreshInterval = setInterval(refreshStats, 5000); // Refresh every 5 seconds
    addActivityLog('Auto-refresh enabled', 'success');
  } else {
    statusElement.textContent = 'Off';
    button.classList.remove('btn-primary');
    button.classList.add('btn-outline-primary');
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
    addActivityLog('Auto-refresh disabled', 'info');
  }
}

// Form handlers
async function handleReadKey(event) {
  event.preventDefault();
  const key = document.getElementById('read-key').value.trim();

  if (!key) {
    showError('read-result', 'Please enter a key name');
    return;
  }

  showLoading();
  try {
    const data = await apiCall(`/api/read/${encodeURIComponent(key)}`);
    displayReadResult(data);
  } catch (error) {
    showError('read-result', error.message);
  } finally {
    hideLoading();
  }
}

async function handleSetKey(event) {
  event.preventDefault();
  const key = document.getElementById('set-key').value.trim();
  const value = document.getElementById('set-value').value.trim();
  const ttl = document.getElementById('set-ttl').value;

  if (!key) {
    showError('set-result', 'Please enter a key name');
    return;
  }

  if (!value) {
    showError('set-result', 'Please enter a value');
    return;
  }

  let parsedValue = value;
  try {
    // Try to parse as JSON if it looks like JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      parsedValue = JSON.parse(value);
    }
  } catch (e) {
    // If JSON parsing fails, use the original string value
  }

  showLoading();
  try {
    const data = await apiCall('/api/set', {
      method: 'POST',
      body: JSON.stringify({
        key,
        value: parsedValue,
        ttl: parseInt(ttl, 10) || 0,
      }),
    });
    displaySetResult(data);
  } catch (error) {
    showError('set-result', error.message);
  } finally {
    hideLoading();
  }
}

async function handleDeleteKey(event) {
  event.preventDefault();
  const key = document.getElementById('delete-key').value.trim();

  if (!key) {
    showError('delete-result', 'Please enter a key name');
    return;
  }

  // Confirm deletion
  // eslint-disable-next-line no-alert
  if (!window.confirm(`Are you sure you want to delete the key "${key}"?`)) {
    return;
  }

  showLoading();
  try {
    const data = await apiCall(`/api/delete/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
    displayDeleteResult(data);
  } catch (error) {
    showError('delete-result', error.message);
  } finally {
    hideLoading();
  }
}

// eslint-disable-next-line no-unused-vars
async function checkHealth() {
  showLoading();
  try {
    const data = await apiCall('/api/health');
    displayHealthResult(data);
  } catch (error) {
    showError('health-result', error.message);
  } finally {
    hideLoading();
  }
}

// Navigation function
// eslint-disable-next-line no-unused-vars
function showSection(section) {
  // Hide all sections
  const sections = document.querySelectorAll('.content-section');
  sections.forEach((sectionElement) => {
    // eslint-disable-next-line no-param-reassign
    sectionElement.style.display = 'none';
  });

  // Show selected section
  const selectedSection = document.getElementById(`${section}-section`);
  if (selectedSection) {
    selectedSection.style.display = 'block';
  }

  // Update navigation
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.classList.remove('active');
  });

  // Find and activate the correct nav link
  const activeLink = Array.from(navLinks).find((link) => link.textContent.toLowerCase().includes(section));
  if (activeLink) {
    activeLink.classList.add('active');
  }

  // Update page title
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    const titles = {
      read: 'Read Key',
      set: 'Set Key',
      delete: 'Delete Key',
      stats: 'Real-time Stats',
      health: 'Health Check',
    };
    pageTitle.textContent = titles[section] || 'Memcache Editor';
  }

  // Auto-load stats when stats section is shown
  if (section === 'stats') {
    refreshStats();
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
  // Ctrl/Cmd + Enter to submit forms
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    const { activeElement } = document;
    if (activeElement && activeElement.form) {
      activeElement.form.dispatchEvent(new Event('submit'));
    }
  }

  // Escape to clear results
  if (event.key === 'Escape') {
    clearResults();
  }
});

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Form submissions
  const readForm = document.getElementById('read-form');
  if (readForm) {
    readForm.addEventListener('submit', handleReadKey);
  }

  const setForm = document.getElementById('set-form');
  if (setForm) {
    setForm.addEventListener('submit', handleSetKey);
  }

  const deleteForm = document.getElementById('delete-form');
  if (deleteForm) {
    deleteForm.addEventListener('submit', handleDeleteKey);
  }

  // Auto-refresh health status every 30 seconds
  setInterval(() => {
    const currentModalElement = document.getElementById('loadingModal');
    if (currentModalElement && currentModalElement.classList.contains('show')) {
      const modalStartTime = currentModalElement.getAttribute('data-start-time');
      if (modalStartTime && (Date.now() - parseInt(modalStartTime, 10)) > 10000) {
        // eslint-disable-next-line no-console
        console.warn('Modal stuck for more than 10 seconds, forcing hide');
        hideLoading();
      }
    }
  }, 5000);
});
