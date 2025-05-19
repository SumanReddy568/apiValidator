export function initParameterFunctionality() {
    const addParamBtn = document.querySelector('.add-param');
    const paramList = document.querySelector('.param-list');

    if (addParamBtn && paramList) {
        addParamBtn.addEventListener('click', () => {
            const paramItem = document.createElement('div');
            paramItem.className = 'param-item';
            paramItem.innerHTML = `
                <input type="text" placeholder="Key" />
                <input type="text" placeholder="Value" />
                <button class="remove-btn"><i class="fas fa-times"></i></button>
            `;

            paramList.appendChild(paramItem);

            paramItem.querySelector('.remove-btn').addEventListener('click', () => {
                paramItem.remove();
            });
        });
    }
}
