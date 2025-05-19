import { escapeHtml } from '../utils/escaping.js';

export function initPreview() {
    // Preview tab initialization if needed
}

export function updatePreviewTab(data) {
    const previewContainer = document.getElementById('preview-container');
    if (!previewContainer) {
        console.error('Preview container not found');
        return;
    }
    if (data === null || data === undefined) {
        previewContainer.innerHTML = 'No preview available.';
        return;
    }
    try {
        if (typeof data === 'object') {
            // Basic tree view for objects/arrays
            const treeHtml = createTreeView(data);
            previewContainer.innerHTML = treeHtml;
        } else {
            previewContainer.textContent = String(data);
        }
    } catch (e) {
        console.error('Error updating preview tab:', e);
        previewContainer.textContent = 'Error generating preview.';
    }
}

function createTreeView(obj, depth = 0) {
    if (depth > 5) return Array.isArray(obj) ? '[...]' : '{...}'; // Limit depth

    let html = '';
    if (Array.isArray(obj)) {
        html += '<ul class="preview-array">';
        obj.forEach((item, index) => {
            html += `<li><span class="preview-index">[${index}]:</span> ${createTreeView(item, depth + 1)}</li>`;
        });
        html += '</ul>';
    } else if (typeof obj === 'object' && obj !== null) {
        html += '<ul class="preview-object">';
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                html += `<li><span class="preview-key">${escapeHtml(key)}:</span> ${createTreeView(obj[key], depth + 1)}</li>`;
            }
        }
        html += '</ul>';
    } else {
        html += formatPreviewValue(obj);
    }
    return html;
}

function formatPreviewValue(value) {
    if (value === null) return '<span class="preview-null">null</span>';
    if (value === undefined) return '<span class="preview-undefined">undefined</span>';

    switch (typeof value) {
        case 'string':
            return `<span class="preview-string">"${escapeHtml(value)}"</span>`;
        case 'number':
            return `<span class="preview-number">${value}</span>`;
        case 'boolean':
            return `<span class="preview-boolean">${value}</span>`;
        case 'object':
            if (Array.isArray(value)) {
                if (value.length === 0) return '[]';
                return `Array(${value.length})`;
            }
            return `{...}`; // Or handle nested objects differently if needed
        default:
            return escapeHtml(String(value));
    }
}
