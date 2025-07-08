document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
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

    // New DOM elements for search engine selection
    const searchEngineSelector = document.getElementById('search-engine-selector');

    // Settings modal elements
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsButton = document.getElementById('close-settings-button');
    const sortByClicksCheckbox = document.getElementById('sort-by-clicks-checkbox');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const languageSelector = document.getElementById('language-selector');
    const exportDataButton = document.getElementById('export-data-button');
    const importDataButton = document.getElementById('import-data-button');
    const importFileInput = document.getElementById('import-file-input');

    // Custom alert/confirm modal elements
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


    // Data initialization
    let links = JSON.parse(localStorage.getItem('links')) || [];
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    let sortByClicksEnabled = localStorage.getItem('sortByClicksEnabled') === 'true';
    let currentLanguage = localStorage.getItem('language') || 'en';
    let currentSearchEngine = localStorage.getItem('searchEngine') || 'google';
    let translations = {};

    // Constants
    const MAX_SEARCH_HISTORY = 10;
    const NEW_LINK_INDEX = -1; // Used to indicate adding a new link
    const URL_REGEX = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/i;

    let currentSelectedSuggestion = -1;
    let confirmResolve; // To handle promise resolution for custom confirm dialog

    // Fixed suggestions (search candidates)
    const fixedSuggestions = [
        "Today's news", "Weather", "Stock prices", "Latest technology", "Recommended restaurants",
        "Movie information", "Sports news", "Programming", "Travel destinations", "Recipes",
        "Cafe", "Reading", "Design", "Health", "Fitness", "Education"
    ];

    // ------------------------------------
    //  Internationalization (i18n)
    // ------------------------------------

    /**
     * Loads translation data for the specified language.
     * @param {string} lang - The language code (e.g., 'en', 'ja').
     */
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
            // Fallback to English if translation fails
            if (lang !== 'en') {
                await loadTranslations('en');
            }
        }
    }

    /**
     * Applies loaded translations to DOM elements with data-i18n attributes.
     */
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

    /**
     * Displays a custom alert modal.
     * @param {string} message - The message to display.
     * @param {string} [titleKey='custom_alert_title'] - The translation key for the modal title.
     */
    function showAlert(message, titleKey = 'custom_alert_title') {
        alertTitle.textContent = translations[titleKey] || 'Alert';
        alertMessage.textContent = message;
        customAlertModal.style.display = 'flex';
    }

    /**
     * Displays a custom confirmation modal.
     * @param {string} message - The message to display.
     * @param {string} [titleKey='custom_confirm_title'] - The translation key for the modal title.
     * @returns {Promise<boolean>} - A promise that resolves to true if confirmed, false otherwise.
     */
    function showConfirm(message, titleKey = 'custom_confirm_title') {
        confirmTitle.textContent = translations[titleKey] || 'Confirm';
        confirmMessage.textContent = message;
        customConfirmModal.style.display = 'flex';

        return new Promise(resolve => {
            confirmResolve = resolve;
        });
    }

    // Event listeners for custom alert/confirm modals
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

    /**
     * Renders the links in the grid.
     */
    function renderLinks() {
        linksGrid.innerHTML = '';

        // Sort by clicks if enabled
        let displayedLinks = [...links];
        if (sortByClicksEnabled) {
            displayedLinks.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        }

        displayedLinks.forEach((link, displayIndex) => {
            const originalIndex = links.indexOf(link); // Get original index for data manipulation
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

            // Click event for link buttons
            linkButton.addEventListener('click', (e) => {
                // If edit icon is clicked, open edit modal
                if (e.target.closest('.edit-icon')) {
                    e.preventDefault(); // Prevent navigating to the link
                    const originalIndex = parseInt(e.target.closest('.edit-icon').dataset.originalIndex);
                    openEditModal(links[originalIndex], originalIndex);
                } else {
                    // Track clicks for the link
                    links[originalIndex].clicks = (links[originalIndex].clicks || 0) + 1;
                    localStorage.setItem('links', JSON.stringify(links));
                }
            });

            linksGrid.appendChild(linkButton);
        });

        // Add new link button
        const addLinkButton = document.createElement('button');
        addLinkButton.className = 'link-button add-button';
        addLinkButton.innerHTML = '+';
        addLinkButton.setAttribute('aria-label', translations.add_button_text || 'Add New Link'); // Accessibility
        addLinkButton.addEventListener('click', () => openEditModal(null, NEW_LINK_INDEX));
        linksGrid.appendChild(addLinkButton);
    }

    /**
     * Generates a favicon URL for a given URL.
     * @param {string} url - The URL to get the favicon for.
     * @returns {string} The favicon URL or an empty string if the URL is invalid.
     */
    function getFaviconUrl(url) {
        try {
            const parsedUrl = new URL(url);
            return `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=48`;
        } catch (e) {
            console.error('Invalid URL for favicon:', url, e);
            return ''; // Return empty string on error
        }
    }

    // ------------------------------------
    //  Modal Management
    // ------------------------------------

    /**
     * Opens the edit link modal.
     * @param {object|null} link - The link object to edit, or null for a new link.
     * @param {number} index - The index of the link in the `links` array, or NEW_LINK_INDEX for a new link.
     */
    function openEditModal(link, index) {
        if (link) {
            modalLinkUrl.value = link.url;
            modalLinkTitle.value = link.title;
            modalLinkIcon.value = link.icon || '';
            modalLinkIndex.value = index;
            deleteLinkButton.style.display = 'inline-block';
            editModal.querySelector('h2').textContent = translations.edit_link_title || 'Edit Link'; // Update modal title
        } else {
            modalLinkUrl.value = '';
            modalLinkTitle.value = '';
            modalLinkIcon.value = '';
            modalLinkIndex.value = NEW_LINK_INDEX;
            deleteLinkButton.style.display = 'none';
            editModal.querySelector('h2').textContent = translations.add_new_link_title || 'Add New Link'; // Update modal title
        }
        editModal.style.display = 'flex';
        modalLinkUrl.focus();
    }

    /**
     * Closes the edit link modal.
     */
    function closeEditModal() {
        editModal.style.display = 'none';
    }

    /**
     * Closes the settings modal.
     */
    function closeSettingsModal() {
        settingsModal.style.display = 'none';
    }

    // ------------------------------------
    //  Search Functionality
    // ------------------------------------

    /**
     * Performs a search using the selected search engine.
     */
    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            let searchUrl;
            // Check if the query is a valid URL
            if (URL_REGEX.test(query)) {
                // Prepend 'https://' if missing for direct navigation
                searchUrl = query.startsWith('http') ? query : `https://${query}`;
            } else {
                // Perform search based on selected engine
                switch (currentSearchEngine) {
                    case 'bing':
                        searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
                        break;
                    case 'yahoo':
                        searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
                        break;
                    case 'google':
                    default:
                        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                        break;
                }
            }
            window.open(searchUrl, '_blank');
            addToSearchHistory(query);
            searchInput.value = '';
            hideSuggestions();
        }
    }

    /**
     * Displays search suggestions based on the query.
     * @param {string} query - The current search input query.
     */
    function showSuggestions(query) {
        if (!suggestionsBox) return;

        suggestionsBox.innerHTML = '';
        suggestionsBox.classList.remove('visible');
        currentSelectedSuggestion = -1;

        if (query.length === 0) return;

        const lowerCaseQuery = query.toLowerCase();
        const filteredHistory = searchHistory.filter(h => 
            h.toLowerCase().includes(lowerCaseQuery)
        );
        const filteredSuggestions = fixedSuggestions.filter(s => 
            s.toLowerCase().includes(lowerCaseQuery) && 
            !filteredHistory.some(h => h.toLowerCase() === s.toLowerCase())
        );

        let combinedSuggestions = [];

        // Add history items
        filteredHistory.forEach(item => {
            combinedSuggestions.push({ type: 'history', text: item });
        });

        // Add fixed suggestions
        filteredSuggestions.forEach(item => {
            combinedSuggestions.push({ type: 'suggestion', text: item });
        });

        if (combinedSuggestions.length === 0) return;

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

            suggestionItem.appendChild(createElementFromHTML(iconSvg));
            suggestionItem.appendChild(textSpan);

            suggestionItem.addEventListener('click', (e) => {
                // Prevent click on suggestion item if delete button is clicked
                if (e.target.classList.contains('delete-history-btn') || 
                    e.target.closest('.delete-history-btn')) {
                    return;
                }
                searchInput.value = item.text;
                hideSuggestions();
                performSearch();
            });

            if (item.type === 'history') {
                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('delete-history-btn');
                deleteBtn.innerHTML = '&times;';
                deleteBtn.title = translations.delete_history_title || 'Delete from history';
                deleteBtn.setAttribute('aria-label', translations.delete_history_title || 'Delete from history'); // Accessibility
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering suggestion item click
                    deleteSearchHistoryItem(item.text);
                });
                suggestionItem.appendChild(deleteBtn);
            }
            
            suggestionsBox.appendChild(suggestionItem);
        });

        suggestionsBox.classList.add('visible');
    }

    /**
     * Hides search suggestions.
     */
    function hideSuggestions() {
        if (!suggestionsBox) return;
        suggestionsBox.classList.remove('visible');
        suggestionsBox.innerHTML = '';
        currentSelectedSuggestion = -1;
    }

    /**
     * Navigates through search suggestions using arrow keys.
     * @param {number} direction - 1 for down, -1 for up.
     */
    function navigateSuggestions(direction) {
        if (!suggestionsBox) return;

        const items = Array.from(suggestionsBox.children);
        if (items.length === 0) return;

        let currentIndex = items.findIndex(item => item.classList.contains('selected'));
        if (currentIndex === -1) {
            currentIndex = direction === 1 ? -1 : 0;
        }

        items[currentIndex]?.classList.remove('selected');

        let newIndex = currentIndex + direction;
        if (newIndex >= items.length) {
            newIndex = 0;
        } else if (newIndex < 0) {
            newIndex = items.length - 1;
        }

        items[newIndex].classList.add('selected');
        items[newIndex].scrollIntoView({ block: 'nearest' });
    }

    // ------------------------------------
    //  Search History Management
    // ------------------------------------

    /**
     * Adds a query to the search history.
     * @param {string} query - The search query to add.
     */
    function addToSearchHistory(query) {
        const normalizedQuery = query.toLowerCase();
        searchHistory = searchHistory.filter(item => item.toLowerCase() !== normalizedQuery);
        searchHistory.unshift(query);
        searchHistory = searchHistory.slice(0, MAX_SEARCH_HISTORY);
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }

    /**
     * Deletes an item from the search history.
     * @param {string} value - The item to delete from history.
     */
    function deleteSearchHistoryItem(value) {
        searchHistory = searchHistory.filter(item => item !== value);
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        showSuggestions(searchInput.value.trim()); // Re-render suggestions after deletion
    }

    // ------------------------------------
    //  Title Fetching Functionality
    // ------------------------------------

    /**
     * Fetches the title from a given URL using a proxy.
     * @param {string} url - The URL to fetch the title from.
     */
    async function fetchTitleFromUrl(url) {
        if (!url) {
            showAlert(translations.alert_url_required_for_title_fetch || 'Please enter a URL.');
            return;
        }

        if (!URL_REGEX.test(url)) {
            showAlert(translations.alert_invalid_url_format || 'Invalid URL format. Please enter a valid URL.');
            return;
        }

        const originalButtonContent = fetchTitleButton.innerHTML;
        const originalButtonTitle = fetchTitleButton.title;
        fetchTitleButton.disabled = true;
        fetchTitleButton.innerHTML = translations.fetching_title || 'Fetching...';
        fetchTitleButton.title = translations.fetching_title_tooltip || 'Fetching title';

        try {
            // Using AllOrigins proxy to bypass CORS issues for title fetching
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();

            if (data.contents) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, 'text/html');
                const title = doc.querySelector('title')?.textContent;
                if (title) {
                    modalLinkTitle.value = title.trim();
                } else {
                    showAlert(translations.alert_no_title_found || 'Title not found.');
                }
            } else {
                showAlert(translations.alert_failed_to_fetch_title || 'Failed to fetch title.');
            }
        } catch (error) {
            console.error('Error fetching title:', error);
            showAlert((translations.alert_error_fetching_title || 'Error fetching title') + `\n${error.message}`);
        } finally {
            fetchTitleButton.disabled = false;
            fetchTitleButton.innerHTML = originalButtonContent;
            fetchTitleButton.title = originalButtonTitle;
        }
    }

    // ------------------------------------
    //  Data Management Functionality
    // ------------------------------------

    /**
     * Exports current data (links, search history, settings) to a JSON file.
     */
    function exportData() {
        const data = {
            links: links,
            searchHistory: searchHistory,
            sortByClicksEnabled: sortByClicksEnabled,
            language: currentLanguage,
            searchEngine: currentSearchEngine
        };
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
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

    /**
     * Imports data from a selected JSON file.
     * @param {Event} event - The file input change event.
     */
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (importedData.links && Array.isArray(importedData.links)) {
                    links = importedData.links;
                } else {
                    showAlert(translations.alert_import_links_corrupted || 'Link data is corrupted.');
                    // Do not return here, try to import other settings if possible
                }

                if (importedData.searchHistory && Array.isArray(importedData.searchHistory)) {
                    searchHistory = importedData.searchHistory;
                } else {
                    console.warn('Search history data missing or corrupted during import.');
                }

                if (typeof importedData.sortByClicksEnabled === 'boolean') {
                    sortByClicksEnabled = importedData.sortByClicksEnabled;
                } else {
                    console.warn('Sort by clicks setting missing or corrupted during import.');
                }

                if (typeof importedData.language === 'string') {
                    currentLanguage = importedData.language;
                    languageSelector.value = currentLanguage;
                    loadTranslations(currentLanguage);
                } else {
                    console.warn('Language setting missing or corrupted during import.');
                }
                
                // Import search engine setting
                if (typeof importedData.searchEngine === 'string') {
                    currentSearchEngine = importedData.searchEngine;
                    searchEngineSelector.value = currentSearchEngine;
                } else {
                    console.warn('Search engine setting missing or corrupted during import.');
                }

                localStorage.setItem('links', JSON.stringify(links));
                localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
                localStorage.setItem('sortByClicksEnabled', sortByClicksEnabled);
                localStorage.setItem('language', currentLanguage);
                localStorage.setItem('searchEngine', currentSearchEngine);

                renderLinks();
                showAlert(translations.alert_data_imported_success || 'Data imported successfully.');
                closeSettingsModal();
            } catch (error) {
                if (error instanceof SyntaxError) {
                    showAlert(translations.alert_import_data_parse_error || 'Failed to parse JSON file. The file may be corrupted or in an invalid format.');
                } else {
                    showAlert((translations.alert_import_failed || 'Import failed') + `\n${error.message}`);
                }
                console.error('Error importing data:', error);
            }
        };
        reader.readAsText(file);
        importFileInput.value = ''; // Clear file input after reading
    }

    // ------------------------------------
    //  Utility Functions
    // ------------------------------------

    /**
     * Creates a DOM element from an HTML string.
     * @param {string} htmlString - The HTML string.
     * @returns {Node} The first child node created from the HTML string.
     */
    function createElementFromHTML(htmlString) {
        const template = document.createElement('template');
        template.innerHTML = htmlString.trim();
        return template.content.firstChild;
    }

    // ------------------------------------
    //  Event Listeners
    // ------------------------------------
    
    // Modal related event listeners
    closeModalButton.addEventListener('click', closeEditModal);
    
    // Close modals when clicking outside their content
    window.addEventListener('click', (event) => {
        if (event.target === editModal) {
            closeEditModal();
        }
        if (event.target === settingsModal) {
            closeSettingsModal();
        }
        if (event.target === customAlertModal) {
            customAlertModal.style.display = 'none';
        }
        if (event.target === customConfirmModal) {
            customConfirmModal.style.display = 'none';
            if (confirmResolve) {
                confirmResolve(false); // Resolve with false if confirm modal is closed by clicking outside
            }
        }
    });

    // Save link button handler
    saveLinkButton.addEventListener('click', () => {
        const url = modalLinkUrl.value.trim();
        const title = modalLinkTitle.value.trim();
        const icon = modalLinkIcon.value.trim();
        const index = parseInt(modalLinkIndex.value);

        if (!url || !title) {
            showAlert(translations.alert_url_title_required || 'URL and Title are required.');
            return;
        }

        // Basic URL validation
        if (!URL_REGEX.test(url)) {
            showAlert(translations.alert_invalid_url_format || 'Invalid URL format. Please enter a valid URL.');
            return;
        }

        const newLink = { url, title, icon, clicks: 0 };

        if (index === NEW_LINK_INDEX) {
            links.push(newLink);
        } else {
            // Preserve existing click count when updating a link
            newLink.clicks = links[index].clicks;
            links[index] = newLink;
        }

        localStorage.setItem('links', JSON.stringify(links));
        renderLinks();
        closeEditModal();
    });

    // Delete link button handler
    deleteLinkButton.addEventListener('click', async () => {
        const index = parseInt(modalLinkIndex.value);
        // Use custom confirm modal
        const confirmed = await showConfirm(translations.confirm_delete_link || 'Are you sure you want to delete this link?');
        
        if (confirmed && index !== NEW_LINK_INDEX) {
            links.splice(index, 1);
            localStorage.setItem('links', JSON.stringify(links));
            renderLinks();
            closeEditModal();
        }
    });

    // Search input event listeners
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        if (query.length > 0) {
            showSuggestions(query);
        } else {
            hideSuggestions();
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if inside a form
            const selectedSuggestion = suggestionsBox?.querySelector('.suggestion-item.selected');
            if (selectedSuggestion) {
                searchInput.value = selectedSuggestion.querySelector('.text-content').textContent;
            }
            performSearch();
            hideSuggestions();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault(); // Prevent cursor movement in input
            navigateSuggestions(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault(); // Prevent cursor movement in input
            navigateSuggestions(-1);
        }
    });

    // Search button click handler (also handles form submission if wrapped in <form>)
    searchButton.addEventListener('click', performSearch);

    // Handle search engine selector change
    searchEngineSelector.addEventListener('change', (event) => {
        currentSearchEngine = event.target.value;
        localStorage.setItem('searchEngine', currentSearchEngine);
    });

    // Settings button click handler
    settingsButton.addEventListener('click', () => {
        sortByClicksCheckbox.checked = sortByClicksEnabled;
        languageSelector.value = currentLanguage;
        settingsModal.style.display = 'flex';
    });

    // Close settings button handler
    closeSettingsButton.addEventListener('click', closeSettingsModal);

    // Language selector change handler
    languageSelector.addEventListener('change', (event) => {
        currentLanguage = event.target.value;
        localStorage.setItem('language', currentLanguage);
        loadTranslations(currentLanguage);
    });

    // Save settings button handler
    saveSettingsButton.addEventListener('click', () => {
        sortByClicksEnabled = sortByClicksCheckbox.checked;
        localStorage.setItem('sortByClicksEnabled', sortByClicksEnabled);
        
        showAlert(translations.alert_settings_saved || 'Settings saved.');
        renderLinks(); // Re-render links if sorting preference changed
        closeSettingsModal();
    });

    // Data management buttons
    exportDataButton.addEventListener('click', exportData);
    importDataButton.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);
    fetchTitleButton.addEventListener('click', () => {
        const url = modalLinkUrl.value.trim();
        fetchTitleFromUrl(url);
    });

    // Initial display setup
    searchEngineSelector.value = currentSearchEngine; // Set initial selected search engine
    renderLinks(); // Render links on page load
});
