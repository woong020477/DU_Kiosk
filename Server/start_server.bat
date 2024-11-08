@echo off

:: 해당 디렉토리로 이동
cd /d %USERPROFILE%\Documents\GitHub\DU_Kiosk\Server
echo.

:: package.json 파일 존재 여부 확인
if not exist package.json (
    echo package.json 파일이 없습니다. npm init -y 명령어 실행 중...
    npm init -y
    cmd/k start_server.bat
)

:: express 모듈 설치 여부 확인
if not exist node_modules\express (
    echo express 모듈이 설치되지 않았습니다. 설치 중...
    npm install express
    cmd/k start_server.bat
)

:: multer 모듈 설치 여부 확인
if not exist node_modules\multer (
    echo multer 모듈이 설치되지 않았습니다. 설치 중...
    npm install multer
    cmd/k start_server.bat
)

:: cors 모듈 설치 여부 확인
if not exist node_modules\cors (
    echo cors 모듈이 설치되지 않았습니다. 설치 중...
    npm install cors
    cmd/k start_server.bat
)

:: 모든 파일 및 모듈 설치 완료 후 다음 작업 진행
echo.
echo 모든 패키지와 모듈이 준비되었습니다.
echo.

:: server_Main.html 파일 웹 브라우저로 실행
echo server_Main.html을 기본 웹 브라우저로 엽니다...
start "" "%USERPROFILE%\Documents\GitHub\DU_Kiosk\Server\server_Main.html"

:: 서버 실행
echo.
echo node server.js 실행 중... (종료를 원하면 Ctrl + C)
node server.js
echo.
pause
