document.addEventListener('DOMContentLoaded', function () {
    const authToken = localStorage.getItem('authToken');
    const apiBaseUrl = 'https://mis-api.kreosoft.space';
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');
    const diagnosisList = []; // Список добавленных диагнозов
    const consultationList = []; // Список добавленных консультаций
    const previousInspectionId = urlParams.get('previousInspectionId');

     // Устанавливаем значения переключателей и заполняем данные
     const primaryInspectionRadio = document.getElementById('primaryInspection');
     const secondaryInspectionRadio = document.getElementById('secondaryInspection');
     const previousInspectionSelect = document.getElementById('previousInspectionSelect');


     // Проверяем значение previousInspectionId
    if (previousInspectionId === 'null') {
        // Если previousInspectionId == null, устанавливаем "Первичный осмотр" по умолчанию
        primaryInspectionRadio.checked = true;
    } else {
        // Если указан previousInspectionId, выбираем "Повторный осмотр"
        secondaryInspectionRadio.checked = true;

        // Загружаем данные предыдущего осмотра
        fetch(`${apiBaseUrl}/api/patient/${patientId}/inspection/${previousInspectionId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Добавляем в селект информацию о предыдущем осмотре
            const option = document.createElement('option');
            option.value = data.id;
            option.textContent = `${new Date(data.date).toLocaleDateString()} - ${data.diagnosis?.name || 'Диагноз неизвестен'}`;
            previousInspectionSelect.appendChild(option);
            previousInspectionSelect.value = data.id;
        })
        .catch(error => console.error('Ошибка загрузки предыдущего осмотра:', error));
    }

    // Обработчик для выбора типа осмотра
    primaryInspectionRadio.addEventListener('change', function () {
        if (primaryInspectionRadio.checked) {
            previousInspectionSelect.disabled = true; // Отключаем выбор предыдущего осмотра
        }
    });

    secondaryInspectionRadio.addEventListener('change', function () {
        if (secondaryInspectionRadio.checked) {
            previousInspectionSelect.disabled = false; // Включаем выбор предыдущего осмотра
        }
    });

    // Заполняем выпадающий список предыдущих осмотров, если выбран "Повторный осмотр"
    if (previousInspectionId === 'null' || secondaryInspectionRadio.checked) {
        loadPreviousInspections();
    }

    function loadPreviousInspections() {
        fetch(`${apiBaseUrl}/api/patient/${patientId}/inspections`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            data.inspections.forEach(inspection => {
                const option = document.createElement('option');
                option.value = inspection.id;
                option.textContent = `${new Date(inspection.date).toLocaleDateString()} - ${inspection.diagnosis?.name || 'Диагноз неизвестен'}`;
                previousInspectionSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Ошибка загрузки списка осмотров:', error));
    }

    if (!authToken) {
        alert('Авторизация требуется для доступа к этой странице.');
        window.location.href = 'login.html';
        return;
    }

    loadPatientInfo(patientId, apiBaseUrl, authToken); 
    const inspectionTypeRadios = document.getElementsByName('inspectionType');

    const diagnosisSearch = document.getElementById('diagnosisSearch');
    const diagnosisResults = document.getElementById('diagnosisResults');
    const diagnosisListContainer = document.getElementById('diagnosisList');
    const consultationSpecialty = document.getElementById('consultationSpecialty');
    const consultationListContainer = document.getElementById('consultationList');

    // Сопоставление типов диагноза на русском и английском языках
    const diagnosisTypeMapping = {
        "Основной": "Main",
        "Сопутствующий": "Concomitant",
        "Осложнение": "Complication"
    };

    // Функция поиска диагнозов
    function fetchDiagnoses(query = '') {
        fetch(`${apiBaseUrl}/api/dictionary/icd10?request=${query}&page=1&size=20`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            diagnosisResults.innerHTML = '';
            diagnosisResults.style.display = 'block';

            data.records.forEach(diagnosis => {
                const item = document.createElement('a');
                item.href = '#';
                item.className = 'list-group-item list-group-item-action';
                item.textContent = `${diagnosis.code} - ${diagnosis.name}`;
                item.dataset.id = diagnosis.id;
                item.dataset.name = diagnosis.name;

                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    diagnosisSearch.value = `${diagnosis.code} - ${diagnosis.name}`;
                    diagnosisSearch.dataset.diagnosisId = diagnosis.id;
                    diagnosisResults.style.display = 'none';
                });

                diagnosisResults.appendChild(item);
            });
        })
        .catch(error => console.error('Ошибка загрузки диагнозов ICD-10:', error));
    }

    function addDiagnosisToList(diagnosis) {
        const diagnosisItem = document.createElement('div');
        diagnosisItem.className = 'd-flex flex-column align-items-start mb-2 p-2 border rounded';

        diagnosisItem.innerHTML = `
            <div><strong>${diagnosis.code} - ${diagnosis.name}</strong></div>
            <div>Тип диагноза: <span>${diagnosis.type}</span></div>
            <div>Описание: <span>${diagnosis.description || 'Не указано'}</span></div>
            <div class="d-flex mt-2">
                <button class="btn btn-secondary btn-sm me-2 edit-diagnosis-btn">Редактировать</button>
                <button class="btn btn-danger btn-sm remove-diagnosis-btn">Удалить</button>
            </div>
        `;

        diagnosisItem.querySelector('.remove-diagnosis-btn').addEventListener('click', () => {
            diagnosisListContainer.removeChild(diagnosisItem);
            const index = diagnosisList.findIndex(d => d.id === diagnosis.id);
            if (index > -1) diagnosisList.splice(index, 1);
        });

        diagnosisItem.querySelector('.edit-diagnosis-btn').addEventListener('click', () => {
            editDiagnosis(diagnosis);
            diagnosisListContainer.removeChild(diagnosisItem);
            const index = diagnosisList.findIndex(d => d.id === diagnosis.id);
            if (index > -1) diagnosisList.splice(index, 1);
        });

        diagnosisList.push(diagnosis);
        diagnosisListContainer.appendChild(diagnosisItem);
    }

    function editDiagnosis(diagnosis) {
        diagnosisSearch.value = `${diagnosis.code} - ${diagnosis.name}`;
        diagnosisSearch.dataset.diagnosisId = diagnosis.id;
        document.getElementById('diagnosisDescription').value = diagnosis.description;

        const typeInputs = document.getElementsByName('diagnosisType');
        typeInputs.forEach(input => {
            if (input.value === diagnosis.type) {
                input.checked = true;
            }
        });
    }

    document.getElementById('addDiagnosisBtn').addEventListener('click', function(e) {
        e.preventDefault();
        const diagnosisId = diagnosisSearch.dataset.diagnosisId;
        const diagnosisName = diagnosisSearch.value;
        const description = document.getElementById('diagnosisDescription').value;

        const selectedType = Array.from(document.getElementsByName('diagnosisType')).find(input => input.checked)?.value;

        if (!diagnosisId || !diagnosisName) {
            alert('Выберите диагноз перед добавлением.');
            return;
        }

        if (!selectedType) {
            alert('Выберите тип диагноза.');
            return;
        }

        if (diagnosisList.some(d => d.id === diagnosisId)) {
            alert('Диагноз уже добавлен.');
            return;
        }
        // Используем английский тип диагноза
        const englishType = diagnosisTypeMapping[selectedType];

        addDiagnosisToList({
            id: diagnosisId,
            code: diagnosisName.split(' - ')[0],
            name: diagnosisName.split(' - ')[1],
            type: englishType,
            description
        });

        diagnosisSearch.value = '';
        document.getElementById('diagnosisDescription').value = '';
        document.getElementsByName('diagnosisType')[0].checked = true;
    });


    diagnosisSearch.addEventListener('focus', () => fetchDiagnoses());

    diagnosisSearch.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length > 0) {
            fetchDiagnoses(query);
        } else {
            diagnosisResults.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!diagnosisSearch.contains(e.target) && !diagnosisResults.contains(e.target)) {
            diagnosisResults.style.display = 'none';
        }
    });


    function addConsultationToList(consultation) {
        const consultationItem = document.createElement('div');
        consultationItem.className = 'd-flex flex-column align-items-start mb-2 p-2 border rounded';

        consultationItem.innerHTML = `
            <div><strong>Специальность: ${consultation.name}</strong></div>
            <div>Комментарий: <span>${consultation.comment}</span></div>
            <div class="d-flex mt-2">
                <button class="btn btn-secondary btn-sm me-2 edit-consultation-btn">Редактировать</button>
                <button class="btn btn-danger btn-sm remove-consultation-btn">Удалить</button>
            </div>
        `;

        consultationItem.querySelector('.remove-consultation-btn').addEventListener('click', () => {
            consultationListContainer.removeChild(consultationItem);
            const index = consultationList.findIndex(c => c.id === consultation.id);
            if (index > -1) consultationList.splice(index, 1);
        });

        consultationItem.querySelector('.edit-consultation-btn').addEventListener('click', () => {
            editConsultation(consultation);
            consultationListContainer.removeChild(consultationItem);
            const index = consultationList.findIndex(c => c.id === consultation.id);
            if (index > -1) consultationList.splice(index, 1);
        });

        consultationList.push(consultation);
        consultationListContainer.appendChild(consultationItem);
    }

    function editConsultation(consultation) {
        consultationSpecialty.value = consultation.name;
        consultationSpecialty.dataset.specialityId = consultation.id;
        document.getElementById('consultationComment').value = consultation.comment;
    }

    document.getElementById('addConsultation').addEventListener('click', function(e) {
        e.preventDefault();
    
        const specialityId = consultationSpecialty.dataset.specialityId;
        const specialtyName = consultationSpecialty.value;
        const comment = consultationComment.value.trim();
    
        if (!specialityId || !specialtyName) {
            alert('Выберите специальность перед добавлением.');
            return;
        }
    
        if (!comment) {
            alert('Заполните поле комментария перед добавлением консультации.');
            return;
        }
    
        if (consultationList.some(c => c.id === specialityId)) {
            alert('Консультация с этой специальностью уже добавлена.');
            return;
        }
    
        addConsultationToList({
            specialityId: specialityId,
            name: specialtyName,
            comment: comment
        });
    
        // Сбрасываем поле ввода и комментарий после добавления
        consultationSpecialty.value = '';
        consultationComment.value = '';
    });
    

    // Включение или отключение полей консультации
    document.getElementById('needConsultation').addEventListener('change', function() {
            const isChecked = this.checked;
            document.getElementById('consultationSpecialty').disabled = !isChecked;
            document.getElementById('consultationComment').disabled = !isChecked;
            document.getElementById('addConsultation').disabled = !isChecked;
    });

    consultationSpecialty.addEventListener('focus', () => fetchSpecialties());

    consultationSpecialty.addEventListener('input', function() {
        const query = this.value.trim();
        fetchSpecialties(query);
    });

    const conclusionTypeSelect = document.getElementById('conclusionType');
    const nextVisitContainer = document.getElementById('nextVisit');
    const deathDateContainer = document.getElementById('deathDate');

    // Функция для отображения нужного поля на основе типа заключения
    function updateConclusionFields() {
        nextVisitContainer.style.display = 'none';
        deathDateContainer.style.display = 'none';

        if (conclusionTypeSelect.value === 'Disease') {
            nextVisitContainer.style.display = 'block';
        } else if (conclusionTypeSelect.value === 'Death') {
            deathDateContainer.style.display = 'block';
        }
    }

    // Событие для изменения типа заключения
    conclusionTypeSelect.addEventListener('change', updateConclusionFields);

    // Вызов функции при загрузке страницы
    updateConclusionFields();

    const inspectionDateInput = document.getElementById('inspectionDate');

    // Устанавливаем текущую дату и время для поля даты осмотра
    function setCurrentDateTime() {
        const now = new Date();
        const formattedDateTime = now.toISOString().slice(0, 16); // Приводим дату к формату YYYY-MM-DDTHH:MM
        inspectionDateInput.value = formattedDateTime;
    }

    setCurrentDateTime(); // Устанавливаем дату осмотра при загрузке страницы

    document.getElementById('saveInspection').addEventListener('click', function () {
        const selectedInspectionType = Array.from(inspectionTypeRadios).find(radio => radio.checked)?.value;
        if (!selectedInspectionType) {
            alert('Выберите тип осмотра: первичный или повторный.');
            return;
        }
        const inspectionDate = document.getElementById('inspectionDate').value;
        const anamnesis = document.getElementById('anamnesis').value;
        const complaints = document.getElementById('complaints').value;
        const treatment = document.getElementById('treatment').value;
        const conclusionType = document.getElementById('conclusionType').value;
        const nextVisitDate = document.getElementById('nextVisitDate').value;
        const deathDate = document.getElementById('deathDateInput').value;
        
        // Собираем диагнозы и консультации
        const diagnoses = diagnosisList.map(diagnosis => ({
            icdDiagnosisId: diagnosis.id,
            description: diagnosis.description,
            type: diagnosis.type
        }));
    
        const consultations = consultationList.map(consultation => ({
            specialityId: consultation.specialityId,
            comment: {
                content: consultation.comment
            }
        }));
    
        // Создаем объект данных для отправки
        const requestData = {
            date: new Date(inspectionDate).toISOString(),
            anamnesis: anamnesis || 'string', 
            complaints: complaints || 'string',
            treatment: treatment || 'string',
            conclusion: conclusionType,
            nextVisitDate: nextVisitDate ? new Date(nextVisitDate).toISOString() : null,
            deathDate: deathDate ? new Date(deathDate).toISOString() : null,
            previousInspectionId: null,
            diagnoses: diagnoses,
            consultations: consultations
        };
    
        // Отправка POST-запроса
        fetch(`${apiBaseUrl}/api/patient/${patientId}/inspections`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при создании осмотра');
            }
            return response.json();
        })
        .then(data => {
            alert('Осмотр успешно создан');
            console.log(data); // логируем ответ для проверки
        })
        .catch(error => {
            console.error('Ошибка при отправке данных осмотра:', error);
        });
    });
   
});
