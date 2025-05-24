// ...existing code...

/**
 * Render the history table with the given data
 */
function renderHistoryTable(historyData) {
    const tableBody = document.getElementById('history-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!historyData || historyData.length === 0) {
        const container = document.querySelector('.history-table-container');
        if (container) {
            container.style.display = 'none';
        }

        const noHistoryMessage = document.createElement('div');
        noHistoryMessage.className = 'no-history-message';
        noHistoryMessage.innerHTML = `
            <i class="fas fa-history fa-3x"></i>
            <p>No request history found.</p>
        `;

        const parentContainer = document.querySelector('.history-card .tab-content');
        if (parentContainer) {
            parentContainer.appendChild(noHistoryMessage);
        }
        return;
    }

    historyData.forEach(item => {
        const row = document.createElement('tr');

        // Create method cell
        const methodCell = document.createElement('td');
        methodCell.className = 'method-cell';
        const methodBadge = document.createElement('span');
        methodBadge.className = `method-badge ${item.method ? item.method.toLowerCase() : 'unknown'}`;
        methodBadge.textContent = item.method || 'UNKNOWN';
        methodCell.appendChild(methodBadge);

        // Create URL cell
        const urlCell = document.createElement('td');
        urlCell.className = 'url-cell';
        urlCell.textContent = item.url || 'N/A';

        // Create status cell
        const statusCell = document.createElement('td');
        statusCell.className = 'status-cell';
        if (item.status) {
            const statusClass = `status-${Math.floor(item.status / 100)}xx`;
            statusCell.innerHTML = `<span class="status-code ${statusClass}">${item.status}</span>`;
        } else {
            statusCell.textContent = 'N/A';
        }

        // Create date and time cells
        const date = item.timestamp ? new Date(item.timestamp) : new Date();

        const dateCell = document.createElement('td');
        dateCell.className = 'date-cell';
        dateCell.textContent = date.toLocaleDateString();

        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.textContent = date.toLocaleTimeString();

        // Create actions cell
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions-cell';
        actionsCell.innerHTML = `
            <div class="history-actions">
                <button class="history-action-btn load-btn" title="Load request" data-id="${item.id}">
                    <i class="fas fa-arrow-right"></i>
                </button>
                <button class="history-action-btn view-btn" title="View details" data-id="${item.id}">
                    <i class="fas fa-search"></i>
                </button>
                <button class="history-action-btn delete delete-btn" title="Delete" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Append all cells to row
        row.appendChild(methodCell);
        row.appendChild(urlCell);
        row.appendChild(statusCell);
        row.appendChild(dateCell);
        row.appendChild(timeCell);
        row.appendChild(actionsCell);

        // Append row to table body
        tableBody.appendChild(row);
    });

    // ...existing code...
}

// ...existing code...