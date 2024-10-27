document.addEventListener('DOMContentLoaded', function () {
    const authToken = localStorage.getItem('authToken');
    const apiBaseUrl = 'https://mis-api.kreosoft.space';
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');
    let inspectionsData = []; // Хранение данных осмотров
    let filterGrouped = true; // По умолчанию выбрано "Сгруппировать по повторным"

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

        const grouped = filterGrouped;
        const showAll = !filterGrouped;

        const params = cleanParams({ page, size: pageSize, icd10, grouped: grouped.toString(), showAll: showAll.toString() });

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
            renderInspections();
            setupPagination(data.pagination);
        })
        .catch(error => console.error('Ошибка загрузки осмотров:', error));
    }

    // Функция для рендеринга осмотров
    function renderInspections() {
        const inspectionsList = document.getElementById('inspectionsList');
        const fragment = document.createDocumentFragment(); // Используем фрагмент

        inspectionsData.forEach(inspection => {
            const row = document.createElement('div');
            row.className = 'row';
            renderInspection(row, inspection);
            fragment.appendChild(row);
        });

        inspectionsList.innerHTML = ''; // Очищаем список перед добавлением
        inspectionsList.appendChild(fragment); // Добавляем фрагмент в DOM за один раз
    }

    // Функция для отрисовки одного осмотра
    function renderInspection(row, inspection) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-12 mb-4';
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

    // Логика показа/скрытия дочерних осмотров
    function toggleChildInspections(inspectionId, chainButton) {
        const isExpanded = chainButton.getAttribute('data-expanded') === 'true';

        if (isExpanded) {
            hideChildInspections(inspectionId, chainButton);
        } else {
            loadChildInspections(inspectionId, chainButton);
        }
    }

    // Загрузка и добавление дочерних осмотров
    function loadChildInspections(inspectionId, chainButton) {
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
            renderInspections();
        })
        .catch(error => console.error('Ошибка загрузки повторных осмотров:', error));
    }

    // Добавление дочерних осмотров в массив
    function addChildInspections(parentId, childInspections) {
        const parentIndex = inspectionsData.findIndex(item => item.id === parentId);

        if (parentIndex !== -1) {
            childInspections.forEach((child, index) => {
                child.isChild = true;
                child.previousId = parentId;
                inspectionsData.splice(parentIndex + 1 + index, 0, child); // Добавляем дочерние элементы после родителя
            });
        }
    }

    // Функция для скрытия дочерних осмотров
    function hideChildInspections(inspectionId, chainButton) {
        inspectionsData = inspectionsData.filter(item => item.previousId !== inspectionId);
        const parentIndex = inspectionsData.findIndex(item => item.id === inspectionId);
        if (parentIndex !== -1) {
            inspectionsData[parentIndex].isExpanded = false;
        }
        chainButton.textContent = '+ Показать повторные осмотры';
        chainButton.setAttribute('data-expanded', 'false');
        renderInspections(); // Перерисовка после удаления
    }

    setupFilters();
    loadPatientInfo();
    loadInspections();
});
