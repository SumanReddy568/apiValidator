import { escapeHtml } from '../utils/escaping.js';

export function initHistoryPanel() {
    // History panel toggle
    const historyPanel = document.querySelector('.history-panel');
    document.addEventListener('keydown', function (e) {
        if (e.key === 'h' && e.ctrlKey) {
            historyPanel.classList.toggle('open');
            e.preventDefault();
        }
    });

    // Show/hide history panel
    const logoElement = document.querySelector('.logo');
    if (logoElement) {
        logoElement.addEventListener('dblclick', () => {
            const historyPanel = document.querySelector('.history-panel');
            if (historyPanel) {
                historyPanel.classList.toggle('open');
            }
        });
    }

    // Clear history
    const clearHistoryBtn = document.getElementById('clear-history');
    const historyList = document.getElementById('history-list');

    if (clearHistoryBtn && historyList) {
        clearHistoryBtn.addEventListener('click', () => {
            localStorage.removeItem('apiRequestHistory');
            historyList.innerHTML = '';
        });
    }
}

export function loadHistory() {
    const history = JSON.parse(localStorage.getItem('apiRequestHistory')) || [];
    const historyList = document.getElementById('history-list');

    if (!historyList) return;

    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-history">No request history yet</div>';
        return;
    }

    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        // Format timestamp
        const date = new Date(item.timestamp);
        const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        // Set status color class
        let statusClass = '';
        if (item.status >= 100 && item.status < 200) statusClass = 'status-1xx';
        else if (item.status >= 200 && item.status < 300) statusClass = 'status-2xx';
        else if (item.status >= 300 && item.status < 400) statusClass = 'status-3xx';
        else if (item.status >= 400 && item.status < 500) statusClass = 'status-4xx';
        else if (item.status >= 500) statusClass = 'status-5xx';

        historyItem.innerHTML = `
            <span class="history-method ${item.method.toLowerCase()}">${item.method}</span>
            <div class="history-url">${escapeHtml(item.url)}</div>
            <div class="history-details">
                <span class="history-status ${statusClass}">${item.status}</span>
                <span class="history-time">${formattedDate} ${formattedTime} - ${item.time}ms</span>
            </div>
        `;

        historyItem.addEventListener('click', () => {
            document.getElementById('request-method').value = item.method;
            document.getElementById('request-url').value = item.url;
            const historyPanel = document.querySelector('.history-panel');
            if (historyPanel) historyPanel.classList.remove('open');
        });

        historyList.appendChild(historyItem);
    });
}

export function addToHistory(method, url, status, time) {
    let history = JSON.parse(localStorage.getItem('apiRequestHistory')) || [];

    // Limit history to 50 items
    if (history.length >= 50) {
        history.pop();
    }

    const requestItem = {
        method,
        url,
        status,
        time,
        timestamp: Date.now()
    };

    history.unshift(requestItem);
    localStorage.setItem('apiRequestHistory', JSON.stringify(history));

    loadHistory();
}
