import { showNotification } from '../utils/notifications.js';
import { formatResponse } from './formatToggle.js';
import { syntaxHighlight } from '../utils/formatting.js';
import { getNestedValue } from '../utils/objectUtils.js';

// Store the current data and filters
let currentData = null;
let activeFilters = [];

/**
 * Initialize the filter modal
 */
export function initFilterModal() {
    // Create filter button event handler
    const filterBtn = document.getElementById('show-filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', showFilterModal);
    }

    // Create modal close handler
    document.getElementById('close-filter-modal')?.addEventListener('click', hideFilterModal);
    document.getElementById('filter-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'filter-modal-overlay') {
            hideFilterModal();
        }
    });

    // Apply filter button
    document.getElementById('apply-filter-btn')?.addEventListener('click', () => {
        applySelectedFilter();
    });

    // Clear filters button
    document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
        clearAllFilters();
    });
}

/**
 * Show the filter modal
 */
function showFilterModal() {
    const modal = document.getElementById('filter-modal-overlay');
    if (modal) {
        modal.classList.add('visible');
        populateFilterFields();
    }
}

/**
 * Hide the filter modal
 */
function hideFilterModal() {
    const modal = document.getElementById('filter-modal-overlay');
    if (modal) {
        modal.classList.remove('visible');
    }
}

/**
 * Populate filter fields based on the current response data
 */
function populateFilterFields() {
    const fieldSelect = document.getElementById('filter-field-select');
    if (!fieldSelect || !currentData) return;

    // Clear existing options
    fieldSelect.innerHTML = '<option value="">Select a field</option>';

    // Extract fields from the data
    const fields = extractFields(currentData);

    // Add options
    fields.forEach(field => {
        const option = document.createElement('option');
        option.value = field.path;
        option.textContent = field.label;
        fieldSelect.appendChild(option);
    });

    // Set up field change handler
    fieldSelect.onchange = function () {
        const path = this.value;
        if (!path) return;

        updateOperatorAndValueOptions(path);
    };
}

/**
 * Extract fields from data for filtering
 */
function extractFields(data, prefix = '', result = []) {
    if (!data) return result;

    if (Array.isArray(data)) {
        if (data.length > 0 && typeof data[0] === 'object') {
            // For arrays of objects, extract fields from the first item
            extractFields(data[0], prefix ? `${prefix}[0]` : '[0]', result);
        }
        return result;
    }

    if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach(key => {
            const path = prefix ? `${prefix}.${key}` : key;
            const label = prefix ? `${prefix}.${key}` : key;

            result.push({ path, label });

            // Recursively extract nested fields
            if (typeof data[key] === 'object' && data[key] !== null) {
                extractFields(data[key], path, result);
            }
        });
    }

    return result;
}

/**
 * Update operator and value options based on the selected field
 */
function updateOperatorAndValueOptions(path) {
    const valueInput = document.getElementById('filter-value-input');
    if (!valueInput) return;

    // Get the value type from the data
    const value = getNestedValue(currentData, path);
    const valueType = typeof value;

    // Update input type based on value type
    if (valueType === 'number') {
        valueInput.type = 'number';
        valueInput.placeholder = 'Enter a number...';
    } else if (valueType === 'boolean') {
        valueInput.type = 'text';
        valueInput.placeholder = 'true or false';
    } else {
        valueInput.type = 'text';
        valueInput.placeholder = 'Enter value...';
    }

    // If array item values, show possible values
    if (Array.isArray(currentData)) {
        const uniqueValues = new Set();
        currentData.forEach(item => {
            const itemPath = path.replace('[0]', '');
            const itemValue = getNestedValue(item, itemPath);
            if (itemValue !== undefined) {
                uniqueValues.add(String(itemValue));
            }
        });

        if (uniqueValues.size > 0 && uniqueValues.size < 15) {
            const datalist = document.getElementById('filter-value-list');
            if (datalist) {
                datalist.innerHTML = '';
                uniqueValues.forEach(value => {
                    const option = document.createElement('option');
                    option.value = value;
                    datalist.appendChild(option);
                });
                valueInput.setAttribute('list', 'filter-value-list');
            }
        } else {
            valueInput.removeAttribute('list');
        }
    }
}

/**
 * Apply the selected filter
 */
function applySelectedFilter() {
    const fieldSelect = document.getElementById('filter-field-select');
    const operatorSelect = document.getElementById('filter-operator-select');
    const valueInput = document.getElementById('filter-value-input');

    if (!fieldSelect || !operatorSelect || !valueInput) return;

    const field = fieldSelect.value;
    const operator = operatorSelect.value;
    const value = valueInput.value;

    if (!field || !operator) {
        showNotification('Please select a field and operator', 'warning');
        return;
    }

    // Add the filter
    const fieldLabel = fieldSelect.options[fieldSelect.selectedIndex].textContent;
    addFilter(field, fieldLabel, operator, value);

    // Hide the modal
    hideFilterModal();

    // Apply all filters
    applyAllFilters();
}

/**
 * Add a filter to the active filters
 */
function addFilter(field, label, operator, value) {
    // Add to active filters array
    activeFilters.push({
        field,
        label,
        operator,
        value
    });

    // Add to UI
    updateActiveFiltersUI();
}

/**
 * Update the active filters UI
 */
function updateActiveFiltersUI() {
    const container = document.getElementById('active-filters-container');
    if (!container) return;

    // Clear existing
    container.innerHTML = '';

    // Add each filter
    activeFilters.forEach((filter, index) => {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';

        let operatorSymbol = '=';
        if (filter.operator === 'not_equal') operatorSymbol = '≠';
        else if (filter.operator === 'contains') operatorSymbol = 'contains';
        else if (filter.operator === 'greater') operatorSymbol = '>';
        else if (filter.operator === 'less') operatorSymbol = '<';

        tag.innerHTML = `
            <span class="filter-field">${filter.label}</span>
            <span class="filter-operator">${operatorSymbol}</span>
            <span class="filter-value">${filter.value}</span>
            <span class="remove-filter" data-index="${index}">×</span>
        `;

        container.appendChild(tag);
    });

    // Add click handlers to remove buttons
    document.querySelectorAll('.remove-filter').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = parseInt(this.dataset.index);
            activeFilters.splice(index, 1);
            updateActiveFiltersUI();
            applyAllFilters();
        });
    });

    // Show/hide clear button based on filters
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
        clearBtn.style.display = activeFilters.length ? 'block' : 'none';
    }
}

/**
 * Clear all active filters
 */
function clearAllFilters() {
    activeFilters = [];
    updateActiveFiltersUI();
    applyAllFilters();
}

/**
 * Apply all active filters to the data
 */
function applyAllFilters() {
    if (!currentData || activeFilters.length === 0) {
        // If no filters, show original data
        displayFilteredData(currentData);
        return;
    }

    let filteredData;

    if (Array.isArray(currentData)) {
        // Filter array items
        filteredData = currentData.filter(item => {
            return activeFilters.every(filter => {
                const fieldPath = filter.field.replace('[0]', '');
                const itemValue = getNestedValue(item, fieldPath);

                if (itemValue === undefined) return false;

                switch (filter.operator) {
                    case 'equal':
                        return String(itemValue) === filter.value;
                    case 'not_equal':
                        return String(itemValue) !== filter.value;
                    case 'contains':
                        return String(itemValue).includes(filter.value);
                    case 'greater':
                        return Number(itemValue) > Number(filter.value);
                    case 'less':
                        return Number(itemValue) < Number(filter.value);
                    default:
                        return true;
                }
            });
        });
    } else if (typeof currentData === 'object' && currentData !== null) {
        // Clone the data
        filteredData = JSON.parse(JSON.stringify(currentData));

        // For each filter, find arrays in the data and filter them
        activeFilters.forEach(filter => {
            const pathParts = filter.field.split('.');
            let current = filteredData;
            let pathSoFar = '';

            // Traverse the path to find arrays
            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];

                if (part.includes('[') && part.endsWith(']')) {
                    // This is an array path
                    const arrayName = part.substring(0, part.indexOf('['));

                    if (arrayName && current[arrayName] && Array.isArray(current[arrayName])) {
                        // Filter this array
                        const remainingPath = pathParts.slice(i + 1).join('.');

                        current[arrayName] = current[arrayName].filter(item => {
                            const itemValue = remainingPath ?
                                getNestedValue(item, remainingPath) : item;

                            if (itemValue === undefined) return false;

                            switch (filter.operator) {
                                case 'equal':
                                    return String(itemValue) === filter.value;
                                case 'not_equal':
                                    return String(itemValue) !== filter.value;
                                case 'contains':
                                    return String(itemValue).includes(filter.value);
                                case 'greater':
                                    return Number(itemValue) > Number(filter.value);
                                case 'less':
                                    return Number(itemValue) < Number(filter.value);
                                default:
                                    return true;
                            }
                        });
                        break;
                    }
                }

                if (current[part] === undefined) break;
                current = current[part];
                pathSoFar += (pathSoFar ? '.' : '') + part;
            }
        });
    }

    // Display the filtered data
    displayFilteredData(filteredData);
}

/**
 * Display filtered data in the response area
 */
function displayFilteredData(data) {
    const responseData = document.getElementById('response-data');
    if (!responseData) return;

    if (!data) {
        responseData.textContent = 'No data matches your filters';
        return;
    }

    responseData.innerHTML = syntaxHighlight(JSON.stringify(data, null, 2));
}

/**
 * Set the current data for filtering
 */
export function setFilterData(data) {
    currentData = data;

    // Reset active filters when data changes
    activeFilters = [];
    updateActiveFiltersUI();

    // Enable filter button if data is available
    const filterBtn = document.getElementById('show-filter-btn');
    if (filterBtn) {
        filterBtn.disabled = !data;
    }
}
