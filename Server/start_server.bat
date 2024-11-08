@echo off

:: �ش� ���丮�� �̵�
cd /d %USERPROFILE%\Documents\GitHub\DU_Kiosk\Server
echo.

:: package.json ���� ���� ���� Ȯ��
if not exist package.json (
    echo package.json ������ �����ϴ�. npm init -y ��ɾ� ���� ��...
    npm init -y
    cmd/k start_server.bat
)

:: express ��� ��ġ ���� Ȯ��
if not exist node_modules\express (
    echo express ����� ��ġ���� �ʾҽ��ϴ�. ��ġ ��...
    npm install express
    cmd/k start_server.bat
)

:: multer ��� ��ġ ���� Ȯ��
if not exist node_modules\multer (
    echo multer ����� ��ġ���� �ʾҽ��ϴ�. ��ġ ��...
    npm install multer
    cmd/k start_server.bat
)

:: cors ��� ��ġ ���� Ȯ��
if not exist node_modules\cors (
    echo cors ����� ��ġ���� �ʾҽ��ϴ�. ��ġ ��...
    npm install cors
    cmd/k start_server.bat
)

:: ��� ���� �� ��� ��ġ �Ϸ� �� ���� �۾� ����
echo.
echo ��� ��Ű���� ����� �غ�Ǿ����ϴ�.
echo.

:: server_Main.html ���� �� �������� ����
echo server_Main.html�� �⺻ �� �������� ���ϴ�...
start "" "%USERPROFILE%\Documents\GitHub\DU_Kiosk\Server\server_Main.html"

:: ���� ����
echo.
echo node server.js ���� ��... (���Ḧ ���ϸ� Ctrl + C)
node server.js
echo.
pause
