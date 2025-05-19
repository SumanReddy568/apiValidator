import { showNotification } from '../utils/notifications.js';
import { escapeHtml } from '../utils/escaping.js';
import { sendRequest } from './sendRequest.js';

export function initCurlImport() {
    const curlImportBtn = document.getElementById('import-curl');
    const curlModal = document.getElementById('curl-import-modal');
    const curlInputArea = document.getElementById('curl-input-area');
    const modalImportSendBtn = document.getElementById('modal-import-send-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    function showCurlModal() {
        if (curlModal) {
            curlModal.classList.add('visible');
            if (curlInputArea) curlInputArea.value = ''; // Clear previous input
            if (curlInputArea) curlInputArea.focus();
        }
    }

    function hideCurlModal() {
        if (curlModal) {
            curlModal.classList.remove('visible');
        }
    }

    if (curlImportBtn) {
        curlImportBtn.addEventListener('click', showCurlModal);
    }

    if (modalImportSendBtn) {
        modalImportSendBtn.addEventListener('click', async () => {
            if (!curlInputArea) return;
            const curlCommand = curlInputArea.value.trim();
            if (!curlCommand) {
                showNotification('Please paste a cURL command.', 'warning');
                return;
            }

            try {
                const parsedCurl = parseCurlCommand(curlCommand);
                populateRequestFields(parsedCurl);
                hideCurlModal();
                showNotification('cURL command imported. Sending request...', 'info');
                await sendRequest(); // Automatically send the request
            } catch (error) {
                console.error('Error processing cURL command:', error);
                showNotification(`Invalid cURL command: ${error.message}`, 'error');
                // Optionally, keep the modal open or clear the input
            }
        });
    }

    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', hideCurlModal);
    }
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', hideCurlModal);
    }
    // Hide modal if overlay is clicked
    if (curlModal) {
        curlModal.addEventListener('click', (event) => {
            if (event.target === curlModal) {
                hideCurlModal();
            }
        });
    }
}

function parseCurlCommand(curl) {
    const result = {
        method: 'GET',
        url: '',
        headers: {},
        body: null,
    };

    // Remove line continuations (backslash followed by newline)
    const singleLineCurl = curl.replace(/\\\r?\n\s*/g, ' ');

    const curlParts = singleLineCurl.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g); // Improved regex to handle single and double quotes
    if (!curlParts || curlParts[0].toLowerCase() !== 'curl') {
        throw new Error('Not a valid cURL command (must start with "curl")');
    }

    for (let i = 1; i < curlParts.length; i++) {
        let part = curlParts[i];
        // Remove surrounding single or double quotes from the part itself
        if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
            part = part.substring(1, part.length - 1);
        }

        if (part === '-X' || part === '--request') {
            if (i + 1 < curlParts.length) {
                result.method = curlParts[++i].replace(/^['"]|['"]$/g, '');
            } else {
                throw new Error(`Flag ${part} requires an argument.`);
            }
        } else if (part === '-H' || part === '--header') {
            if (i + 1 < curlParts.length) {
                let headerLine = curlParts[++i];
                // Remove surrounding single or double quotes from the header line
                if ((headerLine.startsWith('"') && headerLine.endsWith('"')) || (headerLine.startsWith("'") && headerLine.endsWith("'"))) {
                    headerLine = headerLine.substring(1, headerLine.length - 1);
                }

                const colonIndex = headerLine.indexOf(':');
                if (colonIndex > 0) {
                    const key = headerLine.substring(0, colonIndex).trim();
                    const value = headerLine.substring(colonIndex + 1).trim();
                    result.headers[key] = value;
                } else {
                    console.warn(`Malformed header: ${headerLine}`);
                }
            } else {
                throw new Error(`Flag ${part} requires an argument.`);
            }
        } else if (part === '--data' || part === '--data-raw' || part === '--data-binary' || part === '-d') {
            if (i + 1 < curlParts.length) {
                let bodyData = curlParts[++i];
                if ((bodyData.startsWith('"') && bodyData.endsWith('"')) || (bodyData.startsWith("'") && bodyData.endsWith("'"))) {
                    bodyData = bodyData.substring(1, bodyData.length - 1);
                }
                result.body = bodyData;
            } else {
                throw new Error(`Flag ${part} requires an argument.`);
            }
        } else if (part === '-b' || part === '--cookie') {
            if (i + 1 < curlParts.length) {
                let cookieString = curlParts[++i];
                if ((cookieString.startsWith('"') && cookieString.endsWith('"')) || (cookieString.startsWith("'") && cookieString.endsWith("'"))) {
                    cookieString = cookieString.substring(1, cookieString.length - 1);
                }
                result.headers['Cookie'] = cookieString;
            } else {
                throw new Error(`Flag ${part} requires an argument.`);
            }
        } else if (!part.startsWith('-') && !result.url) {
            // Part is already cleaned of surrounding quotes at the beginning of the loop
            result.url = part;
        } else if ((part.startsWith('http://') || part.startsWith('https://')) && !result.url) {
            // Part is already cleaned
            result.url = part;
        }
        // Other flags like -L, -i, -s, etc., are ignored for now
    }

    if (!result.url) {
        // Try to find URL as the last part if not identified
        for (let j = curlParts.length - 1; j > 0; j--) {
            let potentialUrl = curlParts[j];
            if ((potentialUrl.startsWith('"') && potentialUrl.endsWith('"')) || (potentialUrl.startsWith("'") && potentialUrl.endsWith("'"))) {
                potentialUrl = potentialUrl.substring(1, potentialUrl.length - 1);
            }
            if (!potentialUrl.startsWith('-') && (potentialUrl.includes('http://') || potentialUrl.includes('https://') || potentialUrl.includes('.'))) {
                // A simple check, might need refinement
                if (j > 0 && !['-X', '--request', '-H', '--header', '--data', '--data-raw', '--data-binary', '-d', '-b', '--cookie'].includes(curlParts[j - 1])) {
                    result.url = potentialUrl;
                    break;
                }
            }
        }
    }

    if (!result.url) {
        throw new Error('URL is missing or could not be identified in the cURL command');
    }

    return result;
}

function populateRequestFields(parsedCurl) {
    const methodSelect = document.getElementById('request-method');
    const urlInput = document.getElementById('request-url');
    const headerList = document.querySelector('.header-list');
    const bodyContent = document.getElementById('body-content');

    if (methodSelect) methodSelect.value = parsedCurl.method;
    if (urlInput) urlInput.value = parsedCurl.url;

    if (headerList) {
        headerList.innerHTML = ''; // Clear existing headers
        Object.entries(parsedCurl.headers).forEach(([key, value]) => {
            const headerItem = document.createElement('div');
            headerItem.className = 'header-item';
            // Use escapeHtml for keys and values to prevent potential XSS if they somehow contained HTML
            headerItem.innerHTML = `
                <input type="text" placeholder="Key" value="${escapeHtml(key)}" />
                <input type="text" placeholder="Value" value="${escapeHtml(value)}" />
                <button class="remove-btn"><i class="fas fa-times"></i></button>
            `;
            headerItem.querySelector('.remove-btn').addEventListener('click', () => {
                headerItem.remove();
            });
            headerList.appendChild(headerItem);
        });
    }

    if (bodyContent && parsedCurl.body) {
        bodyContent.value = parsedCurl.body;
    }
}
