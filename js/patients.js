document.addEventListener('DOMContentLoaded', function () {
    const searchBtn = document.getElementById('searchPatients');
    const registerBtn = document.getElementById('registerPatientBtn');
    const sortBySelect = document.getElementById('sortBy');
    const authToken = localStorage.getItem('authToken');
    const apiBaseUrl = 'https://mis-api.kreosoft.space'; 
    const userDropdown = document.getElementById('userDropdown');
    const storedUserName = localStorage.getItem('userName'); // Получаем имя пользователя из localStorage

    // Обновляем кнопку в навбаре, если в localStorage есть токен и имя пользователя
    if (authToken && storedUserName) {
        updateUserDropdown(storedUserName);
    }

    // Функция для обновления текста кнопки с именем пользователя
    function updateUserDropdown(userName) {
        userDropdown.textContent = userName.length > 20 ? userName.slice(0, 20) + '...' : userName;
    }

    // Функция для загрузки пациентов с поддержкой фильтров и пагинации
    function loadPatients(page = 1) {
        const pageSize = document.getElementById('pageSize').value || 5;
        const sortBy = sortBySelect.value || ''; // Получаем выбранную сортировку
    
        console.log('Текущая страница:', page);
        console.log('Количество пациентов на странице:', pageSize);
    
        const params = new URLSearchParams({
            page: page,
            size: pageSize,
            name: document.getElementById('searchName').value,
            conclusions: document.getElementById('conclusions').value,
            scheduledVisits: document.getElementById('scheduledVisits').checked,
            onlyMine: document.getElementById('myPatients').checked,
            sorting: sortBy
        });
    
        fetch(`${apiBaseUrl}/api/patient?${params.toString()}`, {
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
            console.log('Ответ с сервера:', data); // Для проверки всех данных
            displayPatients(data.patients);
            setupPagination(data.pagination);
        })
        .catch(error => console.error('Ошибка загрузки пациентов:', error));
    }
    loadPatients();
    

    // Отображение списка пациентов
    function displayPatients(patients) {
        const patientsList = document.getElementById('patientsList');
        patientsList.innerHTML = '';

        const row = document.createElement('div');
        row.className = 'row'; // Строка Bootstrap

        patients.forEach(patient => {
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-4'; // Колонка для двух элементов на экранах md и выше

            // Проверяем значения, если null, то выводим текст 'Не указано'
            const name = patient.name || 'Не указано';
            const birthday = patient.birthday ? patient.birthday.split('T')[0] : 'Не указано';
            const gender = patient.gender || 'Не указано';

            col.innerHTML = `
                <div class="card h-100 bg-light">
                    <div class="card-body">
                        <h5 class="card-title">${name}</h5>
                        <p class="card-text">Дата рождения: ${birthday}</p>
                        <p class="card-text">Пол: ${gender}</p>
                    </div>
                </div>`;

            row.appendChild(col);
        });

        patientsList.appendChild(row);
    }

    // Установка пагинации
    function setupPagination(pagination) {
        const paginationElement = document.getElementById('pagination');
        paginationElement.innerHTML = '';
    
        const totalPages = pagination.count;  // Используем количество страниц с сервера
        console.log('Количество страниц:', totalPages); // Проверка количества страниц
    
        for (let i = 1; i <= totalPages; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = 'page-item';
            pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageItem.addEventListener('click', function (event) {
                event.preventDefault();
                loadPatients(i); // Загружаем нужную страницу
            });
            paginationElement.appendChild(pageItem);
        }
    }
    

    // Обработчик поиска пациентов
    searchBtn.addEventListener('click', () => loadPatients());
    // Обработчик для изменения сортировки
    sortBySelect.addEventListener('change', () => loadPatients());

    // Открытие модального окна для регистрации нового пациента
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
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patientData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert('Пациент успешно зарегистрирован');
            loadPatients(); // Перезагрузка списка пациентов
        })
        .catch(error => {
            console.error('Ошибка при регистрации пациента:', error);
            alert('Ошибка при регистрации пациента');
        });
    });

    // Загружаем пациентов при загрузке страницы
    loadPatients();
});
