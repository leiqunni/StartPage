document.addEventListener('DOMContentLoaded', () => {
    const linksGrid = document.getElementById('links-grid');
    const searchInput = document.getElementById('google-search-input');
    const searchButton = document.getElementById('search-button');
    const modal = document.getElementById('edit-modal');
    const closeModalButton = modal.querySelector('.close-button');
    const saveLinkButton = document.getElementById('save-link-button');
    const deleteLinkButton = document.getElementById('delete-link-button');
    const modalLinkUrl = document.getElementById('modal-link-url');
    const modalLinkTitle = document.getElementById('modal-link-title');
    const modalLinkIcon = document.getElementById('modal-link-icon');
    const modalLinkIndex = document.getElementById('modal-link-index');

    let links = JSON.parse(localStorage.getItem('chromeLinks')) || [];
    const MAX_LINKS = 24; // 8x3グリッドの最大数

    // 既存のリンクデータにclicksプロパティがない場合、初期化する
    links.forEach(link => {
        if (typeof link.clicks === 'undefined') {
            link.clicks = 0;
        }
    });
    // ローカルストレージを更新
    localStorage.setItem('chromeLinks', JSON.stringify(links));

    // ------------------------------------
    //  リンクの描画
    // ------------------------------------
    function renderLinks() {
        linksGrid.innerHTML = ''; // 既存のボタンをクリア

        // クリック数が多い順にソート（降順）
        // 同じクリック数の場合は、現在の並び順（安定ソート）を維持するため、元のインデックスも考慮しない単純なソート
        const sortedLinks = [...links].sort((a, b) => b.clicks - a.clicks);

        // 登録されているリンクの描画
        sortedLinks.forEach((link, index) => {
            const originalIndex = links.findIndex(l => l === link); // 元の配列でのインデックスを取得
            const linkButton = createLinkButton(link, originalIndex); // 元のインデックスを渡す
            linksGrid.appendChild(linkButton);
        });

        // 空きスロットの描画
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
        linkButton.target = '_blank'; // 新しいタブで開く

        // リンククリック時のイベントリスナー
        linkButton.addEventListener('click', (e) => {
            // ここでクリック数をインクリメント
            if (links[index]) { // リンクが存在することを確認
                links[index].clicks = (links[index].clicks || 0) + 1;
                localStorage.setItem('chromeLinks', JSON.stringify(links));
                // クリック後、ソートされた状態を再描画する場合は以下の行を有効にする
                // renderLinks();
                // ただし、毎回ソートすると視覚的に動きが激しくなる可能性があるので、
                // 必要に応じて検討してください。今回はクリック後すぐに再描画はしない。
            }
        });

        const iconSrc = link.icon || `https://www.google.com/s2/favicons?sz=64&domain_url=${link.url}`;
        const iconImg = document.createElement('img');
        iconImg.classList.add('icon');
        iconImg.src = iconSrc;
        iconImg.alt = link.title;
        iconImg.onerror = () => {
            // アイコンのロード失敗時は、デフォルトのSVGアイコンに切り替える
            iconImg.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ccc' d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z'/%3E%3C/svg%3E`;
        };

        const titleDiv = document.createElement('div');
        titleDiv.classList.add('title');
        titleDiv.textContent = link.title;

        // 編集アイコン
        const editIcon = document.createElement('div');
        editIcon.classList.add('edit-icon');
        editIcon.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
        `;
        editIcon.addEventListener('click', (e) => {
            e.preventDefault(); // リンクへの遷移を阻止
            e.stopPropagation(); // 親要素のクリックイベントが発火するのを阻止
            openModalForEditing(index); // 元の配列のインデックスを渡す
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
    }

    function closeModal() {
        modal.style.display = 'none';
        resetModalForm();
    }

    function resetModalForm() {
        modalLinkUrl.value = '';
        modalLinkTitle.value = '';
        modalLinkIcon.value = '';
        modalLinkIndex.value = ''; // 編集中のインデックスをクリア
        deleteLinkButton.style.display = 'none'; // 削除ボタンを非表示に
    }

    function openModalForNewLink() {
        resetModalForm();
        deleteLinkButton.style.display = 'none'; // 新規登録時は削除ボタン非表示
        modal.querySelector('h2').textContent = '新しいリンクを追加';
        openModal();
    }

    function openModalForEditing(index) {
        const link = links[index];
        if (link) {
            modalLinkUrl.value = link.url;
            modalLinkTitle.value = link.title;
            modalLinkIcon.value = link.icon || '';
            modalLinkIndex.value = index; // 編集中のインデックスをセット
            deleteLinkButton.style.display = 'inline-block'; // 編集時は削除ボタン表示
            modal.querySelector('h2').textContent = 'リンクを編集';
            openModal();
        }
    }

    // ------------------------------------
    //  イベントリスナー
    // ------------------------------------
    // Google検索ボタン
    searchButton.addEventListener('click', () => {
        const query = searchInput.value;
        if (query) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        }
    });

    // Enterキーで検索
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });

    // モーダルを閉じるボタン
    closeModalButton.addEventListener('click', closeModal);

    // モーダル外をクリックで閉じる
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // リンク保存/更新ボタン
    saveLinkButton.addEventListener('click', () => {
        const url = modalLinkUrl.value.trim();
        const title = modalLinkTitle.value.trim();
        const icon = modalLinkIcon.value.trim();
        const index = modalLinkIndex.value; // stringなので注意

        if (!url || !title) {
            alert('URLとタイトルは必須です。');
            return;
        }

        if (index === '') { // 新規追加
            if (links.length < MAX_LINKS) {
                // 新規追加時にはclicksを0で初期化
                links.push({ url, title, icon, clicks: 0 });
            } else {
                alert('リンクの最大数に達しました。');
            }
        } else { // 既存リンクの編集
            const existingLink = links[parseInt(index)];
            // 既存のclicksプロパティを保持しつつ更新
            links[parseInt(index)] = {
                url,
                title,
                icon,
                clicks: existingLink ? existingLink.clicks : 0 // 既存ならclicksを保持
            };
        }

        localStorage.setItem('chromeLinks', JSON.stringify(links));
        renderLinks(); // ソートされた状態で再描画
        closeModal();
    });

    // リンク削除ボタン
    deleteLinkButton.addEventListener('click', () => {
        if (confirm('このリンクを削除してもよろしいですか？')) {
            const index = parseInt(modalLinkIndex.value);
            links.splice(index, 1); // 指定したインデックスの要素を削除
            localStorage.setItem('chromeLinks', JSON.stringify(links));
            renderLinks(); // ソートされた状態で再描画
            closeModal();
        }
    });

    // 初期描画
    renderLinks();
});