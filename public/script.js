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
      bulk: 'Bulk Operations',
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

// Bulk Operations Display Functions
function displayBulkReadResult(data) {
  const container = document.getElementById('bulk-read-result');
  if (!container) return;

  const successCount = data.successful;
  const failureCount = data.failed;
  const totalCount = data.total;

  let resultHtml = `
    <div class="alert alert-${data.hasErrors ? 'warning' : 'success'}">
      <h6><i class="fas fa-${data.hasErrors ? 'exclamation-triangle' : 'check-circle'}"></i> Bulk Read Results</h6>
      <p><strong>Total:</strong> ${totalCount} keys</p>
      <p><strong>Successful:</strong> <span class="badge bg-success">${successCount}</span></p>
      <p><strong>Failed:</strong> <span class="badge bg-danger">${failureCount}</span></p>
    </div>
  `;

  if (data.results && data.results.length > 0) {
    resultHtml += '<div class="mt-3"><h6>Detailed Results:</h6>';
    data.results.forEach((result) => {
      const statusClass = result.success ? 'success' : 'danger';
      const statusIcon = result.success ? 'check-circle' : 'times-circle';

      resultHtml += `
        <div class="alert alert-${statusClass} alert-sm">
          <i class="fas fa-${statusIcon}"></i>
          <strong>${escapeHtml(result.key)}</strong>
          ${result.success
    ? `<br><small>Type: ${result.valueType}, Size: ${result.valueSize} bytes</small>`
    : `<br><small>Error: ${escapeHtml(result.error)}</small>`
}
        </div>
      `;
    });
    resultHtml += '</div>';
  }

  container.innerHTML = resultHtml;
}

function displayBulkSetResult(data) {
  const container = document.getElementById('bulk-set-result');
  if (!container) return;

  const successCount = data.successful;
  const failureCount = data.failed;
  const totalCount = data.total;

  let resultHtml = `
    <div class="alert alert-${data.hasErrors ? 'warning' : 'success'}">
      <h6><i class="fas fa-${data.hasErrors ? 'exclamation-triangle' : 'check-circle'}"></i> Bulk Set Results</h6>
      <p><strong>Total:</strong> ${totalCount} operations</p>
      <p><strong>Successful:</strong> <span class="badge bg-success">${successCount}</span></p>
      <p><strong>Failed:</strong> <span class="badge bg-danger">${failureCount}</span></p>
    </div>
  `;

  if (data.results && data.results.length > 0) {
    resultHtml += '<div class="mt-3"><h6>Detailed Results:</h6>';
    data.results.forEach((result) => {
      const statusClass = result.success ? 'success' : 'danger';
      const statusIcon = result.success ? 'check-circle' : 'times-circle';

      resultHtml += `
        <div class="alert alert-${statusClass} alert-sm">
          <i class="fas fa-${statusIcon}"></i>
          <strong>${escapeHtml(result.key)}</strong>
          ${result.success
    ? `<br><small>TTL: ${result.ttl || 0} seconds</small>`
    : `<br><small>Error: ${escapeHtml(result.error)}</small>`
}
        </div>
      `;
    });
    resultHtml += '</div>';
  }

  container.innerHTML = resultHtml;
}

function displayBulkDeleteResult(data) {
  const container = document.getElementById('bulk-delete-result');
  if (!container) return;

  const successCount = data.successful;
  const failureCount = data.failed;
  const totalCount = data.total;

  let resultHtml = `
    <div class="alert alert-${data.hasErrors ? 'warning' : 'success'}">
      <h6><i class="fas fa-${data.hasErrors ? 'exclamation-triangle' : 'check-circle'}"></i> Bulk Delete Results</h6>
      <p><strong>Total:</strong> ${totalCount} keys</p>
      <p><strong>Successfully Deleted:</strong> <span class="badge bg-success">${successCount}</span></p>
      <p><strong>Failed:</strong> <span class="badge bg-danger">${failureCount}</span></p>
    </div>
  `;

  if (data.results && data.results.length > 0) {
    resultHtml += '<div class="mt-3"><h6>Detailed Results:</h6>';
    data.results.forEach((result) => {
      const statusClass = result.success ? 'success' : 'danger';
      const statusIcon = result.success ? 'check-circle' : 'times-circle';

      resultHtml += `
        <div class="alert alert-${statusClass} alert-sm">
          <i class="fas fa-${statusIcon}"></i>
          <strong>${escapeHtml(result.key)}</strong>
          ${result.success
    ? '<br><small>Successfully deleted</small>'
    : `<br><small>Error: ${escapeHtml(result.error)}</small>`
}
        </div>
      `;
    });
    resultHtml += '</div>';
  }

  container.innerHTML = resultHtml;
}

// Bulk Operations Functions
async function handleBulkRead(event) {
  event.preventDefault();
  showLoading();

  try {
    const keysText = document.getElementById('bulk-read-keys').value.trim();
    if (!keysText) {
      throw new Error('Please enter at least one key');
    }

    const keys = keysText.split('\n')
      .map((key) => key.trim())
      .filter((key) => key.length > 0);

    if (keys.length === 0) {
      throw new Error('Please enter at least one valid key');
    }

    if (keys.length > 100) {
      throw new Error('Maximum 100 keys allowed per bulk operation');
    }

    const data = await apiCall('/api/bulk/read', {
      method: 'POST',
      body: JSON.stringify({ keys }),
    });

    displayBulkReadResult(data);
    addActivityLog(`Bulk read completed: ${data.successful} successful, ${data.failed} failed`, 'success');
  } catch (error) {
    showError('bulk-read-result', error.message);
    addActivityLog(`Bulk read failed: ${error.message}`, 'error');
  } finally {
    hideLoading();
  }
}

async function handleBulkSet(event) {
  event.preventDefault();
  showLoading();

  try {
    const operationsText = document.getElementById('bulk-set-data').value.trim();
    if (!operationsText) {
      throw new Error('Please enter operations data');
    }

    let operations;
    try {
      operations = JSON.parse(operationsText);
    } catch (parseError) {
      throw new Error('Invalid JSON format. Please check your input.');
    }

    if (!Array.isArray(operations)) {
      throw new Error('Operations must be an array');
    }

    if (operations.length === 0) {
      throw new Error('Please enter at least one operation');
    }

    if (operations.length > 100) {
      throw new Error('Maximum 100 operations allowed per bulk operation');
    }

    // Validate each operation
    operations.forEach((op, index) => {
      if (!op.key || op.value === undefined || op.value === null) {
        throw new Error(`Invalid operation at index ${index}: key and value are required`);
      }
    });

    const data = await apiCall('/api/bulk/set', {
      method: 'POST',
      body: JSON.stringify({ operations }),
    });

    displayBulkSetResult(data);
    addActivityLog(`Bulk set completed: ${data.successful} successful, ${data.failed} failed`, 'success');
  } catch (error) {
    showError('bulk-set-result', error.message);
    addActivityLog(`Bulk set failed: ${error.message}`, 'error');
  } finally {
    hideLoading();
  }
}

async function handleBulkDelete(event) {
  event.preventDefault();
  showLoading();

  try {
    const keysText = document.getElementById('bulk-delete-keys').value.trim();
    if (!keysText) {
      throw new Error('Please enter at least one key');
    }

    const keys = keysText.split('\n')
      .map((key) => key.trim())
      .filter((key) => key.length > 0);

    if (keys.length === 0) {
      throw new Error('Please enter at least one valid key');
    }

    if (keys.length > 100) {
      throw new Error('Maximum 100 keys allowed per bulk operation');
    }

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete ${keys.length} keys? This action cannot be undone.`)) {
      hideLoading();
      return;
    }

    const data = await apiCall('/api/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ keys }),
    });

    displayBulkDeleteResult(data);
    addActivityLog(`Bulk delete completed: ${data.successful} successful, ${data.failed} failed`, 'warning');
  } catch (error) {
    showError('bulk-delete-result', error.message);
    addActivityLog(`Bulk delete failed: ${error.message}`, 'error');
  } finally {
    hideLoading();
  }
}

async function handleBulkExport(event) {
  event.preventDefault();
  showLoading();

  try {
    const keysText = document.getElementById('bulk-export-keys').value.trim();
    if (!keysText) {
      throw new Error('Please enter at least one key');
    }

    const keys = keysText.split(',')
      .map((key) => key.trim())
      .filter((key) => key.length > 0);

    if (keys.length === 0) {
      throw new Error('Please enter at least one valid key');
    }

    if (keys.length > 100) {
      throw new Error('Maximum 100 keys allowed per export');
    }

    // Create download link
    const keysParam = encodeURIComponent(keys.join(','));
    const downloadUrl = `/api/bulk/export?keys=${keysParam}`;

    // Trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `memcache-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success message
    const container = document.getElementById('bulk-export-result');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          <strong>Export Successful!</strong><br>
          <small>Downloaded ${keys.length} keys as JSON file</small>
        </div>
      `;
    }

    addActivityLog(`Exported ${keys.length} keys to JSON file`, 'success');
  } catch (error) {
    showError('bulk-export-result', error.message);
    addActivityLog(`Export failed: ${error.message}`, 'error');
  } finally {
    hideLoading();
  }
}

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

  // Bulk operations form submissions
  const bulkReadForm = document.getElementById('bulk-read-form');
  if (bulkReadForm) {
    bulkReadForm.addEventListener('submit', handleBulkRead);
  }

  const bulkSetForm = document.getElementById('bulk-set-form');
  if (bulkSetForm) {
    bulkSetForm.addEventListener('submit', handleBulkSet);
  }

  const bulkDeleteForm = document.getElementById('bulk-delete-form');
  if (bulkDeleteForm) {
    bulkDeleteForm.addEventListener('submit', handleBulkDelete);
  }

  const bulkExportForm = document.getElementById('bulk-export-form');
  if (bulkExportForm) {
    bulkExportForm.addEventListener('submit', handleBulkExport);
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
