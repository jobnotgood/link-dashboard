// 获取 DOM 元素
const linkNameInput = document.getElementById('link-name');
const linkUrlInput = document.getElementById('link-url');
const addLinkBtn = document.getElementById('add-link-btn');
const linksContainer = document.getElementById('links-container');
const formMessage = document.getElementById('form-message');
const listMessage = document.getElementById('list-message');

// 数据存储键名
const STORAGE_KEY = 'myLinkPoolLinks';

// 从 localStorage 加载链接
function loadLinks() {
    const linksJson = localStorage.getItem(STORAGE_KEY);
    try {
        return linksJson ? JSON.parse(linksJson) : [];
    } catch (e) {
        console.error("Failed to parse links from localStorage:", e);
        return []; // Return empty array if parsing fails
    }
}

// 保存链接到 localStorage
function saveLinks(links) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

// 生成唯一的链接 ID (这里使用时间戳，简单但不保证绝对唯一性，生产环境建议 UUID)
function generateId() {
    return Date.now().toString();
}

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
function renderLinks() {
    const links = loadLinks();
    linksContainer.innerHTML = ''; // 清空当前列表

    if (links.length === 0) {
        listMessage.textContent = '链接池为空，快来添加第一个链接吧！';
        listMessage.className = 'no-links-message'; // 使用特定的无链接样式
        listMessage.style.display = 'block';
        return;
    } else {
         listMessage.style.display = 'none'; // 隐藏无链接消息
    }


    links.forEach(link => {
        const listItem = document.createElement('li');
        // 使用 data-id 存储链接 ID，方便删除操作时获取
        listItem.dataset.id = link.id;

        const linkAnchor = document.createElement('a');
        linkAnchor.href = link.url;
        linkAnchor.textContent = link.name || link.url; // 如果没有名称，显示 URL
        linkAnchor.target = '_blank'; // 在新标签页打开

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '删除';
        // 删除按钮的点击事件会在这里由事件委托处理，见后面的代码

        listItem.appendChild(linkAnchor);
        listItem.appendChild(deleteButton);
        linksContainer.appendChild(listItem);
    });
}

// 添加链接的逻辑
function addLink() {
    const name = linkNameInput.value.trim();
    const url = linkUrlInput.value.trim();

    if (!url) {
        showMessage(formMessage, '链接地址不能为空！', 'error');
        return;
    }

    // 简单的 URL 格式验证（可以更复杂）
    try {
        new URL(url);
    } catch (e) {
        showMessage(formMessage, '请输入有效的链接地址！', 'error');
        return;
    }


    const links = loadLinks();

    const newLink = {
        id: generateId(),
        name: name, // 保存用户输入的名称，即使为空字符串
        url: url
    };

    links.push(newLink);
    saveLinks(links);
    renderLinks(); // 重新渲染列表

    // 清空输入框
    linkNameInput.value = '';
    linkUrlInput.value = '';

    showMessage(formMessage, '链接添加成功！', 'success');
}

// 删除链接的逻辑
function deleteLink(id) {
    let links = loadLinks();
    // 过滤掉需要删除的链接
    const updatedLinks = links.filter(link => link.id !== id);

    if (updatedLinks.length < links.length) { // 确保确实删除了一个链接
        saveLinks(updatedLinks);
        renderLinks(); // 重新渲染列表
        showMessage(listMessage, '链接删除成功！', 'success');
    } else {
         showMessage(listMessage, '未找到指定的链接进行删除！', 'error');
    }
}

// 初始化函数
function init() {
    renderLinks(); // 页面加载时先渲染一次现有链接

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