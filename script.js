document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
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

    // 設定モーダル要素
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsButton = document.getElementById('close-settings-button');
    const sortByClicksCheckbox = document.getElementById('sort-by-clicks-checkbox');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const languageSelector = document.getElementById('language-selector');
    const exportDataButton = document.getElementById('export-data-button');
    const importDataButton = document.getElementById('import-data-button');
    const importFileInput = document.getElementById('import-file-input');

    // データの初期化
    let links = JSON.parse(localStorage.getItem('links')) || [];
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    let sortByClicksEnabled = localStorage.getItem('sortByClicksEnabled') === 'true';
    let currentLanguage = localStorage.getItem('language') || 'en';
    let translations = {};

    const MAX_SEARCH_HISTORY = 10;
    let currentSelectedSuggestion = -1;

    // 固定サジェスト（検索候補）
    const fixedSuggestions = [
        "Today's news", "Weather", "Stock prices", "Latest technology", "Recommended restaurants",
        "Movie information", "Sports news", "Programming", "Travel destinations", "Recipes",
        "Cafe", "Reading", "Design", "Health", "Fitness", "Education"
    ];

    // ------------------------------------
    //  国際化機能
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
            // 英語へのフォールバック
            if (lang !== 'en') {
                await loadTranslations('en');
            }
        }
    }

    // 翻訳の適用
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

    // 翻訳の初期化
    loadTranslations(currentLanguage);

    // ------------------------------------
    //  リンク表示機能
    // ------------------------------------
    function renderLinks() {
        linksGrid.innerHTML = '';

        // クリック数でソート（有効な場合）
        let displayedLinks = [...links];
        if (sortByClicksEnabled) {
            displayedLinks.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        }

        displayedLinks.forEach((link, displayIndex) => {
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
                <div class="edit-icon" data-original-index="${originalIndex}">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </div>
            `;

            // クリックイベント
            linkButton.addEventListener('click', (e) => {
                if (e.target.closest('.edit-icon')) {
                    e.preventDefault();
                    const originalIndex = parseInt(e.target.closest('.edit-icon').dataset.originalIndex);
                    openEditModal(links[originalIndex], originalIndex);
                } else {
                    // クリック数を追跡
                    links[originalIndex].clicks = (links[originalIndex].clicks || 0) + 1;
                    localStorage.setItem('links', JSON.stringify(links));
                }
            });

            linksGrid.appendChild(linkButton);
        });

        // 新しいリンク追加ボタン
        const addLinkButton = document.createElement('button');
        addLinkButton.className = 'link-button add-button';
        addLinkButton.innerHTML = '+';
        addLinkButton.addEventListener('click', () => openEditModal(null, -1));
        linksGrid.appendChild(addLinkButton);
    }

    function getFaviconUrl(url) {
        try {
            const parsedUrl = new URL(url);
            return `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=48`;
        } catch (e) {
            return '';
        }
    }

    // ------------------------------------
    //  モーダル管理
    // ------------------------------------
    function openEditModal(link, index) {
        if (link) {
            modalLinkUrl.value = link.url;
            modalLinkTitle.value = link.title;
            modalLinkIcon.value = link.icon || '';
            modalLinkIndex.value = index;
            deleteLinkButton.style.display = 'inline-block';
        } else {
            modalLinkUrl.value = '';
            modalLinkTitle.value = '';
            modalLinkIcon.value = '';
            modalLinkIndex.value = '-1';
            deleteLinkButton.style.display = 'none';
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
    //  検索機能
    // ------------------------------------
    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            window.open(searchUrl, '_blank');
            addToSearchHistory(query);
            searchInput.value = '';
            hideSuggestions();
        }
    }

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

        // 履歴を追加
        filteredHistory.forEach(item => {
            combinedSuggestions.push({ type: 'history', text: item });
        });

        // 固定サジェストを追加
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
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteSearchHistoryItem(item.text);
                });
                suggestionItem.appendChild(deleteBtn);
            }
            
            suggestionsBox.appendChild(suggestionItem);
        });

        suggestionsBox.classList.add('visible');
    }

    function hideSuggestions() {
        if (!suggestionsBox) return;
        suggestionsBox.classList.remove('visible');
        suggestionsBox.innerHTML = '';
        currentSelectedSuggestion = -1;
    }

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
    //  検索履歴管理
    // ------------------------------------
    function addToSearchHistory(query) {
        const normalizedQuery = query.toLowerCase();
        searchHistory = searchHistory.filter(item => item.toLowerCase() !== normalizedQuery);
        searchHistory.unshift(query);
        searchHistory = searchHistory.slice(0, MAX_SEARCH_HISTORY);
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }

    function deleteSearchHistoryItem(value) {
        searchHistory = searchHistory.filter(item => item !== value);
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        showSuggestions(searchInput.value.trim());
    }

    // ------------------------------------
    //  タイトル取得機能
    // ------------------------------------
    async function fetchTitleFromUrl(url) {
        if (!url) {
            alert(translations.alert_url_required_for_title_fetch || 'URLを入力してください');
            return;
        }

        const originalButtonContent = fetchTitleButton.innerHTML;
        const originalButtonTitle = fetchTitleButton.title;
        fetchTitleButton.disabled = true;
        fetchTitleButton.innerHTML = translations.fetching_title || '取得中...';
        fetchTitleButton.title = translations.fetching_title_tooltip || 'タイトル取得中';

        try {
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
                    alert(translations.alert_no_title_found || 'タイトルが見つかりませんでした');
                }
            } else {
                alert(translations.alert_failed_to_fetch_title || 'タイトルの取得に失敗しました');
            }
        } catch (error) {
            console.error('Error fetching title:', error);
            alert((translations.alert_error_fetching_title || 'タイトル取得エラー') + `\n${error.message}`);
        } finally {
            fetchTitleButton.disabled = false;
            fetchTitleButton.innerHTML = originalButtonContent;
            fetchTitleButton.title = originalButtonTitle;
        }
    }

    // ------------------------------------
    //  データ管理機能
    // ------------------------------------
    function exportData() {
        const data = {
            links: links,
            searchHistory: searchHistory,
            sortByClicksEnabled: sortByClicksEnabled,
            language: currentLanguage
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
        alert(translations.alert_data_exported || 'データをエクスポートしました');
    }

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
                    alert(translations.alert_import_links_corrupted || 'リンクデータが破損しています');
                    return;
                }

                if (importedData.searchHistory && Array.isArray(importedData.searchHistory)) {
                    searchHistory = importedData.searchHistory;
                }

                if (typeof importedData.sortByClicksEnabled === 'boolean') {
                    sortByClicksEnabled = importedData.sortByClicksEnabled;
                }

                if (typeof importedData.language === 'string') {
                    currentLanguage = importedData.language;
                    languageSelector.value = currentLanguage;
                    loadTranslations(currentLanguage);
                }

                localStorage.setItem('links', JSON.stringify(links));
                localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
                localStorage.setItem('sortByClicksEnabled', sortByClicksEnabled);
                localStorage.setItem('language', currentLanguage);

                renderLinks();
                alert(translations.alert_data_imported || 'データをインポートしました');
                closeSettingsModal();
            } catch (error) {
                alert((translations.alert_import_failed || 'インポートに失敗しました') + `\n${error.message}`);
                console.error('Error importing data:', error);
            }
        };
        reader.readAsText(file);
        importFileInput.value = '';
    }

    // ------------------------------------
    //  ユーティリティ関数
    // ------------------------------------
    function createElementFromHTML(htmlString) {
        const template = document.createElement('template');
        template.innerHTML = htmlString.trim();
        return template.content.firstChild;
    }

    // ------------------------------------
    //  イベントリスナー
    // ------------------------------------
    
    // モーダル関連
    closeModalButton.addEventListener('click', closeEditModal);
    
    window.addEventListener('click', (event) => {
        if (event.target === editModal) {
            closeEditModal();
        }
        if (event.target === settingsModal) {
            closeSettingsModal();
        }
    });

    // リンク保存
    saveLinkButton.addEventListener('click', () => {
        const url = modalLinkUrl.value.trim();
        const title = modalLinkTitle.value.trim();
        const icon = modalLinkIcon.value.trim();
        const index = parseInt(modalLinkIndex.value);

        if (!url || !title) {
            alert(translations.alert_url_title_required || 'URLとタイトルは必須です');
            return;
        }

        const newLink = { url, title, icon, clicks: 0 };

        if (index === -1) {
            links.push(newLink);
        } else {
            newLink.clicks = links[index].clicks;
            links[index] = newLink;
        }

        localStorage.setItem('links', JSON.stringify(links));
        renderLinks();
        closeEditModal();
    });

    // リンク削除
    deleteLinkButton.addEventListener('click', () => {
        const index = parseInt(modalLinkIndex.value);
        if (index !== -1 && confirm(translations.confirm_delete_link || 'このリンクを削除しますか？')) {
            links.splice(index, 1);
            localStorage.setItem('links', JSON.stringify(links));
            renderLinks();
            closeEditModal();
        }
    });

    // 検索関連
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
            const selectedSuggestion = suggestionsBox?.querySelector('.suggestion-item.selected');
            if (selectedSuggestion) {
                searchInput.value = selectedSuggestion.querySelector('.text-content').textContent;
            }
            performSearch();
            hideSuggestions();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateSuggestions(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateSuggestions(-1);
        }
    });

    searchButton.addEventListener('click', performSearch);

    // 設定関連
    settingsButton.addEventListener('click', () => {
        sortByClicksCheckbox.checked = sortByClicksEnabled;
        languageSelector.value = currentLanguage;
        settingsModal.style.display = 'flex';
    });

    closeSettingsButton.addEventListener('click', closeSettingsModal);

    languageSelector.addEventListener('change', (event) => {
        currentLanguage = event.target.value;
        localStorage.setItem('language', currentLanguage);
        loadTranslations(currentLanguage);
    });

    saveSettingsButton.addEventListener('click', () => {
        sortByClicksEnabled = sortByClicksCheckbox.checked;
        localStorage.setItem('sortByClicksEnabled', sortByClicksEnabled);
        
        alert(translations.alert_settings_saved || '設定を保存しました');
        renderLinks();
        closeSettingsModal();
    });

    // データ管理
    exportDataButton.addEventListener('click', exportData);
    importDataButton.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);
    fetchTitleButton.addEventListener('click', () => {
        const url = modalLinkUrl.value.trim();
        fetchTitleFromUrl(url);
    });

    // 初期表示
    renderLinks();
});
