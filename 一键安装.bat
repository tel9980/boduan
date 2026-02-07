@echo off
chcp 65001 >nul
echo ========================================
echo   A股波段交易筛选系统
echo   一键安装脚本 v4.15.4
echo ========================================
echo.
echo 本脚本将自动完成以下操作：
echo 1. 检查 Python 和 Node.js 是否已安装
echo 2. 创建 Python 虚拟环境
echo 3. 安装后端依赖
echo 4. 安装前端依赖
echo 5. 配置环境变量
echo.
echo 预计耗时：5-10分钟
echo.
pause

echo.
echo ========================================
echo [1/6] 检查 Python 环境...
echo ========================================
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到 Python！
    echo.
    echo 请先安装 Python：
    echo 1. 访问 https://www.python.org/downloads/
    echo 2. 下载并安装最新版本
    echo 3. 安装时勾选 "Add Python to PATH"
    echo.
    pause
    exit /b 1
)
python --version
echo ✅ Python 环境正常

echo.
echo ========================================
echo [2/6] 检查 Node.js 环境...
echo ========================================
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到 Node.js！
    echo.
    echo 请先安装 Node.js：
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装 LTS 版本
    echo.
    pause
    exit /b 1
)
node --version
npm --version
echo ✅ Node.js 环境正常

echo.
echo ========================================
echo [3/6] 创建 Python 虚拟环境...
echo ========================================
if exist .venv (
    echo ⚠️ 虚拟环境已存在，跳过创建
) else (
    echo 正在创建虚拟环境...
    python -m venv .venv
    if errorlevel 1 (
        echo ❌ 创建虚拟环境失败！
        pause
        exit /b 1
    )
    echo ✅ 虚拟环境创建成功
)

echo.
echo ========================================
echo [4/6] 安装后端依赖...
echo ========================================
echo 正在激活虚拟环境...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ 激活虚拟环境失败！
    pause
    exit /b 1
)

echo 正在安装后端依赖（这可能需要几分钟）...
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo ❌ 安装后端依赖失败！
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. pip 版本过旧
    echo.
    echo 解决方法：
    echo 1. 检查网络连接
    echo 2. 运行：python -m pip install --upgrade pip
    echo 3. 重新运行本脚本
    echo.
    pause
    exit /b 1
)
echo ✅ 后端依赖安装成功

echo.
echo ========================================
echo [5/6] 安装前端依赖...
echo ========================================
cd frontend
if errorlevel 1 (
    echo ❌ 找不到 frontend 目录！
    pause
    exit /b 1
)

echo 正在安装前端依赖（这可能需要几分钟）...
call npm install
if errorlevel 1 (
    echo ❌ 安装前端依赖失败！
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. npm 配置问题
    echo.
    echo 解决方法：
    echo 1. 检查网络连接
    echo 2. 尝试使用国内镜像：npm config set registry https://registry.npmmirror.com
    echo 3. 重新运行本脚本
    echo.
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ 前端依赖安装成功

echo.
echo ========================================
echo [6/6] 配置环境变量...
echo ========================================
if exist .env (
    echo ✅ 环境变量文件已存在
) else (
    if exist .env.example (
        echo 正在复制环境变量模板...
        copy .env.example .env >nul
        echo ✅ 环境变量文件创建成功
        echo.
        echo ⚠️ 重要提示：
        echo 如需启用 AI 分析功能，请：
        echo 1. 打开 .env 文件
        echo 2. 将 GLM_API_KEY 替换为你的密钥
        echo 3. 密钥获取：https://open.bigmodel.cn/
    ) else (
        echo ⚠️ 未找到环境变量模板文件
        echo 将创建默认配置...
        echo # 智谱AI API配置 > .env
        echo GLM_API_KEY=your_api_key_here >> .env
        echo ZHIPUAI_API_KEY=your_api_key_here >> .env
        echo. >> .env
        echo # 模型配置 >> .env
        echo GLM_MODEL=glm-4-flash >> .env
        echo GLM_MODEL_TEMPERATURE=0.7 >> .env
        echo GLM_MODEL_MAX_TOKENS=4096 >> .env
        echo ✅ 默认环境变量文件创建成功
    )
)

echo.
echo ========================================
echo   安装完成！
echo ========================================
echo.
echo ✅ 所有依赖已安装完成
echo ✅ 环境配置已完成
echo.
echo 下一步操作：
echo 1. 如需启用 AI 分析，请编辑 .env 文件配置密钥
echo 2. 双击运行 "启动系统_极速版.bat" 启动系统
echo 3. 或双击运行 "启动系统.bat" 使用普通模式
echo.
echo 首次启动建议使用极速版（需要预热10-12分钟）
echo 预热完成后，任何时候点击都能秒开！
echo.
echo 使用指南：
echo - 小白部署指南.md - 零基础部署指南
echo - v4.15.4_快速使用指南.md - 详细使用指南
echo.
pause
