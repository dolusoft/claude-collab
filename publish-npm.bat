@echo off
setlocal EnableDelayedExpansion

:: =================================================================
:: Claude Collab Automatic Publisher (NPM version)
:: This script will:
::  1. Update the version number (patch)
::  2. Build the project
::  3. Run tests
::  4. Commit changes to git with version number
::  5. Push to remote repository
::  6. Publish to NPM using direct npm command
:: =================================================================

echo -------------------------------------------
echo Publishing Claude Collab to NPM
echo -------------------------------------------

:: Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Git is not installed or not in PATH. Please install Git and try again.
    goto :error
)

:: Check if we're in the main branch
git rev-parse --abbrev-ref HEAD > branch.tmp
set /p CURRENT_BRANCH=<branch.tmp
del branch.tmp

if not "%CURRENT_BRANCH%" == "main" (
    if not "%CURRENT_BRANCH%" == "master" (
        echo WARNING: You are not on main/master branch. Current branch: %CURRENT_BRANCH%
        echo Would you like to continue anyway? (y/n)
        set /p CONTINUE=
        if /i not "%CONTINUE%" == "y" goto :end
    )
)

:: Step 1: Commit any changes if needed
git diff --quiet --exit-code
if %ERRORLEVEL% NEQ 0 (
    echo Uncommitted changes detected.
    echo Automatically committing current changes...
    git add .
    git commit -m "Prepare for new version release"
    echo Git commit completed.
)

:: Step 2: Update version manually with node script
echo Updating version number...

:: Using temporary JS file to update version
echo import fs from 'fs'; > update-version.mjs
echo const packagePath = './package.json'; >> update-version.mjs
echo const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8')); >> update-version.mjs
echo const currentVersion = pkg.version; >> update-version.mjs
echo console.log('Current version: ' + currentVersion); >> update-version.mjs
echo const parts = currentVersion.split('.'); >> update-version.mjs
echo parts[2] = (parseInt(parts[2]) + 1).toString(); >> update-version.mjs
echo const newVersion = parts.join('.'); >> update-version.mjs
echo pkg.version = newVersion; >> update-version.mjs
echo fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n'); >> update-version.mjs
echo console.log('New version: ' + newVersion); >> update-version.mjs
echo console.log(newVersion); >> update-version.mjs

node update-version.mjs > version-output.txt
if %ERRORLEVEL% NEQ 0 (
    echo Failed to update version number.
    del update-version.mjs
    goto :error
)

:: Get the last line which contains just the version
for /f "delims=" %%i in (version-output.txt) do set VERSION=%%i
del version-output.txt
del update-version.mjs

:: Step 3: Build the project
echo Building project...
call pnpm build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed. Aborting publish.
    goto :error
)

:: Step 4: Run tests
echo Running tests...
call pnpm test
if %ERRORLEVEL% NEQ 0 (
    echo Tests failed. Aborting publish.
    goto :error
)

:: Step 5: Commit changes
echo Committing changes to git...
git add package.json
git commit -m "v%VERSION%"
if %ERRORLEVEL% NEQ 0 (
    echo Failed to commit changes to version.
    goto :error
)

:: Step 6: Push to remote
echo Pushing to remote repository...
git push
if %ERRORLEVEL% NEQ 0 (
    echo Failed to push to remote repository.
    goto :error
)

:: Step 7: Publish to NPM using direct npm command
echo Publishing to NPM with direct npm command...
npm publish --access public
if %ERRORLEVEL% NEQ 0 (
    echo Failed to publish to NPM. Trying with login first...
    npm login
    npm publish --access public
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to publish to NPM after login.
        goto :error
    )
)

echo.
echo -------------------------------------------
echo Successfully published version v%VERSION% to NPM!
echo -------------------------------------------
goto :end

:error
echo -------------------------------------------
echo Error occurred. Publishing failed.
echo -------------------------------------------
exit /b 1

:end
echo Process completed.
echo.
echo Install with:
echo   npx @dolusoft/claude-collab --help
echo.
echo Or add to Claude Code:
echo   claude mcp add claude-collab -- npx @dolusoft/claude-collab client --team frontend --auto-hub
echo.
pause
