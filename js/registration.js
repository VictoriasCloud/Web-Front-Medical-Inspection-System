document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault(); // Останавливаем отправку формы по умолчанию

            // Собираем данные из формы
            const fullName = document.getElementById('fullName').value;
            const gender = document.getElementById('gender').value;
            const dob = document.getElementById('dob').value;
            const phone =  document.getElementById('phone').value; 
            const specialty = document.getElementById('specialty').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Формируем данные для отправки на сервер
            const userData = {
                name: fullName,
                password: password,
                email: email,
                birthday: dob + 'T00:00:00.000Z', // Дата в формате ISO
                gender: gender,
                phone: phone, 
                speciality: specialty // ID специальности
            };

            try {
                const response = await fetch('https://mis-api.kreosoft.space/api/doctor/register', {
                    method: 'POST',
                    headers: {
                        'accept': 'text/plain',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData) 
                });

                if (response.ok) {
                    const data = await response.json(); 
                    const token = data.token; 

                    // Сохраняем токен в LocalStorage
                    localStorage.setItem('authToken', token);
                    alert('Ваш токен: ' + localStorage.getItem('authToken'));

                    alert('Регистрация прошла успешно! Токен сохранён.');



                    // Перенаправляем на другую страницу (профиль)
                    window.location.href = '../profile';
                } else {
                    const errorData = await response.json();
                    alert('Ошибка регистрации: ' + errorData.message);
                }
            } catch (error) {
                console.error('Произошла ошибка:', error);
                alert('Произошла ошибка при регистрации.');
            }
        });
    } else {
        console.error('Форма не найдена');
    }
});
