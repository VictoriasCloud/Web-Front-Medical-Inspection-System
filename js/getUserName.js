document.addEventListener('DOMContentLoaded', function () {
    const authToken = localStorage.getItem('authToken');
    const apiBaseUrl = 'https://mis-api.kreosoft.space';
    const userDropdown = document.getElementById('userDropdown');

    // Функция для перенаправления на страницу авторизации
    function redirectToLogin() {
        window.location.href = '/login.html'; // Переход на страницу авторизации
    }

    // Функция для получения данных профиля пользователя
    function loadUserProfile() {
        fetch(`${apiBaseUrl}/api/doctor/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.status === 401) { // Ошибка авторизации
                console.error('Токен невалиден или истёк.');
                redirectToLogin(); // Перенаправляем на авторизацию
            }
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            updateUserDropdown(data.name);
        })
        .catch(error => {
            console.error('Ошибка при получении профиля:', error);
            redirectToLogin(); // Перенаправляем на авторизацию при ошибке
        });
    }

    // Функция для обновления кнопки с именем пользователя
    function updateUserDropdown(userName) {
        if (userName.length > 20) {
            userDropdown.textContent = userName.slice(0, 20) + '...'; // Если имя длинное, сокращаем
        } else {
            userDropdown.textContent = userName; // Если имя короткое, выводим полностью
        }
    }

    // Проверка наличия токена
    if (authToken) {
        loadUserProfile(); // Загружаем профиль, если токен есть
    } else {
        redirectToLogin(); // Если токена нет, перенаправляем на авторизацию
    }
});
