import { escapeHtml } from '../utils/escaping.js';

/**
 * Preview functionality
 */

export function initPreview() {
    setupPreviewToggle();
}

/**
 * Set up preview toggle functionality - simplified to use a single toggle button
 */
function setupPreviewToggle() {
    const previewToggleBtn = document.getElementById('preview-toggle-btn');

    if (!previewToggleBtn) {
        console.error('Preview toggle button not found, might not be loaded yet');
        // Retry after a short delay
        setTimeout(setupPreviewToggle, 500);
        return;
    }

    let previewMode = false;

    // Set up button click handler
    previewToggleBtn.addEventListener('click', function () {
        previewMode = !previewMode;
        togglePreviewMode(previewMode);
    });
}

/**
 * Toggle preview mode on/off
 */
function togglePreviewMode(showPreview) {
    const previewToggleBtn = document.getElementById('preview-toggle-btn');
    const previewOverlay = document.getElementById('preview-overlay');

    if (!previewToggleBtn || !previewOverlay) return;

    if (showPreview) {
        // Show preview
        previewToggleBtn.classList.add('active');
        previewOverlay.style.display = 'block';
        // Generate preview content
        generatePreview();
        // Show notification
        if (window.showNotification) {
            window.showNotification('Switched to preview mode', 'info');
        }
    } else {
        // Show raw data
        previewToggleBtn.classList.remove('active');
        previewOverlay.style.display = 'none';
        // Show notification
        if (window.showNotification) {
            window.showNotification('Switched to raw data mode', 'info');
        }
    }
}

/**
 * Generate preview content from response data
 */
function generatePreview() {
    const previewOverlay = document.getElementById('preview-overlay');
    if (!previewOverlay) return;

    try {
        // Get response data from the global state
        const responseData = window.appState?.lastResponse;

        if (!responseData) {
            previewOverlay.innerHTML = '<div id="preview-container">No data available for preview</div>';
            return;
        }

        // Determine content type to decide how to render the preview
        const contentType = detectContentType(responseData);

        // Clear previous content
        previewOverlay.innerHTML = '';

        // Create new container
        const container = document.createElement('div');
        container.id = 'preview-container';

        // Render different previews based on content type
        if (contentType === 'json') {
            renderJsonPreview(container, responseData);
        } else if (contentType === 'html') {
            renderHtmlPreview(container, responseData);
        } else if (contentType === 'image') {
            renderImagePreview(container, responseData);
        } else {
            container.textContent = 'Preview not available for this content type';
        }

        previewOverlay.appendChild(container);

    } catch (err) {
        console.error('Error generating preview:', err);
        previewOverlay.innerHTML = '<div id="preview-container">Error generating preview</div>';
    }
}

/**
 * Detect content type of response data
 */
function detectContentType(data) {
    // Simple content type detection - can be improved
    if (typeof data === 'object') {
        return 'json';
    }

    if (typeof data === 'string') {
        if (data.trim().startsWith('<') && data.includes('</')) {
            return 'html';
        }

        // Try parsing as JSON
        try {
            JSON.parse(data);
            return 'json';
        } catch (e) {
            // Not JSON
        }
    }

    // Default
    return 'text';
}

/**
 * Render JSON preview
 */
function renderJsonPreview(container, data) {
    // Convert string to object if needed
    let jsonData = data;
    if (typeof data === 'string') {
        try {
            jsonData = JSON.parse(data);
        } catch (e) {
            container.textContent = 'Invalid JSON data';
            return;
        }
    }

    // Create interactive tree view
    if (Array.isArray(jsonData)) {
        renderArrayPreview(container, jsonData);
    } else {
        renderObjectPreview(container, jsonData);
    }
}

/**
 * Render object preview
 */
function renderObjectPreview(container, obj) {
    const list = document.createElement('ul');
    list.className = 'preview-object';

    for (const [key, value] of Object.entries(obj)) {
        const item = document.createElement('li');

        if (typeof value === 'object' && value !== null) {
            // Add expandable key
            const keySpan = document.createElement('span');
            keySpan.className = 'preview-key';
            keySpan.textContent = key + ': ';
            item.appendChild(keySpan);

            // Add value (recursively)
            if (Array.isArray(value)) {
                renderArrayPreview(item, value);
            } else {
                renderObjectPreview(item, value);
            }
        } else {
            // Simple key-value
            const keySpan = document.createElement('span');
            keySpan.className = 'preview-key';
            keySpan.textContent = key + ': ';
            item.appendChild(keySpan);

            const valueSpan = document.createElement('span');
            valueSpan.className = getValueClass(value);
            valueSpan.textContent = formatValue(value);
            item.appendChild(valueSpan);
        }

        list.appendChild(item);
    }

    container.appendChild(list);
}

/**
 * Render array preview
 */
function renderArrayPreview(container, arr) {
    const list = document.createElement('ul');
    list.className = 'preview-array';

    arr.forEach((value, index) => {
        const item = document.createElement('li');

        if (typeof value === 'object' && value !== null) {
            // Add expandable index
            const indexSpan = document.createElement('span');
            indexSpan.className = 'preview-index';
            indexSpan.textContent = `[${index}]: `;
            item.appendChild(indexSpan);

            // Add value (recursively)
            if (Array.isArray(value)) {
                renderArrayPreview(item, value);
            } else {
                renderObjectPreview(item, value);
            }
        } else {
            // Simple index-value
            const indexSpan = document.createElement('span');
            indexSpan.className = 'preview-index';
            indexSpan.textContent = `[${index}]: `;
            item.appendChild(indexSpan);

            const valueSpan = document.createElement('span');
            valueSpan.className = getValueClass(value);
            valueSpan.textContent = formatValue(value);
            item.appendChild(valueSpan);
        }

        list.appendChild(item);
    });

    container.appendChild(list);
}

/**
 * Render HTML preview
 */
function renderHtmlPreview(container, data) {
    // Create a safe iframe to render HTML
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    iframe.style.border = 'none';
    container.appendChild(iframe);

    // Write HTML content to iframe
    setTimeout(() => {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(data);
        doc.close();
    }, 10);
}

/**
 * Render image preview
 */
function renderImagePreview(container, data) {
    const img = document.createElement('img');
    img.src = data;
    img.style.maxWidth = '100%';
    container.appendChild(img);
}

/**
 * Get CSS class for value type
 */
function getValueClass(value) {
    if (value === null) return 'preview-null';
    if (value === undefined) return 'preview-undefined';

    switch (typeof value) {
        case 'string': return 'preview-string';
        case 'number': return 'preview-number';
        case 'boolean': return 'preview-boolean';
        default: return '';
    }
}

/**
 * Format value for display
 */
function formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    return String(value);
}

/**
 * Update preview when response data changes
 */
export function updatePreview(responseData) {
    // Store response data in global state
    if (window.appState) {
        window.appState.lastResponse = responseData;
    }

    // If preview is currently visible, regenerate it
    const previewOverlay = document.getElementById('preview-overlay');
    const previewToggleBtn = document.getElementById('preview-toggle-btn');

    if (previewOverlay && previewToggleBtn && previewToggleBtn.classList.contains('active')) {
        generatePreview();
    }

    // Update response display with filters applied
    if (window.applyAllFilters) {
        window.applyAllFilters();
    }
}
