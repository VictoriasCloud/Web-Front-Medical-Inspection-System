// Функция для установки пагинации
function setupPagination(pagination, loadInspections) {
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = ''; // Очищаем пагинацию

    const totalPages = pagination.count;
    const currentPage = pagination.current;

    if (currentPage > 1) {
        const prevPageItem = document.createElement('li');
        prevPageItem.className = 'page-item';
        prevPageItem.innerHTML = `<a class="page-link" href="#">Предыдущая</a>`;
        prevPageItem.addEventListener('click', function (event) {
            event.preventDefault();
            loadInspections(currentPage - 1);
        });
        paginationElement.appendChild(prevPageItem);
    }

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageItem.addEventListener('click', function (event) {
            event.preventDefault();
            loadInspections(i);
        });
        paginationElement.appendChild(pageItem);
    }

    if (currentPage < totalPages) {
        const nextPageItem = document.createElement('li');
        nextPageItem.className = 'page-item';
        nextPageItem.innerHTML = `<a class="page-link" href="#">Следующая</a>`;
        nextPageItem.addEventListener('click', function (event) {
            event.preventDefault();
            loadInspections(currentPage + 1);
        });
        paginationElement.appendChild(nextPageItem);
    }
}

// Экспорт функции на глобальный объект window
window.setupPagination = setupPagination;
