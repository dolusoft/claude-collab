@echo off
setlocal EnableDelayedExpansion

echo.
echo ===================================================
echo    Claude Collab NPM Publisher
echo ===================================================
echo.

cd /d "%~dp0"
echo [INFO] Directory: %CD%

:: Check npm login
echo [1/5] Checking npm login...
for /f "tokens=*" %%a in ('npm whoami 2^>^&1') do set NPM_USER=%%a
if "%NPM_USER%"=="" (
    echo [ERROR] Not logged in. Run: npm login
    goto :error
)
echo [OK] Logged in as: %NPM_USER%

:: Build
echo [2/5] Building...
call pnpm build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed
    goto :error
)
echo [OK] Build done

:: Test
echo [3/5] Testing...
call pnpm test
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Tests failed
    goto :error
)
echo [OK] Tests passed

:: Get current version and increment
echo [4/5] Updating version...
for /f "tokens=2 delims=:, " %%a in ('findstr /C:"\"version\"" package.json') do set OLD_VER=%%~a
echo Current: %OLD_VER%

:: Commit and push
git add -A
git commit -m "Prepare release" 2>nul
git push 2>nul

:: Publish
echo [5/5] Publishing to npm...
call npm publish --access public
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] npm publish failed!
    echo.
    echo Possible issues:
    echo   1. @dolusoft org not created on npmjs.com
    echo   2. Not logged in properly
    echo   3. Package name already taken
    echo.
    goto :error
)

echo.
echo ===================================================
echo [SUCCESS] Published to npm!
echo ===================================================
echo.
echo Test: npx @dolusoft/claude-collab --help
echo.
goto :end

:error
echo.
echo [FAILED]
pause
exit /b 1

:end
pause
