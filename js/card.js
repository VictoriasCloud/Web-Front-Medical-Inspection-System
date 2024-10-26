document.addEventListener('DOMContentLoaded', function () {
    const authToken = localStorage.getItem('authToken');
    const apiBaseUrl = 'https://mis-api.kreosoft.space';
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id'); // Извлечение id пациента из URL

    // Проверка наличия id пациента
    if (!patientId) {
        console.error('ID пациента не найден');
        return;
    }

    // Функция для получения параметров из URL
    function getQueryParam(param, defaultValue) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has(param) ? urlParams.get(param) : defaultValue;
    }

    // Обновление URL без перезагрузки страницы
    function updateURL(params) {
        params.id = patientId; // Обязательно добавляем параметр id пациента
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

    // Загрузка осмотров пациента с поддержкой пагинации и фильтров
    function loadInspections(page = 1) {
        const pageSize = document.getElementById('pageSize').value || getQueryParam('pageSize', 5);  // Из формы или из URL
        const icd10 = document.getElementById('icd10').value || getQueryParam('icd10', '');  // Из формы или из URL
        const groupByRepeat = document.getElementById('groupByRepeat').checked || getQueryParam('groupByRepeat', false);
        const showAll = document.getElementById('showAll').checked || getQueryParam('showAll', false);

        const params = cleanParams({
            page,
            size: pageSize,
            icd10,
            groupByRepeat,
            showAll
        });

        updateURL(params);  // Обновление URL без перезагрузки страницы

        fetch(`${apiBaseUrl}/api/patient/${patientId}/inspections?${new URLSearchParams(params).toString()}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            displayInspections(data.inspections);
            setupPagination(data.pagination);
        })
        .catch(error => console.error('Ошибка загрузки осмотров:', error));
    }

    //отображение осмотров пациента
    function displayInspections(inspections) {
        const inspectionsList = document.getElementById('inspectionsList');
        inspectionsList.innerHTML = ''; // Очищаем список перед добавлением новых осмотров, а вдруг

        // Создаем строку (row) для размещения карточек осмотров в строку 
        const row = document.createElement('div');
        row.className = 'row';

        inspections.forEach(inspection => {
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-4'; 

            const date = new Date(inspection.date).toLocaleDateString();
            const conclusion = inspection.conclusion || 'Не указано';
            const diagnosis = inspection.diagnosis ? `${inspection.diagnosis.code} - ${inspection.diagnosis.name}` : 'Не указано';
            const doctor = inspection.doctor || 'Не указано';

            // Создаем карточку осмотра
            col.innerHTML = `
                <div class="card h-100 bg-light inspection-card" data-inspection-id="${inspection.id}">
                    <div class="card-body">
                        <h5 class="card-title">${date} - ${conclusion}</h5>
                        <p class="card-text"><strong>Основной диагноз:</strong> ${diagnosis}</p>
                        <p class="card-text"><strong>Медицинский работник:</strong> ${doctor}</p>
                        <p class="card-text"><strong>Заключение:</strong> ${conclusion}</p>
                        <a href="#" class="btn btn-primary">Детали осмотра</a>
                    </div>
                </div>`;

        // Если заключение "Death", делаем выделение границей КРАСНОЙ
        if (conclusion === 'Death') {
            col.querySelector('.card').classList.add('border-danger');
        }


            row.appendChild(col);
        });

        inspectionsList.appendChild(row); // Добавляем строку с осмотрами в список всех осмотров
    }

    // Функция для установки пагинации
    function setupPagination(pagination) {
        const paginationElement = document.getElementById('pagination');
        paginationElement.innerHTML = ''; // Очищаем пагинацию

        const totalPages = pagination.count;
        const currentPage = pagination.current;
        const pageSize = getQueryParam('pageSize', 5);

        // Добавляем кнопку для предыдущей страницы(прикольно вроде)
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

        // Добавляем кнопки для всех страниц
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

        // Добавляем кнопку для следующей страницы
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

    // Обработчик кнопки поиска
    document.getElementById('filterBtn').addEventListener('click', function(event) {
        event.preventDefault();
        loadInspections(); // Загружаем осмотры при применении фильтров
    });

    // Загружаем данные при загрузке страницы
    loadPatientInfo();
    loadInspections(getQueryParam('page', 1));
});
