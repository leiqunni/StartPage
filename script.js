document.addEventListener('DOMContentLoaded', () => {
    const linksGrid = document.getElementById('links-grid');
    const searchInput = document.getElementById('google-search-input');
    const searchButton = document.getElementById('search-button');
    const suggestionsBox = document.getElementById('suggestions-box');
    const editModal = document.getElementById('edit-modal');
    const closeModalButton = editModal.querySelector('.close-button');
    const saveLinkButton = document.getElementById('save-link-button');
    const deleteLinkButton = document.getElementById('delete-link-button');
    const modalLinkUrl = document.getElementById('modal-link-url');
    const modalLinkTitle = document.getElementById('modal-link-title');
    const modalLinkIcon = document.getElementById('modal-link-icon');
    const modalLinkIndex = document.getElementById('modal-link-index');
    const fetchTitleButton = document.getElementById('fetch-title-button');

    // Elements for settings modal
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsButton = document.getElementById('close-settings-button');
    const linksPerRowInput = document.getElementById('links-per-row');
    const numberOfRowsInput = document.getElementById('number-of-rows');
    const sortByClicksCheckbox = document.getElementById('sort-by-clicks-checkbox');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const exportDataButton = document.getElementById('export-data-button');
    const importDataButton = document.getElementById('import-data-button');
    const importFileInput = document.getElementById('import-file-input');

    // Elements for language selection
    const languageSelector = document.getElementById('language-selector');
    let translations = {}; // Object to hold the loaded translations

    let links = JSON.parse(localStorage.getItem('chromeLinks')) || [];
    let searchHistory = JSON.parse(localStorage.getItem('chromeSearchHistory')) || [];

    // Load settings or set defaults
    let linksPerRow = parseInt(localStorage.getItem('linksPerRow')) || 8;
    let numberOfRows = parseInt(localStorage.getItem('numberOfRows')) || 3;
    let sortByClicksEnabled = (localStorage.getItem('sortByClicksEnabled') === 'true');
    let MAX_LINKS = linksPerRow * numberOfRows;

    const MAX_SEARCH_HISTORY = 10;
    let currentSelectedSuggestion = -1;

    // Fixed suggestions (not translated in JSON as they are dynamic search terms)
    const fixedSuggestions = [
        "Today's news", "Weather", "Stock prices", "Latest technology", "Recommended restaurants",
        "Movie information", "Sports news", "Programming", "Travel destinations", "Recipes",
        "Cafe", "Reading", "Design", "Health", "Fitness", "Education"
    ];

    links.forEach(link => {
        if (typeof link.clicks === 'undefined') {
            link.clicks = 0;
        }
    });
    localStorage.setItem('chromeLinks', JSON.stringify(links));

    // ------------------------------------
    //  Internationalization Functions
    // ------------------------------------
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`lang-${lang}.json`);
            if (!response.ok) {
                throw new Error(`Could not load translations for ${lang}`);
            }
            translations = await response.json();
            applyTranslations();
            localStorage.setItem('selectedLanguage', lang); // Save selected language
        } catch (error) {
            console.error(error);
            // Fallback to default language if loading fails
            if (lang !== 'en') { // Prevent infinite loop if English also fails
                loadTranslations('en');
            }
        }
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.dataset.i18n;
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.dataset.i18nPlaceholder; // Corrected from data-i18n-placeholder
            if (translations[key]) {
                element.placeholder = translations[key];
            }
        });
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.dataset.i18nTitle; // Corrected from data-i18n-title
            if (translations[key]) {
                element.title = translations[key];
            }
        });
        // Update specific elements that need dynamic translation (like modal headers)
        document.querySelector('#edit-modal h2').textContent = modalLinkIndex.value === '' ? translations.add_new_link_title : translations.edit_link_title;
    }

    // Set initial language from localStorage or default to English
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    languageSelector.value = savedLanguage;
    loadTranslations(savedLanguage);

    // ------------------------------------
    //  Link Rendering
    // ------------------------------------
    function renderLinks() {
        linksGrid.innerHTML = '';
        linksGrid.style.gridTemplateColumns = `repeat(${linksPerRow}, minmax(120px, 1fr))`;
        MAX_LINKS = linksPerRow * numberOfRows;

        let linksToDisplay = [...links];

        if (sortByClicksEnabled) {
            linksToDisplay.sort((a, b) => b.clicks - a.clicks);
        }

        // Slice and display only the links that fit the grid
        linksToDisplay.slice(0, MAX_LINKS).forEach((link) => {
            const originalIndex = links.findIndex(l => l.url === link.url && l.title === link.title);
            const linkButton = createLinkButton(link, originalIndex);
            linksGrid.appendChild(linkButton);
        });

        // Display an add button only if the number of links is less than MAX_LINKS
        if (links.length < MAX_LINKS) {
            const addButton = document.createElement('div');
            addButton.classList.add('link-button', 'add-button');
            addButton.textContent = translations.add_button_text || '+'; // Use translated text
            addButton.addEventListener('click', () => {
                openEditModalForNewLink();
            });
            linksGrid.appendChild(addButton);
        }
    }

    function createLinkButton(link, index) {
        const linkButton = document.createElement('a');
        linkButton.classList.add('link-button');
        linkButton.href = link.url;
        linkButton.target = '_blank';

        linkButton.addEventListener('click', (e) => {
            if (index !== -1 && links[index]) {
                links[index].clicks = (links[index].clicks || 0) + 1;
                localStorage.setItem('chromeLinks', JSON.stringify(links));
            }
        });

        const iconSrc = link.icon || `https://www.google.com/s2/favicons?sz=64&domain_url=${link.url}`;
        const iconImg = document.createElement('img');
        iconImg.classList.add('icon');
        iconImg.src = iconSrc;
        iconImg.alt = link.title;
        iconImg.onerror = () => {
            iconImg.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ccc' d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z'/%3E%3C/svg%3E`;
        };

        const titleDiv = document.createElement('div');
        titleDiv.classList.add('title');
        titleDiv.textContent = link.title;

        const editIcon = document.createElement('div');
        editIcon.classList.add('edit-icon');
        editIcon.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
        `;
        editIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openEditModalForEditing(index);
        });

        linkButton.appendChild(iconImg);
        linkButton.appendChild(titleDiv);
        linkButton.appendChild(editIcon);

        return linkButton;
    }

    // ------------------------------------
    //  Edit Modal Functions
    // ------------------------------------
    function openEditModal() {
        editModal.style.display = 'flex';
        modalLinkUrl.focus();
    }

    function closeEditModal() {
        editModal.style.display = 'none';
        resetEditModalForm();
    }

    function resetEditModalForm() {
        modalLinkUrl.value = '';
        modalLinkTitle.value = '';
        modalLinkIcon.value = '';
        modalLinkIndex.value = '';
        deleteLinkButton.style.display = 'none';
    }

    function openEditModalForNewLink() {
        resetEditModalForm();
        deleteLinkButton.style.display = 'none';
        editModal.querySelector('h2').textContent = translations.add_new_link_title;
        openEditModal();
    }

    function openEditModalForEditing(index) {
        const link = links[index];
        if (link) {
            modalLinkUrl.value = link.url;
            modalLinkTitle.value = link.title;
            modalLinkIcon.value = link.icon || '';
            modalLinkIndex.value = index;
            deleteLinkButton.style.display = 'inline-block';
            editModal.querySelector('h2').textContent = translations.edit_link_title;
            openEditModal();
        }
    }

    // ------------------------------------
    //  Settings Modal Functions
    // ------------------------------------
    function openSettingsModal() {
        settingsModal.style.display = 'flex';
        linksPerRowInput.value = linksPerRow;
        numberOfRowsInput.value = numberOfRows;
        sortByClicksCheckbox.checked = sortByClicksEnabled;
    }

    function closeSettingsModal() {
        settingsModal.style.display = 'none';
    }

    // ------------------------------------
    //  Search History & Suggestions
    // ------------------------------------
    function saveSearchQuery(query) {
        if (!query) return;
        searchHistory = searchHistory.filter(item => item !== query);
        searchHistory.unshift(query);
        if (searchHistory.length > MAX_SEARCH_HISTORY) {
            searchHistory = searchHistory.slice(0, MAX_SEARCH_HISTORY);
        }
        localStorage.setItem('chromeSearchHistory', JSON.stringify(searchHistory));
    }

    function deleteSearchQuery(queryToDelete) {
        searchHistory = searchHistory.filter(item => item !== queryToDelete);
        localStorage.setItem('chromeSearchHistory', JSON.stringify(searchHistory));
        showSuggestions(searchInput.value.trim());
    }

    async function showSuggestions(query) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.classList.remove('visible');
        currentSelectedSuggestion = -1;

        if (query.length === 0) return;

        const filteredHistory = searchHistory.filter(h => h.toLowerCase().includes(query.toLowerCase()));
        const filteredSuggestions = fixedSuggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()) && !filteredHistory.includes(s));

        let combinedSuggestions = [];

        filteredHistory.forEach(item => {
            combinedSuggestions.push({ type: 'history', text: item });
        });

        filteredSuggestions.forEach(item => {
            combinedSuggestions.push({ type: 'suggestion', text: item });
        });

        if (combinedSuggestions.length === 0) {
            return;
        }

        combinedSuggestions.forEach((item, index) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('suggestion-item');
            suggestionItem.dataset.index = index;

            const iconSvg = item.type === 'history' ?
                '<svg class="icon-history" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.51 0-2.91-.49-4.06-1.3l-1.42 1.42C8.28 19.99 10.04 20.72 12 20.72c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/></svg>' :
                '<svg class="icon-search" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';

            const textSpan = document.createElement('span');
            textSpan.classList.add('text-content');
            textSpan.textContent = item.text;

            suggestionItem.appendChild(DOMParser.parseFromString(iconSvg, 'image/svg+xml').documentElement);
            suggestionItem.appendChild(textSpan);

            suggestionItem.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-history-btn') || e.target.closest('.delete-history-btn')) {
                    return;
                }
                searchInput.value = item.text;
                hideSuggestions();
                searchButton.click();
            });

            if (item.type === 'history') {
                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('delete-history-btn');
                deleteBtn.innerHTML = '&times;';
                deleteBtn.title = translations.delete_history_title || 'Delete from history'; // Use translated title
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteSearchQuery(item.text);
                });
                suggestionItem.appendChild(deleteBtn);
            }
            suggestionsBox.appendChild(suggestionItem);
        });

        suggestionsBox.classList.add('visible');
    }

    function hideSuggestions() {
        suggestionsBox.classList.remove('visible');
        currentSelectedSuggestion = -1;
    }

    // ------------------------------------
    //  Data Import/Export
    // ------------------------------------
    function exportData() {
        const dataToExport = {
            links: links,
            searchHistory: searchHistory,
            settings: {
                linksPerRow: linksPerRow,
                numberOfRows: numberOfRows,
                sortByClicksEnabled: sortByClicksEnabled
            }
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chrome_new_tab_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importData(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.links && Array.isArray(importedData.links) &&
                    importedData.searchHistory && Array.isArray(importedData.searchHistory) &&
                    importedData.settings && typeof importedData.settings === 'object') {

                    links = importedData.links;
                    searchHistory = importedData.searchHistory;
                    linksPerRow = importedData.settings.linksPerRow || 8;
                    numberOfRows = importedData.settings.numberOfRows || 3;
                    sortByClicksEnabled = (importedData.settings.sortByClicksEnabled === true);


                    localStorage.setItem('chromeLinks', JSON.stringify(links));
                    localStorage.setItem('chromeSearchHistory', JSON.stringify(searchHistory));
                    localStorage.setItem('linksPerRow', linksPerRow);
                    localStorage.setItem('numberOfRows', numberOfRows);
                    localStorage.setItem('sortByClicksEnabled', sortByClicksEnabled);

                    alert(translations.alert_data_imported_success);
                    renderLinks();
                    closeSettingsModal();
                } else {
                    alert(translations.alert_import_data_invalid_format);
                }
            } catch (error) {
                alert(translations.alert_import_data_parse_error);
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    // ------------------------------------
    //  Fetch Title Function
    // ------------------------------------
    async function fetchTitleFromUrl(url) {
        if (!url) {
            alert(translations.alert_enter_url_for_title_fetch);
            return;
        }

        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const htmlContent = data.contents;

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const title = doc.querySelector('title')?.textContent;

            if (title) {
                modalLinkTitle.value = title;
            } else {
                alert(translations.alert_title_not_found);
            }
        } catch (error) {
            console.error('Failed to fetch title:', error);
            alert(translations.alert_fetch_title_failed);
        }
    }


    // ------------------------------------
    //  Event Listeners
    // ------------------------------------
    languageSelector.addEventListener('change', (e) => {
        loadTranslations(e.target.value);
    });

    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            saveSearchQuery(query);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        }
        hideSuggestions();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (currentSelectedSuggestion > -1) {
                const selectedText = suggestionsBox.children[currentSelectedSuggestion].querySelector('.text-content').textContent;
                searchInput.value = selectedText;
            }
            searchButton.click();
        }
    });

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        showSuggestions(query);
    });

    searchInput.addEventListener('keydown', (e) => {
        const items = suggestionsBox.children;
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentSelectedSuggestion < items.length - 1) {
                if (currentSelectedSuggestion > -1) {
                    items[currentSelectedSuggestion].classList.remove('selected');
                }
                currentSelectedSuggestion++;
                items[currentSelectedSuggestion].classList.add('selected');
                searchInput.value = items[currentSelectedSuggestion].querySelector('.text-content').textContent;
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentSelectedSuggestion > 0) {
                if (currentSelectedSuggestion > -1) {
                    items[currentSelectedSuggestion].classList.remove('selected');
                }
                currentSelectedSuggestion--;
                items[currentSelectedSuggestion].classList.add('selected');
                searchInput.value = searchInput.dataset.originalValue || '';
            } else if (currentSelectedSuggestion === 0) {
                items[currentSelectedSuggestion].classList.remove('selected');
                currentSelectedSuggestion = -1;
                searchInput.value = searchInput.dataset.originalValue || '';
            }
        }
    });

    searchInput.addEventListener('focus', () => {
        searchInput.dataset.originalValue = searchInput.value;
        showSuggestions(searchInput.value.trim());
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(hideSuggestions, 150);
    });

    closeModalButton.addEventListener('click', closeEditModal);

    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    saveLinkButton.addEventListener('click', () => {
        const url = modalLinkUrl.value.trim();
        const title = modalLinkTitle.value.trim();
        const icon = modalLinkIcon.value.trim();
        const index = modalLinkIndex.value;

        if (!url || !title) {
            alert(translations.alert_url_title_required);
            return;
        }

        if (index === '') {
            if (links.length < MAX_LINKS) {
                links.push({ url, title, icon, clicks: 0 });
            } else {
                alert(translations.alert_max_links_reached);
            }
        } else {
            const existingLink = links[parseInt(index)];
            links[parseInt(index)] = {
                url,
                title,
                icon,
                clicks: existingLink ? existingLink.clicks : 0
            };
        }

        localStorage.setItem('chromeLinks', JSON.stringify(links));
        renderLinks();
        closeEditModal();
    });

    deleteLinkButton.addEventListener('click', () => {
        if (confirm(translations.confirm_delete_link)) {
            const index = parseInt(modalLinkIndex.value);
            links.splice(index, 1);
            localStorage.setItem('chromeLinks', JSON.stringify(links));
            renderLinks();
            closeEditModal();
        }
    });

    // Settings modal event listeners
    settingsButton.addEventListener('click', openSettingsModal);
    closeSettingsButton.addEventListener('click', closeSettingsModal);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
    });

    saveSettingsButton.addEventListener('click', () => {
        const newLinksPerRow = parseInt(linksPerRowInput.value);
        const newNumberOfRows = parseInt(numberOfRowsInput.value);
        const newSortByClicksEnabled = sortByClicksCheckbox.checked;

        if (isNaN(newLinksPerRow) || newLinksPerRow < 1 || newLinksPerRow > 20) {
            alert(translations.alert_links_per_row_invalid);
            return;
        }
        if (isNaN(newNumberOfRows) || newNumberOfRows < 1 || newNumberOfRows > 20) {
            alert(translations.alert_number_of_rows_invalid);
            return;
        }

        linksPerRow = newLinksPerRow;
        numberOfRows = newNumberOfRows;
        sortByClicksEnabled = newSortByClicksEnabled;

        localStorage.setItem('linksPerRow', linksPerRow);
        localStorage.setItem('numberOfRows', numberOfRows);
        localStorage.setItem('sortByClicksEnabled', sortByClicksEnabled);

        alert(translations.alert_settings_saved);
        renderLinks();
        closeSettingsModal();
    });

    exportDataButton.addEventListener('click', exportData);

    importDataButton.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', importData);

    fetchTitleButton.addEventListener('click', () => {
        const url = modalLinkUrl.value.trim();
        fetchTitleFromUrl(url);
    });

    renderLinks(); // Initial render
});
