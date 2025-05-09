async function fetchDiagnoses(query = '', authToken, apiBaseUrl, diagnosisResults = null, diagnosisSearch = null) {
    try {
        const response = await fetch(`${apiBaseUrl}/api/dictionary/icd10?request=${query}&page=1&size=20`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        if (diagnosisResults && diagnosisSearch) {
            diagnosisResults.innerHTML = '';
            diagnosisResults.style.display = 'block';

            data.records.forEach(diagnosis => {
                const item = document.createElement('a');
                item.href = '#';
                item.className = 'list-group-item list-group-item-action';
                item.textContent = `${diagnosis.code} - ${diagnosis.name}`;
                item.dataset.id = diagnosis.id;
                item.dataset.name = diagnosis.name;

                item.addEventListener('click', function (e) {
                    e.preventDefault();
                    diagnosisSearch.value = `${diagnosis.code} - ${diagnosis.name}`;
                    diagnosisSearch.dataset.diagnosisId = diagnosis.id;
                    diagnosisResults.style.display = 'none';
                });

                diagnosisResults.appendChild(item);
            });
        }
        return data.records;
    } catch (error) {
        return console.error('Ошибка загрузки диагнозов ICD-10:', error);
    }
}

// Экспорт функции
window.fetchDiagnoses = fetchDiagnoses;
