document.addEventListener('DOMContentLoaded', function () {
    const authToken = localStorage.getItem('authToken');
    const apiBaseUrl = 'https://mis-api.kreosoft.space';
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');
    let inspectionsData = []; // Хранение данных осмотров
    let filterGrouped = urlParams.get('grouped') !== 'false';  // По умолчанию выбрано "Сгруппировать по повторным"

    // Функция для установки радиокнопок в зависимости от параметра URL
    function setFilterOptions() {
        const isGrouped = new URLSearchParams(window.location.search).get('grouped') === 'true';
        document.getElementById('groupedOption').checked = isGrouped;
        document.getElementById('allOption').checked = !isGrouped;
    }

    // Функция для получения параметров из URL
    function getQueryParam(param, defaultValue) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has(param) ? urlParams.get(param) : defaultValue;
    }

    function updateURL(params) {
        params.id = patientId; // Добавляем ID пациента к параметрам
        const urlParams = new URLSearchParams(params);
        window.history.pushState(null, '', `/patient?${urlParams.toString()}`); // Меняем путь на "/patient"
        setFilterOptions();
    }

    function synchronizePageSize() {
        const urlPageSize = getQueryParam('size', 5); // Получаем `size` из URL или 5 по умолчанию
        document.getElementById('pageSize').value = urlPageSize; // Устанавливаем `pageSize` в элемент выбора
    }

    function updateFiltersAndReload() {
        const selectedIcd10Ids = getSelectedIcd10();
        const pageSize = document.getElementById('pageSize').value;
        const grouped = filterGrouped ? 'true' : 'false';

        // Формируем параметры для обновления URL и запроса
        const params = {
            grouped: grouped,
            size: pageSize,
            icdRoots: selectedIcd10Ids.join(',')
        };

        // Обновляем URL с новыми параметрами
        updateURL(params);
        loadInspections(); // Перезагружаем осмотры
    }

    document.getElementById('pageSize').addEventListener('change', updateFiltersAndReload);
    document.getElementById('filterBtn').addEventListener('click', function(event) {
        event.preventDefault();
        updateFiltersAndReload();
    });

    function loadInspections(page = 1) {
        // Показ временного индикатора загрузки
        synchronizePageSize();
        const inspectionsList = document.getElementById('inspectionsList');
        //inspectionsList.innerHTML = '<p>Загрузка...</p>';

        const pageSize = getQueryParam('size', document.getElementById('pageSize').value || 5);
        const grouped = filterGrouped ? 'true' : 'false';
        const selectedICD10 = getSelectedIcd10();

        // Формируем параметры запроса
        const params = new URLSearchParams({
            page,
            size: pageSize,
            grouped: grouped
        });

        selectedICD10.forEach(icdRoot => params.append('icdRoots', icdRoot));

        updateURL(Object.fromEntries(params.entries()));  // Обновляем URL

        fetch(`${apiBaseUrl}/api/patient/${patientId}/inspections?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            inspectionsData = data.inspections;
            renderInspections(); // Отрисовываем данные после загрузки
            setupPagination(data.pagination, loadInspections);            
        })
        .catch(error => {
            console.error('Ошибка загрузки осмотров:', error);
            inspectionsList.innerHTML = '<p>Не удалось загрузить данные. Попробуйте еще раз.</p>';
        });
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
        let currentColumn = leftColumn; // Текущая колонка для распределения
    
        // Заполняем оба столбца с осмотрами
        inspectionsData.forEach((inspection, index) => {
            const col = document.createElement('div');
            col.className = 'inspection-cell mb-4'; // Класс для отступов и фиксированного размера ячеек
            
            // Выбираем колонку для осмотра
            if (index >= half) {
                currentColumn = rightColumn;
            }
    
            renderInspection(col, inspection, currentColumn);
        });
    
        container.appendChild(leftColumn);
        container.appendChild(rightColumn);
        inspectionsList.appendChild(container);
    } 
    
    function renderInspection(cell, inspection, columnContainer, level = 0) {
            const inspectionBlock = document.createElement('div');
            inspectionBlock.className = 'inspection-block d-flex flex-column justify-content-between h-100 p-3 bg-light border rounded';
            inspectionBlock.setAttribute('data-id', inspection.id); // Устанавливаем идентификатор для проверки
        
            // Устанавливаем отступ слева на основе уровня вложенности
            inspectionBlock.style.marginLeft = `${level * 30}px`;
        
            // Внутренний блок для вывода информации об осмотре
            inspectionBlock.innerHTML = `
                <div>
                    <h5>${new Date(inspection.date).toLocaleDateString()} - ${inspection.conclusion || 'Не указано'}</h5>
                    <p><strong>Основной диагноз:</strong> ${inspection.diagnosis ? inspection.diagnosis.code + ' - ' + inspection.diagnosis.name : 'Не указано'}</p>
                    <p><strong>Медицинский работник:</strong> ${inspection.doctor || 'Не указано'}</p>
                    <p><strong>Заключение:</strong> ${inspection.conclusion || 'Не указано'}</p>
                </div>`;
        
            // Создаем блок для кнопок, чтобы расположить их в строку
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'd-flex justify-content-start mt-auto'; // Flexbox для выравнивания кнопок в строку
        
            // Кнопка "Детали осмотра"
            const detailsButton = document.createElement('a');
            detailsButton.href = '#'; // Здесь может быть ссылка на детали осмотра
            detailsButton.className = 'btn btn-primary me-2'; // Кнопка с отступом справа
            detailsButton.textContent = 'Детали осмотра';
    
            // Добавляем кнопку "Детали осмотра" в контейнер кнопок
            buttonContainer.appendChild(detailsButton);
        
            // Если у осмотра нет дочерних осмотров (hasNested = false), добавляем кнопку "Добавить осмотр"
            if (!inspection.hasNested) {
                const addButton = document.createElement('button');
                addButton.className = 'btn btn-outline-primary';
                addButton.textContent = 'Добавить осмотр';
                addButton.textContent = 'Добавить осмотр';
        
                // Обработчик для кнопки "Добавить осмотр"
                addButton.addEventListener('click', function () {
                    // Логика добавления нового осмотра (открываем новую вкладку)
                    window.open(`createCard.html?parentInspectionId=${inspection.id}&id=${patientId}`, '_blank');
                });
        
                // Добавляем кнопку "Добавить осмотр" справа от кнопки "Детали осмотра"
                buttonContainer.appendChild(addButton);
            }
    
            // Добавляем кнопку для раскрытия дочерних осмотров только для корневых элементов (level === 0)
            // И только если фильтрация установлена на 'Сгруппировать по повторным'
            if (level === 0 && filterGrouped && (inspection.hasChain || inspection.hasNested)) {
                const chainButton = document.createElement('button');
                chainButton.className = 'btn btn-link'; // Кнопка с текстом
                chainButton.textContent = inspection.isExpanded ? '- Скрыть повторные осмотры' : '+ Показать повторные осмотры';
                chainButton.addEventListener('click', () => {
                    toggleChildInspections(inspection, cell, chainButton, columnContainer, level + 1); // Увеличиваем уровень вложенности
                });
        
                // Добавляем кнопку "Показать повторные осмотры" под кнопками действий
                buttonContainer.appendChild(chainButton);
            }
        
            // Добавляем контейнер с кнопками в блок осмотра
            inspectionBlock.appendChild(buttonContainer);
        
            // Вставляем блок осмотра в текущую колонку
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

    function addChildInspections(parentInspection, childInspections, parentCell, columnContainer, level) {
        let insertAfter = parentCell.nextSibling;

        // Обрабатываем каждый дочерний осмотр с увеличенным уровнем
        childInspections.forEach((child, index) => {
            const childCell = document.createElement('div');
            childCell.className = 'inspection-cell mb-4 child-inspection';
            childCell.setAttribute('data-parent-id', parentInspection.id);

            // Увеличиваем отступ для дочерних осмотров на основе их индекса
            renderInspection(childCell, child, columnContainer, level + (index));  // Увеличиваем level для каждого дочернего элемента
            
            columnContainer.insertBefore(childCell, insertAfter); // Вставляем дочерние осмотры сразу под родителем
        });
    }


    // Редирект на страницу создания осмотра (createCard.html) при нажатии на кнопку "Добавить осмотр"
    document.getElementById('addInspectionBtn').addEventListener('click', function() {
        const patientId = new URLSearchParams(window.location.search).get('id'); // Получаем ID пациента из URL (если есть)
        if (patientId) {
            window.location.href = `createCard.html?id=${patientId}`;
        } else {
            // Если ID пациента нет, просто переходим на createCard.html
            window.location.href = 'createCard.html';
        }
    });

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
            height: 350px; /* Фиксированная высота для каждой ячейки */
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

    // Обработка фильтра при нажатии на кнопку "Поиск"
    document.getElementById('filterBtn').addEventListener('click', function(event) {
        event.preventDefault();
        const selectedIcd10Ids = getSelectedIcd10();
        console.log('Выбранные диагнозы МКБ-10:', selectedIcd10Ids);

        // Далее используем selectedIcd10Ids для выполнения фильтрации осмотров
        loadInspections();// Передаем выбранные диагнозы в функцию загрузки осмотров
    });
    loadPatientInfo(patientId, apiBaseUrl, authToken);

    setFilterOptions();  
    setupFilters(); 
    loadInspections(getQueryParam('page', 1));
    loadIcd10Options();
});
