import { syntaxHighlight } from '../utils/formatting.js';

export function initFormatToggle() {
    const prettyPrint = document.getElementById('pretty-print');
    const rawView = document.getElementById('raw-view');

    if (prettyPrint && rawView) {
        prettyPrint.addEventListener('click', () => {
            prettyPrint.classList.add('active');
            rawView.classList.remove('active');
            window.appState.prettyPrintEnabled = true;
            if (window.appState.lastResponse) formatResponse(true);
        });

        rawView.addEventListener('click', () => {
            rawView.classList.add('active');
            prettyPrint.classList.remove('active');
            window.appState.prettyPrintEnabled = false;
            if (window.appState.lastResponse) formatResponse(false);
        });
    }
}

export function formatResponse(prettyPrint) {
    const responseData = document.getElementById('response-data');
    if (!responseData || !window.appState.lastResponse) {
        if (responseData) responseData.textContent = 'No response data';
        return;
    }

    try {
        if (typeof window.appState.lastResponse === 'object') {
            responseData.innerHTML = prettyPrint ?
                syntaxHighlight(JSON.stringify(window.appState.lastResponse, null, 4)) :
                JSON.stringify(window.appState.lastResponse);
        } else {
            responseData.textContent = String(window.appState.lastResponse);
        }
    } catch (e) {
        console.error('Format error:', e);
        responseData.textContent = 'Error formatting response';
    }
}
