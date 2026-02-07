@echo off
chcp 65001 >nul
echo ========================================
echo   A股波段交易筛选系统 v4.15.4
echo   普通启动模式
echo ========================================
echo.

echo [1/2] 启动后端服务...
start "后端服务" cmd /k "cd /d %~dp0 && .venv\Scripts\python.exe backend/main.py"
timeout /t 5 /nobreak >nul

echo [2/2] 启动前端服务...
start "前端服务" cmd /k "cd /d %~dp0\frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   系统启动完成！
echo ========================================
echo.
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:8000
echo.
echo ⚠️ 注意：
echo - 首次点击筛选需要等待2-3分钟
echo - 30分钟内再次点击会使用缓存（<1秒）
echo.
echo 💡 提示：
echo - 如需极速体验，请使用 "启动系统_极速版.bat"
echo - 关闭此窗口不会影响系统运行
echo.
pause
