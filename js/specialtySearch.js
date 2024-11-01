// Функция для поиска специальностей для консультаций
function fetchSpecialties(query = '', authToken, apiBaseUrl, consultationResults, consultationSpecialty) {
    fetch(`${apiBaseUrl}/api/dictionary/speciality?name=${query}&page=1&size=18`, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        consultationResults.innerHTML = '';
        consultationResults.style.display = 'block';

        data.specialties.forEach(specialty => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'list-group-item list-group-item-action';
            item.textContent = specialty.name;
            item.dataset.id = specialty.id;

            item.addEventListener('click', function(e) {
                e.preventDefault();
                consultationSpecialty.value = specialty.name;
                consultationSpecialty.dataset.specialityId = specialty.id;
                consultationResults.style.display = 'none';
            });

            consultationResults.appendChild(item);
        });
    })
    .catch(error => console.error('Ошибка загрузки специальностей:', error));
}

// Экспорт функции на глобальный объект window
window.fetchSpecialties = fetchSpecialties;
