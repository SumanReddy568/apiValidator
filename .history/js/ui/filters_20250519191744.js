import { showNotification } from '../utils/notifications.js';
import { formatResponse } from './formatToggle.js';
import { syntaxHighlight } from '../utils/formatting.js';
import { getNestedValue } from '../utils/objectUtils.js';

export function initFilterFunctionality() {
    // Add filter event listeners
    const applyFilterBtn = document.getElementById('apply-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function () {
            const filterType = document.getElementById('filter-type');
            const filterOperator = document.getElementById('filter-operator');
            const filterValue = document.getElementById('filter-value');

            if (!filterType || !filterOperator || !filterValue) return;

            const typeVal = filterType.value;
            const operatorVal = filterOperator.value;
            const valueVal = filterValue.value;

            if (!typeVal) {
                showNotification('Please select a field', 'warning');
                return;
            }

            // For exclude operator, we need a value
            if (operatorVal === 'exclude' && !valueVal) {
                showNotification('Please enter a value to exclude', 'warning');
                return;
            }

            applyFilterToResponse(typeVal, operatorVal, valueVal);
        });
    }

    // Set up filter type change handler for nested objects
    const filterType = document.getElementById('filter-type');
    if (filterType) {
        filterType.addEventListener('change', function () {
            updateSubFieldOptions(filterType.value);
        });
    }

    // Filter input
    const filterQuery = document.getElementById('filter-query');
    if (filterQuery) {
        filterQuery.addEventListener('input', () => {
            if (window.appState.lastResponse) filterResponse(filterQuery.value);
        });
    }
}

export function filterResponse(query) {
    if (!window.appState.lastResponse || typeof window.appState.lastResponse !== 'object') return;

    const responseData = document.getElementById('response-data');
    if (!responseData) return;

    if (!query) {
        formatResponse(window.appState.prettyPrintEnabled);
        return;
    }

    try {
        const parts = query.split('.');
        let result = window.appState.lastResponse;

        for (let part of parts) {
            if (!result) break;

            if (part.includes('[') && part.includes(']')) {
                const arrayName = part.substring(0, part.indexOf('['));
                const indexStr = part.substring(part.indexOf('[') + 1, part.indexOf(']'));
                const index = parseInt(indexStr);

                result = arrayName ? result[arrayName]?.[index] : result[index];
            } else {
                result = result[part];
            }
        }

        if (result === undefined || result === null) {
            responseData.textContent = 'No results for this filter query';
            return;
        }

        if (typeof result === 'object') {
            responseData.innerHTML = syntaxHighlight(JSON.stringify(result, null, 4));
        } else {
            responseData.textContent = String(result);
        }
    } catch (e) {
        console.error('Filter error:', e);
        responseData.textContent = `Error applying filter: ${e.message}`;
    }
}

export function updateFilterFieldOptions(data) {
    const filterTypeSelect = document.getElementById('filter-type');
    if (!filterTypeSelect) {
        console.error('Filter type select element not found.');
        return;
    }

    // Reset filter UI
    resetFilterUI();

    // Store the full response data for later use in filtering
    window.appState.fullResponseData = data;

    // Identify the main array or object in the response
    let mainData = data;

    // Check if the data has a structure with nested arrays (like testRuns in your example)
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        const keys = Object.keys(data);
        for (const key of keys) {
            if (Array.isArray(data[key]) && data[key].length > 0) {
                // Found an array property that might be the main data
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                filterTypeSelect.appendChild(option);
            } else if (typeof data[key] === 'object' && data[key] !== null) {
                // Found a nested object
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                filterTypeSelect.appendChild(option);
            } else {
                // Simple property
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                filterTypeSelect.appendChild(option);
            }
        }
    } else if (Array.isArray(data)) {
        // If it's directly an array
        mainData = data;

        // If it's an array of objects, add "[root]" option
        if (data.length > 0 && typeof data[0] === 'object') {
            const option = document.createElement('option');
            option.value = "[root]";
            option.textContent = "Array Items";
            filterTypeSelect.appendChild(option);
        }
    }

    // Update filter operator options
    updateFilterOperators();
}

function resetFilterUI() {
    const filterTypeSelect = document.getElementById('filter-type');
    const filterOperator = document.getElementById('filter-operator');
    const filterValue = document.getElementById('filter-value');

    // Clear existing options
    while (filterTypeSelect.options.length > 0) {
        filterTypeSelect.remove(0);
    }

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Select Path";
    defaultOption.selected = true;
    filterTypeSelect.appendChild(defaultOption);

    // Reset other fields
    if (filterValue) filterValue.value = '';

    // Remove any sub-field selects
    const subFieldContainer = document.getElementById('sub-field-container');
    if (subFieldContainer) {
        while (subFieldContainer.firstChild) {
            subFieldContainer.removeChild(subFieldContainer.firstChild);
        }
    }
}

function updateSubFieldOptions(selectedPath) {
    if (!selectedPath || !window.appState.fullResponseData) return;

    // Create or get the sub-field container
    let subFieldContainer = document.getElementById('sub-field-container');
    if (!subFieldContainer) {
        subFieldContainer = document.createElement('div');
        subFieldContainer.id = 'sub-field-container';
        subFieldContainer.className = 'sub-field-container';

        // Insert after the main filter type
        const filterType = document.getElementById('filter-type');
        filterType.parentNode.insertBefore(subFieldContainer, filterType.nextSibling);
    }

    // Clear existing sub-fields
    while (subFieldContainer.firstChild) {
        subFieldContainer.removeChild(subFieldContainer.firstChild);
    }

    let targetData;

    // Different handling for root array
    if (selectedPath === "[root]" && Array.isArray(window.appState.fullResponseData)) {
        targetData = window.appState.fullResponseData[0]; // First item in the array
    } else {
        // Handle array path (e.g., "testRuns")
        const isArrayPath = Array.isArray(getNestedValue(window.appState.fullResponseData, selectedPath));

        if (isArrayPath) {
            // For array paths, get the first item to see the structure
            const arrayData = getNestedValue(window.appState.fullResponseData, selectedPath);
            targetData = arrayData && arrayData.length > 0 ? arrayData[0] : null;

            // Create a label to show we're exploring array items
            const arrayLabel = document.createElement('div');
            arrayLabel.className = 'filter-path-label';
            arrayLabel.textContent = `Showing fields from ${selectedPath}[0]`;
            subFieldContainer.appendChild(arrayLabel);
        } else {
            targetData = getNestedValue(window.appState.fullResponseData, selectedPath);
        }
    }

    // For non-object data, show the value
    if (targetData !== undefined && (typeof targetData !== 'object' || targetData === null)) {
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'filter-value-display';
        valueDisplay.textContent = `Value: ${JSON.stringify(targetData)}`;
        subFieldContainer.appendChild(valueDisplay);
        return;
    }

    // If we have an object with properties
    if (typeof targetData === 'object' && targetData !== null) {
        const subSelect = document.createElement('select');
        subSelect.className = 'filter-select sub-field-select';

        // Default option
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Select Property";
        defaultOption.selected = true;
        subSelect.appendChild(defaultOption);

        // Add options for each property
        for (const key of Object.keys(targetData)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            subSelect.appendChild(option);
        }

        // Event listener for property selection
        subSelect.addEventListener('change', function () {
            if (!subSelect.value) return;

            const fullPath = selectedPath === "[root]" ?
                subSelect.value :
                `${selectedPath}.${subSelect.value}`;

            // Check if this is an object property that can be further explored
            const propertyValue = getNestedValue(window.appState.fullResponseData, fullPath);

            if (typeof propertyValue === 'object' && propertyValue !== null && !Array.isArray(propertyValue)) {
                // Handle nested object
                const combinedPath = fullPath;
                updateNestedSubFields(combinedPath, subFieldContainer, subSelect);
            } else {
                // For primitive values or arrays, show available values
                displayFieldValues(fullPath, subFieldContainer, subSelect);
            }
        });

        subFieldContainer.appendChild(subSelect);
    }
}

// Add this new function to extract unique values for a given path
function extractUniqueValues(data, path) {
    if (!data || !path) return [];

    // Get the value at the given path
    let values = [];
    let targetData = getNestedValue(data, path);

    // Handle array data specifically (most common case)
    if (Array.isArray(targetData)) {
        // This is an array of objects most likely, so we return the array
        return targetData;
    }

    // Find all values in the data structure that match this path
    // This is useful when we have an array of objects and looking for all values of a specific field
    if (Array.isArray(data)) {
        // Path might be a property of items in this array
        const fieldParts = path.split('.');
        const lastField = fieldParts[fieldParts.length - 1];

        data.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                const itemValue = fieldParts.length === 1 ?
                    item[lastField] :
                    getNestedValue(item, path);

                if (itemValue !== undefined && !values.includes(itemValue)) {
                    values.push(itemValue);
                }
            }
        });
    }

    return values;
}

// New function to display all available values for a selected field
function displayFieldValues(path, container, previousSelect) {
    // Remove any elements after the current select
    let next = previousSelect.nextSibling;
    while (next) {
        const toRemove = next;
        next = next.nextSibling;
        container.removeChild(toRemove);
    }

    // Get array data that contains this path
    let arrayData;
    const pathParts = path.split('.');
    let arrayPath = "";

    // Find the array in the path if any
    for (let i = 0; i < pathParts.length; i++) {
        const currentPath = pathParts.slice(0, i + 1).join('.');
        const currentData = getNestedValue(window.appState.fullResponseData, currentPath);

        if (Array.isArray(currentData)) {
            arrayPath = currentPath;
            arrayData = currentData;
            break;
        }
    }

    if (!arrayPath && Array.isArray(window.appState.fullResponseData)) {
        // Root is an array
        arrayData = window.appState.fullResponseData;
    }

    // Extract unique values for this field
    const values = new Set();
    const fieldName = pathParts[pathParts.length - 1];

    if (arrayData) {
        // If we have array data, extract values from it
        arrayData.forEach(item => {
            // If the field is directly on the array items
            if (pathParts.length === 1 || path.startsWith('[root].')) {
                if (item && typeof item === 'object' && item[fieldName] !== undefined) {
                    values.add(String(item[fieldName]));
                }
            } else {
                // For nested fields, we need to get the relevant part of the path
                const relPathParts = arrayPath === "" ?
                    pathParts :
                    pathParts.slice(pathParts.indexOf(arrayPath.split('.').pop()) + 1);

                let currentItem = item;
                for (let i = 0; i < relPathParts.length - 1; i++) {
                    if (!currentItem || typeof currentItem !== 'object') break;
                    currentItem = currentItem[relPathParts[i]];
                }

                if (currentItem && typeof currentItem === 'object' && currentItem[fieldName] !== undefined) {
                    values.add(String(currentItem[fieldName]));
                }
            }
        });
    } else {
        // If no array in the path, just get the single value
        const value = getNestedValue(window.appState.fullResponseData, path);
        if (value !== undefined) values.add(String(value));
    }

    // Create value selector
    if (values.size > 0) {
        const valueSelect = document.createElement('select');
        valueSelect.className = 'filter-select value-select';

        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = `Available ${fieldName} values (${values.size})`;
        defaultOption.selected = true;
        valueSelect.appendChild(defaultOption);

        // Convert set to array and sort for consistent display
        Array.from(values).sort().forEach(val => {
            const option = document.createElement('option');
            option.value = val;
            option.textContent = val;
            valueSelect.appendChild(option);
        });

        // When a value is selected, apply a filter to show only matching items
        valueSelect.addEventListener('change', function () {
            if (!valueSelect.value) return;

            const filterValue = valueSelect.value;
            createFilterTag(path, fieldName, filterValue, 'match');
        });

        container.appendChild(valueSelect);
    } else {
        const noValues = document.createElement('div');
        noValues.className = 'no-values-message';
        noValues.textContent = 'No values found for this field';
        container.appendChild(noValues);
    }
}

// Helper to create filter tags
function createFilterTag(path, fieldName, value, operator) {
    const activeFilters = document.getElementById('active-filters');
    if (!activeFilters) return;

    const filterTag = document.createElement('div');
    filterTag.className = 'filter-tag';

    // Format the display
    filterTag.innerHTML = `
        ${fieldName} = "${value}"
        <span class="remove-filter"><i class="fas fa-times"></i></span>
    `;

    filterTag.querySelector('.remove-filter')?.addEventListener('click', () => {
        filterTag.remove();
        applyAllFilters();
    });

    // Store filter data
    filterTag.dataset.path = path;
    filterTag.dataset.operator = operator;
    filterTag.dataset.value = value;

    activeFilters.appendChild(filterTag);
    applyAllFilters();
}

// Update this function for our revised filtering approach
function applyAllFilters() {
    if (!window.appState.fullResponseData) return;

    const responseData = document.getElementById('response-data');
    if (!responseData) return;

    const filterTags = document.querySelectorAll('.filter-tag');
    if (!filterTags || filterTags.length === 0) {
        // If no filters, show original data
        formatResponse(window.appState.prettyPrintEnabled);
        return;
    }

    // Create a mapping of paths to filter criteria
    const filters = [];
    filterTags.forEach(tag => {
        filters.push({
            path: tag.dataset.path,
            operator: tag.dataset.operator,
            value: tag.dataset.value
        });
    });

    // Start with a deep copy of the original data
    let resultData = JSON.parse(JSON.stringify(window.appState.fullResponseData));

    // Apply filters - we'll focus mostly on filtering array data
    for (const filter of filters) {
        resultData = applyFilter(resultData, filter);
    }

    // Update the display with filtered data
    responseData.innerHTML = syntaxHighlight(JSON.stringify(resultData, null, 2));
}

// New approach to apply filters
function applyFilter(data, filter) {
    // Find if we're filtering an array
    const pathParts = filter.path.split('.');
    let currentData = data;
    let currentPath = '';
    let arrayPath = null;

    // Find the array in the path
    for (let i = 0; i < pathParts.length; i++) {
        if (currentPath) {
            currentPath += '.';
        }
        currentPath += pathParts[i];

        if (Array.isArray(getNestedValue(data, currentPath))) {
            arrayPath = currentPath;
            break;
        }
    }

    // If no array was found in the path but the root is an array
    if (!arrayPath && Array.isArray(data)) {
        arrayPath = ''; // Root array
    }

    // If we found an array, filter it
    if (arrayPath !== null) {
        return filterDataArray(data, arrayPath, filter);
    }

    // If no array to filter, return the original data
    return data;
}

// Filter an array at the given path
function filterDataArray(data, arrayPath, filter) {
    const result = JSON.parse(JSON.stringify(data));
    const targetArray = arrayPath ? getNestedValue(result, arrayPath) : result;

    if (!Array.isArray(targetArray)) return result;

    // Get the field to filter on (relative to array items)
    const fullPath = filter.path;
    let fieldPath;

    if (arrayPath === '') {
        // Root array
        fieldPath = fullPath;
    } else {
        // Get the part of the path after the array
        const arrayPathParts = arrayPath.split('.');
        const fullPathParts = fullPath.split('.');
        fieldPath = fullPathParts.slice(arrayPathParts.length).join('.');
    }

    // Filter the array
    const filtered = targetArray.filter(item => {
        if (!item || typeof item !== 'object') return false;

        // Get the value from the item
        const itemValue = fieldPath.includes('.') ?
            getNestedValue(item, fieldPath) :
            item[fieldPath];

        if (itemValue === undefined) return false;

        // Apply the filter condition
        if (filter.operator === 'match') {
            return String(itemValue) === filter.value;
        }
        return true; // Default case
    });

    // Update the array in the result
    if (arrayPath) {
        // For a nested array
        const parts = arrayPath.split('.');
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = filtered;
    } else {
        // For a root array
        return filtered;
    }

    return result;
}

function updateFilterOperators() {
    // This function is no longer needed since we're using a hardcoded match operator
    // But we'll keep it to fix the reference error
    console.log('Filter operators updated');
}
