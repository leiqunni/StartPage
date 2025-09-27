document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const linksGrid = document.getElementById('links-grid');
    const searchInput = document.getElementById('search-input');
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

    const searchEngineSelector = document.getElementById('search-engine-selector');

    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsButton = document.getElementById('close-settings-button');
    const sortByClicksCheckbox = document.getElementById('sort-by-clicks-checkbox');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const languageSelector = document.getElementById('language-selector');
    const exportDataButton = document.getElementById('export-data-button');
    const importDataButton = document.getElementById('import-data-button');
    const importFileInput = document.getElementById('import-file-input');

    const jsonConfigTextarea = document.getElementById('json-config-textarea');
    const loadJsonButton = document.getElementById('load-json-button');
    const linksPerRowInput = document.getElementById('links-per-row-input');
    const numberOfRowsInput = document.getElementById('number-of-rows-input');


    const headerMailLink = document.getElementById('header-mail-link');
    const headerMailText = document.getElementById('header-mail-text');
    const headerMailIcon = document.getElementById('header-mail-icon');
    const headerImageSearchLink = document.getElementById('header-image-search-link');
    const headerImageSearchText = document.getElementById('header-image-search-text');
    const headerImageSearchIcon = document.getElementById('header-image-search-icon');


    const customAlertModal = document.getElementById('custom-alert-modal');
    const alertTitle = document.getElementById('alert-title');
    const alertMessage = document.getElementById('alert-message');
    const alertOkButton = document.getElementById('alert-ok-button');
    const closeAlertButton = document.getElementById('close-alert-button');

    const customConfirmModal = document.getElementById('custom-confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmOkButton = document.getElementById('confirm-ok-button');
    const confirmCancelButton = document.getElementById('confirm-cancel-button');
    const closeConfirmButton = document.getElementById('close-confirm-button');

    const searchForm = document.querySelector('.search-form');

    // Data initialization
    let links = JSON.parse(localStorage.getItem('links')) || [];
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    let sortByClicksEnabled = localStorage.getItem('sortByClicksEnabled') === 'true';
    let currentLanguage = localStorage.getItem('language') || 'ja'; // Default to Japanese

    let settings = JSON.parse(localStorage.getItem('settings')) || defaultSettings;
    let translations = {};
    let currentSearchEngine = localStorage.getItem('searchEngine') || settings.searchEngineData[0].name;

    // Constants
    const MAX_SEARCH_HISTORY = 10;
    const NEW_LINK_INDEX = -1;
    const URL_REGEX = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/i;

    let currentSelectedSuggestion = -1;
    let confirmResolve;

    // Fixed suggestions (search candidates)
    const fixedSuggestions = [
        "今日のニュース", "天気", "株価", "最新技術", "おすすめレストラン",
        "映画情報", "スポーツニュース", "プログラミング", "旅行先", "レシピ",
        "カフェ", "読書", "デザイン", "健康", "フィットネス", "教育"
    ];

    // ------------------------------------
    //  Internationalization (i18n)
    // ------------------------------------

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`lang-${lang}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            translations = data;
            applyTranslations();
            document.documentElement.lang = currentLanguage;
        } catch (error) {
            console.error('Error loading translations:', error);
            if (lang !== 'en') {
                await loadTranslations('en');
            }
        }
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (translations[key]) {
                element.placeholder = translations[key];
            }
        });

        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            if (translations[key]) {
                element.title = translations[key];
            }
        });
    }

    // Initialize translations on load
    loadTranslations(currentLanguage);

    // ------------------------------------
    //  Custom Alert/Confirm Modals
    // ------------------------------------

    function showAlert(message, titleKey = 'custom_alert_title') {
        alertTitle.textContent = translations[titleKey] || 'Alert';
        alertMessage.textContent = message;
        customAlertModal.style.display = 'flex';
    }

    function showConfirm(message, titleKey = 'custom_confirm_title') {
        confirmTitle.textContent = translations[titleKey] || 'Confirm';
        confirmMessage.textContent = message;
        customConfirmModal.style.display = 'flex';

        return new Promise(resolve => {
            confirmResolve = resolve;
        });
    }

    alertOkButton.addEventListener('click', () => {
        customAlertModal.style.display = 'none';
    });

    closeAlertButton.addEventListener('click', () => {
        customAlertModal.style.display = 'none';
    });

    confirmOkButton.addEventListener('click', () => {
        customConfirmModal.style.display = 'none';
        if (confirmResolve) {
            confirmResolve(true);
        }
    });

    confirmCancelButton.addEventListener('click', () => {
        customConfirmModal.style.display = 'none';
        if (confirmResolve) {
            confirmResolve(false);
        }
    });

    closeConfirmButton.addEventListener('click', () => {
        customConfirmModal.style.display = 'none';
        if (confirmResolve) {
            confirmResolve(false);
        }
    });

    // ------------------------------------
    //  Link Display Functionality
    // ------------------------------------

    function renderLinks() {
        linksGrid.innerHTML = '';
        linksGrid.style.gridTemplateColumns = `repeat(${settings.linksPerRow}, minmax(120px, 1fr))`;
        linksGrid.style.gridTemplateRows = `repeat(${settings.numberOfRows}, 1fr)`;

        let displayedLinks = [...links];
        if (sortByClicksEnabled) {
            displayedLinks.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        }

        displayedLinks.forEach((link, displayIndex) => {
            if (displayIndex >= settings.linksPerRow * settings.numberOfRows) return;
            const originalIndex = links.indexOf(link);
            const linkButton = document.createElement('a');
            linkButton.href = link.url;
            linkButton.target = '_blank';
            linkButton.className = 'link-button';
            linkButton.draggable = true;
            linkButton.dataset.originalIndex = originalIndex;

            const favicon = link.icon || getFaviconUrl(link.url);
            linkButton.innerHTML = `
                <img src="${favicon}" alt="${link.title}" class="icon" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'%235f6368\\'%3E%3Cpath d=\\'M0 0h24v24H0z\\' fill=\\'none\\'/\\%3E%3Cpath d=\\'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-.001 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z\\'/%3E%3Cpath d=\\'M12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z\\'/%3E%3C/svg%3E';">
                <div class="title">${link.title}</div>
                <div class="edit-icon" data-original-index="${originalIndex}" aria-label="Edit Link">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </div>
            `;

            linkButton.addEventListener('click', (e) => {
                if (e.target.closest('.edit-icon')) {
                    e.preventDefault();
                    const originalIndex = parseInt(e.target.closest('.edit-icon').dataset.originalIndex);
                    openEditModal(links[originalIndex], originalIndex);
                } else {
                    links[originalIndex].clicks = (links[originalIndex].clicks || 0) + 1;
                    localStorage.setItem('links', JSON.stringify(links));
                }
            });

            linksGrid.appendChild(linkButton);
        });

        const addLinkButton = document.createElement('button');
        addLinkButton.className = 'link-button add-button';
        addLinkButton.innerHTML = '+';
        addLinkButton.setAttribute('aria-label', translations.add_button_text || 'Add New Link');
        addLinkButton.addEventListener('click', () => openEditModal(null, NEW_LINK_INDEX));
        linksGrid.appendChild(addLinkButton);
    }

    function getFaviconUrl(url) {
        try {
            const parsedUrl = new URL(url);
            return `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=48`;
        } catch (e) {
            console.error('Invalid URL for favicon:', url, e);
            return '';
        }
    }

    // Update header links function
    function updateHeaderLinks() {
        const selectedEngineData = settings.searchEngineData.find(
            engine => engine.name === currentSearchEngine
        );

        if (selectedEngineData && selectedEngineData.headerLinks) {
            const { mail, imageSearch } = selectedEngineData.headerLinks;

            if (mail && mail.url) {
                headerMailLink.style.display = 'flex';
                headerMailLink.href = mail.url;
                headerMailLink.setAttribute('aria-label', `Go to ${mail.title}`);
                headerMailText.textContent = mail.title;
                headerMailIcon.src = mail.icon || getFaviconUrl(mail.url);
            } else {
                headerMailLink.style.display = 'none';
            }

            if (imageSearch && imageSearch.url) {
                headerImageSearchLink.style.display = 'flex';
                headerImageSearchLink.href = imageSearch.url;
                headerImageSearchLink.setAttribute('aria-label', `Go to ${imageSearch.title}`);
                headerImageSearchText.textContent = imageSearch.title;
                headerImageSearchIcon.src = imageSearch.icon || getFaviconUrl(imageSearch.url);
            } else {
                headerImageSearchLink.style.display = 'none';
            }
        }
    }

    function updateSearchEngineSelector() {
        searchEngineSelector.innerHTML = '';
        if (settings.searchEngineData && settings.searchEngineData.length > 0) {
            settings.searchEngineData.forEach(engine => {
                const option = document.createElement('option');
                option.value = engine.name;
                option.textContent = engine.name;
                searchEngineSelector.appendChild(option);
            });
            searchEngineSelector.value = currentSearchEngine;
        }
    }

    // ------------------------------------
    //  Modal Management
    // ------------------------------------

    function openEditModal(link, index) {
        if (link) {
            modalLinkUrl.value = link.url;
            modalLinkTitle.value = link.title;
            modalLinkIcon.value = link.icon || '';
            modalLinkIndex.value = index;
            deleteLinkButton.style.display = 'inline-block';
            editModal.querySelector('h2').textContent = translations.edit_link_title || 'Edit Link';
        } else {
            modalLinkUrl.value = '';
            modalLinkTitle.value = '';
            modalLinkIcon.value = '';
            modalLinkIndex.value = NEW_LINK_INDEX;
            deleteLinkButton.style.display = 'none';
            editModal.querySelector('h2').textContent = translations.add_new_link_title || 'Add New Link';
        }
        editModal.style.display = 'flex';
        modalLinkUrl.focus();
    }

    function closeEditModal() {
        editModal.style.display = 'none';
    }

    function closeSettingsModal() {
        settingsModal.style.display = 'none';
    }

    // ------------------------------------
    //  Event Listeners
    // ------------------------------------

    // Search functionality
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();

        if (query) {
            // Save search history
            saveSearchHistory(query);

            // Get the selected search engine from settings
            const selectedEngine = settings.searchEngineData.find(
                engine => engine.name === searchEngineSelector.value
            );

            let searchUrl = '';
            if (selectedEngine && selectedEngine.urlTemplate) {
                searchUrl = selectedEngine.urlTemplate.replace('{searchTerms}', encodeURIComponent(query));
            } else {
                searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            }

            // Check if the query is a URL
            if (URL_REGEX.test(query)) {
                // If it's a URL, navigate directly
                window.location.href = query;
            } else {
                // Otherwise, perform a search
                window.location.href = searchUrl;
            }
        }
    });

    // Event listener for search engine change to update header links
    searchEngineSelector.addEventListener('change', (e) => {
        currentSearchEngine = e.target.value;
        localStorage.setItem('searchEngine', currentSearchEngine);
        updateHeaderLinks();
    });

    // Search History and Suggestions
    function saveSearchHistory(query) {
        // Add query to the beginning of the history array if it's not already there
        const index = searchHistory.indexOf(query);
        if (index > -1) {
            searchHistory.splice(index, 1);
        }
        searchHistory.unshift(query);
        // Trim history to max size
        if (searchHistory.length > MAX_SEARCH_HISTORY) {
            searchHistory = searchHistory.slice(0, MAX_SEARCH_HISTORY);
        }
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }

    function renderSuggestions() {
        const query = searchInput.value.trim().toLowerCase();
        suggestionsBox.innerHTML = '';
        suggestionsBox.style.display = 'none';
        currentSelectedSuggestion = -1;

        const allSuggestions = [];

        // Add search history if query is empty
        if (query === '') {
            searchHistory.forEach(item => {
                const li = document.createElement('li');
                li.className = 'suggestion-item history-item';
                li.innerHTML = `
                    <svg class="icon-history" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7c0 3.87-3.13 7-7 7-1.51 0-2.91-.49-4.06-1.3l-1.42 1.42C9.28 19.99 10.94 20.65 13 20.65c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
                    </svg>
                    <span>${item}</span>
                    <button class="delete-history" aria-label="${translations.delete_history_title || 'Delete from history'}" data-query="${item}">&times;</button>
                `;
                li.addEventListener('click', (e) => {
                    if (e.target.classList.contains('delete-history')) {
                        deleteSearchHistory(item);
                        renderSuggestions();
                    } else {
                        searchInput.value = item;
                        suggestionsBox.style.display = 'none';
                        searchForm.dispatchEvent(new Event('submit'));
                    }
                });
                allSuggestions.push(li);
            });
        }

        // Add filtered fixed suggestions
        const filteredFixedSuggestions = fixedSuggestions.filter(s =>
            s.toLowerCase().includes(query)
        );

        filteredFixedSuggestions.forEach(item => {
                const li = document.createElement('li');
                li.className = 'suggestion-item fixed-suggestion';
                li.innerHTML = `
                <svg class="icon-search" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <span>${item}</span>
            `;
            li.addEventListener('click', () => {
                searchInput.value = item;
                suggestionsBox.style.display = 'none';
                searchForm.dispatchEvent(new Event('submit'));
            });
            allSuggestions.push(li);
        });

        if (allSuggestions.length > 0) {
            allSuggestions.forEach(s => suggestionsBox.appendChild(s));
            suggestionsBox.style.display = 'block';
        } else {
            suggestionsBox.style.display = 'none';
        }
    }

    function deleteSearchHistory(query) {
        searchHistory = searchHistory.filter(item => item !== query);
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }

    searchInput.addEventListener('input', renderSuggestions);
    searchInput.addEventListener('focus', renderSuggestions);

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (!suggestionsBox.contains(document.activeElement)) {
                suggestionsBox.style.display = 'none';
            }
        }, 100);
    });

    suggestionsBox.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    searchInput.addEventListener('keydown', (e) => {
        const items = suggestionsBox.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentSelectedSuggestion = (currentSelectedSuggestion + 1) % items.length;
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentSelectedSuggestion = (currentSelectedSuggestion - 1 + items.length) % items.length;
            updateSelection(items);
        } else if (e.key === 'Enter') {
            if (currentSelectedSuggestion > -1) {
                e.preventDefault();
                items[currentSelectedSuggestion].click();
            }
        }
    });

    function updateSelection(items) {
        items.forEach((item, index) => {
            item.classList.remove('selected');
            if (index === currentSelectedSuggestion) {
                item.classList.add('selected');
                searchInput.value = item.querySelector('span').textContent;
            }
        });
    }

    // Modal close buttons
    closeModalButton.addEventListener('click', closeEditModal);
    closeSettingsButton.addEventListener('click', closeSettingsModal);

    // Settings modal
    settingsButton.addEventListener('click', () => {
        jsonConfigTextarea.value = JSON.stringify(settings, null, 2);
        linksPerRowInput.value = settings.linksPerRow;
        numberOfRowsInput.value = settings.numberOfRows;
        sortByClicksCheckbox.checked = sortByClicksEnabled;
        languageSelector.value = currentLanguage;
        settingsModal.style.display = 'flex';
    });

    loadJsonButton.addEventListener('click', () => {
        try {
            const newSettings = JSON.parse(jsonConfigTextarea.value);
            // Basic validation
            if (!newSettings.searchEngineData) {
                showAlert(translations.alert_import_data_invalid_format || 'Invalid JSON format. Must contain "searchEngineData".');
                return;
            }
            settings = newSettings;
            localStorage.setItem('settings', JSON.stringify(settings));
            updateHeaderLinks();
            updateSearchEngineSelector();
            showAlert(translations.alert_settings_loaded || 'Settings loaded successfully from JSON.');
        } catch (e) {
            showAlert(translations.alert_import_data_parse_error || 'Failed to parse JSON. Please check the format.');
            console.error(e);
        }
    });


    saveSettingsButton.addEventListener('click', () => {
        const newLinksPerRow = parseInt(linksPerRowInput.value, 10);
        const newNumberOfRows = parseInt(numberOfRowsInput.value, 10);
        const newLanguage = languageSelector.value;

        if (isNaN(newLinksPerRow) || newLinksPerRow < 1 || newLinksPerRow > 20) {
            showAlert(translations.alert_links_per_row_invalid || 'Links per row must be a number between 1 and 20.');
            return;
        }

        if (isNaN(newNumberOfRows) || newNumberOfRows < 1 || newNumberOfRows > 20) {
            showAlert(translations.alert_number_of_rows_invalid || 'Number of rows must be a number between 1 and 20.');
            return;
        }

        settings.linksPerRow = newLinksPerRow;
        settings.numberOfRows = newNumberOfRows;
        sortByClicksEnabled = sortByClicksCheckbox.checked;
        currentLanguage = newLanguage;

        localStorage.setItem('settings', JSON.stringify(settings));
        localStorage.setItem('sortByClicksEnabled', sortByClicksEnabled);
        localStorage.setItem('language', currentLanguage);

        loadTranslations(currentLanguage); // Re-load translations for new language
        showAlert(translations.alert_settings_saved || 'Settings saved.');
        renderLinks();
        closeSettingsModal();
    });

    // Link edit modal
    closeModalButton.addEventListener('click', closeEditModal);
    editModal.querySelector('.close-button').addEventListener('click', closeEditModal);

    saveLinkButton.addEventListener('click', () => {
        const url = modalLinkUrl.value.trim();
        const title = modalLinkTitle.value.trim();
        const icon = modalLinkIcon.value.trim();
        const index = parseInt(modalLinkIndex.value);

        if (!url || !title) {
            showAlert(translations.alert_url_title_required || 'URL and Title are required.');
            return;
        }

        if (index === NEW_LINK_INDEX) {
            if (links.length >= settings.linksPerRow * settings.numberOfRows) {
                showAlert(translations.alert_max_links_reached || 'Maximum number of links reached.');
                return;
            }
            links.push({
                url,
                title,
                icon
            });
        } else {
            links[index].url = url;
            links[index].title = title;
            links[index].icon = icon;
        }

        localStorage.setItem('links', JSON.stringify(links));
        renderLinks();
        closeEditModal();
    });

    deleteLinkButton.addEventListener('click', async () => {
        const index = parseInt(modalLinkIndex.value);
        if (await showConfirm(translations.confirm_delete_link || 'Are you sure you want to delete this link?')) {
            links.splice(index, 1);
            localStorage.setItem('links', JSON.stringify(links));
            renderLinks();
            closeEditModal();
        }
    });

    fetchTitleButton.addEventListener('click', () => {
        const url = modalLinkUrl.value.trim();
        fetchTitleFromUrl(url);
    });

    // Fetch title from URL
    async function fetchTitleFromUrl(url) {
        if (!url) {
            showAlert(translations.alert_url_required_for_title_fetch || 'Please enter a URL.');
            return;
        }
        modalLinkTitle.value = translations.fetching_title || 'Fetching...';
        try {
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            const title = doc.querySelector('title');
            if (title && title.textContent) {
                modalLinkTitle.value = title.textContent;
            } else {
                modalLinkTitle.value = translations.alert_no_title_found || 'Title not found.';
            }
        } catch (e) {
            console.error('Failed to fetch title:', e);
            modalLinkTitle.value = translations.alert_failed_to_fetch_title || 'Failed to fetch title.';
        }
    }

    // Data management buttons
    exportDataButton.addEventListener('click', exportData);
    importDataButton.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);

    function exportData() {
        const data = {
            links,
            searchHistory,
            settings,
            sortByClicksEnabled,
            language: currentLanguage
        };
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'new_tab_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showAlert(translations.alert_data_exported || 'Data exported successfully.');
    }

    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.links) {
                    links = importedData.links;
                    localStorage.setItem('links', JSON.stringify(links));
                }
                if (importedData.searchHistory) {
                    searchHistory = importedData.searchHistory;
                    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
                }
                if (importedData.settings) {
                    settings = importedData.settings;
                    localStorage.setItem('settings', JSON.stringify(settings));
                }
                if (importedData.hasOwnProperty('sortByClicksEnabled')) {
                    sortByClicksEnabled = importedData.sortByClicksEnabled;
                    localStorage.setItem('sortByClicksEnabled', sortByClicksEnabled);
                }
                if (importedData.language) {
                    currentLanguage = importedData.language;
                    localStorage.setItem('language', currentLanguage);
                }

                renderLinks();
                updateHeaderLinks();
                updateSearchEngineSelector();
                loadTranslations(currentLanguage);
                showAlert(translations.alert_data_imported_success || 'Data imported successfully.');
            } catch (error) {
                console.error('Import error:', error);
                showAlert(translations.alert_import_data_parse_error || 'Failed to parse JSON file. The file may be corrupted or in an invalid format.');
            }
        };
        reader.readAsText(file);
    }

    // Initial display setup
    updateSearchEngineSelector();
    renderLinks();
    updateHeaderLinks();
});