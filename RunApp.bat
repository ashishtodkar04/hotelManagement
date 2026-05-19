@echo off
set "ANDROID_HOME=C:\Users\Ashish\AppData\Local\Android\Sdk"
set "PATH=%ANDROID_HOME%\platform-tools;%PATH%"

echo [1/4] Killing stale processes...
taskkill /f /im java.exe /t 2>nul
taskkill /f /im node.exe /t 2>nul

echo [2/4] Verifying SDK...
if not exist "%ANDROID_HOME%" (
    echo ERROR: Android SDK not found at %ANDROID_HOME%
    pause
    exit /b
)

echo [3/4] Forcing local.properties...
echo sdk.dir=C:/Users/Ashish/AppData/Local/Android/Sdk > "%~dp0sms-app\android\local.properties"

echo [4/4] Starting L'Elite SMS Verifier...
cd /d "%~dp0sms-app"
npx react-native run-android

echo.
echo If it failed with "SDK location not found", please try:
echo 1. Close this window.
echo 2. Open a NEW PowerShell window.
echo 3. Run: cd sms-app\android ; .\gradlew.bat clean
echo.
pause
