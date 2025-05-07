// 获取 DOM 元素
const linkNameInput = document.getElementById('link-name');
const linkUrlInput = document.getElementById('link-url');
const addLinkBtn = document.getElementById('add-link-btn');
const linksContainer = document.getElementById('links-container');
const formMessage = document.getElementById('form-message');
const listMessage = document.getElementById('list-message');

// --- 配置项 ---
// 你的 Cloudflare Worker API 的基础 URL (使用 workers.dev 地址)
// 已经使用你提供的 Worker 名称和 workers.dev 子域名
const BASE_API_URL = 'https://link-pool-api-worker.youihim1234.workers.dev/api/links';
// --- 配置项结束 ---

// 显示消息提示
function showMessage(element, msg, type = '') {
    element.textContent = msg;
    element.className = 'message'; // Reset classes
    if (type) {
        element.classList.add(type); // Add success/error class
    }
    element.style.display = 'block';
    // 自动隐藏消息（可选）
    setTimeout(() => {
        element.style.display = 'none';
        element.textContent = '';
    }, 3000); // 3秒后隐藏
}

// 渲染链接列表
function renderLinks(links) {
    linksContainer.innerHTML = ''; // 清空当前列表

    if (!links || links.length === 0) {
        listMessage.textContent = '链接池为空，快来添加第一个链接吧！';
        listMessage.className = 'no-links-message'; // 使用特定的无链接样式
        listMessage.style.display = 'block';
        return;
    } else {
         listMessage.style.display = 'none'; // 隐藏无链接消息
    }


    links.forEach(link => {
        const listItem = document.createElement('li');
        // 使用 data-id 存储链接 ID
        listItem.dataset.id = link.id;

        const linkAnchor = document.createElement('a');
        linkAnchor.href = link.url;
        linkAnchor.textContent = link.name || link.url; // 如果没有名称，显示 URL
        linkAnchor.target = '_blank'; // 在新标签页打开

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '删除';
        // 删除按钮的点击事件会在这里由事件委托处理

        listItem.appendChild(linkAnchor);
        listItem.appendChild(deleteButton);
        linksContainer.appendChild(listItem);
    });
}

// 从 API 获取并渲染链接
async function fetchAndRenderLinks() {
    listMessage.textContent = '正在加载链接...'; // 显示加载状态
    listMessage.className = 'message';
    listMessage.style.display = 'block';


    try {
        const response = await fetch(BASE_API_URL);

        if (!response.ok) {
             // Handle HTTP errors (e.g., 404, 500)
             const errorBody = await response.text(); // Try to read error body
             throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const links = await response.json();
        renderLinks(links); // 渲染获取到的链接
        // 清除加载消息或显示成功
        if (links.length > 0) {
             listMessage.style.display = 'none'; // 有链接时隐藏消息
        } else {
             // 如果没有链接，renderLinks 会显示 '链接池为空' 的消息，所以这里不用额外处理
        }


    } catch (error) {
        console.error("Failed to fetch links:", error);
        showMessage(listMessage, `加载链接失败: ${error.message}`, 'error');
        renderLinks([]); // 清空列表或显示空状态
    }
}

// 添加链接的逻辑
async function addLink() {
    const name = linkNameInput.value.trim();
    const url = linkUrlInput.value.trim();

    if (!url) {
        showMessage(formMessage, '链接地址不能为空！', 'error');
        return;
    }

    // 简单的 URL 格式验证
    try {
        new URL(url);
    } catch (e) {
        showMessage(formMessage, '请输入有效的链接地址！', 'error');
        return;
    }

    addLinkBtn.disabled = true; // 添加过程中禁用按钮
    showMessage(formMessage, '正在添加链接...', ''); // 显示添加中状态

    const newLinkData = {
        name: name,
        url: url
    };

    try {
        const response = await fetch(BASE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newLinkData)
        });

         if (!response.ok) {
              const errorBody = await response.text();
              throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
         }


        const addedLink = await response.json(); // API 应该返回新添加的链接对象

        // 重新获取并渲染所有链接，确保列表最新
        await fetchAndRenderLinks();

        // 清空输入框
        linkNameInput.value = '';
        linkUrlInput.value = '';

        showMessage(formMessage, '链接添加成功！', 'success');

    } catch (error) {
        console.error("Failed to add link:", error);
        showMessage(formMessage, `添加链接失败: ${error.message}`, 'error');
    } finally {
        addLinkBtn.disabled = false; // 添加完成后启用按钮
    }
}

// 删除链接的逻辑
async function deleteLink(id) {
     // 可以在这里添加确认对话框
     // if (!confirm('确定要删除这个链接吗？')) {
     //     return;
     // }

    showMessage(listMessage, '正在删除链接...', ''); // 显示删除中状态

    try {
        // 构建删除特定链接的 URL
        const deleteUrl = `${BASE_API_URL}/${id}`;
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            // DELETE 请求通常不需要请求体
        });

        if (!response.ok) {
             const errorBody = await response.text();
             throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        // 删除成功后，重新获取并渲染所有链接
        await fetchAndRenderLinks();

        showMessage(listMessage, '链接删除成功！', 'success');

    } catch (error) {
        console.error("Failed to delete link:", error);
        showMessage(listMessage, `删除链接失败: ${error.message}`, 'error');
    }
}

// 初始化函数
function init() {
    // 页面加载时从 API 获取并渲染链接
    fetchAndRenderLinks();

    // 为添加按钮绑定点击事件
    addLinkBtn.addEventListener('click', addLink);

    // 为链接列表容器使用事件委托，处理删除按钮的点击事件
    linksContainer.addEventListener('click', (event) => {
        // 检查点击的元素是否是删除按钮
        if (event.target.tagName === 'BUTTON') {
            // 获取按钮所在的 li 元素的 data-id
            const listItem = event.target.closest('li');
            if (listItem && listItem.dataset.id) {
                const linkIdToDelete = listItem.dataset.id;
                deleteLink(linkIdToDelete);
            }
        }
    });

    // 允许按回车键添加链接（在 URL 输入框按回车）
    linkUrlInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // 阻止表单默认提交行为
            addLink();
        }
    });
     // 也允许在名称输入框按回车
     linkNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // 阻止表单默认提交行为
            addLink();
        }
    });
}

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', init);
