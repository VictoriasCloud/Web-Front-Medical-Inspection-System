document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken');
    const urlParams = new URLSearchParams(window.location.search);
    const inspectionId = urlParams.get('id');
    const apiBaseUrl = 'https://mis-api.kreosoft.space';
    let currentDoctorId = null;
    const diagnosisList = []; // Список диагнозов
    const diagnosisSearch = document.getElementById('diagnosisSearch');
    const diagnosisResults = document.getElementById('diagnosisResults');
    const diagnosisListContainer = document.getElementById('diagnosisList');
    const diagnosisDescriptionInput = document.getElementById('diagnosisDescription');
    const conclusionTypeSelect = document.getElementById('conclusionType');


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
                    document.getElementById('editInspectionBtn').style.display = 'block';
                document.getElementById('editInspectionBtn').addEventListener('click', () => openEditModal(data));
                }
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке осмотра:', error);
        });
    }

const conclusionMapping = {
    "Disease": "Болезнь",
    "Death": "Смерть",
    "Recovery": "Выздоровление"
};

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

    // Определение пола пациента
    patientGenderEl.textContent = inspection.patient.gender === 'Male' ? 'Мужской' :
                                  inspection.patient.gender === 'Female' ? 'Женский' :
                                  inspection.patient.gender; // Для других значений

    patientBirthdayEl.textContent = new Date(inspection.patient.birthday).toLocaleDateString();

    // Заполнение элементов, если они присутствуют
    if (inspectionDateEl) inspectionDateEl.textContent = new Date(inspection.date).toLocaleDateString();
    if (patientNameEl) patientNameEl.textContent = inspection.patient.name;
    if (doctorNameEl) doctorNameEl.textContent = inspection.doctor.name;
    if (complaintsTextEl) complaintsTextEl.textContent = inspection.complaints;
    if (anamnesisTextEl) anamnesisTextEl.textContent = inspection.anamnesis;
    if (treatmentTextEl) treatmentTextEl.textContent = inspection.treatment;

    // Отображение заключения на русском
    if (conclusionTextEl) {
        conclusionTextEl.textContent = conclusionMapping[inspection.conclusion] || inspection.conclusion;
    }

    // Отображение дат в зависимости от заключения
    const showNextVisit = inspection.conclusion === 'Disease' && inspection.nextVisitDate;
    const showDeathDate = inspection.conclusion === 'Death' && inspection.deathDate;

    nextVisitDateEl.style.display = showNextVisit ? 'block' : 'none';
    deathDateEl.style.display = showDeathDate ? 'block' : 'none';

    if (showNextVisit) {
        nextVisitDateEl.textContent = `Дата следующего визита: ${new Date(inspection.nextVisitDate).toLocaleString()}`;
    }
    if (showDeathDate) {
        deathDateEl.textContent = `Дата и время смерти: ${new Date(inspection.deathDate).toLocaleString()}`;
    }

    // Отображение диагнозов и консультаций
    renderDiagnoses(inspection.diagnoses);
    renderConsultations(inspection.consultations);
}



// Функция для загрузки комментариев консультации
function loadComments(consultationId, container) {
    fetch(`https://mis-api.kreosoft.space/api/consultation/${consultationId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const commentsByParent = groupCommentsByParent(data.comments);
        commentsByParent[null]?.forEach(comment => renderComment(comment, container, commentsByParent, data));
    })
    .catch(error => console.error('Ошибка при загрузке комментариев:', error));
}
    

function renderConsultations(consultations) {
    const consultationsList = document.getElementById('consultations-list');
    if (!consultationsList) return;

    consultationsList.innerHTML = '';
    consultations.forEach(consultation => {
        const listItem = document.createElement('div');
        listItem.className = 'p-3 mb-2 border rounded bg-white';
        listItem.setAttribute('data-consultation-id', consultation.id); // Добавляем идентификатор консультации

        // Контейнер для комментариев, скрытый по умолчанию
        const commentsContainer = document.createElement('div');
        commentsContainer.className = 'comments mt-2';
        commentsContainer.style.display = 'none';

        // Кнопка для показа/скрытия комментариев
        const toggleButton = document.createElement('span');
        toggleButton.className = 'text-primary cursor-pointer';
        toggleButton.style.cursor = 'pointer';
        toggleButton.textContent = '(показать)';

        // Событие на кнопку для показа/скрытия комментариев
        toggleButton.addEventListener('click', () => {
            if (commentsContainer.style.display === 'none') {
                commentsContainer.style.display = 'block';
                toggleButton.textContent = '(скрыть)';
                loadComments(consultation.id, commentsContainer); // Загружаем комментарии только при открытии
            } else {
                commentsContainer.style.display = 'none';
                toggleButton.textContent = '(показать)';
                commentsContainer.innerHTML = ''; // Очищаем, чтобы не дублировать при повторном открытии
            }
        });

        // Добавляем основную информацию о консультации
        listItem.innerHTML = `
            <strong>Специальность консультанта: ${consultation.speciality.name}</strong><br>
            Комментарий врача: ${consultation.rootComment.content}<br>
            <div class="d-flex align-items-center">
                <em class="me-1">Количество ответов: ${consultation.commentsNumber}</em>
            </div>
        `;

        // Вставляем кнопку (показать/скрыть) рядом с количеством ответов
        listItem.querySelector('.d-flex').appendChild(toggleButton);
        listItem.appendChild(commentsContainer);

        consultationsList.appendChild(listItem);
    });
}

    

// Функция для группировки комментариев по parentId
function groupCommentsByParent(comments) {
    if (!Array.isArray(comments)) {
        return {}; //раньше нужно было для проверки, но щас пусть останется
    }
    
    return comments.reduce((acc, comment) => {
        const parentId = comment.parentId || null;
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(comment);
        return acc;
    }, {});
}



// Отрисовка комментария и его дочерних комментариев
function renderComment(comment, container, commentsByParent, consultation) {
    const commentElement = document.createElement('div');
    commentElement.className = 'p-2 mb-1 border rounded bg-light';

    const createDate = new Date(comment.createTime).toLocaleString();
    let lastEditedInfo = '';

    //Проверяем, отличается ли время изменения от времени создания. если да, то отображаем изменение
    if (comment.modifiedDate && comment.modifiedDate !== comment.createTime) {
        const editedDate = new Date(comment.modifiedDate).toLocaleString();
        lastEditedInfo = `<span class="text-muted" title="Последнее изменение: ${editedDate}">(Изменено в ${editedDate})</span>`;
    }

    commentElement.innerHTML = `
        <div class="row">
            <div class="col-10">
                <div>
                    <strong>${comment.author}</strong> ${lastEditedInfo}
                </div>
                <p class="mb-1">${comment.content}</p>
                <div class="text-muted small">${createDate}</div>
            </div>
            <div class="col-2 d-flex flex-column align-items-end">
                <div class="mt-auto d-flex">
                    ${comment.authorId === currentDoctorId ? 
                        `<button class="btn btn-sm btn-secondary me-2 edit-comment-btn">Редактировать</button>` : ''}
                    <button class="btn btn-sm btn-primary reply-btn">Ответить</button>
                </div>
            </div>
        </div>
    `;

    // Обработчик для кнопки "Редактировать"
    commentElement.querySelector('.edit-comment-btn')?.addEventListener('click', () => {
        showEditCommentForm(comment, commentElement);
    });

    // Обработчик для кнопки "Ответить" с передачей объекта consultation
    commentElement.querySelector('.reply-btn').addEventListener('click', () => {
        showReplyForm(consultation, commentElement, comment.id);
    });

    container.appendChild(commentElement);

    // Если у комментария есть дочерние комментарии, отображаем их рекурсивно
    if (commentsByParent[comment.id]) {
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'ms-4 mt-2';
        commentsByParent[comment.id].forEach(reply =>renderComment(reply, repliesContainer, commentsByParent, consultation));
        container.appendChild(repliesContainer);
    }
}




    function showEditCommentForm(comment, commentElement) {
        const editForm = document.createElement('div');
        editForm.className = 'edit-form mt-2';
    
        editForm.innerHTML = `
            <textarea class="form-control mb-2">${comment.content}</textarea>
            <button class="btn btn-sm btn-success save-edit-btn">Сохранить</button>
            <button class="btn btn-sm btn-secondary cancel-edit-btn">Отмена</button>
        `;
    
        commentElement.appendChild(editForm);
    
        editForm.querySelector('.save-edit-btn').addEventListener('click', () => {
            const updatedContent = editForm.querySelector('textarea').value;
            saveEditedComment(comment.id, updatedContent, commentElement, editForm);
        });
    
        editForm.querySelector('.cancel-edit-btn').addEventListener('click', () => {
            editForm.remove();
        });
    }


    function saveEditedComment(commentId, updatedContent, commentElement, editForm) {
        fetch(`${apiBaseUrl}/api/consultation/comment/${commentId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: updatedContent })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }
            return response;
        })
        .then(() => {
            // Убираем форму редактирования
            editForm.remove();
    
            // Находим родительский элемент консультации
            const consultationContainer = commentElement.closest('[data-consultation-id]');
            const commentsContainer = consultationContainer.querySelector('.comments');
    
            // Обновляем комм-ии в этой консультации и сразу раскрываем их
            commentsContainer.innerHTML = '';
            commentsContainer.style.display = 'block';
            const toggleButton = consultationContainer.querySelector('.text-primary');
            toggleButton.textContent = '(скрыть)';
    
            // Загружаем и отображаем обновленные комментарии уаа
            loadComments(consultationContainer.getAttribute('data-consultation-id'), commentsContainer);
        })
        .catch(error => console.error('Ошибка при редактировании комментария:', error));
    }
    
    


    function showReplyForm(consultation, commentElement, parentId) {
        const replyForm = document.createElement('div');
        replyForm.className = 'reply-form mt-2';
    
        replyForm.innerHTML = `
            <textarea class="form-control mb-2" placeholder="Ваш ответ..."></textarea>
            <button class="btn btn-sm btn-primary send-reply-btn">Отправить</button>
            <button class="btn btn-sm btn-secondary cancel-reply-btn">Отмена</button>
        `;
    
        commentElement.appendChild(replyForm);
    
        replyForm.querySelector('.send-reply-btn').addEventListener('click', () => {
            const replyContent = replyForm.querySelector('textarea').value;
            sendReply(consultation.id, replyContent, commentElement, replyForm, parentId);
        });
    
        replyForm.querySelector('.cancel-reply-btn').addEventListener('click', () => {
            replyForm.remove();
        });
    }

    function sendReply(consultationId, replyContent, commentElement, replyForm, parentId) {
        fetch(`${apiBaseUrl}/api/consultation/${consultationId}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: replyContent, parentId: parentId })
        })
        .then(response => response.json())
        .then(newReply => {
            replyForm.remove(); // Убираем форму ответа
            // Находим контейнер комментариев и очищаем его
            const commentsContainer = commentElement.closest('.comments');
            commentsContainer.innerHTML = ''; 
            
            // Заново загружаем и отображаем все комментарии для этой консультации
            loadComments(consultationId, commentsContainer);
        })
        .catch(error => console.error('Ошибка при отправке ответа:', error));
    }

    function fetchCommentsForConsultation(consultationId, container) {
        fetch(`${apiBaseUrl}/api/consultation/${consultationId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            const commentsByParent = groupCommentsByParent(data.comments);
            commentsByParent[null].forEach(comment => renderComment(comment, container, commentsByParent));
        })
        .catch(error => console.error('Ошибка при загрузке комментариев:', error));
    }
    
    
    



    document.getElementById('saveChangesBtn').addEventListener('click', () => {
        const complaintsField = document.getElementById('edit-complaints');
        const anamnesisField = document.getElementById('edit-anamnesis');
        const treatmentField = document.getElementById('edit-treatment');
        const conclusionField = document.getElementById('conclusionType');
        const nextVisitDateField = document.getElementById('nextVisitDate');
        const deathDateField = document.getElementById('deathDateInput');
    
        // Установка значения заключения
        const conclusionValue = conclusionField ? conclusionField.value : null;
    
        // Установка значений для дат в зависимости от заключения
        let nextVisitDate = nextVisitDateField ? nextVisitDateField.value || null : null;
        let deathDate = deathDateField ? deathDateField.value || null : null;
    
        if (conclusionValue === 'Death') {
            nextVisitDate = null; // Если заключение "Смерть", удаляем дату следующего визита
        } else if (conclusionValue === 'Disease') {
            deathDate = null; // Если заключение "Болезнь", удаляем дату смерти
        } else if (conclusionValue === 'Recovery') {
            // Если заключение "Выздоровление", оба поля даты не должны быть отправлены
            nextVisitDate = null;
            deathDate = null;
        }
    
        const updatedData = {
            complaints: complaintsField ? complaintsField.value : '',
            anamnesis: anamnesisField ? anamnesisField.value : '',
            treatment: treatmentField ? treatmentField.value : '',
            conclusion: conclusionValue,
            nextVisitDate: nextVisitDate,
            deathDate: deathDate,
            diagnoses: [] // Пустой массив для наполнения с актуальными icdDiagnosisId
        };
    
        console.log("Данные для отправки:", JSON.stringify(updatedData));
    
        const fetchPromises = diagnosisList.map(diagnosis => {
            return new Promise((resolve) => {
                fetchDiagnoses(diagnosis.code, authToken, apiBaseUrl, null, null)
                    .then(records => {
                        const matchedDiagnosis = records.find(record => record.code === diagnosis.code);
                        if (matchedDiagnosis) {
                            updatedData.diagnoses.push({
                                icdDiagnosisId: matchedDiagnosis.id,
                                description: diagnosis.description || '',
                                type: diagnosis.type || "Main"
                            });
                        } else {
                            console.warn(`Не найден диагноз для кода ${diagnosis.code} в МКБ-10`);
                        }
                        resolve();
                    })
                    .catch(error => {
                        console.error('Ошибка при поиске icdDiagnosisId:', error);
                        resolve();
                    });
            });
        });
    
        Promise.all(fetchPromises).then(() => {
            fetch(`${apiBaseUrl}/api/inspection/${inspectionId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            })
            .then(response => {
                if (response.ok) {
                    alert('Изменения успешно сохранены.');
                    location.reload();
                } else {
                    return response.json().then(errorData => {
                        console.error("Ошибка при сохранении:", errorData.message || "Неизвестная ошибка");
                        throw new Error('Ошибка при сохранении изменений.');
                    });
                }
            })
            .catch(error => console.error('Ошибка при сохранении:', error));
        });
    });







    function updateConclusionFields() {
        const nextVisitContainer = document.getElementById('nextVisit');
        const deathDateContainer = document.getElementById('deathDate');
        
        // Убедимся, что контейнеры существуют
        if (!conclusionTypeSelect || !nextVisitContainer || !deathDateContainer) return;

        // Скрываем оба контейнера по умолчанию
        nextVisitContainer.classList.add('d-none');
        deathDateContainer.classList.add('d-none');

        // Показываем нужное поле в зависимости от значения
        if (conclusionTypeSelect.value === 'Disease') {
            nextVisitContainer.classList.remove('d-none');
        } else if (conclusionTypeSelect.value === 'Death') {
            deathDateContainer.classList.remove('d-none');
        }
    }
    
    const conclusionField = document.getElementById('conclusionType');
    if (conclusionField) {
        conclusionField.addEventListener('change', updateConclusionFields);
        updateConclusionFields(); // Инициализируем видимость полей при загрузке
    }

    // Добавляем обработчик события, если элемент `conclusionTypeSelect` существует
    if (conclusionTypeSelect) {
        conclusionTypeSelect.addEventListener('change', updateConclusionFields);
        updateConclusionFields();
    }

    function openEditModal(inspection) {
        // Заполнение полей модального окна значениями из осмотра
        const complaintsField = document.getElementById('edit-complaints');
        const anamnesisField = document.getElementById('edit-anamnesis');
        const treatmentField = document.getElementById('edit-treatment');
        const conclusionField = document.getElementById('conclusionType');
        const nextVisitDateField = document.getElementById('nextVisitDate');
        const deathDateField = document.getElementById('deathDateInput');
        const diagnosisListContainer = document.getElementById('diagnosisList');
    
        // Установка значений для текстовых полей
        if (complaintsField) complaintsField.value = inspection.complaints || '';
        if (anamnesisField) anamnesisField.value = inspection.anamnesis || '';
        if (treatmentField) treatmentField.value = inspection.treatment || '';
        if (conclusionField) conclusionField.value = inspection.conclusion || '';
    
        // Приведение дат к формату для input с типом datetime-local
        if (nextVisitDateField) {
            nextVisitDateField.value = inspection.nextVisitDate
                ? new Date(inspection.nextVisitDate).toISOString().slice(0, 16) // Формат YYYY-MM-DDTHH:MM
                : '';
        }
        if (deathDateField) {
            deathDateField.value = inspection.deathDate
                ? new Date(inspection.deathDate).toISOString().slice(0, 16) // Формат YYYY-MM-DDTHH:MM
                : '';
        }
    
        // Обновляем видимость полей в зависимости от заключения
        updateConclusionFields();
    
        // Очистка и отображение диагнозов
        if (diagnosisListContainer) {
            diagnosisListContainer.innerHTML = '';
            inspection.diagnoses.forEach(diagnosis => addDiagnosisToList(diagnosis));
        } else {
            console.error('Element with id "diagnosisList" not found.');
        }
    
        // Показ модального окна
        const editModalElement = document.getElementById('editInspectionModal');
        if (editModalElement) {
            const editModal = new bootstrap.Modal(editModalElement);
            editModal.show();
        } else {
            console.error('Modal element with id "editInspectionModal" not found.');
        }
    }
    
    


// Логика добавления нового диагноза
document.getElementById('addDiagnosisBtn').addEventListener('click', function(e) {
    e.preventDefault();

    const diagnosisId = document.getElementById('diagnosisSearch').dataset.diagnosisId;
    const diagnosisName = document.getElementById('diagnosisSearch').value;
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

    const englishType = { "Основной": "Main", "Сопутствующий": "Concomitant", "Осложнение": "Complication" }[selectedType];

    addDiagnosisToList({
        id: diagnosisId,
        code: diagnosisName.split(' - ')[0],
        name: diagnosisName.split(' - ')[1],
        type: englishType,
        description
    });

    document.getElementById('diagnosisSearch').value = '';
    document.getElementById('diagnosisDescription').value = '';
    document.getElementsByName('diagnosisType')[0].checked = true;
});

// Сопоставление типов диагноза на русском и английском языках
const diagnosisTypeMapping = {
    "Main": "Основной",
    "Concomitant": "Сопутствующий",
    "Complication": "Осложнение"
};

function renderDiagnoses(diagnoses) {
    const diagnosesList = document.getElementById('diagnoses-list');
    if (!diagnosesList) return;

    diagnosesList.innerHTML = '';
    diagnoses.forEach(diagnosis => {
        const listItem = document.createElement('li');
        listItem.className = 'p-3 mb-2 border rounded bg-white';

        // Преобразование типа диагноза
        const diagnosisType = diagnosisTypeMapping[diagnosis.type] || diagnosis.type;

        listItem.innerHTML = `
            <strong>${diagnosis.code} - ${diagnosis.name}</strong><br>
            Тип: ${diagnosisType}<br>
            Описание: ${diagnosis.description || 'Нет описания'}
        `;

        diagnosesList.appendChild(listItem);
    });
}


function editDiagnosis(diagnosis) {
    // Используем fetchDiagnoses для обновления icdDiagnosisId диагноза по совпадению названия
    fetchDiagnoses(diagnosis.name, authToken, apiBaseUrl, null, null)
        .then(records => {
            const matchedDiagnosis = records.find(d => d.name === diagnosis.name && d.code === diagnosis.code);
            if (matchedDiagnosis) {
                diagnosis.id = matchedDiagnosis.id; // Обновляем icdDiagnosisId на сервере
            }
            
            // Заполнение полей для редактирования диагноза после обновления id
            diagnosisSearch.value = `${diagnosis.code} - ${diagnosis.name}`;
            diagnosisSearch.dataset.diagnosisId = diagnosis.id;
            diagnosisDescriptionInput.value = diagnosis.description || '';

            // Установка типа диагноза
            const typeInputs = document.getElementsByName('diagnosisType');
            typeInputs.forEach(input => {
                if (input.value === Object.keys(diagnosisTypeMapping).find(key => diagnosisTypeMapping[key] === diagnosis.type) || input.value === diagnosis.type) {
                    input.checked = true;
                }
            });
        })
        .catch(error => console.error('Ошибка при обновлении id диагноза:', error));
}


function addDiagnosisToList(diagnosis) {
    const existingDiagnosis = diagnosisList.find(d => d.id === diagnosis.id);
    if (existingDiagnosis) {
        existingDiagnosis.description = diagnosis.description;
        existingDiagnosis.type = diagnosis.type;
        return;
    }
    
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
    });

    diagnosisList.push(diagnosis);
    diagnosisListContainer.appendChild(diagnosisItem);
}



// Запуск поиска диагноза
document.getElementById('diagnosisSearch').addEventListener('focus', () => fetchDiagnoses('', authToken, apiBaseUrl, diagnosisResults, diagnosisSearch));

// Обработка ввода в поле поиска
document.getElementById('diagnosisSearch').addEventListener('input', function() {
    const query = this.value.trim();
    if (query.length > 0) {
        fetchDiagnoses(query);
    } else {
        document.getElementById('diagnosisResults').style.display = 'none';
    }
});

 // Обработка поиска диагноза по ICD-10
 diagnosisSearch.addEventListener('focus', () => fetchDiagnoses('', authToken, apiBaseUrl, diagnosisResults, diagnosisSearch));

 diagnosisSearch.addEventListener('input', function() {
     const query = this.value.trim();
     if (query.length > 0) {
         fetchDiagnoses(query, authToken, apiBaseUrl, diagnosisResults, diagnosisSearch);
     } else {
         diagnosisResults.style.display = 'none';
     }
 });
    // Закрытие результатов поиска, если клик вне поля поиска
    document.addEventListener('click', function(e) {
    if (!diagnosisSearch.contains(e.target) && !diagnosisResults.contains(e.target)) {
        diagnosisResults.style.display = 'none';
    }
});

    document.getElementById('editInspectionBtn')?.addEventListener('click', () => {
        // Логика для открытия модального окна редактирования
    });
        // Вызов функции при загрузке страницы
    updateConclusionFields();
});
