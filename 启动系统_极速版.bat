@echo off
chcp 65001 >nul
echo ========================================
echo   A股波段交易筛选系统 v4.15.4
echo   极速版 - 自动预热 + 定时刷新
echo ========================================
echo.

echo [1/4] 启动后端服务...
start "后端服务" cmd /k "cd /d %~dp0 && .venv\Scripts\python.exe backend/main.py"
timeout /t 5 /nobreak >nul

echo [2/4] 启动前端服务...
start "前端服务" cmd /k "cd /d %~dp0\frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo [3/4] 首次预热缓存...
echo 这将需要约10-12分钟，请耐心等待...
echo 预热完成后，用户点击任何策略都能秒开！
echo.
.venv\Scripts\python.exe preheat_cache.py

echo.
echo [4/4] 启动自动预热服务（每30分钟刷新）...
start "自动预热服务" cmd /k "cd /d %~dp0 && .venv\Scripts\python.exe backend/auto_preheat.py"

echo.
echo ========================================
echo   系统启动完成！
echo ========================================
echo.
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:8000
echo.
echo ✅ 缓存已预热，首次点击也能秒开！
echo ✅ 自动预热服务已启动，缓存将每30分钟自动刷新！
echo.
echo 提示：关闭此窗口不会影响系统运行
echo.
pause
