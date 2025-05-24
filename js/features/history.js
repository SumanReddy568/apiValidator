import { showNotification } from '../utils/notifications.js';

/**
 * History functionality
 */

/**
 * Initialize the history panel functionality
 */
export function initHistoryPanel() {
    const historyToggle = document.getElementById('history-toggle');
    const historyPanel = document.querySelector('.history-panel');
    const clearHistoryBtn = document.getElementById('clear-history');
    const historyPageBtn = document.getElementById('history-page-btn');

    // Navigate to history page
    if (historyPageBtn) {
        historyPageBtn.addEventListener('click', function () {
            window.location.href = 'history.html';
        });
    }

    // Toggle history panel
    if (historyToggle && historyPanel) {
        historyToggle.addEventListener('click', function () {
            historyPanel.classList.toggle('open');
            // Update button icon based on state
            const icon = this.querySelector('i');
            if (historyPanel.classList.contains('open')) {
                icon.className = 'fas fa-times';
                this.title = 'Hide history';
            } else {
                icon.className = 'fas fa-history';
                this.title = 'Show history';
            }
        });
    }

    // Clear history functionality
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function () {
            if (confirm('Are you sure you want to clear all history?')) {
                localStorage.removeItem('requestHistory');
                document.getElementById('history-list').innerHTML = '';
                // Only notify for critical actions
                showNotification('History cleared', 'info');
            }
        });
    }

    // Close history panel when clicking elsewhere
    document.addEventListener('click', function (e) {
        if (historyPanel && historyPanel.classList.contains('open')) {
            // Check if click is outside the history panel and not on the toggle button
            if (!historyPanel.contains(e.target) && e.target !== historyToggle && !historyToggle.contains(e.target)) {
                historyPanel.classList.remove('open');
                if (historyToggle) {
                    const icon = historyToggle.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-history';
                        historyToggle.title = 'Show history';
                    }
                }
            }
        }
    });
}

/**
 * Load history from localStorage
 */
export function loadHistory() {
    try {
        const historyData = localStorage.getItem('requestHistory');
        if (historyData) {
            const history = JSON.parse(historyData);
            renderHistoryItems(history);
        }
    } catch (error) {
        console.error('Error loading history:', error);
        // Only show notification for errors
        showNotification('Failed to load history', 'error');
    }
}

/**
 * Add a new history item
 * @param {Object} request - The request details
 * @param {Object} response - The response details
 */
export function addToHistory(request, response) {
    try {
        // Get existing history or create a new array
        const historyData = localStorage.getItem('requestHistory');
        const history = historyData ? JSON.parse(historyData) : [];

        // Create new history entry
        const newEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            method: request.method,
            url: request.url,
            status: response.status,
            time: response.time,
            request: request,
            response: response
        };

        // Add to beginning of array and limit to 50 items
        history.unshift(newEntry);
        if (history.length > 50) {
            history.pop();
        }

        // Save to localStorage
        localStorage.setItem('requestHistory', JSON.stringify(history));

        // Update UI if on main page
        if (document.querySelector('.history-list')) {
            renderHistoryItems(history);
        }

        // Don't notify for regular history additions
    } catch (error) {
        console.error('Error saving history:', error);
        showNotification('Failed to save to history', 'error');
    }
}

/**
 * Render history items in the history panel
 * @param {Array} history - Array of history items
 */
function renderHistoryItems(historyData) {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    historyList.innerHTML = '';

    if (!Array.isArray(historyData) || historyData.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'no-history-message';
        emptyMessage.innerHTML = `
            <i class="fas fa-history fa-3x"></i>
            <p>No request history yet</p>
        `;
        historyList.appendChild(emptyMessage);
        return;
    }

    historyData.forEach(item => {
        if (!item || typeof item !== 'object') return;

        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const methodClass = item.method ? item.method.toString().toLowerCase() : 'unknown';

        historyItem.innerHTML = `
            <span class="history-method ${methodClass}">${item.method || 'UNKNOWN'}</span>
            <div class="history-url">${escapeHtml(item.url || '')}</div>
            <div class="history-time">${formatTimestamp(item.timestamp)}</div>
        `;

        historyList.appendChild(historyItem);
    });
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Helper function to format timestamp
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown time';
    try {
        const date = new Date(timestamp);
        return date.toLocaleString();
    } catch (e) {
        return 'Invalid date';
    }
}

/**
 * Load a history item into the UI
 * @param {Object} item - The history item to load
 */
function loadHistoryItem(item) {
    // Fill in the request method and URL
    const methodSelect = document.getElementById('request-method');
    const urlInput = document.getElementById('request-url');

    if (methodSelect && urlInput) {
        methodSelect.value = item.method;
        urlInput.value = item.url;
    }

    // Fill in other request details if available
    if (item.request) {
        // TODO: Populate headers, params, body, etc.

        // Keep this notification as it's an important user action
        showNotification('Request loaded from history', 'info');
    }

    // Close the history panel
    const historyPanel = document.querySelector('.history-panel');
    const historyToggle = document.getElementById('history-toggle');

    if (historyPanel) {
        historyPanel.classList.remove('open');
    }

    if (historyToggle) {
        const icon = historyToggle.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-history';
            historyToggle.title = 'Show history';
        }
    }
}

// Make addToHistory available globally
window.addToHistory = addToHistory;
