@echo off
REM Ghost Reply - GitHub Push Script
REM This script will:
REM 1. Configure git with your credentials
REM 2. Add your GitHub remote
REM 3. Push your code to GitHub

setlocal enabledelayedexpansion

REM Configuration
set GITHUB_USERNAME=Israeldcoder
set GITHUB_EMAIL=theonyekachithompson@gmail.com
set REPO_NAME=Ghost-Reply
set GITHUB_REPO_URL=https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git

echo.
echo ====================================
echo Ghost Reply - GitHub Push Setup
echo ====================================
echo.
echo GitHub Username: %GITHUB_USERNAME%
echo Repository: %REPO_NAME%
echo URL: %GITHUB_REPO_URL%
echo.

REM Step 1: Configure git
echo [1/4] Configuring git credentials...
git config --global user.name "%GITHUB_USERNAME%"
git config --global user.email "%GITHUB_EMAIL%"
if errorlevel 1 (
    echo ERROR: Failed to configure git
    exit /b 1
)
echo ✓ Git configured
echo.

REM Step 2: Remove old remote if exists
echo [2/4] Preparing repository...
git remote remove origin 2>nul
echo ✓ Repository cleaned
echo.

REM Step 3: Add remote
echo [3/4] Adding GitHub remote...
git remote add origin %GITHUB_REPO_URL%
if errorlevel 1 (
    echo ERROR: Failed to add remote
    exit /b 1
)
echo ✓ Remote added: %GITHUB_REPO_URL%
echo.

REM Step 4: Push to GitHub
echo [4/4] Pushing code to GitHub...
echo NOTE: You may be prompted for authentication in your browser or terminal
echo.
git push -u origin main
if errorlevel 1 (
    echo.
    echo ERROR: Push failed. Possible reasons:
    echo  - Repository doesn't exist on GitHub yet
    echo  - Authentication failed
    echo  - No internet connection
    echo.
    echo SOLUTION:
    echo 1. Go to https://github.com/new
    echo 2. Create a new repository named: %REPO_NAME%
    echo 3. Make it PUBLIC
    echo 4. Don't initialize with any files
    echo 5. Come back here and run this script again
    exit /b 1
)

echo.
echo ====================================
echo ✓ SUCCESS! Code pushed to GitHub
echo ====================================
echo.
echo Your repository is now at:
echo https://github.com/%GITHUB_USERNAME%/%REPO_NAME%
echo.
echo Next steps:
echo 1. Visit your repo URL to verify
echo 2. Deploy backend to Render/Railway
echo 3. Build AAB for Play Store
echo 4. Submit to Google Play Store
echo.
pause
