# ==============================================================================
# Smart Solar Microgrid - IIS Web Service Hosting Automation Script
# Hosts the ASP.NET Core Web API on Windows IIS on Port 5299
# ==============================================================================

param (
    [int]$Port = 5299,
    [string]$SiteName = "SmartSolarAPI",
    [string]$AppPoolName = "SmartSolarPool",
    [string]$DestinationPath = "C:\inetpub\wwwroot\SmartSolarAPI"
)

# 1. Require Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    try {
        Write-Host "[INFO] Attempting to elevate to Administrator..." -ForegroundColor Yellow
        Start-Process powershell.exe -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"") -Verb RunAs -ErrorAction Stop
        exit
    } catch {
        Write-Host ""
        Write-Host "================================================================================" -ForegroundColor Red
        Write-Host "  ADMINISTRATOR PRIVILEGES REQUIRED TO CONFIGURE IIS" -ForegroundColor Red
        Write-Host "================================================================================" -ForegroundColor Red
        Write-Host "  IIS configuration requires elevated Administrator permissions." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  HOW TO RUN:" -ForegroundColor Cyan
        Write-Host "  1. Right-click 'setup-iis.ps1' -> Select 'Run with PowerShell'" -ForegroundColor White
        Write-Host "     OR" -ForegroundColor White
        Write-Host "  2. Open PowerShell as Administrator and run:" -ForegroundColor White
        Write-Host "     cd `"$projectRoot`"" -ForegroundColor White
        Write-Host "     .\setup-iis.ps1" -ForegroundColor White
        Write-Host "================================================================================" -ForegroundColor Red
        exit 1
    }
}

Clear-Host
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "   SMART SOLAR MICROGRID - IIS WEB SERVICE HOSTING SETUP" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

$appCmd = "$env:SystemRoot\System32\inetsrv\appcmd.exe"
$projectRoot = Split-Path -Parent $PSCommandPath
$publishDir = Join-Path $projectRoot "backend\publish"
$apiProjectDir = Join-Path $projectRoot "backend\SmartSolarMicrogrid.API"

# 2. Check IIS & AspNetCoreModuleV2
Write-Host "[1/6] Checking IIS & ASP.NET Core Hosting Bundle..." -ForegroundColor Yellow
$w3svc = Get-Service -Name W3SVC -ErrorAction SilentlyContinue
if ($null -eq $w3svc) {
    Write-Host "[-] IIS (World Wide Web Publishing Service) is not installed." -ForegroundColor Red
    Write-Host "    Please enable 'Internet Information Services' in Windows Features." -ForegroundColor Red
    pause
    exit 1
}

$aspnetcoreModule = "C:\Program Files\IIS\Asp.Net Core Module\V2\aspnetcorev2.dll"
if (-not (Test-Path $aspnetcoreModule)) {
    Write-Host "[-] ASP.NET Core Hosting Bundle (AspNetCoreModuleV2) was not found." -ForegroundColor Red
    Write-Host "    Please download & install the .NET 8 Hosting Bundle from Microsoft." -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[+] IIS & AspNetCoreModuleV2 are installed and verified." -ForegroundColor Green

# 3. Publish Latest API Binaries
Write-Host ""
Write-Host "[2/6] Publishing ASP.NET Core API project in Release mode..." -ForegroundColor Yellow
Push-Location $apiProjectDir
dotnet publish -c Release -o $publishDir --nologo
Pop-Location

if (-not (Test-Path "$publishDir\SmartSolarMicrogrid.API.dll")) {
    Write-Host "[-] Failed to find published binaries in $publishDir." -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[+] API successfully compiled and published." -ForegroundColor Green

# 4. Copy published files to C:\inetpub\wwwroot\SmartSolarAPI
Write-Host ""
Write-Host "[3/6] Deploying files to $DestinationPath..." -ForegroundColor Yellow
if (-not (Test-Path $DestinationPath)) {
    New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
}

# Stop site/pool temporarily if updating to avoid locked files
& $appCmd stop site /site.name:"$SiteName" 2>$null
& $appCmd stop apppool /apppool.name:"$AppPoolName" 2>$null

Copy-Item -Path "$publishDir\*" -Destination $DestinationPath -Recurse -Force
Write-Host "[+] Files deployed to $DestinationPath." -ForegroundColor Green

# 5. Grant NTFS Permissions to IIS_IUSRS and IUSR
Write-Host ""
Write-Host "[4/6] Setting NTFS directory permissions for IIS..." -ForegroundColor Yellow
& icacls "$DestinationPath" /grant "IIS_IUSRS:(OI)(CI)RX" /grant "IUSR:(OI)(CI)RX" /T /Q | Out-Null
Write-Host "[+] IIS_IUSRS & IUSR granted Read & Execute permissions." -ForegroundColor Green

# 6. Configure Application Pool & IIS Website
Write-Host ""
Write-Host "[5/6] Configuring IIS Application Pool & Website..." -ForegroundColor Yellow

# Create or configure Application Pool (No Managed Code for ASP.NET Core)
$existingPool = & $appCmd list apppool "$AppPoolName" 2>$null
if (-not $existingPool) {
    & $appCmd add apppool /name:"$AppPoolName" /managedRuntimeVersion:"" /managedPipelineMode:"Integrated"
    Write-Host "[+] Application Pool '$AppPoolName' created (No Managed Code)." -ForegroundColor Green
} else {
    & $appCmd set apppool /apppool.name:"$AppPoolName" /managedRuntimeVersion:""
    Write-Host "[+] Application Pool '$AppPoolName' verified." -ForegroundColor Green
}

# Check for existing site with same name or port
$existingSite = & $appCmd list site "$SiteName" 2>$null
if ($existingSite) {
    & $appCmd delete site "$SiteName"
    Write-Host "[+] Previous site '$SiteName' cleared for clean setup." -ForegroundColor Green
}

# Create Site on Port 5299
& $appCmd add site /name:"$SiteName" /bindings:"http/*:$($Port):" /physicalPath:"$DestinationPath"
& $appCmd set site /site.name:"$SiteName" "/[path='/'].applicationPool:$AppPoolName"

# Start the Application Pool and Website
& $appCmd start apppool /apppool.name:"$AppPoolName" 2>$null
& $appCmd start site /site.name:"$SiteName" 2>$null

# Also check firewall rule for Port 5299 so mobile physical devices can connect
New-NetFirewallRule -DisplayName "Smart Solar API (Port 5299)" -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null

Write-Host "[+] IIS Website '$SiteName' started on port $Port." -ForegroundColor Green

# 7. Verification & Health Check
Write-Host ""
Write-Host "[6/6] Verifying IIS Web Service endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/dashboard/stats" -UseBasicParsing -TimeoutSec 15
    $serverHeader = $response.Headers["Server"]
    
    Write-Host ""
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "   SUCCESSFULLY HOSTED ON WINDOWS IIS!" -ForegroundColor Green
    Write-Host "   Centralized Web Service is actively serving requests." -ForegroundColor Green
    Write-Host "   ------------------------------------------------------------------" -ForegroundColor Green
    Write-Host "   * Web Service URL:    http://localhost:$Port" -ForegroundColor Cyan
    Write-Host "   * Swagger UI Docs:    http://localhost:$Port/swagger" -ForegroundColor Cyan
    Write-Host "   * IIS Server Header:  $serverHeader" -ForegroundColor Cyan
    Write-Host "   * Backend Tech:       ASP.NET Core 8 Web API (In-Process via IIS)" -ForegroundColor Cyan
    Write-Host "   * Database:           MongoDB Atlas (NoSQL) Connected" -ForegroundColor Cyan
    Write-Host "   * Physical Path:      $DestinationPath" -ForegroundColor Cyan
    Write-Host "   * App Pool:           $AppPoolName (No Managed Code)" -ForegroundColor Cyan
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Client Applications Ready to Connect:" -ForegroundColor Yellow
    Write-Host "  1. Web Application:     Runs via 'npm run dev' -> proxies to http://localhost:$Port" -ForegroundColor White
    Write-Host "  2. Android Emulator:    Connects to http://10.0.2.2:$Port/api/" -ForegroundColor White
    Write-Host "  3. USB Mobile Device:   Run 'adb reverse tcp:$Port tcp:$Port' -> connects to http://127.0.0.1:$Port/api/" -ForegroundColor White
    Write-Host "  4. Physical Phone WiFi: Connects to http://<Your-IP>:$Port/api/" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[!] Web service is starting up or returned an error. Check logs in '$DestinationPath\logs'." -ForegroundColor Yellow
    Write-Host "    Error detail: $_" -ForegroundColor Red
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
