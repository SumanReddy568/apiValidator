export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'info' ? 'info-circle' :
            type === 'success' ? 'check-circle' :
                type === 'warning' ? 'exclamation-triangle' :
                    'exclamation-circle'}"></i>
        </div>
        <div class="notification-message">${message}</div>
    `;

    document.body.appendChild(notification);

    // Show notification by adding visible class
    setTimeout(() => notification.classList.add('visible'), 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
