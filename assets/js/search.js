document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.querySelector('.search-container input');
    const searchResults = document.getElementById('searchResults');
    if (!searchInput || !searchResults) return;

    let pages = [];

    async function loadSitemap() {
        try {
            const response = await fetch('/assets/js/sitemap.json');
            if (!response.ok) throw new Error(`Failed to fetch sitemap: ${response.status}`);
            const data = await response.json();
            pages = data.pages;
        } catch (error) {
            console.error('Search index unavailable:', error);
        }
    }

    function calculateRelevance(page, query) {
        const title = page.title.toLowerCase();
        const description = page.description.toLowerCase();
        const path = page.path.toLowerCase();
        let score = 0;

        if (title.includes(query)) {
            score += 100;
            if (title === query) score += 50;
            if (title.startsWith(query)) score += 25;
        }
        if (description.includes(query)) score += 50;
        if (path.includes(query)) score += 30;
        if (page.type === 'home') score += 10;
        if (page.type === 'about') score += 5;

        return score;
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlightText(text, query) {
        if (!query || !text) return text || '';
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    function displayResults(results, query) {
        searchResults.innerHTML = '';

        if (results.length === 0) {
            searchResults.classList.add('active');
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = `No results found for "${query}"`;
            searchResults.appendChild(noResults);
            return;
        }

        searchResults.classList.add('active');

        const header = document.createElement('div');
        header.className = 'search-results-header';
        header.textContent = `Found ${results.length} result${results.length !== 1 ? 's' : ''}`;
        searchResults.appendChild(header);

        results.forEach(page => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.setAttribute('data-url', page.path);

            const badge = document.createElement('span');
            badge.className = 'result-type-badge ' + page.type;
            badge.textContent = page.type.charAt(0).toUpperCase() + page.type.slice(1);
            item.appendChild(badge);

            const title = document.createElement('h4');
            title.innerHTML = highlightText(page.title, query);
            item.appendChild(title);

            const description = document.createElement('p');
            description.innerHTML = highlightText(page.description, query);
            item.appendChild(description);

            item.addEventListener('click', () => {
                window.location.href = page.path;
            });

            searchResults.appendChild(item);
        });

        const firstResult = searchResults.querySelector('.search-result-item');
        if (firstResult) firstResult.classList.add('active');
    }

    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();

        if (!query) {
            searchResults.classList.remove('active');
            searchResults.innerHTML = '';
            return;
        }

        const results = pages
            .filter(page =>
                page.title.toLowerCase().includes(query) ||
                page.description.toLowerCase().includes(query) ||
                page.path.toLowerCase().includes(query))
            .sort((a, b) => calculateRelevance(b, query) - calculateRelevance(a, query));

        displayResults(results, query);
    }

    let debounceTimer;
    searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(performSearch, 200);
    });

    searchInput.addEventListener('focus', function () {
        if (searchInput.value.trim()) performSearch();
    });

    searchInput.addEventListener('keydown', function (e) {
        if (!searchResults.classList.contains('active')) return;

        const resultItems = searchResults.querySelectorAll('.search-result-item');
        const activeItem = searchResults.querySelector('.search-result-item.active');
        const activeIndex = activeItem ? Array.from(resultItems).indexOf(activeItem) : -1;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (activeIndex < resultItems.length - 1) {
                if (activeItem) activeItem.classList.remove('active');
                resultItems[activeIndex + 1].classList.add('active');
                resultItems[activeIndex + 1].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (activeIndex > 0) {
                if (activeItem) activeItem.classList.remove('active');
                resultItems[activeIndex - 1].classList.add('active');
                resultItems[activeIndex - 1].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter' && activeItem) {
            e.preventDefault();
            window.location.href = activeItem.getAttribute('data-url');
        }
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.search-container')) {
            searchResults.classList.remove('active');
        }
    });

    window.performSearch = performSearch;
    loadSitemap();
});
