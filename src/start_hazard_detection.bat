@echo off
chcp 65001 >nul
title Hazard Detection Software

echo.
echo ========================================
echo      Hidden Hazard Detection Software
echo           隐患排查教育软件
echo ========================================
echo.
echo Starting software, please wait...
echo 正在启动软件，请稍候...
echo.

REM Check if necessary files exist
if not exist "index.html" (
    echo Error: index.html file not found!
    echo 错误：找不到 index.html 文件！
    echo Please ensure all files are in the same directory.
    echo 请确保所有文件都在同一目录下。
    pause
    exit /b 1
)

REM Try to open with default browser
echo Opening software with default browser...
echo 正在使用默认浏览器打开软件...
start "" "index.html"

REM Wait a moment to ensure browser starts
timeout /t 2 /nobreak >nul

echo.
echo Software started successfully!
echo 软件已启动！
echo.
echo Instructions / 使用说明：
echo - Select a scene to start hazard detection training
echo - 选择场景开始隐患排查训练
echo - Click red pulsing points to discover hazards
echo - 点击红色脉冲点发现隐患
echo - Use ESC key to return to main menu
echo - 使用 ESC 键返回主菜单
echo - Use R key to reset current scene
echo - 使用 R 键重置当前场景
echo - Use M key to toggle sound effects
echo - 使用 M 键切换音效开关
echo.
echo Press any key to close this window...
echo 按任意键关闭此窗口...
pause >nul 