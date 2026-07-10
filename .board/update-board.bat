@echo off
chcp 65001 >nul
cd /d "%~dp0"

:: 检查参数
if "%~3"=="" (
  echo 用法：update-board.bat "项目根目录" "改动标题" "改动描述" [涉及文件]
  echo 示例：update-board.bat "E:\星寰海" "修复登录bug" "修复用户无法登录的问题" "src/auth/login.ts"
  exit /b 1
)

node "%~dp0update-board.cjs" %*
