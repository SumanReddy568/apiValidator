import { showNotification } from '../utils/notifications.js';
import { syntaxHighlight } from '../utils/formatting.js';

// Store current data and filter state
let responseData = null;
let currentFilterPath = null;
let activeFilters = [];
let currentFilteredData = null;

/**
 * Initialize filters functionality
 */
export function initFilterFunctionality() {
    console.log('Initializing dynamic nested filters');

    // Set up filter type change listener
    const filterType = document.getElementById('filter-type');
    if (filterType) {
        filterType.addEventListener('change', function () {
            const selectedField = this.value;
            updateFilterValueForField(selectedField);
        });
    }

    // Apply filter button
    const applyFilterBtn = document.getElementById('apply-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function () {
            applySelectedFilter();
        });
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-all-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function () {
            clearAllFilters();
        });
    }
}

/**
 * Update filter value options based on selected field
 */
function updateFilterValueForField(fieldPath) {
    if (!fieldPath) return;

    const filterValue = document.getElementById('filter-value');
    if (!filterValue) return;

    // Reset value
    filterValue.value = '';

    // For array data with objects, we need special handling
    if (Array.isArray(responseData) && responseData.length > 0 && typeof responseData[0] === 'object') {
        // Get unique values for this field
        const uniqueValues = new Set();

        // Handle array notation by removing [0] if present
        const normalizedPath = fieldPath.replace(/\[\d+\]/g, '');

        responseData.forEach(item => {
            const value = getNestedValue(item, normalizedPath);
            if (value !== undefined && value !== null) {
                uniqueValues.add(String(value));
            }
        });

        // Create datalist with unique values if not too many
        if (uniqueValues.size > 0 && uniqueValues.size < 100) {
            // Create or get datalist element
            let datalist = document.getElementById('filter-value-list');
            if (!datalist) {
                datalist = document.createElement('datalist');
                datalist.id = 'filter-value-list';
                document.body.appendChild(datalist);
            } else {
                datalist.innerHTML = '';
            }

            // Add options to datalist
            Array.from(uniqueValues)
                .sort() // Sort values for better UX
                .forEach(value => {
                    const option = document.createElement('option');
                    option.value = value;
                    datalist.appendChild(option);
                });

            filterValue.setAttribute('list', 'filter-value-list');
            filterValue.placeholder = `Select a value (${uniqueValues.size} options)`;
        } else {
            filterValue.removeAttribute('list');
            filterValue.placeholder = 'Enter value to filter';
        }
    }
}

/**
 * Apply the selected filter
 */
function applySelectedFilter() {
    const filterType = document.getElementById('filter-type');
    const filterOperator = document.getElementById('filter-operator');
    const filterValue = document.getElementById('filter-value');

    if (!filterType || !filterOperator || !filterValue) return;

    const field = filterType.value;
    const operator = filterOperator.value;
    const value = filterValue.value;

    if (!field || !value) {
        showNotification('Please select a field and enter a value', 'warning');
        return;
    }

    // Add filter
    addFilter(field, operator, value);

    // Apply filters to data
    const filteredData = applyFilters();

    // Update display with filtered data
    updateDisplayWithFilteredData(filteredData);

    // Reset and update filter options based on filtered data
    updateFilterOptionsForFilteredData(filteredData);

    // Clear value input
    filterValue.value = '';
}

/**
 * Add a filter to the active filters list
 */
function addFilter(field, operator, value) {
    // Get human-readable field and operator names
    const fieldSelect = document.getElementById('filter-type');
    const operatorSelect = document.getElementById('filter-operator');

    const fieldDisplay = fieldSelect.options[fieldSelect.selectedIndex].textContent;
    const operatorDisplay = operatorSelect.options[operatorSelect.selectedIndex].textContent;

    // Create filter object
    const filter = {
        field,
        operator,
        value,
        fieldDisplay,
        operatorDisplay
    };

    // Add to active filters
    activeFilters.push(filter);

    // Update UI
    updateActiveFiltersUI();
}

/**
 * Update active filters UI
 */
function updateActiveFiltersUI() {
    const container = document.getElementById('active-filters');
    if (!container) return;

    // Clear existing filters
    container.innerHTML = '';

    // Add each filter
    activeFilters.forEach((filter, index) => {
        const filterTag = document.createElement('div');
        filterTag.className = 'filter-badge';

        filterTag.innerHTML = `
            <span class="filter-field">${filter.fieldDisplay}</span>
            <span class="filter-operator">${filter.operatorDisplay}</span>
            <span class="filter-value">${filter.value}</span>
            <button class="remove-filter" data-index="${index}">×</button>
        `;

        // Add click handler to remove button
        filterTag.querySelector('.remove-filter').addEventListener('click', function () {
            const index = parseInt(this.dataset.index);
            activeFilters.splice(index, 1);
            updateActiveFiltersUI();

            // Reapply remaining filters from original data
            const filteredData = applyFilters();
            updateDisplayWithFilteredData(filteredData);
            updateFilterOptionsForFilteredData(filteredData);
        });

        container.appendChild(filterTag);
    });

    // Show/hide clear all button
    const clearBtn = document.getElementById('clear-all-filters');
    if (clearBtn) {
        clearBtn.style.display = activeFilters.length ? 'block' : 'none';
    }
}

/**
 * Apply all active filters to the data
 */
function applyFilters() {
    if (!responseData) return null;

    // If no filters, return original data
    if (activeFilters.length === 0) {
        currentFilteredData = responseData;
        return responseData;
    }

    let filteredData = responseData;

    // Apply each filter in sequence
    activeFilters.forEach(filter => {
        // For array data, filter items
        if (Array.isArray(filteredData)) {
            filteredData = filteredData.filter(item => {
                // Handle array notation by removing [0] if present
                const normalizedPath = filter.field.replace(/\[\d+\]/g, '');
                const itemValue = getNestedValue(item, normalizedPath);

                if (itemValue === undefined || itemValue === null) return false;

                return compareValues(itemValue, filter.operator, filter.value);
            });
        }
        // For object data, handle differently (can't filter properties of a single object)
        else if (typeof filteredData === 'object' && filteredData !== null) {
            // For objects, we'll create a new object with only matching properties
            // This is more complex and may need to be customized based on your needs
            console.log('Object filtering is not fully implemented');
        }
    });

    // Store current filtered data
    currentFilteredData = filteredData;
    return filteredData;
}

/**
 * Update display with filtered data
 */
function updateDisplayWithFilteredData(data) {
    const responseData = document.getElementById('response-data');
    if (!responseData) return;

    // If no active filters, always show original response data
    if (activeFilters.length === 0) {
        if (window.appState?.lastResponse) {
            try {
                const formatted = JSON.stringify(window.appState.lastResponse, null, 2);
                responseData.innerHTML = syntaxHighlight(formatted);
                return;
            } catch (error) {
                console.error('Error formatting original response:', error);
            }
        }
        return;
    }

    // Only show "no matches" if we have active filters and no matching data
    if (!data || (Array.isArray(data) && data.length === 0)) {
        // Show "No results found" message instead of resetting filters
        responseData.innerHTML = `<div class="no-results-message">No results found for the applied filters.</div>`;
        return;
    }

    // Show filtered data
    try {
        const formatted = JSON.stringify(data, null, 2);
        responseData.innerHTML = syntaxHighlight(formatted);

        // Update preview if available
        if (window.updatePreview) {
            window.updatePreview(data);
        }
    } catch (error) {
        console.error('Error formatting filtered data:', error);
    }
}

/**
 * Update filter options based on filtered data
 */
function updateFilterOptionsForFilteredData(data) {
    // We don't want to replace the current filter type options
    // Instead we'll use the filtered data to update the value options

    // If there's a currently selected field, update its value options
    const filterType = document.getElementById('filter-type');
    if (filterType && filterType.value) {
        updateFilterValueForField(filterType.value);
    }
}

/**
 * Compare values based on operator
 */
function compareValues(actual, operator, expected) {
    // Convert to strings for comparison (case insensitive)
    const actualStr = String(actual).toLowerCase();
    const expectedStr = String(expected).toLowerCase();

    switch (operator) {
        case 'match':
        case 'equal':
            return actualStr === expectedStr;
        case 'not_match':
        case 'not_equal':
            return actualStr !== expectedStr;
        case 'contains':
            return actualStr.includes(expectedStr);
        case 'starts_with':
            return actualStr.startsWith(expectedStr);
        case 'ends_with':
            return actualStr.endsWith(expectedStr);
        case 'greater':
            return Number(actual) > Number(expected);
        case 'less':
            return Number(actual) < Number(expected);
        default:
            return false;
    }
}

/**
 * Get a nested value from an object
 */
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

/**
 * Clear all filters
 */
function clearAllFilters() {
    activeFilters = [];
    updateActiveFiltersUI();

    // Reset to original data
    updateDisplayWithFilteredData(responseData);

    // Reset filter options
    updateFilterFieldOptions(responseData);
}

/**
 * Extract filterable fields from data
 */
function extractFilterableFields(data, prefix = '') {
    const fields = [];

    if (Array.isArray(data)) {
        // For arrays, analyze the first item as a representative sample
        if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
            extractFilterableFields(data[0], prefix ? `${prefix}[0]` : '[0]')
                .forEach(field => fields.push(field));

            // Special case for IDs in array of objects
            if (data[0].id !== undefined) {
                fields.unshift({
                    path: 'id',
                    label: 'id',
                    type: typeof data[0].id
                });
            }
        }
    } else if (typeof data === 'object' && data !== null) {
        // For objects, add all properties
        Object.entries(data).forEach(([key, value]) => {
            const path = prefix ? `${prefix}.${key}` : key;
            const label = key;

            fields.push({
                path,
                label,
                type: typeof value
            });

            // Recursively process nested objects
            if (typeof value === 'object' && value !== null) {
                extractFilterableFields(value, path).forEach(field => fields.push(field));
            }
        });
    }

    return fields;
}

/**
 * Update filter field options with data
 */
export function updateFilterFieldOptions(data) {
    // Keep track of original data for filters
    responseData = data;
    currentFilteredData = data;

    const filterType = document.getElementById('filter-type');
    if (!filterType || !data) return;

    // Clear existing options
    filterType.innerHTML = '<option value="">Select field...</option>';

    // Extract fields from data
    const fields = extractFilterableFields(data);

    // Sort fields alphabetically for better UX
    fields.sort((a, b) => a.label.localeCompare(b.label));

    // Add fields to select
    fields.forEach(field => {
        const option = document.createElement('option');
        option.value = field.path;
        option.textContent = field.label;
        option.dataset.type = field.type;
        filterType.appendChild(option);
    });

    // Reset active filters when data changes
    activeFilters = [];
    updateActiveFiltersUI();

    // Do NOT update the response display here as it was already handled in sendRequest.js
    // This prevents overwriting the already formatted and displayed response
}
