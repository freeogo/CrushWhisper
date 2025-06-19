// background.js

// *************************************************************************************
// !! IMPORTANT API KEY WARNING !!
// You MUST replace "YOUR_API_KEY_HERE" with your actual Zhipuai API key.
// Without a valid API key, the extension will not be able to analyze screenshots.
// Securely manage your API key. Do not commit it to public repositories.
// *************************************************************************************
const ZHIPUAI_API_KEY = "YOUR_API_KEY_HERE"; // TODO: Manage this securely
const ZHIPUAI_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeScreenshot",
    title: "Analyze WeChat Screenshot",
    contexts: ["page"]
  });
  console.log("MindMate extension installed/updated.");
});

// Function to call Zhipuai API
async function analyzeImageWithZhipuAI(base64ImageData) {
  if (ZHIPUAI_API_KEY === "YOUR_API_KEY_HERE") {
    console.error("API Key not configured.");
    return { error: "API Key not configured in the extension. Please contact the developer to set it in background.js." };
  }

  const prompt = `
# 角色(Role)

你是一位名为“MindMate” 的顶尖恋爱专家与沟通策略师。你拥有深厚的心理学知识、高超的情商和丰富的两性沟通经验。你的特长是能够仅通过一张微信聊天截图，快速洞悉对话双方的情绪状态、潜在意图和关系动态。你不只是一个提供“标准答案”的机器人，你是一个充满共情能力、有策略、有温度的伙伴。

# 核心任务(Core Task)

当用户上传一张微信聊天截图时，你的任务是：

设身处地(Embody)：完全代入用户（截图中的通常是信息接收方或最后发言方）的角色。

深度分析(Analyze)：解析当前的聊天氛围、双方的关系阶段、以及对方最新信息的意图。

策略性回复(Strategize & Reply)：提供2-3 个不同风格且高质量的回复选项，并详细解释每个选项背后的设计思路、目的和可能的后续效果。

赋能用户(Empower)：给出后续的沟通建议，帮助用户掌握主动权，并建立长期健康的沟通模式。

# 工作流程(Workflow)

当你收到一张截图后，必须遵循以下思考和输出流程：

第一步：情景解析(Context Analysis)

识别角色: 快速判断截图中的哪一方是用户（通常是右边气泡的一方），对方通常是左边气泡。

分析对话历史: 阅读截图中的上下文，理解这次对话的起因和发展。

解读对方信息: 对方最后一条信息是问题、陈述、玩笑、测试（废物测试），还是分享？字里行间的情绪是积极、消极还是中性？

判断关系阶段: 根据对话内容，推断双方目前可能处于哪个阶段（初识、暧昧、约会后、稳定期、矛盾期等）。

第二步：明确核心目标(Define Objective)

基于你的分析，明确当前回复最应该达成的核心目标。例如：是“打破尴尬，升级关系”？是“展示高价值，建立吸引”？是“化解矛盾，表达安抚”？是“幽默调侃，拉近距离”？还是“设置悬念，引导对方投入”？

第三步：生成多元化回复方案(Generate Diverse Reply Options)

提供选项: 至少提供2-3 个不同策略的回复选项。

风格化命名: 为每个选项起一个清晰的风格标签，例如：“幽默调侃型”、“真诚推进型”、“高价值挑战型”等。

解释思路: 在每个选项下方，用「设计思路」来解释为什么这么回、它能达到什么效果、以及它适用于什么样的用户性格。这是你作为“专家”的核心价值所在。

第四步：提供后续指导(Provide Follow-up Guidance)

在所有回复选项之后，给出一个「后续建议」部分。

内容可以包括：发送回复后的注意事项、如何根据对方的反应进行下一步操作、或者对这段关系的整体建议。

# 输出格式(Output Format)

请严格按照以下Markdown 格式进行输出，以确保用户能清晰地理解你的建议：

Markdown

### 【情景分析】
> 在这里简明扼要地分析当前的聊天局面、对方意图和关系阶段。语言要一针见血，让用户感觉“你很懂我”。
### 【核心目标】
> 基于分析，明确指出本次回复最应该达成的战略目标。

---
### 【回复选项】
#### 选项一：(例如：幽默调侃型)
> 回复内容： “在这里写下具体回复的话术。”
> 设计思路：
> * 解释这条回复的心理学原理或沟通技巧。
> * 它如何展现用户的某种特质（如：幽默感、自信、高情商）。
> * 它可能会引导对话走向何方。
> * 适合的用户：(例如：性格外向、希望关系轻松愉快的用户)。

#### 选项二：(例如：真诚推进型)
> 回复内容： “在这里写下具体回复的话术。”
> 设计思路：
> * 解释这条回复的心理学原理或沟通技巧。
> * 它如何展现用户的某种特质（如：真诚、稳重、善解人意）。
> * 它如何推动关系进入下一阶段。
> * 适合的用户：(例如：追求稳定关系、不喜套路的用户)。

#### (可有) 选项三：(例如：高价值挑战型)
> 回复内容： “在这里写下具体回复的话术。”
> 设计思路：
> * 解释这条回复的心理学原理或沟通技巧。
> * 它如何建立框架、展示高价值或进行轻度“推拉”。
> * 它如何激发对方的探索欲和征服欲。
> * 适合的用户：(例如：希望掌握关系主动权、自身价值较高的用户)。

---
### 【后续建议与提醒】
* 在这里给出发送回复后的整体建议。
* 提醒用户，文字只是工具，真实的情感和态度更重要。
* 鼓励用户选择最符合自己真实性格的回复，不要为了“套路”而丢失自我。

# 核心原则(Core Principles)

共情为先: 永远站在用户的角度，理解他们的感受。

授人以渔: 你的最终目标是提升用户的沟通能力，而不仅仅是帮他们解决这一次的困境。

保持边界: 明确你的建议是基于有限的截图信息，提醒用户结合实际情况灵活应用。 指导用户如何回复
`;

  const payload = {
    model: "glm-4v", // Assuming glm-4v is the correct model for image analysis
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: {
              url: base64ImageData, // Directly use base64 data URI
            },
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(ZHIPUAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer ${ZHIPUAI_API_KEY}\`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorDetail = await response.text();
      try {
        const jsonError = JSON.parse(errorDetail);
        errorDetail = jsonError.error?.message || jsonError.error?.code || jsonError.error || JSON.stringify(jsonError);
      } catch (e) { /* Not JSON, use as text */ }
      console.error("ZhipuAI API Error:", response.status, errorDetail);
      return { error: \`API request failed (${response.status}): ${errorDetail}\` };
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return { analysisResult: data.choices[0].message.content };
    } else {
      console.error("Unexpected API response structure:", data);
      return { error: "Unexpected API response structure from ZhipuAI." };
    }
  } catch (error) {
    console.error("Error calling ZhipuAI API:", error);
    return { error: \`Network or other error calling API: ${error.message}\` };
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzeScreenshot" && tab && tab.id) {
    // Sequence of operations:
    // 1. Clear any previous analysis data from storage.
    // 2. Set an 'isLoading' flag in storage to notify the popup.
    // 3. Inject html2canvas and then the content script into the active tab.
    // 4. Send a message to the content script to capture the screenshot.
    // 5. Receive the imageData or an error from the content script.
    // 6. Store the imageData (for debugging or potential future use).
    // 7. Call the ZhipuAI API with the imageData.
    // 8. Store the API's analysisResult or an error in storage.
    // 9. Ensure 'isLoading' flag is cleared in storage, regardless of success or failure.
    chrome.storage.local.set({ analysisResult: null, error: null, screenshotData: null }, async () => {
      console.log("Previous results cleared. Starting new analysis.");

      try {
        await chrome.storage.local.set({ isLoading: true });

        const injectionResults = await new Promise((resolve, reject) => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["lib/html2canvas.min.js", "content.js"]
          }, (results) => {
            if (chrome.runtime.lastError) {
              return reject(chrome.runtime.lastError);
            }
            resolve(results);
          });
        });

        if (!injectionResults || injectionResults.length === 0) {
          throw new Error("Injection of scripts did not return results. Page might be protected or a chrome:// page.");
        }

        const messageResponse = await new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tab.id, { action: "captureScreenshot" }, (response) => {
                if (chrome.runtime.lastError) {
                    return reject(new Error("Msg to content script: " + chrome.runtime.lastError.message));
                }
                if (response && response.error) {
                    return reject(new Error("Content script error: " + response.error));
                }
                if (response && response.imageData) {
                    resolve(response);
                } else {
                    reject(new Error("No image data from content script. The page might be restricted (e.g. chrome://) or the content script failed."));
                }
            });
        });

        console.log("Received imageData from content script (first 100 chars):", messageResponse.imageData.substring(0,100));
        await chrome.storage.local.set({ screenshotData: messageResponse.imageData });

        const analysis = await analyzeImageWithZhipuAI(messageResponse.imageData);

        if (analysis.error) {
          console.error("API Analysis Error:", analysis.error);
          await chrome.storage.local.set({ error: analysis.error });
        } else {
          console.log("API Analysis Success:", analysis.analysisResult);
          await chrome.storage.local.set({ analysisResult: analysis.analysisResult });
        }

      } catch (error) {
        console.error("Error in context menu click handler:", error);
        await chrome.storage.local.set({ error: error.message });
      } finally {
        await chrome.storage.local.set({ isLoading: false });
        console.log("isLoading set to false");
      }
    });
  }
});

// Combined message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getApiKey") {
    // In a real extension, you might fetch this from chrome.storage.sync if set by an options page
    sendResponse({ apiKey: ZHIPUAI_API_KEY });
    return true; // Keep message channel open for async response
  } else if (request.action === "getApiKeyStatus") {
    sendResponse({ apiKeySet: ZHIPUAI_API_KEY !== "YOUR_API_KEY_HERE" });
    return true; // Keep message channel open for async response
  }
  // Handle other messages or return false if not handling this message
  return false;
});
