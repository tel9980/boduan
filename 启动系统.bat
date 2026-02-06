@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║     A股波段交易筛选系统 v4.0.0                       ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo 正在启动系统...
echo.

echo [1/2] 启动后端服务（端口8000）...
start "后端服务" cmd /k "python backend/main.py"
timeout /t 3 >nul

echo [2/2] 启动前端服务（端口5173）...
start "前端服务" cmd /k "cd frontend && npm run dev"
timeout /t 3 >nul

echo.
echo ✅ 系统启动完成！
echo.
echo 📊 访问地址：
echo    前端界面：http://localhost:5173
echo    API文档：http://localhost:8000/docs
echo.
echo 💡 提示：
echo    • 关闭窗口即可停止服务
echo    • 首次使用请等待3-5秒加载
echo.
pause
