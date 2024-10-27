document.addEventListener('DOMContentLoaded', function () {
    const authToken = localStorage.getItem('authToken');
    const apiBaseUrl = 'https://mis-api.kreosoft.space';
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');
    let inspectionsData = []; // Хранение данных осмотров
    let filterGrouped = true; // По умолчанию выбрано "Сгруппировать по повторным"

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

    // Загрузка осмотров пациента
    function loadInspections(page = 1) {
        const pageSize = document.getElementById('pageSize').value || getQueryParam('pageSize', 5);
        const icd10 = document.getElementById('icd10').value || getQueryParam('icd10', '');

        // Определяем какой фильтр выбран
        const grouped = filterGrouped;
        const showAll = !filterGrouped;

        const params = cleanParams({
            page,
            size: pageSize,
            icd10,
            grouped: grouped.toString(),
            showAll: showAll.toString()
        });

        updateURL(params);

        fetch(`${apiBaseUrl}/api/patient/${patientId}/inspections?${new URLSearchParams(params).toString()}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            inspectionsData = data.inspections;
            renderInspections(); // Отрисовываем таблицу осмотров
            setupPagination(data.pagination);
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

// Добавляем дочерние осмотры в массив
function addChildInspections(parentId, childInspections) {
    const parentIndex = inspectionsData.findIndex(item => item.id === parentId);

    if (parentIndex !== -1) {
        childInspections.forEach((child, index) => {
            child.isChild = true;
            child.previousId = parentId;
            
            // Рассчитываем индекс, куда будем вставлять дочерний элемент (с шагом через 1 элемент)
            let insertionIndex = parentIndex + (index + 1) * 2;

            // Проверяем, существует ли следующий элемент
            if (insertionIndex >= inspectionsData.length) {
                // Если следующего элемента нет, добавляем пустую ячейку перед дочерним элементом
                inspectionsData.push({ id: `empty-${parentId}-${index}`, isEmpty: true, parentId: parentId });
                insertionIndex = inspectionsData.length; // Дочерний элемент будет вставлен в конец
            }

            // Вставляем дочерний элемент через 1 от текущего положения
            inspectionsData.splice(insertionIndex, 0, child);
        });
    }
}
// Функция для сокрытия дочерних осмотров и пустых ячеек
function hideChildInspections(inspectionId, chainButton) {
    inspectionsData = inspectionsData.filter(item => item.previousId !== inspectionId || (item.isEmpty && item.parentId !== inspectionId));
    const parentIndex = inspectionsData.findIndex(item => item.id === inspectionId);
    if (parentIndex !== -1) {
        inspectionsData[parentIndex].isExpanded = false;
    }
    chainButton.textContent = '+ Показать повторные осмотры';
    chainButton.setAttribute('data-expanded', 'false');
    renderInspections(); // Обновляем таблицу после удаления дочерних элементов
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

    document.getElementById('filterBtn').addEventListener('click', function(event) {
        event.preventDefault();
        loadInspections();
    });

    setupFilters();
    loadPatientInfo();
    loadInspections(getQueryParam('page', 1));
});
