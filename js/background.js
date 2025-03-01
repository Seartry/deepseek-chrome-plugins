/**
 * DeepSeek助手 - 后台服务
 * 用于处理API通信、存储对话记录等
 */

// 默认设置
const DEFAULT_SETTINGS = {
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2000,
  theme: 'auto',
  fontSize: 'medium',
  typingAnimation: true,
  streamOutput: true,
  markdownRender: true,
  codeHighlight: true,
  autoSave: true,
  exportFormat: 'md',
  exportPath: '',
  systemPrompt: '你是由DeepSeek开发的AI助手，你的目标是尽可能地帮助用户。'
};

// 在插件安装或更新时初始化设置
chrome.runtime.onInstalled.addListener(async () => {
  console.log('DeepSeek助手已安装');
  
  // 检查是否已有设置，如果没有则使用默认设置
  const storage = await chrome.storage.local.get('settings');
  if (!storage.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    console.log('已初始化默认设置');
  }
  
  // 确保存在conversations存储空间
  const conversationsStorage = await chrome.storage.local.get('conversations');
  if (!conversationsStorage.conversations) {
    await chrome.storage.local.set({ conversations: [] });
    console.log('已初始化对话存储');
  }
});

// 监听来自popup或options页面的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request.action);
  
  // 根据action类型处理不同请求
  switch (request.action) {
    case 'sendMessage':
      handleSendMessage(request, sendResponse);
      return true; // 保持消息通道开放
      
    case 'testApi':
      testApiConnection(request.apiKey).then(sendResponse);
      return true;
      
    case 'saveConversation':
      saveConversation(request.conversation).then(sendResponse);
      return true;
      
    case 'getConversations':
      getConversations().then(sendResponse);
      return true;
      
    case 'getSettings':
      getSettings().then(sendResponse);
      return true;
      
    case 'saveSettings':
      saveSettings(request.settings).then(sendResponse);
      return true;
      
    case 'clearConversations':
      clearConversations().then(sendResponse);
      return true;
      
    case 'exportConversation':
      exportConversation(request.conversation, request.format).then(sendResponse);
      return true;
      
    default:
      sendResponse({ success: false, error: '未知操作' });
      return false;
  }
});

/**
 * 处理发送消息请求
 * @param {Object} request - 请求对象
 * @param {Function} sendResponse - 响应回调
 */
async function handleSendMessage(request, sendResponse) {
  try {
    // 获取设置
    const { settings } = await chrome.storage.local.get('settings');
    if (!settings || !settings.apiKey) {
      sendResponse({ success: false, error: '请先设置API密钥' });
      return;
    }
    
    // 如果是流式输出
    if (settings.streamOutput) {
      // 告知前端我们将开始流式响应
      sendResponse({ success: true, streaming: true });
      
      // 发送并处理流式响应
      const response = await sendChatRequest(request.messages, request.files);
      await handleStreamResponse(response);
    } else {
      // 非流式输出，直接返回完整响应
      const response = await sendChatRequest(request.messages, request.files);
      const result = await response.json();
      
      if (result.error) {
        sendResponse({ success: false, error: result.error.message });
      } else {
        sendResponse({ success: true, data: result });
      }
    }
  } catch (error) {
    console.error('发送消息错误:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * 发送聊天请求到DeepSeek API
 * @param {Array} messages - 消息数组
 * @param {Array} files - 文件数组 (可选)
 * @returns {Promise<Response>} API响应
 */
async function sendChatRequest(messages, files = []) {
  try {
    const { settings } = await chrome.storage.local.get('settings');
    
    if (!settings || !settings.apiKey) {
      throw new Error('未设置API密钥');
    }
    
    // 准备API请求参数
    const payload = {
      model: settings.model,
      messages: messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: settings.streamOutput
    };
    
    // 如果有文件，添加到请求中
    if (files && files.length > 0) {
      payload.files = files;
    }
    
    // 调用DeepSeek API
    // 注意：这里使用模拟URL，实际应替换为DeepSeek的API端点
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API错误: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

/**
 * 处理流式响应
 * @param {Response} response - API响应
 */
async function handleStreamResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // 解码并处理数据块
      const chunk = decoder.decode(value, { stream: true });
      
      // 处理SSE格式的数据
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.choices && data.choices[0].delta.content) {
              const content = data.choices[0].delta.content;
              
              // 发送增量内容到popup页面
              chrome.runtime.sendMessage({
                action: 'streamResponse',
                content: content
              });
            }
          } catch (e) {
            console.error('解析流数据错误:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('读取流错误:', error);
    chrome.runtime.sendMessage({
      action: 'streamError',
      error: error.message
    });
  }
}

/**
 * 测试API连接
 * @param {string} apiKey - API密钥
 * @returns {Promise<Object>} 测试结果
 */
async function testApiConnection(apiKey) {
  try {
    // 简单的测试请求
    const response = await fetch('https://api.deepseek.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error?.message || `API错误: ${response.status}` };
    }
    
    return { success: true };
  } catch (error) {
    console.error('API测试错误:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 保存对话
 * @param {Object} conversation - 对话对象
 * @returns {Promise<Object>} 操作结果
 */
async function saveConversation(conversation) {
  try {
    if (!conversation || !conversation.id) {
      throw new Error('无效的对话数据');
    }

    // 获取现有对话列表
    const storage = await chrome.storage.local.get('conversations');
    let conversations = storage.conversations || [];
    
    // 查找是否存在相同ID的对话
    const index = conversations.findIndex(conv => conv.id === conversation.id);
    
    if (index !== -1) {
      // 更新现有对话
      conversations[index] = {
        ...conversations[index],
        ...conversation,
        updatedAt: Date.now()
      };
    } else {
      // 添加新对话
      conversations.unshift({
        ...conversation,
        createdAt: conversation.createdAt || Date.now(),
        updatedAt: Date.now()
      });
    }
    
    // 限制保存的对话数量（例如最多保存50条）
    if (conversations.length > 50) {
      conversations = conversations.slice(0, 50);
    }
    
    // 保存更新后的对话列表
    await chrome.storage.local.set({ conversations });
    
    return { success: true };
  } catch (error) {
    console.error('保存对话错误:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 获取所有对话
 * @returns {Promise<Object>} 对话列表
 */
async function getConversations() {
  try {
    const storage = await chrome.storage.local.get('conversations');
    const conversations = storage.conversations || [];
    
    // 按更新时间排序
    conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    
    return { success: true, data: conversations };
  } catch (error) {
    console.error('获取对话错误:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 获取设置
 * @returns {Promise<Object>} 设置对象
 */
async function getSettings() {
  try {
    const { settings } = await chrome.storage.local.get('settings');
    return { success: true, data: settings || DEFAULT_SETTINGS };
  } catch (error) {
    console.error('获取设置错误:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 保存设置
 * @param {Object} newSettings - 新设置
 * @returns {Promise<Object>} 操作结果
 */
async function saveSettings(newSettings) {
  try {
    await chrome.storage.local.set({ settings: newSettings });
    return { success: true };
  } catch (error) {
    console.error('保存设置错误:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 清除所有对话
 * @returns {Promise<Object>} 操作结果
 */
async function clearConversations() {
  try {
    await chrome.storage.local.set({ conversations: [] });
    return { success: true };
  } catch (error) {
    console.error('清除对话错误:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 导出对话
 * @param {Object} conversation - 对话对象
 * @param {string} format - 导出格式
 * @returns {Promise<Object>} 导出数据
 */
async function exportConversation(conversation, format) {
  try {
    if (!conversation) {
      throw new Error('未指定要导出的对话');
    }
    
    let content = '';
    const fileName = formatFileName(conversation.title) + '.' + format;
    const mimeType = getMimeType(format);
    
    if (format === 'md') {
      // Markdown格式
      content = `# ${conversation.title}\n\n`;
      content += `创建时间: ${new Date(conversation.createdAt).toLocaleString()}\n\n`;
      
      conversation.messages.forEach(message => {
        if (message.role === 'user') {
          content += `## 用户\n\n${message.content}\n\n`;
        } else if (message.role === 'assistant') {
          content += `## DeepSeek\n\n${message.content}\n\n`;
        }
      });
    } else {
      // 纯文本格式
      content = `${conversation.title}\n`;
      content += `创建时间: ${new Date(conversation.createdAt).toLocaleString()}\n\n`;
      
      conversation.messages.forEach(message => {
        if (message.role === 'user') {
          content += `用户: ${message.content}\n\n`;
        } else if (message.role === 'assistant') {
          content += `DeepSeek: ${message.content}\n\n`;
        }
      });
    }
    
    return {
      success: true,
      data: {
        content,
        fileName,
        mimeType
      }
    };
  } catch (error) {
    console.error('导出对话错误:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 查找最后一条用户消息的索引
 * @param {Array} messages - 消息数组
 * @returns {number} 最后一条用户消息的索引
 */
function findLastUserMessageIndex(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return i;
    }
  }
  return -1;
}

/**
 * 格式化文件名
 * @param {string} name - 原始名称
 * @returns {string} 格式化后的文件名
 */
function formatFileName(name) {
  // 替换不合法的文件名字符
  return name
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 50); // 限制长度
}

/**
 * 获取MIME类型
 * @param {string} format - 文件格式
 * @returns {string} MIME类型
 */
function getMimeType(format) {
  const mimeTypes = {
    'md': 'text/markdown',
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'json': 'application/json'
  };
  
  return mimeTypes[format] || 'text/plain';
} 