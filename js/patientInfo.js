// Функция для загрузки информации о пациенте
function loadPatientInfo(patientId, apiBaseUrl, authToken) {
    fetch(`${apiBaseUrl}/api/patient/${patientId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Обновляем имя пациента
        document.getElementById('patientName').textContent = data.name || 'Имя неизвестно';

        // Проверяем и форматируем дату рождения
        const dateOfBirth = data.birthday ? new Date(data.birthday) : null;
        const formattedDate = dateOfBirth && !isNaN(dateOfBirth) 
            ? dateOfBirth.toLocaleDateString() 
            : 'Дата рождения неизвестна';

        document.getElementById('patientDob').textContent = `Дата рождения: ${formattedDate}`;
    })
    .catch(error => console.error('Ошибка загрузки данных пациента:', error));
}

// Экспортируем функцию на глобальный объект window
window.loadPatientInfo = loadPatientInfo;
