// Memcache Editor JavaScript

// Global variables
let loadingModal;

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading() {
  if (loadingModal) {
    try {
      loadingModal.show();
      // Track when modal started
      const modalElement = document.getElementById('loadingModal');
      if (modalElement) {
        modalElement.setAttribute('data-start-time', Date.now().toString());
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to show loading modal:', error);
    }
  }
}

function hideLoading() {
  // Multiple attempts to hide the modal
  const hideModal = () => {
    if (loadingModal) {
      try {
        loadingModal.hide();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to hide loading modal:', error);
      }
    }

    // Always try manual fallback
    const modalElement = document.getElementById('loadingModal');
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      modalElement.setAttribute('aria-hidden', 'true');
      modalElement.removeAttribute('aria-modal');
      modalElement.removeAttribute('role');
      // Add hidden class as last resort
      modalElement.classList.add('hidden');
    }

    // Remove body classes
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Remove backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }

    // Remove any remaining modal-related elements
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
  };

  // Try immediately
  hideModal();

  // Try again after a short delay
  setTimeout(hideModal, 50);

  // Try one more time after a longer delay
  setTimeout(hideModal, 200);
}

function clearResults() {
  document.querySelectorAll('.result-container').forEach((container) => {
    container.innerHTML = '<p class="text-muted">Results cleared</p>';
  });
}

function showError(containerId, message) {
  const container = document.getElementById(containerId);

  const html = `
        <div class="error-result p-3">
            <h6><i class="fas fa-exclamation-circle text-danger"></i> Error</h6>
            <p class="mb-0">${escapeHtml(message)}</p>
        </div>
    `;

  container.innerHTML = html;
}

// Display functions
function displayReadResult(data) {
  const container = document.getElementById('read-result');

  const html = `
        <div class="success-result p-3">
            <h6><i class="fas fa-check-circle text-success"></i> Key Found</h6>
            <div class="key-info">
                <strong>Key:</strong> ${escapeHtml(data.key)}
            </div>
            <div class="key-info">
                <strong>Type:</strong> ${data.valueType}
            </div>
            <div class="key-info">
                <strong>Size:</strong> ${data.valueSize} bytes
            </div>
            <div class="key-info">
                <strong>Retrieved:</strong> ${new Date(data.timestamp).toLocaleString()}
            </div>
            <div class="mt-3">
                <strong>Value:</strong>
                <div class="value-display">
                    <pre>${escapeHtml(JSON.stringify(data.value, null, 2))}</pre>
                </div>
            </div>
        </div>
    `;

  container.innerHTML = html;
}

function displaySetResult(data) {
  const container = document.getElementById('set-result');

  const ttlText = data.ttl === 0 ? 'No expiration' : `${data.ttl} seconds`;
  const expirationText = data.ttl === 0 ? 'Never' : new Date(Date.now() + (data.ttl * 1000)).toLocaleString();

  const html = `
        <div class="success-result p-3">
            <h6><i class="fas fa-check-circle text-success"></i> Key Set Successfully</h6>
            <div class="key-info">
                <strong>Key:</strong> ${escapeHtml(data.key)}
            </div>
            <div class="key-info">
                <strong>TTL:</strong> ${ttlText}
            </div>
            <div class="key-info">
                <strong>Expires:</strong> ${expirationText}
            </div>
            <div class="key-info">
                <strong>Set at:</strong> ${new Date(data.timestamp).toLocaleString()}
            </div>
            <div class="mt-3">
                <strong>Value:</strong>
                <div class="value-display">
                    <pre>${escapeHtml(JSON.stringify(data.value, null, 2))}</pre>
                </div>
            </div>
        </div>
    `;

  container.innerHTML = html;
}

function displayDeleteResult(data) {
  const container = document.getElementById('delete-result');

  const html = `
        <div class="success-result p-3">
            <h6><i class="fas fa-check-circle text-success"></i> Success</h6>
            <p class="mb-0">${data.message}</p>
        </div>
    `;

  container.innerHTML = html;
}

function displayHealthResult(data) {
  const container = document.getElementById('health-result');

  const statusClass = data.success ? 'success-result' : 'error-result';
  const statusIcon = data.success ? 'fas fa-check-circle text-success' : 'fas fa-exclamation-circle text-danger';
  const statusText = data.success ? 'Healthy' : 'Unhealthy';

  let statsHtml = '';
  if (data.stats) {
    statsHtml = `
            <div class="mt-3">
                <strong>Memcache Statistics:</strong>
                <div class="value-display">
                    <pre>${escapeHtml(JSON.stringify(data.stats, null, 2))}</pre>
                </div>
            </div>
        `;
  }

  const html = `
        <div class="${statusClass} p-3">
            <h6><i class="${statusIcon}"></i> ${statusText}</h6>
            <p class="mb-0">
                <span class="status-indicator ${data.success ? 'status-healthy' : 'status-error'}"></span>
                Memcache: ${data.memcache || 'Unknown'}
            </p>
            ${statsHtml}
        </div>
    `;

  container.innerHTML = html;
}

// API functions
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    throw new Error(`API Error: ${error.message}`);
  }
}

// Read key function
async function handleReadKey(event) {
  event.preventDefault();

  const key = document.getElementById('read-key').value.trim();
  if (!key) {
    showError('read-result', 'Please enter a key name');
    return;
  }

  showLoading();

  try {
    const result = await apiCall(`/api/read/${encodeURIComponent(key)}`);
    displayReadResult(result);
  } catch (error) {
    showError('read-result', error.message);
  } finally {
    // Ensure loading modal is hidden
    setTimeout(() => {
      hideLoading();
    }, 100);
  }
}

// Set key function
async function handleSetKey(event) {
  event.preventDefault();

  const key = document.getElementById('set-key').value.trim();
  const valueInput = document.getElementById('set-value').value.trim();
  const ttl = document.getElementById('set-ttl').value.trim();

  if (!key) {
    showError('set-result', 'Please enter a key name');
    return;
  }

  if (!valueInput) {
    showError('set-result', 'Please enter a value');
    return;
  }

  // Try to parse as JSON, fallback to string
  let parsedValue = valueInput;
  try {
    parsedValue = JSON.parse(valueInput);
  } catch (e) {
    // If not valid JSON, use as string
    parsedValue = valueInput;
  }

  const payload = {
    key,
    value: parsedValue,
    ttl: ttl ? parseInt(ttl, 10) : 0,
  };

  showLoading();

  try {
    const result = await apiCall('/api/set', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    displaySetResult(result);
    // Clear form on success
    document.getElementById('set-key').value = '';
    document.getElementById('set-value').value = '';
    document.getElementById('set-ttl').value = '0';
  } catch (error) {
    showError('set-result', error.message);
  } finally {
    // Ensure loading modal is hidden
    setTimeout(() => {
      hideLoading();
    }, 100);
  }
}

// Delete key function
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
    const result = await apiCall(`/api/delete/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
    displayDeleteResult(result);
    document.getElementById('delete-key').value = '';
  } catch (error) {
    showError('delete-result', error.message);
  } finally {
    // Ensure loading modal is hidden
    setTimeout(() => {
      hideLoading();
    }, 100);
  }
}

// Health check function
async function checkHealth() {
  const resultContainer = document.getElementById('health-result');
  resultContainer.innerHTML = '<p class="text-muted">Checking health status...</p>';

  try {
    const result = await apiCall('/api/health');
    displayHealthResult(result);
  } catch (error) {
    showError('health-result', error.message);
  }
}

// Navigation functions
// eslint-disable-next-line no-unused-vars
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach((section) => {
    section.style.display = 'none';
  });

  // Show selected section
  document.getElementById(`${sectionName}-section`).style.display = 'block';

  // Update navigation
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.remove('active');
  });
  event.target.classList.add('active');

  // Update page title
  const titles = {
    read: 'Read Key',
    set: 'Set Key',
    delete: 'Delete Key',
    health: 'Health Check',
  };
  document.getElementById('page-title').textContent = titles[sectionName];
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize loading modal
  const modalElement = document.getElementById('loadingModal');
  if (modalElement && typeof window.bootstrap !== 'undefined') {
    loadingModal = new window.bootstrap.Modal(modalElement, {
      backdrop: 'static',
      keyboard: false,
    });
  }

  // Set up form event listeners
  document.getElementById('read-form').addEventListener('submit', handleReadKey);
  document.getElementById('set-form').addEventListener('submit', handleSetKey);
  document.getElementById('delete-form').addEventListener('submit', handleDeleteKey);

  // Global modal cleanup - hide modal if it's stuck
  setInterval(() => {
    const currentModalElement = document.getElementById('loadingModal');
    if (currentModalElement && currentModalElement.classList.contains('show')) {
      // Check if modal has been showing for more than 10 seconds
      const modalStartTime = currentModalElement.getAttribute('data-start-time');
      if (modalStartTime && (Date.now() - parseInt(modalStartTime, 10)) > 10000) {
        // eslint-disable-next-line no-console
        console.warn('Modal stuck for more than 10 seconds, forcing hide');
        hideLoading();
      }
    }
  }, 5000);

  // Initial health check
  checkHealth();
});

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

// Auto-refresh health status every 30 seconds
setInterval(() => {
  if (document.getElementById('health-section').style.display !== 'none') {
    checkHealth();
  }
}, 30000);
