// Main application entry point
import { initFormatToggle, formatResponse } from './ui/formatToggle.js';
import { initTabSwitching } from './ui/tabSwitching.js';
import { initHeaderFunctionality } from './ui/headers.js';
import { initParameterFunctionality } from './ui/parameters.js';
import { initAuthFunctionality } from './ui/auth.js';
import { initFilterFunctionality } from './ui/filters.js';
import { initHistoryPanel, loadHistory } from './features/history.js';
import { initCurlImport } from './features/curlImport.js';
import { initSendRequest } from './features/sendRequest.js';
import { initPreview } from './ui/preview.js';
import { initSearch } from './ui/search.js';
import { initFilterModal, setFilterData } from './ui/filterModal.js';

// Global state (accessible to all modules)
window.appState = {
    lastResponse: null,
    prettyPrintEnabled: true
};

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

document.addEventListener('DOMContentLoaded', function() {
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
    initFilterModal();

    // Load history from localStorage
    loadHistory();

    // Handle docs dropdown
    const docsBtn = document.getElementById('docs-btn');
    const docsContent = document.querySelector('.docs-content');
    
    if (docsBtn && docsContent) {
        docsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            docsContent.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!docsContent.contains(e.target) && e.target !== docsBtn) {
                docsContent.classList.remove('show');
            }
        });
    }

    // Update the response handling to include filter data setup
    async function handleResponse(response) {
        // ...existing response handling code...
        
        try {
            // Parse response data
            const data = await response.json();
            
            // Set filter data
            setFilterData(data);
            
            // ...rest of response handling...
        } catch (error) {
            console.error('Error parsing response:', error);
            // Handle error appropriately
        }
    }
});
