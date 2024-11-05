document.addEventListener('DOMContentLoaded', function () {
    const profileForm = document.getElementById('profileForm');
    const userDropdown = document.getElementById('userDropdown');
    const authToken = localStorage.getItem('authToken');
    
    // Загружаем данные профиля при загрузке страницы
    if (authToken) {
        fetch('https://mis-api.kreosoft.space/api/doctor/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'accept': 'text/plain'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Заполняем поля формы
            document.getElementById('fullName').value = data.name;
            document.getElementById('gender').value = data.gender; 
            document.getElementById('dob').value = data.birthday.split('T')[0];
            document.getElementById('phone').value = data.phone;
            document.getElementById('email').value = data.email;

            // Сохраняем имя пользователя в localStorage
            localStorage.setItem('userName', data.name);

            // Обновляем кнопку пользователя в навбаре
            updateUserDropdown(data.name);
        })
        .catch(error => {
            console.error('Ошибка при загрузке профиля:', error);
        });
    }
    
    // Функция для обновления текста кнопки в навбаре
    function updateUserDropdown(userName) {
        userDropdown.textContent = userName.length > 20 ? userName.slice(0, 20) + '...' : userName;
    }

    // Обработчик отправки формы профиля
    profileForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Останавливаем стандартное поведение формы

        const updatedProfile = {
            name: document.getElementById('fullName').value,
            gender: document.getElementById('gender').value,
            birthday: document.getElementById('dob').value + 'T00:00:00',
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value
        };

        // Отправка PUT-запроса на сервер для обновления профиля
        fetch('https://mis-api.kreosoft.space/api/doctor/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'accept': '*/*'
            },
            body: JSON.stringify(updatedProfile)
        })
        .then(response => {
            if (response.ok) {
            // Проверяем, есть ли тело ответа
            return response.text().then(text => {
                return text ? JSON.parse(text) : {}; // Если ответ пустой, возвращаем пустой объект
            });
            } else {
                throw new Error(`Ошибка: ${response.status}`);
            }
        })
        .then(data => {
            //alert('Профиль успешно обновлён.');
            // Обновляем имя пользователя в localStorage и в кнопке
            const updatedName = document.getElementById('fullName').value;
            localStorage.setItem('userName', updatedName);
            updateUserDropdown(updatedName);
        })
        .catch(error => {
            console.error('Ошибка при сохранении профиля:', error);
            alert('Произошла ошибка при сохранении профиля.');
        });
    });

    // Обработчик выхода из системы
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            localStorage.removeItem('authToken'); // Удаляем токен из LocalStorage
            localStorage.removeItem('userName');  // Удаляем имя пользователя из LocalStorage
            window.location.href = 'login.html'; // Перенаправляем на страницу входа
        });
    }
});
