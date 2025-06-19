// Ensure this script knows it's being injected after html2canvas.min.js
console.log("Content script injected. html2canvas should be available.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureScreenshot") {
    console.log("Content script received captureScreenshot message.");
    if (typeof html2canvas === "function") {
      // Optional: Add a small delay to ensure the page has rendered any recent changes,
      // especially if the context menu click itself triggered some UI update (unlikely but possible).
      // This also helps with pages that might be dynamically loading content.
      setTimeout(() => {
        html2canvas(document.body, {
          useCORS: true, // Important for capturing images from other origins if any
          logging: false, // Disable html2canvas logging in production
          scrollY: -window.scrollY, // Capture the whole scrollable page
          allowTaint: true // Helps with cross-origin images, used with useCORS
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
      }, 100); // 100ms delay
    } else {
      console.error("html2canvas is not defined. Make sure it's loaded before this script.");
      sendResponse({ error: "html2canvas library not loaded." });
    }
    return true; // Indicates that the response will be sent asynchronously.
  }
});
