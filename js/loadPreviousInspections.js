function loadPreviousInspections(apiBaseUrl, authToken, patientId, previousInspectionSelect) {
    fetch(`${apiBaseUrl}/api/patient/${patientId}/inspections/search`, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        previousInspectionSelect.innerHTML = '<option value="">Выберите осмотр</option>';

        // Поскольку data является массивом, сразу выполняем итерацию
        data.forEach(inspection => {
            const option = document.createElement('option');
            option.value = inspection.id;
            option.textContent = `${new Date(inspection.date).toLocaleDateString()} - ${inspection.diagnosis ? inspection.diagnosis.code + ' - ' + inspection.diagnosis.name : 'Диагноз неизвестен'}`;
            previousInspectionSelect.appendChild(option);
        });
    })
    .catch(error => console.error('Ошибка загрузки списка осмотров:', error));
}

// Экспорт функции на глобальный объект window
window.loadPreviousInspections = loadPreviousInspections;
