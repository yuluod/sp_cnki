let executeScript = false;

function main() {
  if (executeScript) {
    const rows = document.querySelectorAll('tbody tr');
    const data = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const titleElement = row.querySelector('.name a.fz14');
      let title = '';
      let link = '';

      if (titleElement) {
        title = sanitizeTitle(titleElement.textContent.trim());
        link = titleElement.href;
      }

      const authorContainer = row.querySelector('.author');
      const authorTags = Array.from(authorContainer.querySelectorAll('a'));
      const authors = authorTags
        .map(authorTag => authorTag.textContent.trim())
        .filter(author => author !== '');

      const sourceElement = row.querySelector('.source a');
      let source = '';
      if (sourceElement) {
        source = sourceElement.textContent.trim();
      }

      const dateElement = row.querySelector('.date');
      let date = '';
      if (dateElement) {
        date = dateElement.textContent.trim();
      }

      const typeElement = row.querySelector('.data span');
      let type = '';
      if (typeElement) {
        type = typeElement.textContent.trim();
      }

      const rowData = {
        title,
        href: link,
        authors,
        source,
        date,
        type
      };

      data.push(rowData);
    }

    console.log(data);
    const htmlContent = document.documentElement.outerHTML;

    const defaultFilename = authorsMatch(htmlContent);
    saveData(JSON.stringify(data, null, 2), defaultFilename, 'json');

    // 访问每个链接并保存为单个HTML文件
    data.forEach((row, index) => {
      const delay = Math.floor(Math.random() * 1000 + 1500);

      setTimeout(() => {
        fetch(row.href)
          .then(response => response.text())
          .then(html => {
            const filename = sanitizeTitle(row.title);
            saveData(html, filename, 'html');
          })
          .catch(error => console.error('Error fetching article:', error));
      }, index * delay);
    });
  }
}

function sanitizeTitle(title) {
  const invalidChars = /[\/:*?"<>|" "]/g;
  return title.replace(invalidChars, '_');
}

function authorsMatch(authors) {
  const regex = new RegExp("</i>[^<>：]+：([^<]+)</a>");
  const match = authors.match(regex);
  console.log('match', match ? match[1] : 'No match found');
  return match ? match[1] : 'data';
}

function saveData(data, fileName, fileType = 'json') {
  const mimeTypes = {
    'json': 'application/json',
    'html': 'text/html'
  };
  
  const blob = new Blob([data], { type: mimeTypes[fileType] || 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  chrome.runtime.sendMessage({
    action: "download",
    url: url,
    filename: fileName + '.' + fileType
  });
}

// 创建悬浮按钮
const button = document.createElement('div');
button.id = 'getDataButton';
button.style.position = 'fixed';
button.style.bottom = '20px';
button.style.right = '20px';
button.style.width = '50px';
button.style.height = '50px';
button.style.background = '#007bff';
button.style.borderRadius = '50%';
button.style.textAlign = 'center';
button.style.lineHeight = '50px';
button.style.color = '#ffffff';
button.style.cursor = 'pointer';
button.textContent = '获';
button.title = '点击获取页面原始数据';

button.addEventListener('click', () => {
  executeScript = true;
  main();
});

document.body.appendChild(button);

// 检测DOM变化停止后执行脚本
const observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      return;
    }
  }
  observer.disconnect();
  main();
});

observer.observe(document, { childList: true, subtree: true });
