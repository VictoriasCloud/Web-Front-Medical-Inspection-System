document.addEventListener('DOMContentLoaded', function () {
    const authToken = localStorage.getItem('authToken');
    const apiBaseUrl = 'https://mis-api.kreosoft.space';
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');
    let inspectionsData = []; // Хранение данных осмотров
    let filterGrouped = true; // По умолчанию выбрано "Сгруппировать по повторным"
    const icd10Container = document.getElementById('icd10-container');

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
        })
        .catch(error => console.error('Ошибка загрузки диагнозов МКБ-10:', error));
    }

    // Функция для получения выбранных значений ICD-10
    function getSelectedIcd10() {
        const selectedCheckboxes = document.querySelectorAll('#icd10-container input[type="checkbox"]:checked');
        return Array.from(selectedCheckboxes).map(checkbox => checkbox.value); // Возвращаем массив ID выбранных диагнозов
    }

    // Функция для получения параметров из URL
    function getQueryParam(param, defaultValue) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has(param) ? urlParams.get(param) : defaultValue;
    }

    // Обновление URL без перезагрузки страницы
    function updateURL(params) {
        params.id = patientId;
        const urlParams = new URLSearchParams(params);
        window.history.pushState(null, '', `${window.location.pathname}?${urlParams.toString()}`);
    }

    // Очистка параметров URL от пустых значений
    function cleanParams(params) {
        Object.keys(params).forEach(key => {
            if (!params[key]) {
                delete params[key];
            }
        });
        return params;
    }

    // Загрузка данных пациента
    function loadPatientInfo() {
        fetch(`${apiBaseUrl}/api/patient/${patientId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('patientName').textContent = `${data.name}`;
            document.getElementById('patientDob').textContent = `Дата рождения: ${new Date(data.birthday).toLocaleDateString()}`;
        })
        .catch(error => console.error('Ошибка загрузки данных пациента:', error));
    }

    function loadInspections(page = 1) {
        const pageSize = document.getElementById('pageSize').value || 5;
        const selectedICD10 = getSelectedIcd10(); // Получаем выбранные значения с чекбоксов
        const grouped = filterGrouped;
        
        // Создаем URLSearchParams
        let params = new URLSearchParams({ 
            page, 
            size: pageSize, 
            grouped: grouped.toString() 
        });
        
        // Добавляем каждый выбранный icdRoot как отдельный параметр
        selectedICD10.forEach(icdRoot => params.append('icdRoots', icdRoot));
    
        fetch(`${apiBaseUrl}/api/patient/${patientId}/inspections?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            inspectionsData = data.inspections;
            renderInspections();  // Отрисовка осмотров
            setupPagination(data.pagination);  // Пагинация
        })
        .catch(error => console.error('Ошибка загрузки осмотров:', error));
    }

    function renderInspections() {
        const inspectionsList = document.getElementById('inspectionsList');
        inspectionsList.innerHTML = ''; // Очищаем список перед добавлением новых осмотров
    
        // Создаем контейнер и два столбца для осмотров
        const container = document.createElement('div');
        container.className = 'row'; // Контейнер Bootstrap для двух колонок
    
        const leftColumn = document.createElement('div');
        const rightColumn = document.createElement('div');
        leftColumn.className = 'col-12 col-md-6'; // Полная ширина на узких экранах, 50% на широких
        rightColumn.className = 'col-12 col-md-6';
    
        const half = Math.ceil(inspectionsData.length / 2);
    
        // Заполняем первый столбец
        inspectionsData.slice(0, half).forEach((inspection) => {
            const col = document.createElement('div');
            col.className = 'inspection-cell mb-4'; // Класс для отступов и фиксированного размера ячеек
            renderInspection(col, inspection, leftColumn);
        });
    
        // Заполняем второй столбец
        inspectionsData.slice(half).forEach((inspection) => {
            const col = document.createElement('div');
            col.className = 'inspection-cell mb-4';
            renderInspection(col, inspection, rightColumn);
        });
    
        container.appendChild(leftColumn);
        container.appendChild(rightColumn);
        inspectionsList.appendChild(container);
    }
    
// Изменённая функция для добавления осмотра с поддержкой уровня вложенности
function renderInspection(cell, inspection, columnContainer, level = 0) {
    const inspectionBlock = document.createElement('div');
    inspectionBlock.className = 'inspection-block d-flex flex-column justify-content-between h-100 p-3 bg-light border rounded';
    inspectionBlock.setAttribute('data-id', inspection.id); // Устанавливаем идентификатор для проверки

    // Устанавливаем отступ слева на основе уровня вложенности
    inspectionBlock.style.marginLeft = `${level * 30}px`;

    inspectionBlock.innerHTML = `
        <div>
            <h5>${new Date(inspection.date).toLocaleDateString()} - ${inspection.conclusion || 'Не указано'}</h5>
            <p><strong>Основной диагноз:</strong> ${inspection.diagnosis ? inspection.diagnosis.code + ' - ' + inspection.diagnosis.name : 'Не указано'}</p>
            <p><strong>Медицинский работник:</strong> ${inspection.doctor || 'Не указано'}</p>
            <p><strong>Заключение:</strong> ${inspection.conclusion || 'Не указано'}</p>
        </div>
        <div>
            <a href="#" class="btn btn-primary mt-auto">Детали осмотра</a>
        </div>`;

    // Добавляем кнопку для раскрытия дочерних осмотров
    if (filterGrouped && inspection.hasChain) {
        const chainButton = document.createElement('button');
        chainButton.className = 'btn btn-link';
        chainButton.textContent = inspection.isExpanded ? '- Скрыть повторные осмотры' : '+ Показать повторные осмотры';
        chainButton.addEventListener('click', () => {
            toggleChildInspections(inspection, cell, chainButton, columnContainer, level + 1); // Увеличиваем уровень вложенности
        });
        inspectionBlock.querySelector('div').appendChild(chainButton);
    }

    cell.appendChild(inspectionBlock);
    columnContainer.appendChild(cell);
}

// Переключение отображения дочерних осмотров с учётом уровня вложенности
function toggleChildInspections(inspection, parentCell, chainButton, columnContainer, level) {
    if (inspection.isExpanded) {
        hideChildInspections(inspection, chainButton, columnContainer);
    } else {
        loadChildInspections(inspection, parentCell, chainButton, columnContainer, level);
    }
}

// Загрузка дочерних осмотров с учётом уровня вложенности
function loadChildInspections(inspection, parentCell, chainButton, columnContainer, level) {
    fetch(`${apiBaseUrl}/api/inspection/${inspection.id}/chain`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(childInspections => {
        addChildInspections(inspection, childInspections, parentCell, columnContainer, level);
        inspection.isExpanded = true;
        chainButton.textContent = '- Скрыть повторные осмотры';
    })
    .catch(error => console.error('Ошибка загрузки повторных осмотров:', error));
}

// Добавление дочерних осмотров с учётом уровня вложенности
function addChildInspections(parentInspection, childInspections, parentCell, columnContainer, level) {
    let insertAfter = parentCell.nextSibling;

    childInspections.forEach(child => {
        const childCell = document.createElement('div');
        childCell.className = 'inspection-cell mb-4 child-inspection';
        childCell.setAttribute('data-parent-id', parentInspection.id); // Устанавливаем родительский ID
        renderInspection(childCell, child, columnContainer, level); // Передаём уровень вложенности

        columnContainer.insertBefore(childCell, insertAfter); // Вставляем дочерние осмотры сразу под родителем
    });
}

// Скрытие дочерних осмотров
function hideChildInspections(inspection, chainButton, columnContainer) {
    // Находим все дочерние элементы с атрибутом data-parent-id равным id родителя
    const childCells = columnContainer.querySelectorAll(`[data-parent-id="${inspection.id}"]`);
    childCells.forEach(child => child.remove()); // Удаляем все дочерние элементы
    inspection.isExpanded = false;
    chainButton.textContent = '+ Показать повторные осмотры';
}

    
// CSS для фиксированной высоты и ширины ячеек
const style = document.createElement('style');
style.innerHTML = `
    .inspection-cell {
        width: 100%;
        height: 400px; /* Фиксированная высота для каждой ячейки */
        display: flex;
        flex-direction: column;
    }
`;
document.head.appendChild(style);


    
    // Функция для настройки фильтров
    function setupFilters() {
        const filterOptions = document.getElementsByName('filterOption');
        filterOptions.forEach(option => {
            option.addEventListener('change', () => {
                filterGrouped = option.value === 'grouped';
                loadInspections(); // Перезагружаем данные при изменении фильтра
            });
        });

        document.getElementById('groupedOption').checked = true;
    }

    // Функция для установки пагинации
    function setupPagination(pagination) {
        const paginationElement = document.getElementById('pagination');
        paginationElement.innerHTML = ''; // Очищаем пагинацию

        const totalPages = pagination.count;
        const currentPage = pagination.current;
        const pageSize = getQueryParam('pageSize', 5);

        if (currentPage > 1) {
            const prevPageItem = document.createElement('li');
            prevPageItem.className = 'page-item';
            prevPageItem.innerHTML = `<a class="page-link" href="#">Предыдущая</a>`;
            prevPageItem.addEventListener('click', function (event) {
                event.preventDefault();
                loadInspections(currentPage - 1);
            });
            paginationElement.appendChild(prevPageItem);
        }

        for (let i = 1; i <= totalPages; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageItem.addEventListener('click', function (event) {
                event.preventDefault();
                loadInspections(i);
            });
            paginationElement.appendChild(pageItem);
        }

        if (currentPage < totalPages) {
            const nextPageItem = document.createElement('li');
            nextPageItem.className = 'page-item';
            nextPageItem.innerHTML = `<a class="page-link" href="#">Следующая</a>`;
            nextPageItem.addEventListener('click', function (event) {
                event.preventDefault();
                loadInspections(currentPage + 1);
            });
            paginationElement.appendChild(nextPageItem);
        }
    }

    // Обработка фильтра при нажатии на кнопку "Поиск"
    document.getElementById('filterBtn').addEventListener('click', function(event) {
        event.preventDefault();
        const selectedIcd10Ids = getSelectedIcd10();
        console.log('Выбранные диагнозы МКБ-10:', selectedIcd10Ids);

        // Далее используем selectedIcd10Ids для выполнения фильтрации осмотров
        loadInspections(1, selectedIcd10Ids); // Передаем выбранные диагнозы в функцию загрузки осмотров
    });

    loadIcd10Options();
    setupFilters();
    loadPatientInfo();
    loadInspections(getQueryParam('page', 1));
});
