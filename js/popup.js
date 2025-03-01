/**
 * DeepSeek助手 - 弹出窗口交互脚本
 */

// 全局变量
let elements = {};
let currentConversation = null;
let settings = null;
let conversations = [];
let selectedFiles = [];
let isTyping = false;
let markedInstance = null;

/**
 * 简单的 Markdown 解析器
 */
const SimpleMarkdown = {
  parse: function(text) {
    if (!text) return '';
    
    return text
      // 代码块
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // 行内代码
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // 标题
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // 粗体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // 列表
      .replace(/^\s*-\s(.+)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // 引用
      .replace(/^\> (.+)/gm, '<blockquote>$1</blockquote>')
      // 换行
      .replace(/\n/g, '<br>');
  }
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化DOM元素引用
  initializeElements();
  
  // 设置 Markdown 解析器
  markedInstance = SimpleMarkdown;
  
  // 加载设置
  await loadSettings();
  
  // 加载对话历史记录
  await loadConversations();
  
  // 创建新对话或加载最近的对话
  if (conversations.length > 0) {
    loadConversation(conversations[0].id);
  } else {
    createNewConversation();
  }
  
  // 设置UI事件监听器
  setupEventListeners();
  
  // 应用主题设置
  applyTheme();
});

/**
 * 初始化DOM元素引用
 */
function initializeElements() {
  // 首先确保工具栏存在
  let toolbar = document.querySelector('.toolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    document.querySelector('.chat-container')?.prepend(toolbar);
  }

  // 创建历史按钮
  const historyBtn = document.createElement('button');
  historyBtn.className = 'toolbar-button history-button';
  historyBtn.title = '历史会话';
  historyBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="4" y1="8" x2="20" y2="8"></line>
      <line x1="4" y1="12" x2="20" y2="12"></line>
      <line x1="4" y1="16" x2="20" y2="16"></line>
    </svg>
  `;

  // 获取新会话按钮
  const newChatBtn = document.getElementById('newChatBtn');
  if (newChatBtn && newChatBtn.parentNode) {
    // 将历史按钮插入到新会话按钮前面
    newChatBtn.parentNode.insertBefore(historyBtn, newChatBtn);
  } else {
    // 如果找不到新会话按钮，就添加到工具栏开头
    toolbar.insertBefore(historyBtn, toolbar.firstChild);
  }

  elements = {
    historyList: document.getElementById('historyList'),
    chatMessages: document.getElementById('chatMessages'),
    userInput: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    fileInput: document.getElementById('fileInput'),
    filePreview: document.getElementById('filePreview'),
    historyBtn: historyBtn,
    newChatBtn: document.getElementById('newChatBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    minimizeBtn: document.getElementById('minimizeBtn')
  };

  // 添加工具栏样式
  const toolbarStyles = document.createElement('style');
  toolbarStyles.textContent = `
    .toolbar {
      display: flex;
      align-items: center;
      padding: 8px;
      gap: 8px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-color);
    }

    .toolbar-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 6px;
      border: none;
      background: none;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-color);
      transition: all 0.2s ease;
    }

    .toolbar-button:hover {
      background-color: var(--hover-color);
    }

    .toolbar-button svg {
      width: 20px;
      height: 20px;
    }

    .history-button {
      margin-right: 4px;
    }
  `;
  document.head.appendChild(toolbarStyles);
  
  // 检查必要元素是否存在
  for (const [key, element] of Object.entries(elements)) {
    if (!element) {
      console.error(`元素未找到: ${key}`);
    }
  }
}

/**
 * 加载用户设置
 */
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getSettings'
    });
    
    if (response.success) {
      settings = response.data;
    } else {
      console.error('加载设置失败:', response.error);
      showToast('加载设置失败，使用默认设置', 'error');
    }
  } catch (error) {
    console.error('加载设置错误:', error);
    showToast('加载设置出错，使用默认设置', 'error');
  }
}

/**
 * 加载对话历史记录
 */
async function loadConversations() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getConversations'
    });
    
    if (response.success) {
      conversations = response.data;
      renderConversationHistory();
    } else {
      console.error('加载对话历史失败:', response.error);
      showToast('加载对话历史失败', 'error');
    }
  } catch (error) {
    console.error('加载对话历史错误:', error);
    showToast('加载对话历史出错', 'error');
  }
}

/**
 * 创建新对话
 */
function createNewConversation() {
  const timestamp = Date.now();
  currentConversation = {
    id: `conv-${timestamp}`,
    title: '新对话',
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: []
  };
  
  // 添加到对话列表
  conversations.unshift(currentConversation);
  
  // 更新UI
  renderConversationHistory();
  renderConversation();
  
  // 保存新对话
  saveCurrentConversation();
}

/**
 * 加载特定对话
 * @param {string} conversationId - 对话ID
 */
function loadConversation(conversationId) {
  const conversation = conversations.find(conv => conv.id === conversationId);
  if (!conversation) return;
  
  currentConversation = conversation;
  renderConversation();
  
  // 更新历史列表选中状态
  const historyItems = elements.historyList.querySelectorAll('.history-item');
  historyItems.forEach(item => {
    if (item.dataset.id === conversationId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

/**
 * 渲染对话历史列表
 */
function renderConversationHistory() {
  elements.historyList.innerHTML = '';
  
  conversations.forEach(conversation => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.dataset.id = conversation.id;
    if (currentConversation && conversation.id === currentConversation.id) {
      historyItem.classList.add('active');
    }
    
    historyItem.textContent = conversation.title;
    historyItem.addEventListener('click', () => loadConversation(conversation.id));
    
    elements.historyList.appendChild(historyItem);
  });
}

/**
 * 渲染当前对话内容
 */
function renderConversation() {
  elements.chatMessages.innerHTML = '';
  
  if (currentConversation.messages.length === 0) {
    // 显示欢迎信息
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'welcome-message';
    welcomeMessage.innerHTML = `
      <h2>欢迎使用 DeepSeek 对话助手</h2>
      <p>请在下方输入框中提问，或上传文件进行对话</p>
    `;
    elements.chatMessages.appendChild(welcomeMessage);
    return;
  }
  
  // 渲染对话消息
  currentConversation.messages.forEach(message => {
    const messageEl = createMessageElement(message);
    elements.chatMessages.appendChild(messageEl);
  });
  
  // 滚动到底部
  scrollToBottom();
}

/**
 * 创建消息元素
 * @param {Object} message - 消息对象
 * @returns {HTMLElement} 消息元素
 */
function createMessageElement(message) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${message.role}`;
  
  // 消息内容
  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  
  // 根据角色和设置决定是否渲染Markdown
  if (message.role === 'assistant' && settings?.markdownRender !== false) {
    try {
      contentEl.innerHTML = SimpleMarkdown.parse(message.content);
      // 代码高亮
      contentEl.querySelectorAll('pre code').forEach((block) => {
        block.classList.add('code-block');
      });
    } catch (error) {
      console.error('Markdown 渲染失败:', error);
      contentEl.textContent = message.content;
    }
  } else {
    contentEl.textContent = message.content;
  }
  
  messageEl.appendChild(contentEl);
  
  // 创建底部信息栏（复制按钮和时间）
  const footerEl = document.createElement('div');
  footerEl.className = 'message-footer';
  
  // 复制按钮
  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-button';
  copyBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z"/>
      <path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/>
    </svg>
    复制
  `;
  
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        已复制
      `;
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z"/>
            <path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/>
          </svg>
          复制
        `;
      }, 2000);
    } catch (error) {
      console.error('复制失败:', error);
      showToast('复制失败', 'error');
    }
  });
  
  // 时间戳
  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  const messageTime = message.timestamp ? new Date(message.timestamp) : new Date();
  timeEl.textContent = messageTime.toLocaleTimeString();
  
  // 添加到底部信息栏
  footerEl.appendChild(copyBtn);
  footerEl.appendChild(timeEl);
  messageEl.appendChild(footerEl);
  
  return messageEl;
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 发送消息
  elements.sendBtn.addEventListener('click', sendMessage);
  elements.userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // 自动调整文本输入框高度
  elements.userInput.addEventListener('input', () => {
    elements.userInput.style.height = 'auto';
    elements.userInput.style.height = `${Math.min(elements.userInput.scrollHeight, 200)}px`;
  });
  
  // 文件上传
  elements.fileInput.addEventListener('change', handleFileUpload);
  
  // 新建对话
  elements.newChatBtn.addEventListener('click', createNewConversation);
  
  // 打开设置页面
  if (elements.settingsBtn) {
    elements.settingsBtn.addEventListener('click', () => {
      openSettingsPage();
      // 可选：关闭弹出窗口
      window.close();
    });
  }
  
  // 最小化
  elements.minimizeBtn.addEventListener('click', () => window.close());
  
  // 监听来自background的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'streamResponse') {
      handleStreamResponse(request.content);
    }
    sendResponse({ received: true });
  });

  // 历史会话按钮点击事件
  if (elements.historyBtn) {
    elements.historyBtn.addEventListener('click', toggleHistoryPanel);
  }
}

/**
 * 发送消息
 */
async function sendMessage() {
  const userInput = elements.userInput.value.trim();
  
  // 检查是否有输入内容或文件
  if (!userInput && selectedFiles.length === 0) return;
  
  // 禁用输入区域
  toggleInputState(false);
  
  // 创建用户消息
  const userMessage = {
    role: 'user',
    content: userInput,
    timestamp: Date.now()
  };
  
  // 添加到当前对话
  currentConversation.messages.push(userMessage);
  
  // 更新对话标题（如果是第一条消息）
  if (currentConversation.messages.length === 1) {
    currentConversation.title = userInput.length > 30 
      ? userInput.substring(0, 30) + '...' 
      : userInput;
    renderConversationHistory();
  }
  
  // 更新UI
  renderConversation();
  
  // 清空输入框
  elements.userInput.value = '';
  elements.userInput.style.height = 'auto';
  
  // 准备发送文件
  const filesToSend = [...selectedFiles];
  selectedFiles = [];
  elements.filePreview.innerHTML = '';
  
  // 添加加载状态
  const loadingMessage = createLoadingMessage();
  elements.chatMessages.appendChild(loadingMessage);
  scrollToBottom();
  
  try {
    // 准备消息
    const messages = currentConversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 如果有系统提示，添加到消息开头
    if (settings?.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: settings.systemPrompt
      });
    }
    
    // 发送消息到background
    const response = await chrome.runtime.sendMessage({
      action: 'sendMessage',
      messages: messages,
      files: filesToSend
    });
    
    // 移除加载状态
    if (elements.chatMessages.contains(loadingMessage)) {
      elements.chatMessages.removeChild(loadingMessage);
    }
    
    if (response.success) {
      if (!response.streaming) {
        // 非流式响应，添加完整回复
        const assistantMessage = {
          role: 'assistant',
          content: response.data?.choices?.[0]?.message?.content || '无响应内容',
          timestamp: Date.now()
        };
        
        currentConversation.messages.push(assistantMessage);
        renderConversation();
      }
      // 如果是流式响应，内容会通过handleStreamResponse逐步添加
      
      // 更新对话时间
      currentConversation.updatedAt = Date.now();
      
      // 保存对话
      if (settings?.autoSave) {
        saveCurrentConversation();
      }
    } else {
      throw new Error(response.error || '发送消息失败');
    }
  } catch (error) {
    console.error('消息处理错误:', error);
    showToast(error.message || '消息处理出错', 'error');
    
    // 移除加载状态
    if (elements.chatMessages.contains(loadingMessage)) {
      elements.chatMessages.removeChild(loadingMessage);
    }
    
    // 显示错误消息
    const errorMessage = {
      role: 'assistant',
      content: `错误: ${error.message || '未知错误'}`,
      timestamp: Date.now(),
      isError: true
    };
    
    currentConversation.messages.push(errorMessage);
    renderConversation();
  } finally {
    // 恢复输入区域
    toggleInputState(true);
  }
}

/**
 * 处理流式响应
 * @param {string} content - 响应内容增量
 */
function handleStreamResponse(content) {
  if (!content) return;

  // 查找或创建当前正在输出的消息元素
  let typingMessageEl = document.querySelector('.message.assistant.typing');
  
  if (!typingMessageEl) {
    // 创建新的消息元素
    typingMessageEl = document.createElement('div');
    typingMessageEl.className = 'message assistant typing';
    
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content typing-animation';
    
    // 创建底部信息栏
    const footerEl = document.createElement('div');
    footerEl.className = 'message-footer';
    
    // 添加时间戳
    const timeEl = document.createElement('div');
    timeEl.className = 'message-time';
    timeEl.textContent = new Date().toLocaleTimeString();
    footerEl.appendChild(timeEl);
    
    typingMessageEl.appendChild(contentEl);
    typingMessageEl.appendChild(footerEl);
    elements.chatMessages.appendChild(typingMessageEl);
    
    // 添加新的助手消息到对话记录
    currentConversation.messages.push({
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    });
  }
  
  // 更新消息内容
  const contentEl = typingMessageEl.querySelector('.message-content');
  const lastMessage = currentConversation.messages[currentConversation.messages.length - 1];
  
  if (contentEl && lastMessage && lastMessage.role === 'assistant') {
    // 更新消息内容
    lastMessage.content += content;
    
    // 使用 Markdown 渲染器实时渲染内容
    if (settings?.markdownRender !== false) {
      try {
        contentEl.innerHTML = SimpleMarkdown.parse(lastMessage.content);
        // 为代码块添加样式
        contentEl.querySelectorAll('pre code').forEach((block) => {
          block.classList.add('code-block');
        });
      } catch (error) {
        console.error('Markdown 渲染失败:', error);
        contentEl.textContent = lastMessage.content;
      }
    } else {
      contentEl.textContent = lastMessage.content;
    }
    
    // 更新对话时间
    currentConversation.updatedAt = Date.now();
    
    // 自动保存对话
    if (settings?.autoSave) {
      saveCurrentConversation();
    }
  }
  
  // 如果消息完成，移除打字动画类
  if (content.endsWith('\n\n') || content.endsWith('.') || content.endsWith('。')) {
    typingMessageEl.classList.remove('typing');
    const contentEl = typingMessageEl.querySelector('.message-content');
    if (contentEl) {
      contentEl.classList.remove('typing-animation');
    }
  }
  
  // 滚动到底部
  scrollToBottom();
}

/**
 * 创建加载中消息元素
 * @returns {HTMLElement} 加载消息元素
 */
function createLoadingMessage() {
  const loadingEl = document.createElement('div');
  loadingEl.className = 'message assistant loading';
  
  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  contentEl.innerHTML = '<div class="typing-dots"><span>.</span><span>.</span><span>.</span></div>';
  
  loadingEl.appendChild(contentEl);
  return loadingEl;
}

/**
 * 处理文件上传
 * @param {Event} event - 文件上传事件
 */
function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  
  if (files.length === 0) return;
  
  // 清空文件预览区域
  elements.filePreview.innerHTML = '';
  selectedFiles = [];
  
  // 处理每个文件
  files.forEach(file => {
    // 检查文件大小（例如10MB限制）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast(`文件 ${file.name} 太大，请上传小于10MB的文件`, 'error');
      return;
    }
    
    // 添加到选中文件数组
    selectedFiles.push(file);
    
    // 创建文件预览元素
    const fileItem = document.createElement('div');
    fileItem.className = 'file-preview-item';
    
    const fileNameEl = document.createElement('span');
    fileNameEl.textContent = file.name;
    fileItem.appendChild(fileNameEl);
    
    const removeBtn = document.createElement('span');
    removeBtn.className = 'file-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', () => {
      // 移除文件
      selectedFiles = selectedFiles.filter(f => f !== file);
      elements.filePreview.removeChild(fileItem);
    });
    
    fileItem.appendChild(removeBtn);
    elements.filePreview.appendChild(fileItem);
  });
}

/**
 * 将文件读取为Base64
 * @param {File} file - 文件对象
 * @returns {Promise<string>} Base64编码的文件内容
 */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * 切换输入区域状态
 * @param {boolean} enabled - 是否启用
 */
function toggleInputState(enabled) {
  elements.userInput.disabled = !enabled;
  elements.sendBtn.disabled = !enabled;
  elements.fileInput.disabled = !enabled;
  
  if (enabled) {
    elements.sendBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/></svg>';
  } else {
    elements.sendBtn.innerHTML = '<div class="spinner"></div>';
  }
}

/**
 * 保存当前对话
 */
async function saveCurrentConversation() {
  if (!currentConversation) return;
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'saveConversation',
      conversation: currentConversation
    });
    
    if (!response.success) {
      console.error('保存对话失败:', response.error);
      showToast('保存对话失败', 'error');
    } else {
      // 更新本地对话列表
      const index = conversations.findIndex(conv => conv.id === currentConversation.id);
      if (index !== -1) {
        conversations[index] = currentConversation;
      } else {
        conversations.unshift(currentConversation);
      }
      
      // 更新对话历史UI
      renderConversationHistory();
    }
  } catch (error) {
    console.error('保存对话错误:', error);
    showToast('保存对话失败', 'error');
  }
}

/**
 * 打开设置页面
 */
function openSettingsPage() {
  try {
    // 使用 chrome.runtime.openOptionsPage 打开设置页面
    chrome.runtime.openOptionsPage(() => {
      if (chrome.runtime.lastError) {
        console.error('打开设置页面失败:', chrome.runtime.lastError);
        // 如果 openOptionsPage 失败，尝试使用 chrome.runtime.getURL
        const optionsUrl = chrome.runtime.getURL('options.html');
        chrome.tabs.create({ url: optionsUrl });
      }
    });
  } catch (error) {
    console.error('打开设置页面错误:', error);
    // 如果出现错误，使用备用方法
    const optionsUrl = chrome.runtime.getURL('options.html');
    chrome.tabs.create({ url: optionsUrl });
  }
}

/**
 * 应用主题设置
 */
function applyTheme() {
  if (!settings) return;
  
  const theme = settings.theme;
  document.body.classList.remove('theme-light', 'theme-dark');
  
  if (theme === 'light') {
    document.body.classList.add('theme-light');
  } else if (theme === 'dark') {
    document.body.classList.add('theme-dark');
  } else {
    // Auto - 跟随系统
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.add('theme-light');
    }
  }
  
  // 设置字体大小
  document.body.classList.remove('font-small', 'font-medium', 'font-large');
  document.body.classList.add(`font-${settings.fontSize}`);
}

/**
 * 格式化消息内容
 * @param {string} content - 原始内容
 * @returns {string} 格式化后的内容
 */
function formatMessageContent(content) {
  // 简单的代码块处理
  // 实际应用中可以使用marked.js等库来完整处理Markdown
  return content
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

/**
 * 高亮代码块
 * @param {HTMLElement} element - 包含代码块的元素
 */
function highlightCodeBlocks(element) {
  // 实际应用中可以使用highlight.js或Prism.js实现代码高亮
  // 这里只是简单的添加类名
  const codeBlocks = element.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    block.classList.add('highlighted-code');
  });
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error)
 */
function showToast(message, type = 'info') {
  // 检查是否已存在toast元素，如果有则移除
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    document.body.removeChild(existingToast);
  }
  
  // 创建新的toast元素
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 添加显示类
  setTimeout(() => toast.classList.add('show'), 10);
  
  // 3秒后自动消失
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

/**
 * 滚动聊天容器到底部
 */
function scrollToBottom() {
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// 添加必要的CSS
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  .toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    padding: 10px 20px;
    border-radius: 4px;
    color: white;
    z-index: 1000;
    opacity: 0;
    transition: all 0.3s ease;
  }
  
  .toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  
  .toast-success {
    background-color: #4caf50;
  }
  
  .toast-error {
    background-color: #f44336;
  }
  
  .toast-info {
    background-color: #2196f3;
  }
  
  .typing-dots span {
    display: inline-block;
    animation: typingDot 1.4s infinite;
  }
  
  .typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes typingDot {
    0%, 60%, 100% { opacity: 0.2; transform: scale(0.8); }
    30% { opacity: 1; transform: scale(1.2); }
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

document.head.appendChild(toastStyles);

/**
 * 创建消息操作按钮组
 * @param {HTMLElement} messageElement - 消息元素
 * @param {string} content - 消息内容
 */
function createMessageActions(messageElement, content) {
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'message-actions';
  
  // 复制按钮
  const copyButton = document.createElement('button');
  copyButton.className = 'action-button copy-button';
  copyButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
    <span class="copy-tooltip">复制</span>
  `;
  
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(content);
      copyButton.classList.add('copy-success');
      const tooltip = copyButton.querySelector('.copy-tooltip');
      tooltip.textContent = '已复制';
      setTimeout(() => {
        copyButton.classList.remove('copy-success');
        tooltip.textContent = '复制';
      }, 1000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  });
  
  actionsDiv.appendChild(copyButton);
  messageElement.appendChild(actionsDiv);
}

/**
 * 添加消息到聊天界面
 * @param {string} content - 消息内容
 * @param {string} role - 消息角色 ('user' 或 'assistant')
 */
function addMessage(content, role) {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${role}-message`;
  
  const contentElement = document.createElement('div');
  contentElement.className = 'message-content';
  
  if (role === 'assistant') {
    // 使用 marked 渲染 Markdown
    contentElement.innerHTML = marked.parse(content);
    // 代码高亮
    contentElement.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  } else {
    contentElement.textContent = content;
  }
  
  messageElement.appendChild(contentElement);
  
  // 添加消息操作按钮组
  createMessageActions(messageElement, content);
  
  elements.chatMessages.appendChild(messageElement);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

/**
 * 切换历史面板的显示状态
 */
function toggleHistoryPanel() {
  const historyPanel = document.querySelector('.history-panel');
  
  if (!historyPanel) {
    // 如果面板不存在，创建一个新的
    createHistoryPanel();
  } else {
    // 如果面板存在，切换其显示状态
    historyPanel.classList.toggle('show');
  }
}

/**
 * 创建历史会话面板
 */
function createHistoryPanel() {
  const panel = document.createElement('div');
  panel.className = 'history-panel';
  
  // 添加面板标题
  const header = document.createElement('div');
  header.className = 'history-panel-header';
  header.innerHTML = `
    <h3>历史会话</h3>
    <button class="close-button">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
  
  // 添加会话列表容器
  const listContainer = document.createElement('div');
  listContainer.className = 'history-list-container';
  
  // 渲染会话列表
  conversations.forEach(conv => {
    const item = document.createElement('div');
    item.className = 'history-item';
    if (currentConversation && conv.id === currentConversation.id) {
      item.classList.add('active');
    }
    
    // 格式化时间
    const date = new Date(conv.updatedAt);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    item.innerHTML = `
      <div class="history-item-title">${conv.title || '新对话'}</div>
      <div class="history-item-date">${formattedDate}</div>
    `;
    
    item.addEventListener('click', () => {
      loadConversation(conv.id);
      toggleHistoryPanel();
    });
    
    listContainer.appendChild(item);
  });
  
  panel.appendChild(header);
  panel.appendChild(listContainer);
  document.body.appendChild(panel);
  
  // 添加关闭按钮事件
  const closeBtn = header.querySelector('.close-button');
  closeBtn.addEventListener('click', () => {
    panel.classList.remove('show');
  });
  
  // 显示面板
  setTimeout(() => panel.classList.add('show'), 10);
  
  // 添加点击外部关闭面板
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('show') && 
        !panel.contains(e.target) && 
        !elements.historyBtn.contains(e.target)) {
      panel.classList.remove('show');
    }
  });
}

// 添加必要的CSS
const historyStyles = document.createElement('style');
historyStyles.textContent = `
  .history-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: var(--text-color);
    transition: all 0.3s ease;
  }
  
  .history-button:hover {
    background-color: var(--hover-color);
    border-radius: 6px;
  }
  
  .history-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 300px;
    height: 100%;
    background: linear-gradient(135deg, rgba(200, 220, 255, 0.2), rgba(180, 210, 255, 0.2));
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    box-shadow: 2px 0 15px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(var(--border-color-rgb), 0.1);
  }
  
  .history-panel.show {
    transform: translateX(0);
  }
  
  .history-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(to right, rgba(190, 215, 255, 0.95), rgba(200, 225, 255, 0.85));
    border-bottom: 1px solid rgba(var(--border-color-rgb), 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  .history-panel-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    letter-spacing: 0.5px;
  }
  
  .history-list-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background-color: rgba(210, 230, 255, 0.2);
  }
  
  .history-item {
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(var(--item-bg-color-rgb), 0.98);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(var(--border-color-rgb), 0.12);
    position: relative;
    overflow: hidden;
  }
  
  .history-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, rgba(var(--primary-color-rgb), 0.6), rgba(var(--primary-color-rgb), 0.2));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .history-item:hover {
    background: rgba(var(--hover-color-rgb), 0.98);
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.12);
  }
  
  .history-item:hover::before {
    opacity: 1;
  }
  
  .history-item.active {
    background: rgba(var(--active-color-rgb), 0.98);
    border: 1px solid rgba(var(--primary-color-rgb), 0.3);
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.15);
  }
  
  .history-item.active::before {
    opacity: 1;
    background: linear-gradient(to bottom, rgba(var(--primary-color-rgb), 0.8), rgba(var(--primary-color-rgb), 0.4));
  }
  
  .history-item-title {
    font-size: 14px;
    margin-bottom: 8px;
    color: var(--text-color);
    font-weight: 500;
    padding-left: 8px;
  }
  
  .history-item-date {
    font-size: 12px;
    color: var(--secondary-text-color);
    opacity: 0.8;
    padding-left: 8px;
    display: flex;
    align-items: center;
  }
  
  .history-item-date::before {
    content: '•';
    margin-right: 5px;
    color: rgba(var(--primary-color-rgb), 0.6);
  }
  
  .close-button {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: var(--text-color);
    opacity: 0.7;
    transition: all 0.3s ease;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-button:hover {
    opacity: 1;
    background-color: rgba(var(--hover-color-rgb), 0.3);
    transform: scale(1.05);
  }

  /* 优化滚动条样式 */
  .history-list-container::-webkit-scrollbar {
    width: 5px;
  }

  .history-list-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .history-list-container::-webkit-scrollbar-thumb {
    background-color: rgba(var(--text-color-rgb), 0.15);
    border-radius: 20px;
  }

  .history-list-container::-webkit-scrollbar-thumb:hover {
    background-color: rgba(var(--text-color-rgb), 0.25);
  }

  /* 添加渐变阴影效果 */
  .history-list-container::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(to top, rgba(var(--bg-color-rgb), 0.2), transparent);
    pointer-events: none;
  }
`;

document.head.appendChild(historyStyles); 