# OpenCode CLI 安装指南 (Windows)

## 问题
`opencode: command not found` - 命令未找到

## 解决方案

### 方法 1: 使用 npm 安装（推荐）

```bash
# 以管理员身份运行 PowerShell 或 CMD，然后执行：
npm install -g @opencode/cli

# 验证安装
opencode --version
```

如果安装成功但命令仍找不到，可能需要：

```bash
# 刷新环境变量
refreshenv

# 或者重新打开终端
```

### 方法 2: 手动添加到 PATH

如果 npm 全局安装成功但命令找不到：

1. 找到 npm 全局安装路径：
```bash
npm config get prefix
```

2. 将 `<prefix>` 添加到系统 PATH：
   - 打开 "系统属性" → "环境变量"
   - 编辑 "Path" 变量
   - 添加 npm 全局 bin 目录（通常是 `C:\Users\<用户名>\AppData\Roaming\npm`）

3. 重新打开终端验证

### 方法 3: 使用 npx（无需全局安装）

```bash
# 每次使用前加上 npx
npx @opencode/cli auth login

# 或者
npx @opencode/cli --version
```

### 方法 4: 直接下载可执行文件

访问 OpenCode 官方 GitHub releases：
- https://github.com/opencode-ai/cli/releases

下载 Windows 版本并解压到 PATH 目录。

## 验证安装

安装完成后：

```bash
# 检查版本
opencode --version

# 登录
opencode auth login
```

## 登录成功后

1. 配置文件会自动创建在：`~/.opencode/config.json`
2. 当前项目的 `opencode.json` 会被读取
3. 系统会使用配置的 **Gemini 2.0 Flash** 模型

## 故障排除

### 权限问题
```bash
# 使用管理员权限运行 PowerShell
# 右键点击 PowerShell → "以管理员身份运行"
```

### npm 权限问题
```bash
# 更改 npm 全局目录权限
npm config set prefix "C:\npm-global"
# 然后将 C:\npm-global 添加到 PATH
```

### 代理问题
```bash
# 如果公司网络需要代理
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

## 备用方案

如果 CLI 实在安装不了，可以直接使用 HTTP API：

```bash
# 使用 curl 调用 Gemini API
curl -X POST "https://api.opencode.ai/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/gemini-2.0-flash",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

或者在后端代码中直接调用（已为你准备好）：

```python
# backend/services/gemini_service.py
from backend.services.gemini_service import GeminiService

service = GeminiService(
    endpoint="https://api.opencode.ai/v1",
    api_key="your-api-key",
    model_name="gemini-2.0-flash"
)
result = service.analyze("你的分析文本")
```
