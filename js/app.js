// Main application entry point
import { initFormatToggle, formatResponse } from './ui/formatToggle.js';
import { initTabSwitching } from './ui/tabSwitching.js';
import { initHeaderFunctionality } from './ui/headers.js';
import { initParameterFunctionality } from './ui/parameters.js';
import { initAuthFunctionality } from './ui/auth.js';
import { initFilterFunctionality, updateFilterFieldOptions } from './ui/filters.js';
import { initHistoryPanel, loadHistory } from './features/history.js';
import { initCurlImport } from './features/curlImport.js';
import { initSendRequest } from './features/sendRequest.js';
import { initPreview, updatePreview } from './ui/preview.js';
import { initSearch } from './ui/search.js';
import { showNotification } from './utils/notifications.js'; // Add this import
import { applyAllFilters } from './ui/filterModal.js';
import { setFilterData } from './ui/filterModal.js';
import { initSmartFilters, setSmartFilterData } from './ui/smartFilters.js';

// Global state (accessible to all modules)
window.appState = {
    lastResponse: null,
    prettyPrintEnabled: true
};

// Make updatePreview and applyAllFilters globally accessible
window.updatePreview = updatePreview;
window.applyAllFilters = applyAllFilters;

// Make functions globally accessible
window.setSmartFilterData = setSmartFilterData;
window.updateFilterFieldOptions = updateFilterFieldOptions;

function initSettings() {
    // Get modal elements
    const settingsBtn = document.getElementById('settings-btn');
    const modal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettingsModal');
    const cancelBtn = document.getElementById('cancelSettingsBtn');
    const saveBtn = document.getElementById('saveSettingsBtn');
    const defaultHeadersInput = document.getElementById('defaultHeadersInput');

    // Verify elements exist
    if (!settingsBtn || !modal || !closeBtn || !cancelBtn || !saveBtn || !defaultHeadersInput) {
        console.error('Settings modal elements not found');
        return;
    }

    // Load saved headers
    try {
        const savedHeaders = localStorage.getItem('defaultHeaders');
        if (savedHeaders) {
            window.appState.defaultHeaders = JSON.parse(savedHeaders);
            defaultHeadersInput.value = savedHeaders;
            console.log('Loaded default headers:', window.appState.defaultHeaders);
        }
    } catch (e) {
        console.error('Error loading headers:', e);
    }

    // Open modal
    settingsBtn.onclick = function () {
        console.log('Opening settings modal');
        modal.style.display = "block";
    }

    // Close modal functions
    function closeModal() {
        console.log('Closing settings modal');
        modal.style.display = "none";
    }

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    // Save settings
    saveBtn.onclick = function () {
        try {
            const headerValue = defaultHeadersInput.value || '{}';
            const parsedHeaders = JSON.parse(headerValue);
            window.appState.defaultHeaders = parsedHeaders;
            localStorage.setItem('defaultHeaders', headerValue);
            console.log('Saved default headers:', parsedHeaders);
            closeModal();
        } catch (e) {
            console.error('Error saving headers:', e);
            alert('Invalid JSON format. Please check your input.');
        }
    }

    // Click outside to close
    window.onclick = function (event) {
        if (event.target == modal) {
            closeModal();
        }
    }
}

// Handle docs dropdown
document.addEventListener('DOMContentLoaded', function () {
    const docsBtn = document.getElementById('docs-btn');
    const docsContent = document.querySelector('.docs-content');

    if (docsBtn && docsContent) {
        docsBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            docsContent.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!docsContent.contains(e.target) && e.target !== docsBtn) {
                docsContent.classList.remove('show');
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all modules
    initFormatToggle();
    initTabSwitching();
    initHeaderFunctionality();
    initParameterFunctionality();
    initAuthFunctionality();
    initFilterFunctionality();
    initHistoryPanel();
    initCurlImport();
    initSendRequest();
    initPreview();
    initSettings();
    initSearch();

    // Initialize smart filters
    initSmartFilters();

    // Load history from localStorage
    loadHistory();

    // Check for loadHistory parameter
    const urlParams = new URLSearchParams(window.location.search);
    const historyId = urlParams.get('loadHistory');
    if (historyId) {
        loadHistoryItemById(historyId);
    }

    // Remove welcome notification
    // showNotification('Welcome to API Validator', 'info', 5000);
});

/**
 * Load a history item by ID
 */
function loadHistoryItemById(id) {
    try {
        const historyData = localStorage.getItem('requestHistory');
        if (!historyData) return;

        const history = JSON.parse(historyData);
        const item = history.find(h => h.id.toString() === id.toString());

        if (!item) {
            console.error('History item not found:', id);
            return;
        }

        // Set method and URL
        document.getElementById('request-method').value = item.method;
        document.getElementById('request-url').value = item.url;

        // TODO: Set headers, params, body, etc.

        // Notify user
        if (window.showNotification) {
            window.showNotification('Request loaded from history', 'info');
        }

    } catch (error) {
        console.error('Error loading history item:', error);
    }
}

// Filter management
document.addEventListener('DOMContentLoaded', function () {
    const filterType = document.getElementById('filter-type');
    const filterOperator = document.getElementById('filter-operator');
    const filterValue = document.getElementById('filter-value');
    const applyFilterBtn = document.getElementById('apply-filter');
    const activeFiltersContainer = document.getElementById('active-filters');
    const clearAllFiltersBtn = document.getElementById('clear-all-filters');

    // Apply a filter
    applyFilterBtn.addEventListener('click', function () {
        if (filterType.value && filterValue.value) {
            addFilter(filterType.value, filterOperator.value, filterValue.value);
            // Reset filter input
            filterValue.value = '';
            applyFilters(); // Function to apply all filters to the response data
        }
    });

    // Clear all filters
    clearAllFiltersBtn.addEventListener('click', function () {
        activeFiltersContainer.innerHTML = '';
        clearAllFiltersBtn.style.display = 'none';
        applyFilters(); // Reset to show all data
    });

    function addFilter(field, operator, value) {
        const filterId = `filter-${Date.now()}`;
        const filterBadge = document.createElement('div');
        filterBadge.className = 'filter-badge';
        filterBadge.id = filterId;

        // Convert operator value to readable text
        let operatorText;
        switch (operator) {
            case 'match': operatorText = 'equals'; break;
            case 'not_match': operatorText = 'not equals'; break;
            case 'contains': operatorText = 'contains'; break;
            case 'greater': operatorText = 'greater than'; break;
            case 'less': operatorText = 'less than'; break;
            default: operatorText = operator;
        }

        filterBadge.innerHTML = `
            <span class="filter-text">${field} <strong>${operatorText}</strong> "${value}"</span>
            <button class="remove-filter" data-filter-id="${filterId}">
                <i class="fas fa-times"></i>
            </button>
        `;

        activeFiltersContainer.appendChild(filterBadge);
        clearAllFiltersBtn.style.display = 'block';

        // Add event listener to remove button
        const removeBtn = filterBadge.querySelector('.remove-filter');
        removeBtn.addEventListener('click', function () {
            const filterId = this.getAttribute('data-filter-id');
            document.getElementById(filterId).remove();

            if (activeFiltersContainer.children.length === 0) {
                clearAllFiltersBtn.style.display = 'none';
            }

            applyFilters(); // Re-apply remaining filters
        });
    }

    function applyFilters() {
        // Get all active filters
        const activeFilters = Array.from(activeFiltersContainer.children).map(filter => {
            const filterText = filter.querySelector('.filter-text').textContent;

            // Parse the filter text to extract field, operator, and value
            // Match patterns like "field operator "value""
            const regex = /(.+?)\s+<strong>(.+?)<\/strong>\s+"(.+)"/;
            const plainTextContent = filterText.replace(/<[^>]+>/g, '');
            const match = plainTextContent.match(/(.+?)\s+(.+?)\s+"(.+)"/);

            if (match) {
                const [_, field, operatorText, value] = match;

                // Convert operator text back to operator value
                let operator;
                switch (operatorText.trim()) {
                    case 'equals': operator = 'match'; break;
                    case 'not equals': operator = 'not_match'; break;
                    case 'contains': operator = 'contains'; break;
                    case 'greater than': operator = 'greater'; break;
                    case 'less than': operator = 'less'; break;
                    default: operator = operatorText.trim();
                }

                return {
                    field: field.trim(),
                    operator: operator,
                    value: value
                };
            }
            return null;
        }).filter(f => f !== null);

        // Apply filters to response data
        if (window.appState?.lastResponse && activeFilters.length > 0) {
            try {
                const filteredData = filterResponseData(window.appState.lastResponse, activeFilters);
                updateResponseDisplay(filteredData);
            } catch (err) {
                console.error('Error applying filters:', err);
            }
        } else if (window.appState?.lastResponse) {
            // If no filters, show original data
            updateResponseDisplay(window.appState.lastResponse);
        }
    }

    function filterResponseData(data, filters) {
        // This is a simplified implementation - you may need more complex logic
        if (Array.isArray(data)) {
            return data.filter(item => {
                return filters.every(filter => {
                    const value = getNestedValue(item, filter.field);
                    if (value === undefined) return false;

                    switch (filter.operator) {
                        case 'match':
                            return String(value) === filter.value;
                        case 'not_match':
                            return String(value) !== filter.value;
                        case 'contains':
                            return String(value).includes(filter.value);
                        case 'greater':
                            return Number(value) > Number(filter.value);
                        case 'less':
                            return Number(value) < Number(filter.value);
                        default:
                            return true;
                    }
                });
            });
        } else if (typeof data === 'object' && data !== null) {
            // For non-array objects, we can filter but the implementation is more complex
            // This is a placeholder - you'd need more complex logic for nested objects
            console.log('Object filtering not fully implemented');
            return data;
        }

        return data;
    }

    function getNestedValue(obj, path) {
        if (!obj || !path) return undefined;

        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = current[part];
        }

        return current;
    }

    function updateResponseDisplay(data) {
        const responseData = document.getElementById('response-data');
        if (!responseData) return;

        if (!data) {
            responseData.textContent = 'No data matches your filters';
            return;
        }

        // Format JSON with pretty printing if enabled
        try {
            const formatted = JSON.stringify(data, null, 2);
            if (window.formatResponse) {
                window.formatResponse(formatted); // Use existing formatter if available
            } else {
                responseData.textContent = formatted;
            }
        } catch (err) {
            console.error('Error formatting response:', err);
            responseData.textContent = 'Error displaying filtered data';
        }
    }
});

/**
 * Handle response data for filters and preview
 */
function handleResponseData(responseData) {
    // Set response data for filters
    setFilterData(responseData);

    // Update the preview
    updatePreview(responseData);
}

// Modify the sendRequest function to call handleResponseData
async function sendRequest() {
    // ...existing code...

    try {
        const response = await fetch(url, options);
        const responseData = await response.json();

        // Handle response data
        handleResponseData(responseData);

        // ...existing code...
    } catch (error) {
        console.error('Error sending request:', error);
    }
}
