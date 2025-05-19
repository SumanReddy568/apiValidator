export function initTabSwitching() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabContainer = tab.closest('.tab-container');
            const tabName = tab.getAttribute('data-tab');

            // Remove active class from all tabs and panes in this container
            tabContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tabContainer.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            // Add active class to clicked tab and corresponding pane
            tab.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}
