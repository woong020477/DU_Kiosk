@echo off
:: UTF-8 인코딩 설정
chcp 65001

:: 해당 디렉토리로 이동
echo 이동 중: %USERPROFILE%\Documents\GitHub\DU_Kiosk\Server 디렉토리로 이동합니다...
cd /d %USERPROFILE%\Documents\GitHub\DU_Kiosk\Server
echo.

:: package.json 파일 존재 여부 확인
if exist package.json (
    echo package.json 파일이 이미 존재합니다. npm init -y를 건너뜁니다...
) else (
    echo npm init -y 명령어 실행 중...
    npm init -y
)

:: express, multer, cors 모듈 설치 여부 확인
if not exist node_modules\express (
    echo express 모듈이 설치되지 않았습니다. 설치 중...
    npm install express
) else (
    echo express 모듈이 이미 설치되어 있습니다.
)

if not exist node_modules\multer (
    echo multer 모듈이 설치되지 않았습니다. 설치 중...
    npm install multer
) else (
    echo multer 모듈이 이미 설치되어 있습니다.
)

if not exist node_modules\cors (
    echo cors 모듈이 설치되지 않았습니다. 설치 중...
    npm install cors
) else (
    echo cors 모듈이 이미 설치되어 있습니다.
)

:: server_Main.html 파일 웹 브라우저로 실행
echo server_Main.html을 기본 웹 브라우저로 엽니다...
start "" "%USERPROFILE%\Documents\GitHub\DU_Kiosk\Server\server_Main.html"

:: 서버 실행
echo.
echo node server.js 실행 중... (종료를 원하면 Ctrl + C)
node server.js
echo.
pause
