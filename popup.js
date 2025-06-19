document.addEventListener('DOMContentLoaded', function() {
  const resultsContainer = document.getElementById('resultsContainer');
  const loadingDiv = document.getElementById('loading');
  const apiKeyWarningDiv = document.getElementById('apiKeyWarning');

  chrome.runtime.sendMessage({ action: "getApiKeyStatus" }, function(response) {
    if (chrome.runtime.lastError) {
      console.warn("Could not get API key status:", chrome.runtime.lastError.message);
      // Potentially show a generic error or allow proceeding if offline analysis is possible
      // 如果可能进行离线分析，则可能显示通用错误或允许继续
      return;
    }
    if (response && response.apiKeySet === false) {
      apiKeyWarningDiv.style.display = 'block';
      if(loadingDiv) { // Ensure loadingDiv exists before trying to set its textContent // 确保loadingDiv存在后再尝试设置其textContent
          loadingDiv.textContent = 'API Key 未配置，无法进行分析。请联系扩展开发者。';
          loadingDiv.style.display = 'block'; // Make sure loading div is visible // 确保加载提示div可见
      }
      resultsContainer.style.display = 'none'; // Hide results container // 隐藏结果容器
    }
  });

  // Function to render results
  // 渲染结果的函数
  function render(data) {
    // If API key is not set, warning is already shown, so don't overwrite it with "loading"
    // unless isLoading is explicitly true and API key warning is not visible.
    // 如果API密钥未设置，警告已显示，因此不要用“加载中”覆盖它
    // 除非isLoading明确为true且API密钥警告不可见。
    if (data.isLoading && apiKeyWarningDiv.style.display === 'none') {
      loadingDiv.textContent = '分析中，请稍候...';
      loadingDiv.style.display = 'block';
      resultsContainer.style.display = 'none';
    } else if (!data.isLoading) { // Only proceed if not loading // 仅在非加载状态下继续
      loadingDiv.style.display = 'none';
      resultsContainer.style.display = 'block';

      if (data.error) {
        resultsContainer.innerHTML = '<p style="color: red; font-weight: bold;">发生错误:</p><p style="color: red; white-space: pre-wrap;">' + data.error + '</p>';
        // Consider not clearing the error immediately from storage if the user might reopen popup
        // 如果用户可能重新打开弹出窗口，可以考虑不立即从存储中清除错误
        // chrome.storage.local.remove('error');
      } else if (data.analysisResult) {
        let htmlResult = data.analysisResult;

        // Replace ### headers (e.g., ### 【情景分析】)
        // 替换 ### 标题 (例如：### 【情景分析】)
        htmlResult = htmlResult.replace(/###\s*【(.*?)】/g, '<h3>$1</h3>');

        // Replace #### option headers (e.g., #### 选项一：轻松幽默型)
        // More flexible regex: #### 选项(?:一|二|三|四|五)：(.*?)(?:\n|$)
        // 替换 #### 选项标题 (例如：#### 选项一：轻松幽默型)
        // 更灵活的正则表达式: #### 选项(?:一|二|三|四|五)：(.*?)(?:\n|$)
        htmlResult = htmlResult.replace(/####\s*选项(?:一|二|三|四|五|六|七|八|九|十)：(.*?)(?:\n|$)/g, (match, p1) => {
            return \`<h4>选项：\${p1.trim()}</h4>\`;
        });

        // Replace > quotes (e.g., > 回复内容：...)
        // This needs to be careful not to over-match if blockquotes are used elsewhere.
        // Assuming it's primarily for "回复内容："
        // 替换 > 引号 (例如： > 回复内容：...)
        // 这里需要小心，如果其他地方使用了块引用，不要过度匹配。
        // 假设主要用于“回复内容：”
        htmlResult = htmlResult.replace(/^>\s*回复内容：\s*([\s\S]*?)(?=\n> 设计思路：|设计思路：|$)/gm, (match, p1) => {
          return \`<p><strong>回复内容：</strong><em>\${p1.trim()}</em></p>\`;
        });
        // Simpler quote for general use like in 【情景分析】
        // 用于【情景分析】等常规用途的更简单的引号处理
        htmlResult = htmlResult.replace(/^>(?! 回复内容：)(.*)/gm, '<p><em>$1</em></p>');


        // Handle "设计思路：" and "### 【后续建议与提醒】" sections for lists
        // 处理“设计思路：”和“### 【后续建议与提醒】”部分的列表
        const processListSection = (sectionTitle, content) => {
            let listItems = content.trim().split('\n')
                .map(item => item.replace(/^\s*\*\s*/, '').trim())
                .filter(item => item) // Remove empty items // 删除空项目
                .map(item => \`<li>\${item}</li>\`)
                .join('');
            return listItems ? \`<strong>\${sectionTitle}</strong><ul>\${listItems}</ul>\` : \`<strong>\${sectionTitle}</strong>\`;
        };

        htmlResult = htmlResult.replace(/设计思路：\s*([\s\S]*?)(?=####|$|### 【后续建议与提醒】|---|<hr>)/g, (match, p1) => {
             return processListSection('设计思路：', p1);
        });

        htmlResult = htmlResult.replace(/### 【后续建议与提醒】\s*([\s\S]*?)(?=####|$|---|<hr>)/g, (match, p1) => {
            // Remove the "### 【后续建议与提醒】" part from p1 if it was captured by ([\s\S]*?)
            // 如果p1中捕获了“### 【后续建议与提醒】”部分，则将其移除
            p1 = p1.replace(/^### 【后续建议与提醒】\s*/, '');
            let title = '<h3>后续建议与提醒</h3>';
            let listItems = p1.trim().split('\n')
                .map(item => item.replace(/^\s*\*\s*/, '').trim())
                .filter(item => item) // 删除空项目
                .map(item => \`<li>\${item}</li>\`)
                .join('');
            return title + (listItems ? \`<ul>\${listItems}</ul>\` : '');
        });

        // Wrap options in a div - this regex needs to be robust
        // It should capture from an <h4> until the next <h4> or <h3> or <hr> or end of string.
        // 将选项包装在div中 - 此正则表达式需要稳健
        // 它应该从一个<h4>标签捕获到下一个<h4>、<h3>、<hr>或字符串末尾。
        htmlResult = htmlResult.replace(/(<h4>.*?<\/h4>[\s\S]*?)(?=(<h4>|<h3>|<hr>|$))/g, '<div class="option">$1</div>');

        // Clean up any remaining ---
        // 清理所有剩余的 ---
        htmlResult = htmlResult.replace(/\n---\n/g, '<hr>').replace(/---/g, '<hr>');

        resultsContainer.innerHTML = htmlResult;
      } else if (apiKeyWarningDiv.style.display !== 'block') { // Only show this if API key is configured // 仅当API密钥已配置时显示此消息
        resultsContainer.textContent = '右键点击页面上的聊天截图区域，选择“Analyze WeChat Screenshot”开始分析。';
      }
    }
  }

  // Initial render
  // 初始渲染
  chrome.storage.local.get(['analysisResult', 'error', 'isLoading'], function(data) {
    // If API key warning is already visible, don't immediately overwrite loading text
    // 如果API密钥警告已显示，则不要立即覆盖加载文本
    if (apiKeyWarningDiv.style.display === 'block' && data.isLoading) {
        // loadingDiv is already handled by the API key check
        // loadingDiv已由API密钥检查处理
    } else {
        render(data);
    }
  });

  // Listen for storage changes to update popup dynamically
  // 监听存储更改以动态更新弹出窗口
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
      // We need to get the full current state because changes only provides what changed.
      // Render function expects a complete state object.
      // 我们需要获取完整的当前状态，因为changes仅提供已更改的内容。
      // render函数期望一个完整的状态对象。
      chrome.storage.local.get(['analysisResult', 'error', 'isLoading'], function(currentData) {
        render(currentData);
      });
    }
  });
});
