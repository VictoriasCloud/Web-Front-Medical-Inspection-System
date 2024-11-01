// URL и токен, если они глобально определены в основном файле
const apiBaseUrl = 'https://mis-api.kreosoft.space';
const authToken = localStorage.getItem('authToken');

// Контейнер для чекбоксов ICD-10
const icd10Container = document.getElementById('icd10-container');

// Загрузка ICD-10 опций
function loadIcd10Options() {
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

        const selectedICD10 = getQueryParam('icdRoots', '').split(',');
        selectedICD10.forEach(icdRoot => {
            const checkbox = document.getElementById(icdRoot);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    })
    .catch(error => console.error('Ошибка загрузки диагнозов МКБ-10:', error));
}

// Функция для получения выбранных значений ICD-10
function getSelectedIcd10() {
    const selectedCheckboxes = document.querySelectorAll('#icd10-container input[type="checkbox"]:checked');
    return Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
}

// Функция для получения параметров из URL
function getQueryParam(param, defaultValue) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has(param) ? urlParams.get(param) : defaultValue;
}

// Экспорт функций на глобальный объект window
window.loadIcd10Options = loadIcd10Options;
window.getSelectedIcd10 = getSelectedIcd10;
window.getQueryParam = getQueryParam;
