document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');

    const registerButton = document.getElementById('registr'); 

    if (registerButton) {
        registerButton.addEventListener('click', function () {
            window.location.href = '/registration'; 
        });
    }
    
    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault(); // Останавливаем отправку формы по умолчанию, так надо

            // Собираем данные из формы
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Формируем данные
            const loginData = {
                email: email,
                password: password
            };

            try {
                // Выполняем POST-запрос
                const response = await fetch('https://mis-api.kreosoft.space/api/doctor/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'text/plain'
                    },
                    body: JSON.stringify(loginData) 
                });

                if (response.ok) {
                    const data = await response.json(); // Получаем ответ от сервера
                    const token = data.token; // Извлекаем токен из ответа

                    // Сохраняем токен в LocalStorage
                    localStorage.setItem('authToken', token);

                    alert('Авторизация прошла успешно! Токен сохранён.');

                    window.location.href = '/profile';
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
