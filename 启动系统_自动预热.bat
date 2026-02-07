@echo off
chcp 65001 >nul
echo ========================================
echo   A股波段交易筛选系统 v4.15.4
echo   自动预热缓存版
echo ========================================
echo.

echo [1/3] 启动后端服务...
start "后端服务" cmd /k "cd /d %~dp0 && .venv\Scripts\python.exe backend/main.py"
timeout /t 5 /nobreak >nul

echo [2/3] 启动前端服务...
start "前端服务" cmd /k "cd /d %~dp0\frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo [3/3] 预热缓存（生成三种策略的缓存）...
echo 这将需要约10-12分钟，请耐心等待...
echo.
.venv\Scripts\python.exe preheat_cache.py

echo.
echo ========================================
echo   系统启动完成！
echo ========================================
echo.
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:8000
echo.
echo 缓存已预热，首次点击也能秒开！
echo.
pause
