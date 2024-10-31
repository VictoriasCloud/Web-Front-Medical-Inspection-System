// icd10.js

export function loadIcd10Options(authToken, apiBaseUrl, icd10Container, selectedIcd10FromURL) {
    fetch(`${apiBaseUrl}/api/dictionary/icd10/roots`, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        data.forEach(item => {
            const checkboxWrapper = document.createElement('div');
            checkboxWrapper.className = 'form-check';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input';
            checkbox.id = item.id;
            checkbox.value = item.id;

            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.setAttribute('for', item.id);
            label.textContent = `${item.code} - ${item.name}`;

            checkboxWrapper.appendChild(checkbox);
            checkboxWrapper.appendChild(label);
            icd10Container.appendChild(checkboxWrapper);
        });

        // После загрузки отмечаем чекбоксы, если icdRoots передан в URL
        selectedIcd10FromURL.forEach(icdRoot => {
            const checkbox = document.getElementById(icdRoot);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    })
    .catch(error => console.error('Ошибка загрузки диагнозов МКБ-10:', error));
}

export function getSelectedIcd10(icd10Container) {
    if (!icd10Container) return []; // Проверка, что контейнер определен
    const selectedCheckboxes = icd10Container.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(selectedCheckboxes).map(checkbox => checkbox.value); // Возвращаем массив ID выбранных диагнозов
}
