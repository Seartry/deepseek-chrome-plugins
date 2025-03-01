/**
 * DeepSeek助手 - 设置页面脚本
 */

// DOM元素引用
const elements = {
  // 表单元素
  apiKeyInput: document.getElementById('apiKey'),
  modelSelect: document.getElementById('modelSelect'),
  temperatureInput: document.getElementById('temperature'),
  temperatureValue: document.getElementById('temperatureValue'),
  maxTokensInput: document.getElementById('maxTokens'),
  maxTokensValue: document.getElementById('maxTokensValue'),
  topPInput: document.getElementById('topP'),
  topPValue: document.getElementById('topPValue'),
  
  themeSelect: document.getElementById('themeSelect'),
  fontSizeSelect: document.getElementById('fontSizeSelect'),
  animationToggle: document.getElementById('animationToggle'),
  
  systemPromptInput: document.getElementById('systemPrompt'),
  streamToggle: document.getElementById('streamToggle'),
  markdownToggle: document.getElementById('markdownToggle'),
  codeHighlightToggle: document.getElementById('codeHighlightToggle'),
  
  historyPathInput: document.getElementById('historyPath'),
  autoSaveToggle: document.getElementById('autoSaveToggle'),
  exportFormatSelect: document.getElementById('exportFormatSelect'),
  
  // 状态元素
  statusMessage: document.getElementById('statusMessage'),
  
  // 按钮
  saveButton: document.getElementById('saveButton'),
  resetButton: document.getElementById('resetButton'),
  apiTestButton: document.getElementById('apiTestButton'),
  
  // 菜单
  sidebarItems: document.querySelectorAll('.sidebar-item'),
  settingsSections: document.querySelectorAll('.settings-section')
};

// 默认设置
const DEFAULT_SETTINGS = {
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1.0,
  
  theme: 'auto',
  fontSize: 'medium',
  typingAnimation: true,
  
  systemPrompt: '你是一个由DeepSeek开发的AI助手，乐于助人、诚实且无害。',
  streamOutput: true,
  markdownRender: true,
  codeHighlight: true,
  
  historyPath: '',
  autoSave: true,
  exportFormat: 'markdown'
};

// 当前设置
let currentSettings = { ...DEFAULT_SETTINGS };

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 加载保存的设置
  await loadSettings();
  
  // 设置标签页切换
  setupTabNavigation();
  
  // 设置事件监听器
  setupEventListeners();
  
  // 计算存储使用情况
  updateStorageUsage();
});

/**
 * 加载保存的设置
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get('settings');
    if (result.settings) {
      const settings = result.settings;
      
      // 填充表单
      const elements = {
        apiKey: document.getElementById('apiKey'),
        modelSelect: document.getElementById('modelSelect'),
        temperature: document.getElementById('temperature'),
        temperatureValue: document.getElementById('temperatureValue'),
        maxTokens: document.getElementById('maxTokens'),
        maxTokensValue: document.getElementById('maxTokensValue'),
        themeSelect: document.getElementById('themeSelect'),
        fontSizeSelect: document.getElementById('fontSizeSelect'),
        animationToggle: document.getElementById('animationToggle'),
        streamToggle: document.getElementById('streamToggle'),
        markdownToggle: document.getElementById('markdownToggle'),
        codeHighlightToggle: document.getElementById('codeHighlightToggle'),
        systemPrompt: document.getElementById('systemPrompt'),
        autoSaveToggle: document.getElementById('autoSaveToggle'),
        exportFormatSelect: document.getElementById('exportFormatSelect')
      };

      // 安全地设置值
      if (elements.apiKey) elements.apiKey.value = settings.apiKey || '';
      if (elements.modelSelect) elements.modelSelect.value = settings.model || 'deepseek-chat';
      if (elements.temperature) {
        elements.temperature.value = settings.temperature || 0.7;
        if (elements.temperatureValue) elements.temperatureValue.textContent = settings.temperature || 0.7;
      }
      if (elements.maxTokens) {
        elements.maxTokens.value = settings.maxTokens || 2000;
        if (elements.maxTokensValue) elements.maxTokensValue.textContent = settings.maxTokens || 2000;
      }
      if (elements.themeSelect) elements.themeSelect.value = settings.theme || 'auto';
      if (elements.fontSizeSelect) elements.fontSizeSelect.value = settings.fontSize || 'medium';
      
      // 切换开关
      if (elements.animationToggle) elements.animationToggle.checked = settings.typingAnimation !== false;
      if (elements.streamToggle) elements.streamToggle.checked = settings.streamOutput !== false;
      if (elements.markdownToggle) elements.markdownToggle.checked = settings.markdownRender !== false;
      if (elements.codeHighlightToggle) elements.codeHighlightToggle.checked = settings.codeHighlight !== false;
      if (elements.autoSaveToggle) elements.autoSaveToggle.checked = settings.autoSave !== false;
      
      // 文本区域
      if (elements.systemPrompt) elements.systemPrompt.value = settings.systemPrompt || '';
      if (elements.exportFormatSelect) elements.exportFormatSelect.value = settings.exportFormat || 'markdown';
    }
  } catch (error) {
    console.error('加载设置失败:', error);
    showNotification('加载设置失败: ' + error.message, 'error');
  }
}

/**
 * 根据当前设置更新UI
 */
function updateUI() {
  // API设置
  elements.apiKeyInput.value = currentSettings.apiKey || '';
  elements.modelSelect.value = currentSettings.model || 'deepseek-chat';
  elements.temperatureInput.value = currentSettings.temperature;
  elements.temperatureValue.textContent = currentSettings.temperature;
  elements.maxTokensInput.value = currentSettings.maxTokens;
  elements.maxTokensValue.textContent = currentSettings.maxTokens;
  elements.topPInput.value = currentSettings.topP;
  elements.topPValue.textContent = currentSettings.topP;
  
  // UI设置
  elements.themeSelect.value = currentSettings.theme;
  elements.fontSizeSelect.value = currentSettings.fontSize;
  elements.animationToggle.checked = currentSettings.typingAnimation;
  
  // 聊天设置
  elements.systemPromptInput.value = currentSettings.systemPrompt;
  elements.streamToggle.checked = currentSettings.streamOutput;
  elements.markdownToggle.checked = currentSettings.markdownRender;
  elements.codeHighlightToggle.checked = currentSettings.codeHighlight;
  
  // 存储设置
  elements.historyPathInput.value = currentSettings.historyPath || '';
  elements.autoSaveToggle.checked = currentSettings.autoSave;
  elements.exportFormatSelect.value = currentSettings.exportFormat;
  
  // 更新主题预览
  updateThemePreview();
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // API 测试按钮
  const testApiBtn = document.getElementById('testApiBtn');
  if (testApiBtn) {
    testApiBtn.addEventListener('click', testApiConnection);
  }

  // 保存设置按钮
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const settings = {};
      
      // 安全地获取值
      const elements = {
        apiKey: document.getElementById('apiKey'),
        modelSelect: document.getElementById('modelSelect'),
        temperature: document.getElementById('temperature'),
        maxTokens: document.getElementById('maxTokens'),
        themeSelect: document.getElementById('themeSelect'),
        fontSizeSelect: document.getElementById('fontSizeSelect'),
        animationToggle: document.getElementById('animationToggle'),
        streamToggle: document.getElementById('streamToggle'),
        markdownToggle: document.getElementById('markdownToggle'),
        codeHighlightToggle: document.getElementById('codeHighlightToggle'),
        systemPrompt: document.getElementById('systemPrompt'),
        autoSaveToggle: document.getElementById('autoSaveToggle'),
        exportFormatSelect: document.getElementById('exportFormatSelect')
      };
      
      // API 设置
      if (elements.apiKey) settings.apiKey = elements.apiKey.value.trim();
      if (elements.modelSelect) settings.model = elements.modelSelect.value;
      if (elements.temperature) settings.temperature = parseFloat(elements.temperature.value);
      if (elements.maxTokens) settings.maxTokens = parseInt(elements.maxTokens.value);
      
      // UI 设置
      if (elements.themeSelect) settings.theme = elements.themeSelect.value;
      if (elements.fontSizeSelect) settings.fontSize = elements.fontSizeSelect.value;
      if (elements.animationToggle) settings.typingAnimation = elements.animationToggle.checked;
      
      // 对话设置
      if (elements.streamToggle) settings.streamOutput = elements.streamToggle.checked;
      if (elements.markdownToggle) settings.markdownRender = elements.markdownToggle.checked;
      if (elements.codeHighlightToggle) settings.codeHighlight = elements.codeHighlightToggle.checked;
      if (elements.systemPrompt) settings.systemPrompt = elements.systemPrompt.value;
      
      // 存储设置
      if (elements.autoSaveToggle) settings.autoSave = elements.autoSaveToggle.checked;
      if (elements.exportFormatSelect) settings.exportFormat = elements.exportFormatSelect.value;

      try {
        await chrome.storage.local.set({ settings });
        showNotification('设置已保存', 'success');
        
        // 如果有 API Key，可以立即测试连接
        if (settings.apiKey) {
          const testNow = confirm('设置已保存。是否要立即测试 API 连接？');
          if (testNow) {
            testApiConnection();
          }
        }
      } catch (error) {
        console.error('保存设置失败:', error);
        showNotification('保存设置失败: ' + error.message, 'error');
      }
    });
  }

  // 重置按钮
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetSettings);
  }

  // 滑块值显示
  setupSliderListeners();
}

/**
 * 设置滑块监听器
 */
function setupSliderListeners() {
  const temperatureInput = document.getElementById('temperature');
  const temperatureValue = document.getElementById('temperatureValue');
  if (temperatureInput && temperatureValue) {
    temperatureInput.addEventListener('input', () => {
      temperatureValue.textContent = temperatureInput.value;
    });
  }

  const maxTokensInput = document.getElementById('maxTokens');
  const maxTokensValue = document.getElementById('maxTokensValue');
  if (maxTokensInput && maxTokensValue) {
    maxTokensInput.addEventListener('input', () => {
      maxTokensValue.textContent = maxTokensInput.value;
    });
  }
}

/**
 * 设置导航菜单
 */
function setupNavigation() {
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  const settingsSections = document.querySelectorAll('.settings-section');
  
  sidebarItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      // 移除所有活动状态
      sidebarItems.forEach(i => i.classList.remove('active'));
      settingsSections.forEach(s => s.classList.remove('active'));
      
      // 添加活动状态到当前项
      item.classList.add('active');
      settingsSections[index].classList.add('active');
    });
  });
  
  // 默认选中第一项
  if (sidebarItems.length > 0 && !sidebarItems[0].classList.contains('active')) {
    sidebarItems[0].click();
  }
}

/**
 * 重置为默认设置
 */
function resetSettings() {
  if (confirm('确定要重置所有设置吗？这将清除所有自定义设置。')) {
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
      systemPrompt: '你是由DeepSeek开发的AI助手，你的目标是尽可能地帮助用户。',
      autoSave: true,
      exportFormat: 'md'
    };

    // 应用默认设置到表单
    Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = value;
        } else if (element.type === 'range') {
          element.value = value;
          const valueDisplay = element.nextElementSibling;
          if (valueDisplay) {
            valueDisplay.textContent = value;
          }
        } else {
          element.value = value;
        }
      }
    });

    showNotification('设置已重置为默认值', 'success');
  }
}

/**
 * 测试API连接
 */
async function testApiConnection() {
  const apiKey = document.getElementById('apiKey')?.value.trim();
  const apiStatus = document.getElementById('apiStatus');
  const testApiBtn = document.getElementById('testApiBtn');

  if (!apiKey) {
    showNotification('请输入 API Key', 'error');
    return;
  }

  try {
    testApiBtn.disabled = true;
    testApiBtn.textContent = '测试中...';
    if (apiStatus) {
      apiStatus.className = 'status';
      apiStatus.textContent = '正在测试连接...';
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 10,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (response.ok) {
      // 检查响应是否包含预期的数据结构
      if (data && Array.isArray(data.choices) && data.choices.length > 0) {
        if (apiStatus) {
          apiStatus.className = 'status success';
          apiStatus.textContent = 'API 连接成功！';
        }
        showNotification('API 连接测试成功', 'success');
      } else {
        throw new Error('API 响应格式不正确');
      }
    } else {
      // 处理 API 错误响应
      const errorMessage = data.error?.message || data.message || '未知错误';
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('API 测试失败:', error);
    if (apiStatus) {
      apiStatus.className = 'status error';
      apiStatus.textContent = `API 连接失败: ${error.message}`;
    }
    showNotification('API 连接测试失败: ' + error.message, 'error');
  } finally {
    if (testApiBtn) {
      testApiBtn.disabled = false;
      testApiBtn.textContent = '测试连接';
    }
  }
}

/**
 * 更新主题预览
 */
function updateThemePreview() {
  const themePreview = document.querySelector('.theme-preview');
  if (!themePreview) return;
  
  themePreview.className = 'theme-preview';
  
  const theme = elements.themeSelect.value;
  if (theme === 'light') {
    themePreview.classList.add('theme-light-preview');
  } else if (theme === 'dark') {
    themePreview.classList.add('theme-dark-preview');
  } else {
    // Auto - 根据系统设置
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      themePreview.classList.add('theme-dark-preview');
    } else {
      themePreview.classList.add('theme-light-preview');
    }
  }
}

/**
 * 显示状态消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error)
 */
function showStatus(message, type = 'info') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`;
  
  // 清除任何现有的超时
  if (elements.statusMessage._timeout) {
    clearTimeout(elements.statusMessage._timeout);
  }
  
  // 5秒后自动隐藏
  elements.statusMessage._timeout = setTimeout(() => {
    elements.statusMessage.textContent = '';
    elements.statusMessage.className = 'status-message';
  }, 5000);
}

// 更新存储使用情况
async function updateStorageUsage() {
  // 尝试获取存储使用量显示元素
  let storageUsedElement = document.getElementById('storageUsed');
  
  // 如果元素不存在，动态创建一个
  if (!storageUsedElement) {
    const storageSection = document.querySelector('.storage-section') || document.querySelector('.settings-section');
    if (storageSection) {
      const storageInfo = document.createElement('div');
      storageInfo.className = 'storage-info';
      storageInfo.innerHTML = `
        <div class="setting-item">
          <label>存储使用量</label>
          <div class="storage-display">
            <span id="storageUsed">计算中...</span>
            <button id="clearStorageBtn" class="secondary-button">清除数据</button>
          </div>
        </div>
      `;
      storageSection.appendChild(storageInfo);
      storageUsedElement = document.getElementById('storageUsed');
      
      // 添加清除数据按钮的事件监听
      const clearStorageBtn = document.getElementById('clearStorageBtn');
      if (clearStorageBtn) {
        clearStorageBtn.addEventListener('click', async () => {
          if (confirm('确定要清除所有存储的数据吗？这将删除所有的聊天记录和设置。')) {
            try {
              await chrome.storage.local.clear();
              showNotification('存储数据已清除', 'success');
              updateStorageUsage(); // 重新计算存储使用量
            } catch (error) {
              console.error('清除存储数据失败:', error);
              showNotification('清除存储数据失败: ' + error.message, 'error');
            }
          }
        });
      }
    } else {
      console.warn('未找到合适的容器来显示存储信息');
      return;
    }
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getStorageUsage'
    });
    
    if (response && response.success) {
      const usage = formatBytes(response.data || 0);
      storageUsedElement.textContent = usage;
    } else {
      storageUsedElement.textContent = '获取失败';
      console.error('获取存储使用情况失败:', response?.error || '未知错误');
    }
  } catch (error) {
    console.error('获取存储使用情况时出错：', error);
    if (storageUsedElement) {
      storageUsedElement.textContent = '获取失败';
    }
  }
}

// 格式化字节数
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 设置标签页切换
function setupTabNavigation() {
  const navItems = document.querySelectorAll('.settings-nav li');
  const tabs = document.querySelectorAll('.settings-tab');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      
      // 移除所有活动状态
      navItems.forEach(nav => nav.classList.remove('active'));
      tabs.forEach(tab => tab.classList.remove('active'));
      
      // 添加活动状态
      item.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// 显示通知
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // 添加动画类
  setTimeout(() => notification.classList.add('show'), 10);

  // 3秒后移除通知
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// 添加通知样式
const style = document.createElement('style');
style.textContent = `
.notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    z-index: 1000;
}

.notification.show {
    opacity: 1;
    transform: translateY(0);
}

.notification.success {
    background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%);
}

.notification.error {
    background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
}

.notification.info {
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
}
`;
document.head.appendChild(style); 