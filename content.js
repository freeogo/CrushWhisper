// Ensure this script knows it's being injected after html2canvas.min.js
// 确保此脚本知道它是在 html2canvas.min.js之后注入的。
console.log("Content script injected. html2canvas should be available.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureScreenshot") {
    console.log("Content script received captureScreenshot message.");
    if (typeof html2canvas === "function") {
      // Optional: Add a small delay to ensure the page has rendered any recent changes,
      // especially if the context menu click itself triggered some UI update (unlikely but possible).
      // This also helps with pages that might be dynamically loading content.
      // 可选：添加少量延迟以确保页面已呈现任何最近的更改，
      // 特别是如果上下文菜单点击本身触发了某些UI更新（可能性不大但存在）。
      // 这也有助于处理可能动态加载内容的页面。
      setTimeout(() => {
        html2canvas(document.body, {
          useCORS: true, // Important for capturing images from other origins if any // 对于从其他来源捕获图像很重要（如有）
          logging: false, // Disable html2canvas logging in production // 在生产环境中禁用html2canvas日志记录
          scrollY: -window.scrollY, // Capture the whole scrollable page // 捕获整个可滚动页面
          allowTaint: true // Helps with cross-origin images, used with useCORS // 有助于处理跨源图像，与useCORS一起使用
        }).then(canvas => {
          try {
            const imageData = canvas.toDataURL('image/png');
            console.log("Screenshot captured by html2canvas. Size:", imageData.length);
            sendResponse({ imageData: imageData });
          } catch (e) {
            console.error("Error converting canvas to data URL:", e);
            sendResponse({ error: "Failed to convert canvas to data URL: " + e.message });
          }
        }).catch(err => {
          console.error("Error using html2canvas:", err);
          sendResponse({ error: "Failed to capture screenshot using html2canvas: " + err.message });
        });
      }, 100); // 100ms delay // 100毫秒延迟
    } else {
      console.error("html2canvas is not defined. Make sure it's loaded before this script.");
      sendResponse({ error: "html2canvas library not loaded." });
    }
    return true; // Indicates that the response will be sent asynchronously. // 表示响应将异步发送。
  }
});
