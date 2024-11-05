document.addEventListener('DOMContentLoaded', function () {
    const authToken = localStorage.getItem('authToken');
    const apiBaseUrl = 'https://mis-api.kreosoft.space';
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');
    let inspectionsData = []; // Хранение данных осмотров
    let filterGrouped = true; // По умолчанию выбрано "Сгруппировать по повторным"
    const icd10Container = document.getElementById('icd10-container');

    // Функция для загрузки опций ICD-10
    function loadIcd10Options() {
        fetch(`${apiBaseUrl}/api/dictionary/icd10/roots`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'form-check';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'form-check-input';
                checkbox.id = item.id;
                checkbox.value = item.id;

                const label = document.createElement('label');
                label.className = 'form-check-label';
                label.setAttribute('for', item.id);
                label.textContent = `${item.code} - ${item.name}`;

                checkboxWrapper.appendChild(checkbox);
                checkboxWrapper.appendChild(label);
                icd10Container.appendChild(checkboxWrapper);
            });
        })
        .catch(error => console.error('Ошибка загрузки диагнозов МКБ-10:', error));
    }

    // Функция для получения выбранных значений ICD-10
    function getSelectedIcd10() {
        const selectedCheckboxes = document.querySelectorAll('#icd10-container input[type="checkbox"]:checked');
        return Array.from(selectedCheckboxes).map(checkbox => checkbox.value); // Возвращаем массив ID выбранных диагнозов
    }

    // Загрузка данных пациента
    function loadPatientInfo() {
        fetch(`${apiBaseUrl}/api/patient/${patientId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('patientName').textContent = `${data.name}`;
            document.getElementById('patientDob').textContent = `Дата рождения: ${new Date(data.birthday).toLocaleDateString()}`;
        })
        .catch(error => console.error('Ошибка загрузки данных пациента:', error));
    }

    // Загрузка осмотров
    function loadInspections(page = 1) {
        const pageSize = document.getElementById('pageSize').value || 5;
        const selectedICD10 = getSelectedIcd10(); // Получаем выбранные значения с чекбоксов
        const grouped = filterGrouped;
        
        let params = new URLSearchParams({ 
            page, 
            size: pageSize, 
            grouped: grouped.toString() 
        });
        
        selectedICD10.forEach(icdRoot => params.append('icdRoots', icdRoot));
    
        fetch(`${apiBaseUrl}/api/patient/${patientId}/inspections?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            inspectionsData = data.inspections;
            renderInspections();  // Отрисовка осмотров
        })
        .catch(error => console.error('Ошибка загрузки осмотров:', error));
    }

	function renderInspection(cell, inspection, columnContainer, level = 0) {
		const inspectionBlock = document.createElement('div');
		inspectionBlock.className = 'inspection-block d-flex flex-column justify-content-between h-100 p-3 bg-light border rounded';
		inspectionBlock.setAttribute('data-id', inspection.id); // Устанавливаем идентификатор для проверки
	
		// Устанавливаем отступ слева на основе уровня вложенности
		inspectionBlock.style.marginLeft = `${level * 30}px`;
	
		inspectionBlock.innerHTML = `
			<div>
				<h5>${new Date(inspection.date).toLocaleDateString()} - ${inspection.conclusion || 'Не указано'}</h5>
				<p><strong>Основной диагноз:</strong> ${inspection.diagnosis ? inspection.diagnosis.code + ' - ' + inspection.diagnosis.name : 'Не указано'}</p>
				<p><strong>Медицинский работник:</strong> ${inspection.doctor || 'Не указано'}</p>
				<p><strong>Заключение:</strong> ${inspection.conclusion || 'Не указано'}</p>
			</div>
			<div>
				<a href="#" class="btn btn-primary mt-auto">Детали осмотра</a>
			</div>`;
	
		cell.appendChild(inspectionBlock);
		columnContainer.appendChild(cell);
	}
	
	function addChildInspections(parentInspection, childInspections, parentCell, columnContainer, level) {
		let insertAfter = parentCell.nextSibling;
	
		childInspections.forEach(child => {
			const childCell = document.createElement('div');
			childCell.className = 'inspection-cell mb-4 child-inspection';
			childCell.setAttribute('data-parent-id', parentInspection.id); // Устанавливаем родительский ID
	
			// Передаём увеличенный уровень вложенности для каждого следующего элемента
			renderInspection(childCell, child, columnContainer, level + 1); // Увеличиваем уровень вложенности
	
			columnContainer.insertBefore(childCell, insertAfter); // Вставляем дочерние осмотры сразу под родителем
		});
	}
	

    // Переключение отображения дочерних осмотров
    function toggleChildInspections(inspection, parentCell, chainButton, columnContainer, level) {
        if (inspection.isExpanded) {
            hideChildInspections(inspection, chainButton, columnContainer);
        } else {
            loadChildInspections(inspection, parentCell, chainButton, columnContainer, level);
        }
    }

    // Загрузка дочерних осмотров с применением отступов
    function loadChildInspections(inspection, parentCell, chainButton, columnContainer, level) {
        if (!inspection.isExpanded) { // Только если осмотры не были ранее загружены
            fetch(`${apiBaseUrl}/api/inspection/${inspection.id}/chain`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(childInspections => {
                addChildInspections(inspection, childInspections, parentCell, columnContainer, level);
                inspection.isExpanded = true; // Обновляем флаг, чтобы не загружать повторно
                chainButton.textContent = '- Скрыть повторные осмотры';
            })
            .catch(error => console.error('Ошибка загрузки повторных осмотров:', error));
        }
    }

    // Добавление дочерних осмотров с увеличением отступа
    function addChildInspections(parentInspection, childInspections, parentCell, columnContainer, level) {
        let insertAfter = parentCell.nextSibling;

        childInspections.forEach(child => {
            const childCell = document.createElement('div');
            childCell.className = 'inspection-cell mb-4 child-inspection';
            childCell.setAttribute('data-parent-id', parentInspection.id);

            renderInspection(childCell, child, columnContainer, level + 1); // Увеличиваем уровень вложенности для каждого дочернего осмотра
            columnContainer.insertBefore(childCell, insertAfter); // Вставляем осмотры под родительским
        });
    }

    // Скрытие дочерних осмотров
    function hideChildInspections(inspection, chainButton, columnContainer) {
        const childCells = columnContainer.querySelectorAll(`[data-parent-id="${inspection.id}"]`);
        childCells.forEach(child => child.remove());
        inspection.isExpanded = false;
        chainButton.textContent = '+ Показать повторные осмотры';
    }

    // Инициализация загрузки данных
    loadIcd10Options();
    loadPatientInfo();
    loadInspections();
});
