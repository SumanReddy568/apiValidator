import { showNotification } from '../utils/notifications.js';

// Cache for storing analyzed response data
let analyzedData = null;
let filteredData = null;

/**
 * Initialize smart filters functionality
 */
export function initSmartFilters() {
    console.log('Initializing smart filters');

    // Apply filter button
    const applyFilterBtn = document.getElementById('apply-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            applySmartFilter();
        });
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-all-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            clearAllFilters();
        });
    }

    // Filter type selection change
    const filterType = document.getElementById('filter-type');
    if (filterType) {
        filterType.addEventListener('change', (e) => {
            updateOperatorBasedOnField(e.target.value);
        });
    }
}

/**
 * Analyze response data and extract filterable fields
 * @param {*} data - Response data to analyze
 */
export function analyzeResponseData(data) {
    console.log('Analyzing response data for smart filters');

    if (!data) {
        console.log('No data to analyze');
        clearFilterFields();
        return;
    }

    try {
        // Store analyzed data
        analyzedData = data;
        filteredData = null;

        // Extract fields and their types
        const fields = [];

        if (Array.isArray(data)) {
            console.log('Analyzing array data with', data.length, 'items');
            // For arrays, analyze the first item as a sample
            if (data.length > 0) {
                const sample = data[0];
                extractFieldsFromObject(sample, fields);

                // Add special array fields
                fields.push({
                    path: 'length',
                    label: 'Array Length',
                    type: 'number',
                    value: data.length,
                    operators: ['equal', 'not_equal', 'greater', 'less']
                });
            }
        } else if (typeof data === 'object' && data !== null) {
            console.log('Analyzing object data');
            extractFieldsFromObject(data, fields);
        } else {
            console.log('Data is primitive type:', typeof data);
            // For primitive types, add a single field
            fields.push({
                path: 'value',
                label: 'Value',
                type: typeof data,
                value: data,
                operators: getOperatorsForType(typeof data)
            });
        }

        // Populate filter fields dropdown
        populateFilterFields(fields);

        // Also identify common values for frequent filtering
        identifyCommonValues(data);

    } catch (error) {
        console.error('Error analyzing response data:', error);
        showNotification('Error analyzing response for filters', 'error');
    }
}

/**
 * Extract fields from an object with path tracking
 */
function extractFieldsFromObject(obj, fields, prefix = '') {
    if (!obj || typeof obj !== 'object') return;

    Object.entries(obj).forEach(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        const type = getValueType(value);

        // Add this field
        fields.push({
            path,
            label: path,
            type,
            value,
            operators: getOperatorsForType(type)
        });

        // Recursively process nested objects (but not too deep)
        if (type === 'object' && !Array.isArray(value) && value !== null && prefix.split('.').length < 3) {
            extractFieldsFromObject(value, fields, path);
        }

        // For arrays, sample the first item's fields if it's an object
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            extractFieldsFromObject(
                value[0],
                fields,
                `${path}[0]`
            );
        }
    });
}

/**
 * Get appropriate operators for different data types
 */
function getOperatorsForType(type) {
    switch (type) {
        case 'string':
            return ['equal', 'not_equal', 'contains', 'starts_with', 'ends_with'];
        case 'number':
            return ['equal', 'not_equal', 'greater', 'less', 'between'];
        case 'boolean':
            return ['equal', 'not_equal'];
        case 'date':
            return ['equal', 'not_equal', 'greater', 'less', 'between'];
        case 'array':
            return ['contains', 'length_equal', 'length_greater', 'length_less'];
        case 'object':
            return ['has_property', 'not_has_property'];
        default:
            return ['equal', 'not_equal'];
    }
}

/**
 * Get the type of a value with better precision
 */
function getValueType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';

    const type = typeof value;

    // Check for date strings
    if (type === 'string') {
        // ISO date format check
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return 'date';
        }
        // Other common date formats
        if (/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
            return 'date';
        }
    }

    return type;
}

/**
 * Populate filter fields dropdown with extracted fields
 */
function populateFilterFields(fields) {
    const filterType = document.getElementById('filter-type');
    if (!filterType) return;

    // Clear existing options
    filterType.innerHTML = '<option value="">Select field to filter...</option>';

    // Add each field as an option
    fields.forEach(field => {
        const option = document.createElement('option');
        option.value = field.path;
        option.textContent = field.label;
        option.dataset.type = field.type;
        option.dataset.operators = JSON.stringify(field.operators);
        filterType.appendChild(option);
    });

    console.log(`Populated ${fields.length} filter fields`);
}

/**
 * Update available operators based on selected field
 */
function updateOperatorBasedOnField(fieldPath) {
    if (!fieldPath) return;

    const filterType = document.getElementById('filter-type');
    const filterOperator = document.getElementById('filter-operator');
    const filterValue = document.getElementById('filter-value');

    if (!filterType || !filterOperator || !filterValue) return;

    // Find the selected option
    const selectedOption = Array.from(filterType.options).find(opt => opt.value === fieldPath);
    if (!selectedOption) return;

    // Get field type and operators
    const fieldType = selectedOption.dataset.type;
    const operators = JSON.parse(selectedOption.dataset.operators || '[]');

    // Update operator options
    filterOperator.innerHTML = '';
    operators.forEach(op => {
        const option = document.createElement('option');
        option.value = op;

        // Human-readable operator names
        switch (op) {
            case 'equal': option.textContent = 'equals'; break;
            case 'not_equal': option.textContent = 'not equals'; break;
            case 'contains': option.textContent = 'contains'; break;
            case 'starts_with': option.textContent = 'starts with'; break;
            case 'ends_with': option.textContent = 'ends with'; break;
            case 'greater': option.textContent = 'greater than'; break;
            case 'less': option.textContent = 'less than'; break;
            case 'between': option.textContent = 'between'; break;
            case 'length_equal': option.textContent = 'length equals'; break;
            case 'length_greater': option.textContent = 'length greater than'; break;
            case 'length_less': option.textContent = 'length less than'; break;
            case 'has_property': option.textContent = 'has property'; break;
            case 'not_has_property': option.textContent = 'does not have property'; break;
            default: option.textContent = op;
        }

        filterOperator.appendChild(option);
    });

    // Update value input based on field type
    updateValueInputForType(fieldType, fieldPath);
}

/**
 * Update value input field based on selected field type
 */
function updateValueInputForType(type, fieldPath) {
    const filterValue = document.getElementById('filter-value');
    if (!filterValue) return;

    // Reset value and attributes
    filterValue.value = '';
    filterValue.removeAttribute('min');
    filterValue.removeAttribute('max');
    filterValue.removeAttribute('step');
    filterValue.removeAttribute('list');

    // Set type-specific attributes
    switch (type) {
        case 'number':
            filterValue.type = 'number';
            filterValue.step = 'any';
            break;
        case 'boolean':
            filterValue.type = 'select';
            // Create a temporary select element with true/false options
            const tempSelect = document.createElement('select');
            tempSelect.innerHTML = `
                <option value="true">true</option>
                <option value="false">false</option>
            `;
            // Replace the input with the select
            filterValue.parentNode.replaceChild(tempSelect, filterValue);
            tempSelect.id = 'filter-value';
            break;
        case 'date':
            filterValue.type = 'date';
            break;
        default:
            filterValue.type = 'text';
    }

    // Add datalist with suggested values if available
    if (analyzedData && fieldPath) {
        // Create or get datalist element
        let datalist = document.getElementById('filter-value-list');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'filter-value-list';
            document.body.appendChild(datalist);
        } else {
            datalist.innerHTML = '';
        }

        // Get unique values for this field
        const uniqueValues = getUniqueValuesForField(analyzedData, fieldPath);

        // Add options to datalist (max 20)
        uniqueValues.slice(0, 20).forEach(value => {
            const option = document.createElement('option');
            option.value = String(value);
            datalist.appendChild(option);
        });

        if (uniqueValues.length > 0) {
            filterValue.setAttribute('list', 'filter-value-list');
        }
    }
}

/**
 * Get unique values for a field in the data
 */
function getUniqueValuesForField(data, fieldPath) {
    const values = new Set();

    function extractValue(obj, path) {
        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
            if (current === null || current === undefined) return undefined;

            // Handle array notation [0]
            if (part.includes('[') && part.endsWith(']')) {
                const arrayName = part.substring(0, part.indexOf('['));
                const index = parseInt(part.substring(part.indexOf('[') + 1, part.indexOf(']')));

                if (current[arrayName] && Array.isArray(current[arrayName]) && current[arrayName].length > index) {
                    current = current[arrayName][index];
                } else {
                    return undefined;
                }
            } else {
                current = current[part];
            }
        }

        return current;
    }

    if (Array.isArray(data)) {
        data.forEach(item => {
            const value = extractValue(item, fieldPath.replace('[0]', ''));
            if (value !== undefined) {
                values.add(value);
            }
        });
    } else {
        const value = extractValue(data, fieldPath);
        if (value !== undefined) {
            values.add(value);
        }
    }

    return Array.from(values);
}

/**
 * Apply a smart filter to the data
 */
function applySmartFilter() {
    const filterType = document.getElementById('filter-type');
    const filterOperator = document.getElementById('filter-operator');
    const filterValue = document.getElementById('filter-value');
    const activeFilters = document.getElementById('active-filters');

    if (!filterType || !filterOperator || !filterValue || !activeFilters || !analyzedData) return;

    const field = filterType.value;
    const operator = filterOperator.value;
    const value = filterValue.value;

    if (!field || !operator || !value) {
        showNotification('Please select a field, operator, and value', 'warning');
        return;
    }

    // Create a filter badge
    const filterBadge = document.createElement('div');
    filterBadge.className = 'filter-badge';
    filterBadge.dataset.field = field;
    filterBadge.dataset.operator = operator;
    filterBadge.dataset.value = value;

    // Get readable field name
    const fieldLabel = filterType.options[filterType.selectedIndex].textContent;
    // Get readable operator name
    const operatorLabel = filterOperator.options[filterOperator.selectedIndex].textContent;

    // Create filter badge content
    filterBadge.innerHTML = `
        <span class="filter-field">${fieldLabel}</span>
        <span class="filter-operator">${operatorLabel}</span>
        <span class="filter-value">${value}</span>
        <button class="remove-filter">×</button>
    `;

    // Add remove button handler
    filterBadge.querySelector('.remove-filter').addEventListener('click', function () {
        filterBadge.remove();

        // Hide clear all button if no filters remain
        const clearAllBtn = document.getElementById('clear-all-filters');
        if (clearAllBtn && activeFilters.children.length === 0) {
            clearAllBtn.style.display = 'none';
        }

        // Re-apply remaining filters
        applyAllFilters();
    });

    // Add filter badge to active filters
    activeFilters.appendChild(filterBadge);

    // Show clear all button
    const clearAllBtn = document.getElementById('clear-all-filters');
    if (clearAllBtn) {
        clearAllBtn.style.display = 'block';
    }

    // Apply all filters to the data
    applyAllFilters();

    // Reset value input
    filterValue.value = '';
}

/**
 * Apply all active filters to the data
 */
function applyAllFilters() {
    const activeFilters = document.getElementById('active-filters');

    if (!activeFilters || !analyzedData) return;

    const filters = Array.from(activeFilters.children).map(badge => ({
        field: badge.dataset.field,
        operator: badge.dataset.operator,
        value: badge.dataset.value
    }));

    if (filters.length === 0) {
        // No filters - restore original data
        filteredData = null;
        updateDisplayedData(analyzedData);
        return;
    }

    // Apply filters
    const result = filterData(analyzedData, filters);
    filteredData = result;
    updateDisplayedData(result);
}

/**
 * Filter data based on provided filters
 */
function filterData(data, filters) {
    // For arrays, filter each item
    if (Array.isArray(data)) {
        return data.filter(item =>
            filters.every(filter => evaluateFilter(item, filter))
        );
    }

    // For objects, if all filters match return the object, otherwise null
    if (typeof data === 'object' && data !== null) {
        return filters.every(filter => evaluateFilter(data, filter)) ? data : null;
    }

    // For primitives, check direct value
    return filters.every(filter =>
        filter.field === 'value' && compareValues(data, filter.operator, filter.value)
    ) ? data : null;
}

/**
 * Evaluate a filter against an item
 */
function evaluateFilter(item, filter) {
    const value = extractNestedValue(item, filter.field);
    return compareValues(value, filter.operator, filter.value);
}

/**
 * Extract a nested value from an object
 */
function extractNestedValue(obj, path) {
    try {
        // For array data, remove the [0] in the path
        path = path.replace('[0]', '');

        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = current[part];
        }

        return current;
    } catch (e) {
        console.error('Error extracting nested value:', e);
        return undefined;
    }
}

/**
 * Compare values based on operator
 */
function compareValues(actual, operator, expected) {
    if (actual === undefined) return false;

    try {
        switch (operator) {
            case 'equal':
                return String(actual) === expected;

            case 'not_equal':
                return String(actual) !== expected;

            case 'contains':
                return String(actual).includes(expected);

            case 'starts_with':
                return String(actual).startsWith(expected);

            case 'ends_with':
                return String(actual).endsWith(expected);

            case 'greater':
                return Number(actual) > Number(expected);

            case 'less':
                return Number(actual) < Number(expected);

            case 'between':
                const [min, max] = expected.split(',').map(Number);
                return Number(actual) >= min && Number(actual) <= max;

            case 'length_equal':
                return actual.length === Number(expected);

            case 'length_greater':
                return actual.length > Number(expected);

            case 'length_less':
                return actual.length < Number(expected);

            case 'has_property':
                return actual && typeof actual === 'object' && expected in actual;

            case 'not_has_property':
                return actual && typeof actual === 'object' && !(expected in actual);

            default:
                return false;
        }
    } catch (e) {
        console.error('Error comparing values:', e);
        return false;
    }
}

/**
 * Update the displayed data in the response area
 */
function updateDisplayedData(data) {
    const responseData = document.getElementById('response-data');
    if (!responseData) return;

    if (!data) {
        responseData.textContent = 'No data matches your filters';
        return;
    }

    try {
        // Format JSON with pretty printing
        const formatted = JSON.stringify(data, null, 2);
        responseData.textContent = formatted;

        // Apply syntax highlighting if available
        if (window.syntaxHighlight) {
            responseData.innerHTML = window.syntaxHighlight(formatted);
        }

        // If there are active filters, show filter indicator
        const filterCount = document.getElementById('active-filters')?.children.length || 0;
        if (filterCount > 0) {
            const countText = `(${filterCount} filter${filterCount > 1 ? 's' : ''} applied)`;
            showNotification(`Showing filtered results ${countText}`, 'info', 3000);
        }
    } catch (e) {
        console.error('Error updating displayed data:', e);
        responseData.textContent = 'Error displaying filtered data';
    }
}

/**
 * Identify common values and patterns in the data for better filtering suggestions
 */
function identifyCommonValues(data) {
    // For arrays, identify patterns in the data
    if (Array.isArray(data) && data.length > 0) {
        try {
            // Identify fields with similar values for easier filtering
            if (typeof data[0] === 'object') {
                const fields = Object.keys(data[0]);

                fields.forEach(field => {
                    // Check if values are well-distributed
                    const values = data.map(item => item[field]).filter(v => v !== undefined);
                    const uniqueValues = new Set(values);

                    // If there are a reasonable number of unique values, suggest them
                    if (uniqueValues.size > 1 && uniqueValues.size <= 10) {
                        console.log(`Field "${field}" has ${uniqueValues.size} unique values - good for filtering`);
                        // You could store these for suggestions
                    }

                    // For numeric fields, suggest min/max filters
                    if (values.every(v => typeof v === 'number')) {
                        const min = Math.min(...values);
                        const max = Math.max(...values);
                        console.log(`Field "${field}" is numeric with range ${min} - ${max}`);
                    }
                });
            }
        } catch (e) {
            console.error('Error identifying common values:', e);
        }
    }
}

/**
 * Clear all filters
 */
function clearAllFilters() {
    const activeFilters = document.getElementById('active-filters');
    const clearAllBtn = document.getElementById('clear-all-filters');

    if (activeFilters) {
        activeFilters.innerHTML = '';
    }

    if (clearAllBtn) {
        clearAllBtn.style.display = 'none';
    }

    // Reset to original data
    filteredData = null;
    updateDisplayedData(analyzedData);

    showNotification('All filters cleared', 'info');
}

/**
 * Clear filter fields
 */
function clearFilterFields() {
    const filterType = document.getElementById('filter-type');
    if (filterType) {
        filterType.innerHTML = '<option value="">Select field to filter...</option>';
    }
}

/**
 * Main entry point to set data for filtering
 */
export function setSmartFilterData(data) {
    console.log('Setting data for smart filtering', typeof data);

    // Store the original data
    window.appState.lastResponse = data;

    // Clear any existing filters
    const activeFilters = document.getElementById('active-filters');
    if (activeFilters) {
        activeFilters.innerHTML = '';
    }

    const clearAllBtn = document.getElementById('clear-all-filters');
    if (clearAllBtn) {
        clearAllBtn.style.display = 'none';
    }

    // Reset filtered data
    filteredData = null;

    // Analyze the data for filter fields
    analyzeResponseData(data);
}
