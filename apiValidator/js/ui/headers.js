export function initHeaderFunctionality() {
    const addHeaderBtn = document.querySelector('.add-header');
    const headerList = document.querySelector('.header-list');

    if (addHeaderBtn && headerList) {
        addHeaderBtn.addEventListener('click', () => {
            const headerItem = document.createElement('div');
            headerItem.className = 'header-item';
            headerItem.innerHTML = `
                <input type="text" placeholder="Key" />
                <input type="text" placeholder="Value" />
                <button class="remove-btn"><i class="fas fa-times"></i></button>
            `;

            headerList.appendChild(headerItem);

            headerItem.querySelector('.remove-btn').addEventListener('click', () => {
                headerItem.remove();
            });
        });
    }
}
