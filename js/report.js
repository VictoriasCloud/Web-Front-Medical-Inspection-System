document.addEventListener('DOMContentLoaded', function () {
    const authToken = localStorage.getItem('authToken');
    const apiBaseUrl = 'https://mis-api.kreosoft.space';
    const reportForm = document.getElementById('reportForm');
    const reportResult = document.getElementById('reportResult');
    const tableHeaders = document.getElementById('tableHeaders');
    const tableBody = document.getElementById('tableBody');

    if (!authToken) {
        alert('Авторизация требуется для доступа к этой странице.');
        window.location.href = 'login.html';
        return;
    }

    // Загружаем ICD-10 при загрузке страницы
    loadIcd10Options();

    // Обработчик отправки формы
    reportForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Полчаем  значения формы
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const icdRoots = getSelectedIcd10();  // Получаем ID выбранных ICD-10 корней

        // Получить данные отчета со сваггера
        const reportData = await fetchReport(startDate, endDate, icdRoots);

        // Проверяем, что reportData содержит нужные данные перед рендерингом:)
        if (reportData && reportData.filters && reportData.records) {
            renderReport(reportData);  // Отрисовываем
        } else {
            console.error("Некорректный ответ от сервера:", reportData);
            alert("Не удалось получить отчет. Попробуйте еще раз.");
        }
    });

    // получение отчета с сервера
    async function fetchReport(start, end, icdRoots) {
        const params = new URLSearchParams({ start, end });

        // Добавляем каждый корень ICD-10 как параметр icdRoots
        icdRoots.forEach(root => params.append('icdRoots', root));

        try {
            const response = await fetch(`${apiBaseUrl}/api/report/icdrootsreport?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка при загрузке отчета:', error);
            alert("Ошибка при загрузке отчета. Пожалуйста, проверьте параметры и попробуйте снова.");
        }
    }

function renderReport(data) {
    reportResult.style.display = 'block';

    reportResult.innerHTML = '<h4 class="mt-4">Результат отчёта:</h4>';
    tableHeaders.innerHTML = ''; 

    // Основные заголовки
    tableHeaders.innerHTML = `
        <th class="border rounded-start">Пациент</th>
        <th class="border">Дата рождения</th>
        <th class="border">Пол</th>
    `;

    // Проверка что data.filters.icdRoots существует
    if (data.filters.icdRoots && Array.isArray(data.filters.icdRoots)) {
        // Динамически добавляем заголовки для каждого корня ICD-10
        data.filters.icdRoots.forEach((root, index) => {
            const th = document.createElement('th');
            th.className = 'border text-center';
            if (index === data.filters.icdRoots.length - 1) {
                th.classList.add('rounded-end'); // Закругляем последний заголовок. нифига оно не закругляется.
            }
            th.textContent = root;
            tableHeaders.appendChild(th);
        });
    } else {
        console.error("Нет данных для корней ICD-10 в ответе от сервера.");
        alert("Ошибка при получении корней ICD-10 из ответа сервера.");
        return;
    }

    // Заполняем таблицу
    tableBody.innerHTML = '';
    data.records.forEach(record => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="border">${record.patientName}</td>
            <td class="border">${new Date(record.patientBirthdate).toLocaleDateString()}</td>
            <td class="border">${record.gender}</td>
        `;

        // Добавляем количество посещений по каждому корню ICD-10
        data.filters.icdRoots.forEach(root => {
            const visitCount = record.visitsByRoot[root] || 0;
            row.innerHTML += `<td class="border text-center">${visitCount}</td>`;
        });

        tableBody.appendChild(row);
    });

    reportResult.innerHTML += `
        <div class="table-responsive">
            <table class="table table-bordered table-hover table-striped mt-3 rounded">
                <thead class="table-primary rounded-top">
                    <tr>${tableHeaders.innerHTML}</tr>
                </thead>
                <tbody class="rounded-bottom">${tableBody.innerHTML}</tbody>
            </table>
        </div>
    `;
}

    
});
