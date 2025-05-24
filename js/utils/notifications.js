/**
 * Simplified notification utility - only for error notifications
 */

/**
 * Show an error notification
 * @param {string} message - The error message to display
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
export function showNotification(message, type = null, duration = 4000) {
    // Only show notifications for errors
    if (type !== 'error') return;

    const container = document.getElementById('notification-container');
    if (!container) return;

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';

    // Build notification HTML
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-times-circle"></i>
        </div>
        <div class="notification-content">${message}</div>
        <div class="notification-close">
            <i class="fas fa-times"></i>
        </div>
    `;

    // Add to container
    container.appendChild(notification);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeNotification(notification);
        });
    }

    // Make it visible with animation
    setTimeout(() => {
        notification.classList.add('visible');
    }, 10);

    // Auto-hide after duration
    const timerId = setTimeout(() => {
        closeNotification(notification);
    }, duration);

    // Store timer ID to allow cancellation
    notification.dataset.timerId = timerId;

    return notification;
}

/**
 * Close a notification
 * @param {Element} notification - The notification element
 */
function closeNotification(notification) {
    // Clear timer if exists
    if (notification.dataset.timerId) {
        clearTimeout(parseInt(notification.dataset.timerId));
    }

    // Start fade out
    notification.classList.remove('visible');

    // Remove after animation
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300); // Match transition duration
}

// Expose globally for other modules
window.showNotification = showNotification;
