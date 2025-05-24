import { showNotification } from '../utils/notifications.js';
import { formatResponse } from '../ui/formatToggle.js';
import { updatePreview } from '../ui/preview.js';
import { updateFilterFieldOptions } from '../ui/filters.js';
import { addToHistory } from './history.js';
import { escapeHtml } from '../utils/escaping.js';

const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

export function initSendRequest() {
    const sendRequestBtn = document.getElementById('send-request');
    const urlInput = document.getElementById('request-url');
    const methodSelect = document.getElementById('request-method');
    const newRequestBtn = document.getElementById('new-request');

    if (sendRequestBtn) {
        sendRequestBtn.addEventListener('click', sendRequest);
    }

    if (urlInput) {
        urlInput.addEventListener('input', handleUrlInput);
        urlInput.addEventListener('paste', (e) => {
            // Short delay to get the pasted content
            setTimeout(() => handleUrlInput(e), 0);
        });
    }

    if (methodSelect) {
        // Set initial method color
        updateMethodColor(methodSelect.value);

        // Update color when method changes
        methodSelect.addEventListener('change', (e) => {
            updateMethodColor(e.target.value);
        });
    }

    if (newRequestBtn) {
        newRequestBtn.addEventListener('click', clearRequest);
    }
}

function updateMethodColor(method) {
    const methodSelect = document.getElementById('request-method');
    if (!methodSelect) return;

    // Remove all method classes
    methodSelect.className = '';
    // Add the new method class
    methodSelect.classList.add(`method-${method}`);
}

function clearRequest() {
    // Clear URL
    const urlInput = document.getElementById('request-url');
    if (urlInput) urlInput.value = '';

    // Reset method to GET
    const methodSelect = document.getElementById('request-method');
    if (methodSelect) {
        methodSelect.value = 'GET';
        updateMethodColor('GET');
    }

    // Clear parameters
    const paramList = document.querySelector('.param-list');
    if (paramList) {
        paramList.innerHTML = `
            <div class="param-item">
                <input type="text" placeholder="Key" />
                <input type="text" placeholder="Value" />
                <button class="remove-btn"><i class="fas fa-times"></i></button>
            </div>
        `;
    }

    // Clear headers
    const headerList = document.querySelector('.header-list');
    if (headerList) {
        headerList.innerHTML = `
            <div class="header-item">
                <input type="text" placeholder="Key" />
                <input type="text" placeholder="Value" />
                <button class="remove-btn"><i class="fas fa-times"></i></button>
            </div>
        `;
    }

    // Clear body content
    const bodyContent = document.getElementById('body-content');
    if (bodyContent) bodyContent.value = '';

    // Reset body format to JSON
    const bodyFormat = document.getElementById('body-format');
    if (bodyFormat) bodyFormat.value = 'json';

    // Reset auth
    const authType = document.getElementById('auth-type');
    if (authType) {
        authType.value = 'none';
        const authContent = document.querySelector('.auth-content');
        if (authContent) authContent.innerHTML = '';
    }

    // Clear response section
    const responseDataEl = document.getElementById('response-data');
    if (responseDataEl) {
        responseDataEl.textContent = '';
    }

    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = '--';
        statusEl.className = 'status-code';
    }

    const responseTimeEl = document.getElementById('response-time');
    if (responseTimeEl) responseTimeEl.textContent = '--';

    const responseSizeEl = document.getElementById('response-size');
    if (responseSizeEl) responseSizeEl.textContent = '--';

    const headersTableBody = document.querySelector('#response-headers-table tbody');
    if (headersTableBody) headersTableBody.innerHTML = '';

    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) previewContainer.textContent = 'No preview available';

    // Clear filters
    const activeFilters = document.getElementById('active-filters');
    if (activeFilters) activeFilters.innerHTML = '';

    const filterType = document.getElementById('filter-type');
    if (filterType) filterType.innerHTML = '<option value="">Select field...</option>';

    // Reset stored response
    window.appState.lastResponse = null;

    showNotification('New request created', 'success');
}

function handleUrlInput(event) {
    const urlInput = event.target;
    const url = urlInput.value.trim();

    if (!url) return;

    try {
        const urlObj = new URL(url);

        // Auto-fill query parameters
        const params = urlObj.searchParams;
        if (params.size > 0) {
            // Clear existing params first
            const paramList = document.querySelector('.param-list');
            if (paramList) {
                paramList.innerHTML = '';

                // Add each parameter
                params.forEach((value, key) => {
                    const paramItem = createParamItem(key, value);
                    paramList.appendChild(paramItem);
                });

                // Switch to params tab
                const paramsTab = document.querySelector('[data-tab="params"]');
                if (paramsTab) {
                    paramsTab.click();
                }

                showNotification('Query parameters auto-filled', 'success');
            }
        }

        // Auto-fill common headers based on URL
        autoFillHeaders(urlObj);

    } catch (e) {
        console.log('Not a valid URL yet:', e);
    }
}

function createParamItem(key, value) {
    const div = document.createElement('div');
    div.className = 'param-item';
    div.innerHTML = `
        <input type="text" placeholder="Key" value="${escapeHtml(key)}" />
        <input type="text" placeholder="Value" value="${escapeHtml(value)}" />
        <button class="remove-btn"><i class="fas fa-times"></i></button>
    `;

    // Add remove button handler
    div.querySelector('.remove-btn').addEventListener('click', function () {
        div.remove();
    });

    return div;
}

function autoFillHeaders(urlObj) {
    const headersList = document.querySelector('.header-list');
    if (!headersList) return;

    // Common headers based on URL patterns
    const commonHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    // Add API key header if looks like an API endpoint
    if (urlObj.pathname.includes('/api/')) {
        commonHeaders['Authorization'] = 'Bearer ';
    }

    // Clear existing headers
    headersList.innerHTML = '';

    // Add common headers
    Object.entries(commonHeaders).forEach(([key, value]) => {
        const headerItem = document.createElement('div');
        headerItem.className = 'header-item';
        headerItem.innerHTML = `
            <input type="text" placeholder="Key" value="${escapeHtml(key)}" />
            <input type="text" placeholder="Value" value="${escapeHtml(value)}" />
            <button class="remove-btn"><i class="fas fa-times"></i></button>
        `;

        headerItem.querySelector('.remove-btn').addEventListener('click', function () {
            headerItem.remove();
        });

        headersList.appendChild(headerItem);
    });

    // Switch to headers tab
    const headersTab = document.querySelector('[data-tab="headers"]');
    if (headersTab) {
        headersTab.click();
    }

    showNotification('Common headers auto-filled', 'success');
}

export async function sendRequest() {
    console.log('sendRequest called');
    const methodSelect = document.getElementById('request-method');
    const urlInput = document.getElementById('request-url');

    if (!methodSelect || !urlInput) {
        console.error('Required form elements are missing (methodSelect or urlInput)');
        showNotification('Required form elements are missing', 'error');
        return;
    }

    const method = methodSelect.value;
    const url = urlInput.value?.trim();
    console.log(`Method: ${method}, URL: ${url}`);

    if (!url) {
        console.error('URL is empty');
        showNotification('Please enter a URL', 'error');
        return;
    }

    let urlObj;
    try {
        const urlWithProtocol = url; // don't force https://
        urlObj = new URL(urlWithProtocol);
        console.log('Parsed URL:', urlObj.toString());
    } catch (e) {
        console.error('Invalid URL format:', e.message);
        showNotification('Invalid URL format. Please enter a valid URL', 'error');
        return;
    }

    const headers = {};
    document.querySelectorAll('.header-item').forEach(item => {
        const keyInput = item.querySelector('input:first-child');
        // Use a more specific selector for the value input
        const valueInput = item.querySelector('input:nth-child(2)');
        if (keyInput && valueInput) {
            const key = keyInput.value.trim();
            const value = valueInput.value.trim();
            if (key) headers[key] = value;
        }
    });

    // Log warnings for problematic headers
    const problematicHeaders = [
        'Referer', 'User-Agent', 'Cookie',
    ];
    const headerKeys = Object.keys(headers);
    headerKeys.forEach(key => {
        if (problematicHeaders.some(ph => key.toLowerCase() === ph.toLowerCase()) || key.toLowerCase().startsWith('sec-')) {
            console.warn(`The header "${key}" is controlled by the browser and might be ignored or modified when using fetch.`);
            showNotification(`Warning: Header "${key}" might be ignored/modified by the browser.`, 'warning');
        }
    });

    console.log('Collected Headers:', headers);


    const finalHeaders = {
        ...(window.appState.defaultHeaders || {}),
        ...headers
    };

    finalHeaders['Accept'] = 'application/json';
    let body = null;
    const bodyContentEl = document.getElementById('body-content');
    const bodyType = document.getElementById('body-format')?.value || 'json';

    if (method !== 'GET' && method !== 'HEAD' && bodyContentEl && bodyContentEl.value.trim()) {
        const bodyText = bodyContentEl.value.trim();
        console.log(`Body Type: ${bodyType}, Body Text: ${bodyText.substring(0, 100)}...`);
        if (bodyType === 'json') {
            try {
                JSON.parse(bodyText); // Validate JSON
                if (!finalHeaders['Content-Type']) {
                    finalHeaders['Content-Type'] = 'application/json';
                }
                body = bodyText;
            } catch (e) {
                console.error('Invalid JSON body:', e.message);
                showNotification('Invalid JSON body. Please check syntax.', 'error');
                return;
            }
        } else if (bodyType === 'form') {
            if (!finalHeaders['Content-Type']) {
                finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
            }
            body = bodyText;
        } else {
            body = bodyText; // Raw body
        }
    }
    console.log('Prepared Body:', body ? body.substring(0, 100) + "..." : null);

    document.querySelectorAll('.param-item').forEach(item => {
        const keyInput = item.querySelector('input:first-child');
        const valueInput = item.querySelector('input:last-of-type');
        if (keyInput && valueInput) {
            const key = keyInput.value.trim();
            const value = valueInput.value.trim();
            if (key) urlObj.searchParams.append(key, value);
        }
    });
    console.log('URL with Params:', urlObj.toString());

    const authTypeSelected = document.getElementById('auth-type')?.value;
    if (authTypeSelected === 'basic') {
        const username = document.getElementById('basic-username')?.value;
        const password = document.getElementById('basic-password')?.value;
        if (username && password) {
            finalHeaders['Authorization'] = 'Basic ' + btoa(username + ':' + password);
        }
    } else if (authTypeSelected === 'bearer') {
        const token = document.getElementById('bearer-token')?.value;
        if (token) {
            finalHeaders['Authorization'] = 'Bearer ' + token;
        }
    } else if (authTypeSelected === 'oauth2') {
        const token = document.getElementById('oauth-token')?.value;
        if (token) {
            finalHeaders['Authorization'] = 'Bearer ' + token;
        }
    }
    console.log('Final Headers:', finalHeaders);

    const sendRequestBtn = document.getElementById('send-request');
    if (!sendRequestBtn) {
        console.error('Send request button not found');
        return;
    }

    sendRequestBtn.disabled = true;
    sendRequestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    const responseDataEl = document.getElementById('response-data');
    if (responseDataEl) responseDataEl.textContent = 'Loading...';
    else console.error('Response data element not found');

    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.textContent = '--';
    else console.error('Status element not found');

    const responseTimeEl = document.getElementById('response-time');
    if (responseTimeEl) responseTimeEl.textContent = '--';
    else console.error('Response time element not found');

    const responseSizeEl = document.getElementById('response-size');
    if (responseSizeEl) responseSizeEl.textContent = '--';
    else console.error('Response size element not found');

    const headersTableBody = document.querySelector('#response-headers-table tbody');
    if (headersTableBody) headersTableBody.innerHTML = '';
    else console.error('Response headers table body not found');

    const startTime = Date.now();

    try {
        console.log(`Fetching: ${urlObj.toString()}`);
        const fetchOptions = {
            method,
            headers: finalHeaders,
            body: body ? body : undefined,
            mode: 'cors',
            credentials: 'omit'
        };
        console.log('Fetch Options:', fetchOptions);

        // Try direct request first
        try {
            const response = await fetch(urlObj.toString(), fetchOptions);
            console.log('Direct fetch successful');
            await handleResponse(response, { startTime, method, urlObj, finalHeaders });
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                console.log('Direct fetch failed, trying with CORS proxy...');
                // Show CORS error notification
                showNotification(`CORS Error: Try one of these solutions:
                    1. Enable CORS in your API
                    2. Use a CORS proxy
                    3. Run browser with disabled security`, 'warning', 10000);

                const proxyUrl = CORS_PROXY + urlObj.toString();
                const proxyResponse = await fetch(proxyUrl, {
                    ...fetchOptions,
                    headers: {
                        ...finalHeaders,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                await handleResponse(proxyResponse, { startTime, method, urlObj, finalHeaders });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Request failed:', error);
        handleRequestError(error);
    } finally {
        if (sendRequestBtn) {
            sendRequestBtn.disabled = false;
            sendRequestBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
        }
        console.log('sendRequest finished');
    }
}

async function handleResponse(response, { startTime, method, urlObj, finalHeaders }) {
    try {
        // Parse the response based on content type
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType?.includes('application/json')) {
            data = await response.json();
        } else if (contentType?.includes('text/')) {
            data = await response.text();
        } else {
            data = await response.text(); // Default to text
        }

        // Update UI with response data
        const status = document.getElementById('status');
        const responseTime = document.getElementById('response-time');
        const responseSize = document.getElementById('response-size');
        const responseData = document.getElementById('response-data');
        const headersTableBody = document.querySelector('#response-headers-table tbody');

        if (status) status.textContent = response.status;
        if (responseTime) responseTime.textContent = Date.now() - startTime;
        if (responseSize && data) {
            const size = (new TextEncoder().encode(JSON.stringify(data)).length / 1024).toFixed(2);
            responseSize.textContent = size;
        }
        if (responseData) {
            if (typeof data === 'object') {
                responseData.textContent = JSON.stringify(data, null, 2);
            } else {
                responseData.textContent = data;
            }
        }

        if (headersTableBody) {
            headersTableBody.innerHTML = ''; // Clear existing headers
            response.headers.forEach((value, key) => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td>`;
                headersTableBody.appendChild(row);
            });
        } else {
            console.error('Response headers table body not found');
        }

        // Store response in global state for filters and preview
        window.appState.lastResponse = data;

        // Update filter fields with the new data
        try {
            if (typeof window.updateFilterFieldOptions === 'function') {
                window.updateFilterFieldOptions(data);
                console.log('Updated filter fields with new data structure');
                // Ensure response area is updated as filter UI expects
                if (typeof window.setFilterData === 'function') {
                    window.setFilterData(data);
                }
                if (typeof window.applyAllFilters === 'function') {
                    window.applyAllFilters();
                }
            } else {
                import('../ui/filters.js').then(module => {
                    if (module.updateFilterFieldOptions) {
                        window.updateFilterFieldOptions = module.updateFilterFieldOptions;
                        module.updateFilterFieldOptions(data);
                        if (typeof window.setFilterData === 'function') {
                            window.setFilterData(data);
                        }
                        if (typeof window.applyAllFilters === 'function') {
                            window.applyAllFilters();
                        }
                        console.log('Filter fields updated dynamically');
                    }
                }).catch(err => console.error('Error importing filters module:', err));
            }
        } catch (error) {
            console.error('Error updating filter fields:', error);
        }

        // Use smart filters if available
        try {
            if (typeof window.setSmartFilterData === 'function') {
                window.setSmartFilterData(data);
                console.log('Smart filter data analysis started');
            } else {
                // Dynamically import smart filters
                import('../ui/smartFilters.js').then(module => {
                    if (module.setSmartFilterData) {
                        window.setSmartFilterData = module.setSmartFilterData;
                        module.setSmartFilterData(data);
                        console.log('Smart filter module loaded and analysis started');
                    }
                }).catch(err => console.error('Error importing smart filters:', err));
            }
        } catch (error) {
            console.error('Error setting smart filter data:', error);
        }

        // Update preview if needed
        try {
            if (typeof window.updatePreview === 'function') {
                window.updatePreview(data);
            }
        } catch (error) {
            console.error('Error updating preview:', error);
        }

        // Store the response in history with all required fields
        const historyEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            method,
            url: urlObj.toString(),
            status: response.status,
            time: Date.now() - startTime,
            responseSize: (new TextEncoder().encode(JSON.stringify(data)).length / 1024).toFixed(2),
            request: {
                headers: finalHeaders,
                body: body || null
            },
            response: {
                headers: Object.fromEntries(response.headers.entries()),
                body: data
            }
        };

        // Save to localStorage
        const historyData = JSON.parse(localStorage.getItem('requestHistory')) || [];
        historyData.push(historyEntry);
        localStorage.setItem('requestHistory', JSON.stringify(historyData));

    } catch (error) {
        console.error('Error handling response:', error);
        showNotification('Error processing response: ' + error.message, 'error');
    }
}

function handleRequestError(error) {
    const responseDataEl = document.getElementById('response-data');
    const statusEl = document.getElementById('status');

    if (responseDataEl) {
        responseDataEl.textContent = `Error: ${error.message}\n\nPossible solutions:\n` +
            '1. Check if the API allows CORS\n' +
            '2. Add required headers (e.g., Authorization)\n' +
            '3. Verify the API endpoint is correct and accessible';
    }

    if (statusEl) {
        statusEl.textContent = 'Error';
        statusEl.className = 'status-code status-5xx';
    }

    showNotification(`Request failed: ${error.message}`, 'error');
}
