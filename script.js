document.addEventListener('DOMContentLoaded', () => {
    const linksGrid = document.getElementById('links-grid');
    const searchInput = document.getElementById('google-search-input');
    const searchButton = document.getElementById('search-button');
    const suggestionsBox = document.getElementById('suggestions-box');
    const modal = document.getElementById('edit-modal');
    const closeModalButton = modal.querySelector('.close-button');
    const saveLinkButton = document.getElementById('save-link-button');
    const deleteLinkButton = document.getElementById('delete-link-button');
    const modalLinkUrl = document.getElementById('modal-link-url');
    const modalLinkTitle = document.getElementById('modal-link-title');
    const modalLinkIcon = document.getElementById('modal-link-icon');
    const modalLinkIndex = document.getElementById('modal-link-index');

    let links = JSON.parse(localStorage.getItem('chromeLinks')) || [];
    let searchHistory = JSON.parse(localStorage.getItem('chromeSearchHistory')) || [];
    const MAX_LINKS = 24; // 8x3グリッドの最大数
    const MAX_SEARCH_HISTORY = 10; // 検索履歴の最大数
    let currentSelectedSuggestion = -1; // 現在選択されているサジェストのインデックス

    // 簡易的な固定サジェストデータ（本家APIの代わり）
    const fixedSuggestions = [
        "今日のニュース", "天気", "株価", "最新のテクノロジー", "おすすめのレストラン",
        "映画情報", "スポーツニュース", "プログラミング", "旅行先", "レシピ",
        "カフェ", "読書", "デザイン", "健康", "フィットネス", "教育"
    ];

    // 既存のリンクデータにclicksプロパティがない場合、初期化する
    links.forEach(link => {
        if (typeof link.clicks === 'undefined') {
            link.clicks = 0;
        }
    });
    localStorage.setItem('chromeLinks', JSON.stringify(links));

    // ------------------------------------
    //  リンクの描画
    // ------------------------------------
    function renderLinks() {
        linksGrid.innerHTML = '';

        // クリック数が多い順にソート（降順）
        const sortedLinks = [...links].sort((a, b) => b.clicks - a.clicks);

        sortedLinks.forEach((link, index) => {
            const originalIndex = links.findIndex(l => l === link);
            const linkButton = createLinkButton(link, originalIndex);
            linksGrid.appendChild(linkButton);
        });

        for (let i = links.length; i < MAX_LINKS; i++) {
            const addButton = document.createElement('div');
            addButton.classList.add('link-button', 'add-button');
            addButton.innerHTML = '+';
            addButton.addEventListener('click', () => {
                openModalForNewLink();
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
            if (links[index]) {
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
            openModalForEditing(index);
        });

        linkButton.appendChild(iconImg);
        linkButton.appendChild(titleDiv);
        linkButton.appendChild(editIcon);

        return linkButton;
    }

    // ------------------------------------
    //  モーダル関連
    // ------------------------------------
    function openModal() {
        modal.style.display = 'flex';
        // モーダルを開いたときに、最初の入力フィールドにフォーカス
        modalLinkUrl.focus();
    }

    function closeModal() {
        modal.style.display = 'none';
        resetModalForm();
    }

    function resetModalForm() {
        modalLinkUrl.value = '';
        modalLinkTitle.value = '';
        modalLinkIcon.value = '';
        modalLinkIndex.value = '';
        deleteLinkButton.style.display = 'none';
    }

    function openModalForNewLink() {
        resetModalForm();
        deleteLinkButton.style.display = 'none';
        modal.querySelector('h2').textContent = '新しいリンクを追加';
        openModal();
    }

    function openModalForEditing(index) {
        const link = links[index];
        if (link) {
            modalLinkUrl.value = link.url;
            modalLinkTitle.value = link.title;
            modalLinkIcon.value = link.icon || '';
            modalLinkIndex.value = index;
            deleteLinkButton.style.display = 'inline-block';
            modal.querySelector('h2').textContent = 'リンクを編集';
            openModal();
        }
    }

    // ------------------------------------
    //  検索履歴・サジェスト関連
    // ------------------------------------
    function saveSearchQuery(query) {
        if (!query) return;
        // 既存の履歴があれば削除して最新の位置に移動
        searchHistory = searchHistory.filter(item => item !== query);
        // 新しいクエリを先頭に追加
        searchHistory.unshift(query);
        // 最大履歴数を超えたら古いものを削除
        if (searchHistory.length > MAX_SEARCH_HISTORY) {
            searchHistory = searchHistory.slice(0, MAX_SEARCH_HISTORY);
        }
        localStorage.setItem('chromeSearchHistory', JSON.stringify(searchHistory));
    }

    function deleteSearchQuery(queryToDelete) {
        searchHistory = searchHistory.filter(item => item !== queryToDelete);
        localStorage.setItem('chromeSearchHistory', JSON.stringify(searchHistory));
        // 現在の入力に基づいてサジェストを再表示
        showSuggestions(searchInput.value.trim());
    }

    // Google Custom Search APIなどを使用する場合の例（CORSとAPIキー設定が必要）
    // async function fetchGoogleSuggestions(query) {
    //     // ここにあなたのGoogle Custom Search APIキーとカスタム検索IDを設定
    //     const API_KEY = 'YOUR_GOOGLE_API_KEY';
    //     const CX = 'YOUR_CUSTOM_SEARCH_ENGINE_ID';
    //     const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}`;

    //     try {
    //         const response = await fetch(url);
    //         const data = await response.json();
    //         // data.items からサジェスト候補を抽出して返す
    //         // このAPIは検索結果を返すため、サジェストには適さない場合があります。
    //         // 実際のサジェストAPIはGoogle Suggest APIなどですが、公式には公開されていません。
    //         // そのため、プロキシサーバーを介して非公式APIを利用するか、Bing Suggestions APIなどの他のAPIを検討する必要があります。
    //         return []; // デモでは空を返します
    //     } catch (error) {
    //         console.error('Failed to fetch suggestions from Google API:', error);
    //         return [];
    //     }
    // }

    async function showSuggestions(query) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.classList.remove('visible');
        currentSelectedSuggestion = -1;

        if (query.length === 0) return;

        const filteredHistory = searchHistory.filter(h => h.toLowerCase().includes(query.toLowerCase()));
        const filteredSuggestions = fixedSuggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()) && !filteredHistory.includes(s));

        let combinedSuggestions = [];

        // 検索履歴
        filteredHistory.forEach(item => {
            combinedSuggestions.push({ type: 'history', text: item });
        });

        // 固定サジェスト
        filteredSuggestions.forEach(item => {
            combinedSuggestions.push({ type: 'suggestion', text: item });
        });

        // オプション: 外部APIからのサジェストを結合する場合
        // const apiSuggestions = await fetchGoogleSuggestions(query); // ここを有効にする場合
        // apiSuggestions.forEach(item => {
        //     if (!combinedSuggestions.some(s => s.text === item)) { // 重複を避ける
        //         combinedSuggestions.push({ type: 'suggestion', text: item });
        //     }
        // });

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

            suggestionItem.appendChild(DOMParser.parseFromString(iconSvg, 'image/svg+xml').documentElement); // SVGをDOMとして追加
            suggestionItem.appendChild(textSpan);

            suggestionItem.addEventListener('click', (e) => {
                // 削除ボタンがクリックされた場合は処理をスキップ
                if (e.target.classList.contains('delete-history-btn') || e.target.closest('.delete-history-btn')) {
                    return;
                }
                searchInput.value = item.text;
                hideSuggestions();
                searchButton.click();
            });

            // 履歴の場合のみ削除ボタンを追加
            if (item.type === 'history') {
                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('delete-history-btn');
                deleteBtn.innerHTML = '&times;'; // ×マーク
                deleteBtn.title = '履歴から削除';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // suggestionItemへのクリックイベントを停止
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
        currentSelectedSuggestion = -1; // 選択状態をリセット
    }

    // ------------------------------------
    //  イベントリスナー
    // ------------------------------------
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
                searchInput.value = items[currentSelectedSuggestion].querySelector('.text-content').textContent;
            } else if (currentSelectedSuggestion === 0) { // 最初の要素から上に移動すると入力フィールドに戻る
                items[currentSelectedSuggestion].classList.remove('selected');
                currentSelectedSuggestion = -1;
                searchInput.value = searchInput.dataset.originalValue || ''; // 元の入力値に戻す
            }
        }
    });

    // input要素にフォーカスがあたったときに現在の値を保存
    searchInput.addEventListener('focus', () => {
        searchInput.dataset.originalValue = searchInput.value;
        showSuggestions(searchInput.value.trim()); // フォーカス時にもサジェストを表示
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(hideSuggestions, 150); // わずかに遅延させてクリック可能にする
    });

    closeModalButton.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    saveLinkButton.addEventListener('click', () => {
        const url = modalLinkUrl.value.trim();
        const title = modalLinkTitle.value.trim();
        const icon = modalLinkIcon.value.trim();
        const index = modalLinkIndex.value;

        if (!url || !title) {
            alert('URLとタイトルは必須です。');
            return;
        }

        if (index === '') {
            if (links.length < MAX_LINKS) {
                links.push({ url, title, icon, clicks: 0 });
            } else {
                alert('リンクの最大数に達しました。');
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
        closeModal();
    });

    deleteLinkButton.addEventListener('click', () => {
        if (confirm('このリンクを削除してもよろしいですか？')) {
            const index = parseInt(modalLinkIndex.value);
            links.splice(index, 1);
            localStorage.setItem('chromeLinks', JSON.stringify(links));
            renderLinks();
            closeModal();
        }
    });

    renderLinks();
});