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
     const previousInspectionContainer = document.getElementById('previousInspectionContainer');

   // Проверка на наличие previousInspectionId
   if (previousInspectionId && previousInspectionId !== 'null') {
    secondaryInspectionRadio.checked = true;
    previousInspectionContainer.style.display = 'block'; // Показываем select

    // Загружаем список осмотров и устанавливаем previousInspectionSelect на нужный элемент
    loadPreviousInspections(apiBaseUrl, authToken, patientId, previousInspectionSelect)
        .then(() => {
            // Устанавливаем выбранный осмотр после загрузки списка
            previousInspectionSelect.value = previousInspectionId;
        });
} else {
    primaryInspectionRadio.checked = true;
}

    // Обработчик для переключения типа осмотра
    primaryInspectionRadio.addEventListener('change', function () {
        previousInspectionContainer.style.display = 'none';
        previousInspectionSelect.value = ''; // Сбрасываем выбранное значение
        previousInspectionId = null; // Сбрасываем значение previousInspectionId
    });

    secondaryInspectionRadio.addEventListener('change', function () {
        previousInspectionContainer.style.display = 'block'; // Показываем select
        loadPreviousInspections(apiBaseUrl, authToken, patientId, previousInspectionSelect); // Загружаем список осмотров
    });


    // Обработчик для изменения выбранного осмотра
    previousInspectionSelect.addEventListener('change', function () {
        previousInspectionId = previousInspectionSelect.value || null; // Устанавливаем previousInspectionId на выбранное значение
    }); 
    

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


    function addDiagnosisToList(diagnosis) {
        const diagnosisItem = document.createElement('div');
        diagnosisItem.className = 'd-flex flex-column align-items-start mb-2 p-2 border bg-white rounded';

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


    diagnosisSearch.addEventListener('focus', () => fetchDiagnoses('', authToken, apiBaseUrl, diagnosisResults, diagnosisSearch));

    diagnosisSearch.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length > 0) {
            fetchDiagnoses(query, authToken, apiBaseUrl, diagnosisResults, diagnosisSearch);
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

consultationSpecialty.addEventListener('focus', () => {
    const query = consultationSpecialty.value.trim();
    fetchSpecialties(query, authToken, apiBaseUrl, consultationResults, consultationSpecialty);
});


    const consultationResults = document.getElementById('consultationResults');
// Передаём все необходимые аргументы в вызов функции
    consultationSpecialty.addEventListener('input', function() {
        const query = this.value.trim();
        fetchSpecialties(query, authToken, apiBaseUrl, consultationResults, consultationSpecialty);
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
            previousInspectionId: previousInspectionId,
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
