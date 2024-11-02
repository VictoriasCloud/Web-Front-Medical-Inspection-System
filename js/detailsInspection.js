document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken');
    const urlParams = new URLSearchParams(window.location.search);
    const inspectionId = urlParams.get('id');
    const apiBaseUrl = 'https://mis-api.kreosoft.space';
    let currentDoctorId = null;

    // Проверка авторизации
    if (!authToken) {
        alert('Авторизация требуется для доступа к этой странице.');
        window.location.href = '/login.html';
        return;
    }

    // Получаем профиль доктора и затем загружаем данные осмотра
    fetchDoctorProfile(apiBaseUrl, authToken)
        .then(data => {
            currentDoctorId = data.id;
            loadInspectionData();
        })
        .catch(error => {
            console.error('Ошибка при получении профиля:', error);
        });

    // Функция для загрузки данных осмотра и отображения кнопки редактирования
    function loadInspectionData() {
        fetch(`${apiBaseUrl}/api/inspection/${inspectionId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            displayInspectionData(data);

            // Проверка, является ли текущий доктор автором осмотра
            if (data.doctor.id === currentDoctorId) {
                const editButton = document.getElementById('editInspectionBtn');
                if (editButton) {
                    editButton.style.display = 'block'; // Показываем кнопку "Редактировать осмотр"
                }
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке осмотра:', error);
        });
    }

    // Основная функция отображения данных осмотра
    function displayInspectionData(inspection) {
        const inspectionDateEl = document.getElementById('inspection-date');
        const patientNameEl = document.getElementById('patient-name');
        const patientGenderEl = document.getElementById('patient-gender');
        const patientBirthdayEl = document.getElementById('patient-birthday');
        const doctorNameEl = document.getElementById('doctor-name');
        const complaintsTextEl = document.getElementById('complaints-text');
        const anamnesisTextEl = document.getElementById('anamnesis-text');
        const treatmentTextEl = document.getElementById('treatment-text');
        const conclusionTextEl = document.getElementById('conclusion-text');
        const nextVisitDateEl = document.getElementById('next-visit-date');
        const deathDateEl = document.getElementById('death-date');

        patientGenderEl.textContent = inspection.patient.gender;
        patientBirthdayEl.textContent = new Date(inspection.patient.birthday).toLocaleDateString();
        

        // Заполняем элементы, если они присутствуют
        if (inspectionDateEl) inspectionDateEl.textContent = new Date(inspection.date).toLocaleDateString();
        if (patientNameEl) patientNameEl.textContent = inspection.patient.name;
        if (doctorNameEl) doctorNameEl.textContent = inspection.doctor.name;
        if (complaintsTextEl) complaintsTextEl.textContent = inspection.complaints;
        if (anamnesisTextEl) anamnesisTextEl.textContent = inspection.anamnesis;
        if (treatmentTextEl) treatmentTextEl.textContent = inspection.treatment;
        if (conclusionTextEl) conclusionTextEl.textContent = inspection.conclusion;

        // Отображение заключения и связанных с ним дат
        if (inspection.conclusion === 'Disease' && inspection.nextVisitDate && nextVisitDateEl) {
            nextVisitDateEl.textContent = `Дата следующего визита: ${new Date(inspection.nextVisitDate).toLocaleDateString()}`;
            nextVisitDateEl.style.display = 'block';
            if (deathDateEl) deathDateEl.style.display = 'none';
        } else if (inspection.conclusion === 'Death' && inspection.deathDate && deathDateEl) {
            deathDateEl.textContent = `Дата и время смерти: ${new Date(inspection.deathDate).toLocaleString()}`;
            deathDateEl.style.display = 'block';
            if (nextVisitDateEl) nextVisitDateEl.style.display = 'none';
        } else {
            if (nextVisitDateEl) nextVisitDateEl.style.display = 'none';
            if (deathDateEl) deathDateEl.style.display = 'none';
        }

        renderDiagnoses(inspection.diagnoses);
        renderConsultations(inspection.consultations);
    }

    function renderDiagnoses(diagnoses) {
        const diagnosesList = document.getElementById('diagnoses-list');
        if (!diagnosesList) return;

        diagnosesList.innerHTML = '';
        diagnoses.forEach(diagnosis => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>${diagnosis.code} - ${diagnosis.name}</strong><br>
                Тип: ${diagnosis.type}<br>
                Описание: ${diagnosis.description || 'Нет описания'}
            `;
            diagnosesList.appendChild(listItem);
        });
    }

    function renderConsultations(consultations) {
        const consultationsList = document.getElementById('consultations-list');
        if (!consultationsList) return;

        consultationsList.innerHTML = '';
        consultations.forEach(consultation => {
            const listItem = document.createElement('div');
            listItem.className = 'consultation-item';

            listItem.innerHTML = `
                <strong>Специальность консультанта: ${consultation.speciality.name}</strong><br>
                Комментарий врача: ${consultation.rootComment.content}<br>
                <em>Количество ответов: ${consultation.commentsNumber}</em>
            `;

            listItem.addEventListener('click', () => {
                toggleComments(consultation, listItem);
            });

            consultationsList.appendChild(listItem);
        });
    }

    function toggleComments(consultation, listItem) {
        if (listItem.querySelector('.comments')) {
            const commentsContainer = listItem.querySelector('.comments');
            commentsContainer.classList.toggle('d-none');
        } else {
            const commentsContainer = document.createElement('div');
            commentsContainer.className = 'comments mt-2';

            consultation.rootComment.replies.forEach(reply => {
                const comment = document.createElement('p');
                comment.innerHTML = `<strong>${reply.author.name}</strong>: ${reply.content}`;
                commentsContainer.appendChild(comment);
            });

            listItem.appendChild(commentsContainer);
        }
    }

    document.getElementById('editInspectionBtn')?.addEventListener('click', () => {
        // Логика для открытия модального окна редактирования
    });
});
