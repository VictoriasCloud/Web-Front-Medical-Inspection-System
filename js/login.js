document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');

    const registerButton = document.getElementById('registr'); // Кнопка регистрации

    if (registerButton) {
        registerButton.addEventListener('click', function () {
            window.location.href = '/registration.html'; // Перенаправляем на страницу регистрации
        });
    }
    
    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault(); // Останавливаем отправку формы по умолчанию

            // Собираем данные из формы
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Формируем данные для отправки на сервер
            const loginData = {
                email: email,
                password: password
            };

            try {
                // Выполняем POST-запрос на сервер для логина
                const response = await fetch('https://mis-api.kreosoft.space/api/doctor/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'text/plain'
                    },
                    body: JSON.stringify(loginData) // Отправляем данные в формате JSON
                });

                if (response.ok) {
                    const data = await response.json(); // Получаем ответ от сервера
                    const token = data.token; // Извлекаем токен из ответа

                    // Сохраняем токен в LocalStorage
                    localStorage.setItem('authToken', token);

                    alert('Авторизация прошла успешно! Токен сохранён.');

                    window.location.href = '/profile.html';
                } else {
                    const errorData = await response.json();
                    alert('Ошибка авторизации: ' + errorData.message);
                }
            } catch (error) {
                console.error('Произошла ошибка:', error);
                alert('Произошла ошибка при авторизации.');
            }
        });
    } else {
        console.error('Форма не найдена');
    }
});
