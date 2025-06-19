document.addEventListener('DOMContentLoaded', function() {
  const resultsContainer = document.getElementById('resultsContainer');
  const loadingDiv = document.getElementById('loading');
  const apiKeyWarningDiv = document.getElementById('apiKeyWarning');

  chrome.runtime.sendMessage({ action: "getApiKeyStatus" }, function(response) {
    if (chrome.runtime.lastError) {
      console.warn("Could not get API key status:", chrome.runtime.lastError.message);
      // Potentially show a generic error or allow proceeding if offline analysis is possible
      return;
    }
    if (response && response.apiKeySet === false) {
      apiKeyWarningDiv.style.display = 'block';
      if(loadingDiv) { // Ensure loadingDiv exists before trying to set its textContent
          loadingDiv.textContent = 'API Key 未配置，无法进行分析。请联系扩展开发者。';
          loadingDiv.style.display = 'block'; // Make sure loading div is visible
      }
      resultsContainer.style.display = 'none'; // Hide results container
    }
  });

  // Function to render results
  function render(data) {
    // If API key is not set, warning is already shown, so don't overwrite it with "loading"
    // unless isLoading is explicitly true and API key warning is not visible.
    if (data.isLoading && apiKeyWarningDiv.style.display === 'none') {
      loadingDiv.textContent = '分析中，请稍候...';
      loadingDiv.style.display = 'block';
      resultsContainer.style.display = 'none';
    } else if (!data.isLoading) { // Only proceed if not loading
      loadingDiv.style.display = 'none';
      resultsContainer.style.display = 'block';

      if (data.error) {
        resultsContainer.innerHTML = '<p style="color: red; font-weight: bold;">发生错误:</p><p style="color: red; white-space: pre-wrap;">' + data.error + '</p>';
      } else if (data.analysisResult) {
        let htmlResult = data.analysisResult;

        // Replace ### headers (e.g., ### 【情景分析】)
        htmlResult = htmlResult.replace(/###\s*【(.*?)】/g, '<h3>$1</h3>');

        // Replace #### option headers (e.g., #### 选项一：轻松幽默型)
        // More flexible regex: #### 选项(?:一|二|三|四|五)：(.*?)(?:\n|$)
        htmlResult = htmlResult.replace(/####\s*选项(?:一|二|三|四|五|六|七|八|九|十)：(.*?)(?:\n|$)/g, (match, p1) => {
            return \`<h4>选项：\${p1.trim()}</h4>\`;
        });

        // Replace > quotes (e.g., > 回复内容：...)
        // This needs to be careful not to over-match if blockquotes are used elsewhere.
        // Assuming it's primarily for "回复内容："
        htmlResult = htmlResult.replace(/^>\s*回复内容：\s*([\s\S]*?)(?=\n> 设计思路：|设计思路：|$)/gm, (match, p1) => {
          return \`<p><strong>回复内容：</strong><em>\${p1.trim()}</em></p>\`;
        });
        // Simpler quote for general use like in 【情景分析】
        htmlResult = htmlResult.replace(/^>(?! 回复内容：)(.*)/gm, '<p><em>$1</em></p>');


        // Handle "设计思路：" and "### 【后续建议与提醒】" sections for lists
        const processListSection = (sectionTitle, content) => {
            let listItems = content.trim().split('\n')
                .map(item => item.replace(/^\s*\*\s*/, '').trim())
                .filter(item => item) // Remove empty items
                .map(item => \`<li>\${item}</li>\`)
                .join('');
            return listItems ? \`<strong>\${sectionTitle}</strong><ul>\${listItems}</ul>\` : \`<strong>\${sectionTitle}</strong>\`;
        };

        htmlResult = htmlResult.replace(/设计思路：\s*([\s\S]*?)(?=####|$|### 【后续建议与提醒】|---|<hr>)/g, (match, p1) => {
             return processListSection('设计思路：', p1);
        });

        htmlResult = htmlResult.replace(/### 【后续建议与提醒】\s*([\s\S]*?)(?=####|$|---|<hr>)/g, (match, p1) => {
            // Remove the "### 【后续建议与提醒】" part from p1 if it was captured by ([\s\S]*?)
            p1 = p1.replace(/^### 【后续建议与提醒】\s*/, '');
            let title = '<h3>后续建议与提醒</h3>';
            let listItems = p1.trim().split('\n')
                .map(item => item.replace(/^\s*\*\s*/, '').trim())
                .filter(item => item)
                .map(item => \`<li>\${item}</li>\`)
                .join('');
            return title + (listItems ? \`<ul>\${listItems}</ul>\` : '');
        });

        // Wrap options in a div - this regex needs to be robust
        // It should capture from an <h4> until the next <h4> or <h3> or <hr> or end of string.
        htmlResult = htmlResult.replace(/(<h4>.*?<\/h4>[\s\S]*?)(?=(<h4>|<h3>|<hr>|$))/g, '<div class="option">$1</div>');

        // Clean up any remaining ---
        htmlResult = htmlResult.replace(/\n---\n/g, '<hr>').replace(/---/g, '<hr>');

        resultsContainer.innerHTML = htmlResult;
      } else if (apiKeyWarningDiv.style.display !== 'block') { // Only show this if API key is configured
        resultsContainer.textContent = '右键点击页面上的聊天截图区域，选择“Analyze WeChat Screenshot”开始分析。';
      }
    }
  }

  // Initial render
  chrome.storage.local.get(['analysisResult', 'error', 'isLoading'], function(data) {
    // If API key warning is already visible, don't immediately overwrite loading text
    if (apiKeyWarningDiv.style.display === 'block' && data.isLoading) {
        // loadingDiv is already handled by the API key check
    } else {
        render(data);
    }
  });

  // Listen for storage changes to update popup dynamically
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
      // We need to get the full current state because changes only provides what changed.
      // Render function expects a complete state object.
      chrome.storage.local.get(['analysisResult', 'error', 'isLoading'], function(currentData) {
        render(currentData);
      });
    }
  });
});
