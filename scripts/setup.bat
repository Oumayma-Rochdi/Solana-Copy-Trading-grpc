@echo off
REM AI Bot Setup Script for Windows
REM Installe et configure le bot IA automatiquement

setlocal enabledelayedexpansion

echo.
echo =========================================
echo. 🚀 Configuration du Bot IA Solana Trading
echo =========================================
echo.

REM Check Node.js
echo [*] Verification de Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js n'est pas installe!
    echo.    Visitez: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('node -v') do echo [+] Node.js %%a detecte

REM Check npm
echo [*] Verification de npm...
npm -v >nul 2>&1
if errorlevel 1 (
    echo [X] npm n'est pas installe!
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('npm -v') do echo [+] npm %%a detecte

REM Install dependencies
echo.
echo [*] Installation des dependances...
call npm install
if errorlevel 1 (
    echo [X] Erreur lors de l'installation
    pause
    exit /b 1
)
echo [+] Dependances installees

REM Create .env if not exists
echo.
echo [*] Configuration du fichier .env...

if exist .env (
    echo [!] .env existe deja
    set /p replace="Voulez-vous le remplacer? (y/n): "
    if /i not "%replace%"=="y" goto skip_env
)

echo [*] Creation du fichier .env...
(
    echo # AI Gateway Configuration
    echo AI_GATEWAY_API_KEY=your_api_key_here
    echo.
    echo # Database Configuration
    echo DATABASE_URL=postgresql://user:password@localhost/trading_db
    echo.
    echo # Server Configuration
    echo PORT=3000
    echo NODE_ENV=development
    echo.
    echo # Risk Management
    echo MAX_DAILY_LOSS=5
    echo MAX_SINGLE_LOSS=1
    echo MAX_POSITIONS=10
    echo.
    echo # Trading Configuration
    echo MIN_TRADE_AMOUNT=0.1
    echo MAX_TRADE_AMOUNT=100
) > .env

echo [+] .env cree
echo [!] Mettez a jour AI_GATEWAY_API_KEY et DATABASE_URL dans .env
goto skip_db_setup

:skip_env
echo [*] Utilisation du .env existant

:skip_db_setup
REM Summary
echo.
echo =========================================
echo [+] Installation terminee!
echo =========================================
echo.
echo Notes:
echo   1. Mettez a jour .env avec vos cles API
echo   2. Configurez DATABASE_URL
echo   3. Executez: npm start
echo.
echo Pour tester:
echo   npm run test
echo.
echo Documentation:
echo   - SETUP_INSTRUCTIONS.md
echo   - QUICK_START.md
echo   - AI_BOT_README.md
echo.
pause
