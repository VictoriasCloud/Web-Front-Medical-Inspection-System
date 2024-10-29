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
    

    // Функция для отрисовки осмотров
    function renderInspections() {
        const inspectionsList = document.getElementById('inspectionsList');
        inspectionsList.innerHTML = ''; // Очищаем список перед добавлением новых осмотров

        const row = document.createElement('div');
        row.className = 'row';

        inspectionsData.forEach((inspection, index) => {
            renderInspection(row, inspection);

            // Если элемент последний и нечётный, добавляем пустую ячейку
            // if ((index + 1) % 2 !== 0 && index === inspectionsData.length - 1) {
            //     const emptyCol = document.createElement('div');
            //     emptyCol.className = 'col-md-6 col-12 mb-4 invisible'; // Пустая невидимая ячейка
            //     emptyCol.innerHTML = `<div class="card bg-light border-0"></div>`;
            //     row.appendChild(emptyCol);
            // }
        });

        inspectionsList.appendChild(row);
    }

// Функция для отрисовки одного осмотра
function renderInspection(row, inspection) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-12 mb-4';

    // Увеличение отступа для дочерних осмотров
    const marginLeft = inspection.isChild ? '50px' : '0';

    if (inspection.isEmpty) {
        col.innerHTML = `<div class="card h-100 bg-light border-0" style="visibility:hidden; height: 0;"></div>`;
    } else {
        const date = new Date(inspection.date).toLocaleDateString();
        const conclusion = inspection.conclusion || 'Не указано';
        const diagnosis = inspection.diagnosis ? `${inspection.diagnosis.code} - ${inspection.diagnosis.name}` : 'Не указано';
        const doctor = inspection.doctor || 'Не указано';

        col.innerHTML = `
            <div class="card h-100 bg-light inspection-card" data-inspection-id="${inspection.id}" style="margin-left: ${marginLeft}">
                <div class="card-body">
                    <h5 class="card-title">${date} - ${conclusion}</h5>
                    <p class="card-text"><strong>Основной диагноз:</strong> ${diagnosis}</p>
                    <p class="card-text"><strong>Медицинский работник:</strong> ${doctor}</p>
                    <p class="card-text"><strong>Заключение:</strong> ${conclusion}</p>
                    <a href="#" class="btn btn-primary">Детали осмотра</a>
                </div>
            </div>`;

        if (filterGrouped && inspection.hasChain) {
            const chainButton = document.createElement('button');
            chainButton.className = 'btn btn-link';
            const isExpanded = inspection.isExpanded || false;
            chainButton.textContent = isExpanded ? '- Скрыть повторные осмотры' : '+ Показать повторные осмотры';
            chainButton.setAttribute('data-expanded', isExpanded.toString());
            chainButton.addEventListener('click', () => {
                toggleChildInspections(inspection.id, chainButton);
            });
            col.querySelector('.card-body').appendChild(chainButton);
        }
    }

    row.appendChild(col);
}

    // Функция для отображения или скрытия дочерних осмотров
    function toggleChildInspections(inspectionId, chainButton) {
        const isExpanded = chainButton.getAttribute('data-expanded') === 'true';

        if (isExpanded) {
            hideChildInspections(inspectionId, chainButton);
        } else {
            loadChildInspections(inspectionId, chainButton);
        }
    }

    // Загрузка дочерних осмотров
    function loadChildInspections(inspectionId, chainButton) {
        const authToken = localStorage.getItem('authToken');

        if (!inspectionId) {
            console.error('Отсутствует идентификатор осмотра для загрузки дочерних элементов');
            return;
        }

        fetch(`${apiBaseUrl}/api/inspection/${inspectionId}/chain`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(childInspections => {
            addChildInspections(inspectionId, childInspections);
            const parentIndex = inspectionsData.findIndex(item => item.id === inspectionId);
            if (parentIndex !== -1) {
                inspectionsData[parentIndex].isExpanded = true;
            }
            chainButton.textContent = '- Скрыть повторные осмотры';
            chainButton.setAttribute('data-expanded', 'true');
            renderInspections(); // Обновляем таблицу после загрузки дочерних элементов
        })
        .catch(error => console.error('Ошибка загрузки повторных осмотров:', error));
    }

// Function to add child inspections without unnecessary shifting
function addChildInspections(parentId, childInspections) {
    const parentIndex = inspectionsData.findIndex(item => item.id === parentId);

    if (parentIndex !== -1) {
        childInspections.forEach((child, index) => {
            child.isChild = true;
            child.previousId = parentId;

            // Calculate where to insert the child
            let insertionIndex = parentIndex + (index + 1) * 2;  // Keep gaps for empty cells

            // If the position already has an empty cell, use it
            if (inspectionsData[insertionIndex] && inspectionsData[insertionIndex].isEmpty) {
                inspectionsData[insertionIndex] = child;  // Replace empty cell with child inspection
            } else {
                // Add a new empty cell before inserting the child if needed
                if (!inspectionsData[insertionIndex]) {
                    inspectionsData.push({ id: `empty-${parentId}-${index}`, isEmpty: true, parentId: parentId });
                }
                // Insert the child at the calculated position
                inspectionsData.splice(insertionIndex, 0, child);
            }
        });
    }
}

// Function to hide child inspections and ensure empty cells are correctly handled
function hideChildInspections(inspectionId, chainButton) {
    inspectionsData = inspectionsData.filter(item => {
        // Keep only those that don't belong to the current parent
        return !(item.previousId === inspectionId || (item.isEmpty && item.parentId === inspectionId));
    });

    const parentIndex = inspectionsData.findIndex(item => item.id === inspectionId);
    if (parentIndex !== -1) {
        inspectionsData[parentIndex].isExpanded = false;
    }
    chainButton.textContent = '+ Показать повторные осмотры';
    chainButton.setAttribute('data-expanded', 'false');
    renderInspections();  // Re-render the inspections after hiding children
}




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
