// History page functionality
import { showNotification } from './utils/notifications.js';

document.addEventListener('DOMContentLoaded', function () {
    initHistoryPage();
});

/**
 * Initialize the history page
 */
function initHistoryPage() {
    // Back button functionality
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function () {
            window.location.href = 'index.html';
        });
    }

    // Clear all history button
    const clearAllBtn = document.getElementById('clear-all-history-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function () {
            if (confirm('Are you sure you want to clear all request history? This cannot be undone.')) {
                localStorage.removeItem('requestHistory');
                loadHistoryData();
                // Keep this notification as it's a critical action
                showNotification('History cleared successfully', 'success');
            }
        });
    }

    // Search functionality
    const searchInput = document.getElementById('history-search');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            filterHistoryTable();
        });
    }

    // Method filter
    const methodFilter = document.getElementById('method-filter');
    if (methodFilter) {
        methodFilter.addEventListener('change', function () {
            filterHistoryTable();
        });
    }

    // Modal functionality
    const responseModal = document.getElementById('response-details-modal');
    const closeDetailsBtn = document.getElementById('close-details-btn');

    if (closeDetailsBtn && responseModal) {
        closeDetailsBtn.addEventListener('click', function () {
            responseModal.classList.remove('visible');
        });

        // Close when clicking outside of modal content
        responseModal.addEventListener('click', function (e) {
            if (e.target === responseModal) {
                responseModal.classList.remove('visible');
            }
        });
    }

    // Load history data
    loadHistoryData();
}

/**
 * Load history data from localStorage
 */
function loadHistoryData() {
    try {
        const historyData = localStorage.getItem('requestHistory');
        const historyTbody = document.getElementById('history-tbody');
        const noHistoryMessage = document.getElementById('no-history-message');

        if (historyData && historyTbody) {
            const history = JSON.parse(historyData);

            if (history.length === 0) {
                showNoHistoryMessage(historyTbody, noHistoryMessage);
                return;
            }

            renderHistoryTable(history, historyTbody);
            if (noHistoryMessage) noHistoryMessage.style.display = 'none';
        } else {
            showNoHistoryMessage(historyTbody, noHistoryMessage);
        }
    } catch (error) {
        console.error('Error loading history data:', error);
        // Only show notifications for errors
        showNotification('Failed to load history data', 'error');
    }
}

/**
 * Show message when no history is available
 */
function showNoHistoryMessage(historyTbody, noHistoryMessage) {
    if (historyTbody) historyTbody.innerHTML = '';
    if (noHistoryMessage) noHistoryMessage.style.display = 'flex';
}

/**
 * Render the history table
 * @param {Array} history - Array of history items
 * @param {HTMLElement} tableBody - Table body element
 */
function renderHistoryTable(history, tableBody) {
    tableBody.innerHTML = '';

    history.forEach(item => {
        // Ensure required properties are defined
        const method = item.method || 'GET';
        const url = item.url || 'Unknown URL';
        const status = item.status || '--';
        const time = item.time || '--';
        const timestamp = item.timestamp || new Date().toISOString();

        // Create row
        const row = document.createElement('tr');
        row.dataset.id = item.id;

        // Determine status class
        let statusClass = '';
        if (status >= 200 && status < 300) statusClass = 'status-2xx';
        else if (status >= 300 && status < 400) statusClass = 'status-3xx';
        else if (status >= 400 && status < 500) statusClass = 'status-4xx';
        else if (status >= 500) statusClass = 'status-5xx';

        // Format timestamp
        const date = new Date(timestamp);
        const timeStr = date.toLocaleTimeString();
        const dateStr = date.toLocaleDateString();

        // Create row HTML
        row.innerHTML = `
            <td class="method-cell">
                <span class="method-badge ${method.toLowerCase()}">${method}</span>
            </td>
            <td class="url-cell" title="${url}">${truncateText(url, 50)}</td>
            <td class="status-cell">
                <span class="status-code ${statusClass}">${status}</span>
            </td>
            <td class="time-cell">${time} ms</td>
            <td class="date-cell">${timeStr}<br>${dateStr}</td>
            <td class="actions-cell">
                <div class="history-actions">
                    <button class="history-action-btn view-details" title="View Details" data-id="${item.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="history-action-btn load-request" title="Load in Editor" data-id="${item.id}">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                    <button class="history-action-btn delete" title="Delete" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        // Add the row to the table
        tableBody.appendChild(row);
    });

    // Add event listeners to buttons
    addActionButtonListeners();
}

/**
 * Add event listeners to history action buttons
 */
function addActionButtonListeners() {
    // View details buttons
    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = this.dataset.id;
            showRequestDetails(id);
        });
    });

    // Load request buttons
    document.querySelectorAll('.load-request').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = this.dataset.id;
            loadRequestInEditor(id);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = this.dataset.id;
            deleteHistoryItem(id);
        });
    });
}

/**
 * Filter the history table based on search and method filter
 */
function filterHistoryTable() {
    const searchInput = document.getElementById('history-search');
    const methodFilter = document.getElementById('method-filter');
    const tbody = document.getElementById('history-tbody');
    const noHistoryMessage = document.getElementById('no-history-message');

    if (!searchInput || !methodFilter || !tbody) return;

    const searchValue = searchInput.value.toLowerCase();
    const methodValue = methodFilter.value;

    let visibleRows = 0;

    // Loop through all rows
    Array.from(tbody.rows).forEach(row => {
        const method = row.querySelector('.method-badge').textContent;
        const urlCell = row.querySelector('.url-cell');
        const url = urlCell ? urlCell.textContent : ''; // Ensure url is defined

        // Check if row matches filters
        const matchesMethod = !methodValue || method === methodValue;
        const matchesSearch = !searchValue || url.toLowerCase().includes(searchValue);

        // Show or hide row
        if (matchesMethod && matchesSearch) {
            row.style.display = '';
            visibleRows++;
        } else {
            row.style.display = 'none';
        }
    });

    // Show/hide no results message
    if (visibleRows === 0 && tbody.rows.length > 0) {
        // We have rows but none are visible - show filtered message
        if (noHistoryMessage) {
            noHistoryMessage.style.display = 'flex';
            noHistoryMessage.innerHTML = `
                <i class="fas fa-filter fa-3x"></i>
                <p>No requests match your filter criteria.</p>
            `;
        }
    } else {
        if (noHistoryMessage) {
            noHistoryMessage.style.display = 'none';
        }
    }
}

/**
 * Show request details in modal
 * @param {string} id - History item ID
 */
function showRequestDetails(id) {
    try {
        const historyData = localStorage.getItem('requestHistory');
        if (!historyData) return;

        const history = JSON.parse(historyData);
        const item = history.find(h => h.id.toString() === id.toString());

        if (!item) {
            console.error('History item not found:', id);
            return;
        }

        // Populate modal with details
        document.getElementById('detail-method').innerHTML = `<span class="method-badge ${item.method.toLowerCase()}">${item.method}</span>`;
        document.getElementById('detail-url').textContent = item.url;

        // Status with color
        let statusClass = '';
        if (item.status >= 200 && item.status < 300) statusClass = 'status-2xx';
        else if (item.status >= 300 && item.status < 400) statusClass = 'status-3xx';
        else if (item.status >= 400 && item.status < 500) statusClass = 'status-4xx';
        else if (item.status >= 500) statusClass = 'status-5xx';

        document.getElementById('detail-status').innerHTML = `<span class="status-code ${statusClass}">${item.status}</span>`;
        document.getElementById('detail-time').textContent = `${item.time || '--'} ms`;

        // Format headers and body
        const requestHeaders = item.request?.headers ? formatJSON(item.request.headers) : 'No headers';
        const requestBody = item.request?.body ? formatJSON(item.request.body) : 'No body';
        const responseHeaders = item.response?.headers ? formatJSON(item.response.headers) : 'No headers';
        const responseBody = item.response?.body ? formatJSON(item.response.body) : 'No body';

        document.getElementById('detail-request-headers').textContent = requestHeaders;
        document.getElementById('detail-request-body').textContent = requestBody;
        document.getElementById('detail-response-headers').textContent = responseHeaders;
        document.getElementById('detail-response-body').textContent = responseBody;

        // Setup load button
        const loadBtn = document.getElementById('load-request-btn');
        if (loadBtn) {
            loadBtn.onclick = function () {
                loadRequestInEditor(id);
            };
        }

        // Show modal
        const modal = document.getElementById('response-details-modal');
        if (modal) {
            modal.classList.add('visible');
        }

    } catch (error) {
        console.error('Error showing request details:', error);
        // Only show notifications for errors
        showNotification('Failed to load request details', 'error');
    }
}

/**
 * Load a request in the editor
 * @param {string} id - History item ID
 */
function loadRequestInEditor(id) {
    // Navigate to main page with history ID parameter
    window.location.href = `index.html?loadHistory=${id}`;
}

/**
 * Delete a history item
 * @param {string} id - History item ID
 */
function deleteHistoryItem(id) {
    if (!confirm('Are you sure you want to delete this request from history?')) {
        return;
    }

    try {
        const historyData = localStorage.getItem('requestHistory');
        if (!historyData) return;

        const history = JSON.parse(historyData);
        const updatedHistory = history.filter(item => item.id.toString() !== id.toString());

        localStorage.setItem('requestHistory', JSON.stringify(updatedHistory));

        // Refresh the table
        const historyTbody = document.getElementById('history-tbody');
        const noHistoryMessage = document.getElementById('no-history-message');

        if (updatedHistory.length === 0) {
            showNoHistoryMessage(historyTbody, noHistoryMessage);
        } else {
            renderHistoryTable(updatedHistory, historyTbody);
        }

        // Keep this notification since it's confirming a user-initiated delete action
        showNotification('History item deleted', 'success');

    } catch (error) {
        console.error('Error deleting history item:', error);
        showNotification('Failed to delete history item', 'error');
    }
}

/**
 * Format JSON for display
 * @param {Object|string} data - Data to format
 */
function formatJSON(data) {
    try {
        if (typeof data === 'string') {
            // Try to parse as JSON first
            try {
                const parsed = JSON.parse(data);
                return JSON.stringify(parsed, null, 2);
            } catch (e) {
                // If not valid JSON, return as is
                return data;
            }
        } else {
            return JSON.stringify(data, null, 2);
        }
    } catch (error) {
        return String(data);
    }
}

/**
 * Truncate text if too long
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
