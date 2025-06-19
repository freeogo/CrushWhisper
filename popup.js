// popup.js

// API密钥直接存储在popup.js中
const ZHIPUAI_API_KEY = "91c3a3b6e7a14bcca20f4a131fbba2d6.i8VHgAmSWKMd3vwG"; // 用户提供的密钥
const ZHIPUAI_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const ZHIPUAI_MODEL = "glm-4v-flash"; // 用户指定的模型

document.addEventListener('DOMContentLoaded', function () {
    const pasteArea = document.getElementById('pasteArea');
    const imagePreview = document.getElementById('imagePreview');
    const pastePlaceholder = document.getElementById('pastePlaceholder');
    const loadingDiv = document.getElementById('loading');
    const resultsContainer = document.getElementById('resultsContainer');

    if (!pasteArea || !imagePreview || !pastePlaceholder || !loadingDiv || !resultsContainer) {
        console.error("UI elements not found. Check popup.html IDs.");
        if(loadingDiv) loadingDiv.textContent = '错误：UI元素初始化失败。';
        if(loadingDiv) loadingDiv.style.display = 'block';
        return;
    }

    // Set initial state
    loadingDiv.style.display = 'none';
    resultsContainer.style.display = 'none';
    imagePreview.style.display = 'none';
    pastePlaceholder.style.display = 'flex'; // Assuming placeholder is a flex container for icon and text

    pasteArea.addEventListener('click', () => {
        // Encourage pasting, perhaps try to read from clipboard if permission allows (usually not directly for images on click)
        // For now, click just serves to focus or as a hint. Main action is 'paste'.
        // You could also trigger a file input if you wanted to offer "click to upload"
        // navigator.clipboard.read().then(items => ...); // Requires specific permissions and user interaction context
        pastePlaceholder.textContent = '请按 Ctrl+V 或右键选择“粘贴”来贴入图片。';
    });

    pasteArea.addEventListener('paste', async function (event) {
        event.preventDefault(); // 阻止默认的粘贴行为 (比如粘贴文本到div)
        loadingDiv.textContent = '正在处理粘贴的图片...';
        loadingDiv.style.display = 'block';
        resultsContainer.style.display = 'none';
        imagePreview.style.display = 'none';
        pastePlaceholder.style.display = 'flex'; // Reset placeholder visibility

        const items = (event.clipboardData || event.originalEvent.clipboardData)?.items;
        let imageFile = null;

        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    imageFile = items[i].getAsFile();
                    break;
                }
            }
        }

        if (imageFile) {
            try {
                const base64ImageData = await convertFileToBase64(imageFile);

                imagePreview.src = base64ImageData;
                imagePreview.style.display = 'block';
                pastePlaceholder.style.display = 'none'; // Hide placeholder text
                loadingDiv.textContent = '图片已粘贴，正在调用AI分析...';

                const analysisResult = await analyzeImageWithZhipuAI(base64ImageData);

                if (analysisResult.error) {
                    throw new Error("AI分析错误: " + analysisResult.error);
                }
                renderSuccess(analysisResult.analysisResult);

            } catch (error) {
                console.error("处理粘贴图片或分析时出错:", error);
                renderError(error.message);
                imagePreview.style.display = 'none'; // Hide preview on error
                pastePlaceholder.style.display = 'flex';
            }
        } else {
            renderError('未能从剪贴板获取图片。请确保您粘贴的是图片。');
        }
    });

    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result); // reader.result contains the base64 string
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file); // Reads the file as a data URL (base64)
        });
    }

    async function analyzeImageWithZhipuAI(base64ImageData) {
        // (The ZHIPUAI_API_KEY and ZHIPUAI_API_URL are defined at the top of the script)
        // (ZHIPUAI_MODEL is also defined at the top)

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
\`;

        const payload = {
            model: ZHIPUAI_MODEL, // Use the model defined at the top
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: base64ImageData } },
                    ],
                },
            ],
        };

        try {
            const apiResponse = await fetch(ZHIPUAI_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": \`Bearer ${ZHIPUAI_API_KEY}\`,
                },
                body: JSON.stringify(payload),
            });

            if (!apiResponse.ok) {
                let errorDetail = await apiResponse.text();
                try {
                    const jsonError = JSON.parse(errorDetail);
                    errorDetail = jsonError.error?.message || jsonError.error?.code || jsonError.error || JSON.stringify(jsonError);
                } catch (e) { /* 不是JSON，则按文本使用 */ }
                return { error: \`API请求失败 (${apiResponse.status}): ${errorDetail}\` };
            }

            const data = await apiResponse.json();
            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                return { analysisResult: data.choices[0].message.content };
            } else {
                console.error("来自智谱AI的API响应结构意外:", data);
                return { error: "来自智谱AI的API响应结构意外。" };
            }
        } catch (error) {
            console.error("调用智谱AI API时出错:", error);
            return { error: \`调用API时发生网络或其他错误: ${error.message}\` };
        }
    }

    function renderError(errorMessage) {
        loadingDiv.style.display = 'none';
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = \`<p style="color: red; font-weight: bold;">发生错误:</p><p style="color: red; white-space: pre-wrap;">${errorMessage}</p>\`;
        imagePreview.style.display = 'none'; // Hide preview on error
        pastePlaceholder.style.display = 'flex'; // Show placeholder again
    }

    function renderSuccess(markdownResult) {
        loadingDiv.style.display = 'none';
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = parseMarkdownToHtml(markdownResult);
        // Keep image preview visible with results
    }

    function parseMarkdownToHtml(markdown) {
        // This function attempts to parse the specific Markdown structure from ZhipuAI
        if (!markdown) return "<p>未收到分析结果。</p>";
        let html = markdown;

        // ### 【(.*?)】 -> <h3>$1</h3>
        html = html.replace(/###\s*【(.*?)】/g, '<h3>$1</h3>');

        // Process sections like "回复选项" which contain multiple sub-options
        // This regex tries to capture each option block
        html = html.replace(/(####\s*(选项(?:一|二|三|四|五|六|七|八|九|十)|[^\n]*?)：?\s*[\s\S]*?)(?=\n####|\n### 【后续建议与提醒】|\n---|$)/g, (optionBlock) => {
            let optionHtml = '<div class="option">';

            // #### 选项标题
            const titleMatch = optionBlock.match(/####\s*(选项(?:一|二|三|四|五|六|七|八|九|十)|[^\n]*?)：?/);
            if (titleMatch && titleMatch[1]) {
                optionHtml += \`<h4>${titleMatch[1].trim()}</h4>\`;
            }

            // > 回复内容：“...”
            const replyMatch = optionBlock.match(/>\s*回复内容：\s*“([\s\S]*?)”/);
            if (replyMatch && replyMatch[1]) {
                optionHtml += \`<p><strong>回复内容：</strong>“${replyMatch[1].trim()}”</p>\`;
            }

            // 设计思路：
            // * item 1
            // * item 2
            const designMatch = optionBlock.match(/设计思路：\s*([\s\S]*?)(?=\n####|\n###|\n---|\n>\s*适合的用户：|$)/);
            if (designMatch && designMatch[1]) {
                const listItems = designMatch[1].trim().split('\n')
                    .map(item => item.replace(/^\s*\*\s*/, '').trim())
                    .filter(item => item)
                    .map(item => \`<li>${item}</li>\`).join('');
                if (listItems) {
                    optionHtml += \`<strong>设计思路：</strong><ul>${listItems}</ul>\`;
                }
            }

            // > 适合的用户：...
            const suitableUserMatch = optionBlock.match(/>\s*适合的用户：([\s\S]*?)(?=\n####|\n###|\n---|$)/);
            if (suitableUserMatch && suitableUserMatch[1]) {
                optionHtml += \`<p><strong>适合的用户：</strong>${suitableUserMatch[1].trim()}</p>\`;
            }

            optionHtml += '</div>';
            return optionHtml;
        });

        // --- to <hr> (if any are outside options and not handled)
        html = html.replace(/^---$\n?/gm, '<hr class="separator">');


        // ### 【后续建议与提醒】
        // * item 1
        // * item 2
        // This needs to be handled carefully if it's outside the option blocks
        html = html.replace(/(<h3>后续建议与提醒<\/h3>)([\s\S]*?)(?=<div class="option">|<hr class="separator">|$)/g, (match, header, content) => {
            const listItems = content.trim().split('\n')
                .map(item => item.replace(/^\s*\*\s*/, '').trim())
                .filter(item => item)
                .map(item => \`<li>${item}</li>\`).join('');
            return header + \`<ul>${listItems}</ul>\`;
        });

        // > (Blockquotes for情景分析, 核心目标)
        html = html.replace(/^>\s*(.*)/gm, '<p class="quote"><em>$1</em></p>');


        // Clean up any remaining --- that might be part of an unexpected structure
        html = html.replace(/---/g, '<hr class="separator-fallback">');


        return html;
    }

});
