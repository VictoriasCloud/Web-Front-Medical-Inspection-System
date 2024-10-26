document.addEventListener('DOMContentLoaded', function () {
    const searchBtn = document.getElementById('searchPatients');
    const sortBySelect = document.getElementById('sortBy');
    const pageSizeInput = document.getElementById('pageSize');
    const authToken = localStorage.getItem('authToken');
    const apiBaseUrl = 'https://mis-api.kreosoft.space'; 
    const userDropdown = document.getElementById('userDropdown');
    const storedUserName = localStorage.getItem('userName');

    // Обновление кнопку в навбаре
    if (authToken && storedUserName) {
        updateUserDropdown(storedUserName);
    }

    function updateUserDropdown(userName) {
        userDropdown.textContent = userName.length > 20 ? userName.slice(0, 20) + '...' : userName;
    }

    // Получение параметров из URL
    function getQueryParam(param, defaultValue) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has(param) ? urlParams.get(param) : defaultValue;
    }

    // Обновление URL без перезагрузки страницы
    function updateURL(params) {
        const urlParams = new URLSearchParams(params);
        window.history.pushState(null, '', `${window.location.pathname}?${urlParams.toString()}`);
    }

    // Чистка параметров (удаление пустых)
    function cleanParams(params) {
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === undefined || params[key] === null) {
                delete params[key];
            }
        });
        return params;
    }

    // Загрузка пациентов с поддержкой фильтров и пагинации
    function loadPatients(page = 1) {
        const pageSize = pageSizeInput.value || 5;
        const sortBy = sortBySelect.value || '';
        const name = document.getElementById('searchName').value;
        const conclusions = document.getElementById('conclusions').value;
        const scheduledVisits = document.getElementById('scheduledVisits').checked;
        const onlyMine = document.getElementById('myPatients').checked;

        const params = cleanParams({
            page,
            size: pageSize,
            name,
            conclusions,
            sorting: sortBy,
            scheduledVisits: scheduledVisits ? 'true' : '',
            onlyMine: onlyMine ? 'true' : ''
        });

        updateURL(params);  // Обновляем URL без перезагрузки страницы

        fetch(`${apiBaseUrl}/api/patient?${new URLSearchParams(params).toString()}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displayPatients(data.patients);
            setupPagination(data.pagination);
        })
        .catch(error => console.error('Ошибка загрузки пациентов:', error));
    }

    // Отображение списка пациентов
    function displayPatients(patients) {
        const patientsList = document.getElementById('patientsList');
        patientsList.innerHTML = '';

        const row = document.createElement('div');
        row.className = 'row';

        patients.forEach(patient => {
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-4';

            const name = patient.name || 'Не указано';
            const birthday = patient.birthday ? patient.birthday.split('T')[0] : 'Не указано';
            const gender = patient.gender || 'Не указано';

            col.innerHTML = `
                <div class="card h-100 bg-light patient-card" data-patient-id="${patient.id}">
                    <div class="card-body">
                        <h5 class="card-title">${name}</h5>
                        <p class="card-text">Дата рождения: ${birthday}</p>
                        <p class="card-text">Пол: ${gender}</p>
                    </div>
                </div>`;

            row.appendChild(col);
        });

        patientsList.appendChild(row);

        const patientCards = document.querySelectorAll('.patient-card');
        patientCards.forEach(card => {
            card.addEventListener('click', function () {
                const patientId = this.getAttribute('data-patient-id');
                window.location.href = `/card.html?id=${patientId}`;
            });
        });
    }

    // Установка пагинации
    function setupPagination(pagination) {
        const paginationElement = document.getElementById('pagination');
        paginationElement.innerHTML = '';

        const totalPages = pagination.count;
        const currentPage = pagination.current;

        // Создаем кнопки пагинации
        for (let i = 1; i <= totalPages; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageItem.addEventListener('click', function (event) {
                event.preventDefault();
                loadPatients(i);  // Загружаем нужную страницу без перезагрузки
            });
            paginationElement.appendChild(pageItem);
        }
    }

    // Обработчик поиска пациентов
    searchBtn.addEventListener('click', () => loadPatients());

    // Обработчик изменения сортировки
    sortBySelect.addEventListener('change', () => loadPatients());

    // Загружаем пациентов при загрузке страницы
    loadPatients(parseInt(getQueryParam('page', 1)));

    // Обработчик для кнопки регистрации пациента
    registerBtn.addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('patientModal'));
        modal.show();
    });

    // Регистрация нового пациента
    document.getElementById('patientForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const patientData = {
            name: document.getElementById('patientName').value,
            gender: document.getElementById('patientGender').value,
            birthday: document.getElementById('patientDob').value + 'T00:00:00.000Z'
        };

        fetch(`${apiBaseUrl}/api/patient`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }
            return response.json();
        })
        .then(() => {
            alert('Пациент успешно зарегистрирован');
            loadPatients();  // Обновляем список пациентов
        })
        .catch(error => {
            console.error('Ошибка при регистрации пациента:', error);
            alert('Ошибка при регистрации пациента');
        });
    });
});
