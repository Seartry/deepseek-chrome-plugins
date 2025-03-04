# DeepSeek对话助手 Chrome插件

一个功能强大的Chrome浏览器扩展，让您可以在浏览器中方便地与DeepSeek AI进行对话，支持文件上传、保存对话记录和一键复制内容。

## 功能特点

- **便捷的AI对话**：随时随地在浏览器中与DeepSeek AI进行对话，无需切换应用
- **文件上传**：支持上传文件并与AI一起分析文件内容
- **对话历史保存**：自动保存您的对话历史，方便随时查看和继续之前的对话
- **快捷复制**：一键复制AI回复内容，提高工作效率
- **灵活的设置**：自定义模型参数、用户界面和对话行为
- **多主题支持**：支持浅色、深色主题，以及自动跟随系统设置
- **Markdown渲染**：AI回复支持Markdown格式，代码高亮显示
- **导出功能**：将对话记录导出为Markdown或纯文本格式

## 安装方法

### 方法一：从Chrome网上应用店安装

1. 访问[Chrome网上应用店](https://chrome.google.com/webstore/category/extensions)
2. 搜索"DeepSeek对话助手"
3. 点击"添加到Chrome"

### 方法二：开发者模式安装

1. 下载本项目并解压
2. 打开Chrome浏览器，访问 `chrome://extensions/`
3. 打开右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择解压后的项目文件夹

## 使用指南

### 初次设置

1. 安装插件后，点击浏览器右上角的DeepSeek图标打开插件
2. 点击设置按钮，或右键点击插件图标选择"选项"
3. 在设置页面，输入您的DeepSeek API密钥
   - 如果您还没有API密钥，请访问[DeepSeek官网](https://www.deepseek.com/)申请
4. 根据需要调整其他设置
5. 点击"保存"按钮保存设置

### 日常使用

#### 发起对话

1. 点击浏览器右上角的DeepSeek图标打开插件
2. 在输入框中输入您的问题
3. 点击发送按钮或按下Enter键发送消息

#### 上传文件

1. 点击输入框旁边的文件图标
2. 选择要上传的文件
3. 输入与文件相关的问题
4. 发送消息

#### 管理对话历史

1. 左侧栏显示您的对话历史
2. 点击任意历史记录可以恢复该对话
3. 点击"新建对话"按钮开始新的对话

#### 复制内容

1. 将鼠标悬停在AI回复上
2. 点击右上角出现的复制按钮
3. 内容将被复制到剪贴板

### 设置说明

#### API设置

- **API密钥**：您的DeepSeek API密钥
- **模型**：选择使用的DeepSeek模型
- **温度**：控制回复的创造性，值越高回复越多样
- **最大Token数**：控制回复的最大长度
- **Top P**：控制回复的多样性

#### UI设置

- **主题**：选择浅色、深色或跟随系统
- **字体大小**：调整界面字体大小
- **打字动画**：启用/禁用打字效果

#### 聊天设置

- **系统提示词**：设置AI的角色和行为
- **流式输出**：启用/禁用实时显示回复
- **Markdown渲染**：启用/禁用Markdown格式渲染
- **代码高亮**：启用/禁用代码语法高亮

#### 存储设置

- **历史保存路径**：设置对话历史的保存位置
- **自动保存**：启用/禁用自动保存对话
- **导出格式**：选择导出格式(Markdown或纯文本)

## 常见问题

**Q: 为什么需要API密钥?**
A: API密钥用于访问DeepSeek的AI服务。您需要在DeepSeek官网注册并获取API密钥。

**Q: 上传文件有大小限制吗?**
A: 是的，当前版本限制上传文件大小不超过10MB。

**Q: 如何清除所有对话历史?**
A: 在设置页面的"存储设置"标签中，有"清除所有历史记录"按钮。

**Q: 插件支持哪些文件类型?**
A: 插件支持文本文件(.txt)、代码文件(.py, .js等)、图片文件(.jpg, .png等)以及PDF文件。

## 隐私声明

- 您的所有对话内容和上传的文件仅在您的浏览器和DeepSeek服务器之间传输。
- 插件不会收集或存储您的个人信息。
- 您的API密钥仅存储在您的浏览器本地，不会被发送到其他地方。

## 开发信息

- 版本: 1.0.0
- 基于Manifest V3开发
- 使用Service Worker作为后台处理

## 许可证

MIT

## 联系与反馈

如有任何问题或建议，请通过以下方式联系我们:

- 在GitHub上提交Issue
- 发送邮件至: [zhangxpit@163.com]

感谢使用DeepSeek对话助手!
