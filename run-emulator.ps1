# Smart Solar Microgrid - Run Mobile App on Emulator
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SMART SOLAR MICROGRID - LAUNCH ON EMULATOR             " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check if an emulator is already running with a visible GUI window
$onlineDevice = adb devices | Select-String -Pattern "emulator-.*?\bdevice\b"
$qemu = Get-Process -Name *qemu* -ErrorAction SilentlyContinue

# If an emulator is running headless/invisible in the background, terminate it so it can start with GUI
if ($qemu -and ($qemu.MainWindowHandle -eq 0 -or -not $onlineDevice)) {
    Write-Host "      Detected background/invisible emulator. Restarting with GUI window..." -ForegroundColor Yellow
    Stop-Process -Name *emulator*, *qemu* -Force -ErrorAction SilentlyContinue
    adb kill-server
    Start-Sleep -Seconds 1
    $onlineDevice = $null
}

if (-not $onlineDevice) {
    # If there is a frozen/offline emulator process, terminate it first
    $stuck = adb devices | Select-String -Pattern "emulator-.*?\boffline\b"
    if ($stuck) {
        Write-Host "      Detected frozen/offline emulator. Cleaning up..." -ForegroundColor Yellow
        Stop-Process -Name *emulator*, *qemu* -Force -ErrorAction SilentlyContinue
        adb kill-server
        Start-Sleep -Seconds 1
    }

    $emuExe = "emulator"
    $sdkEmu = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
    if (Test-Path $sdkEmu) { $emuExe = $sdkEmu }

    Write-Host "[1/4] Starting Android Emulator (Medium_Phone_API_36)..." -ForegroundColor Yellow
    Start-Process -FilePath $emuExe -ArgumentList "-avd", "Medium_Phone_API_36" -WindowStyle Normal

    Write-Host "      Waiting for emulator to boot up (this may take ~20-30s)..." -ForegroundColor Yellow
    adb wait-for-device
    
    $booted = $false
    $timeout = 90
    while (-not $booted -and $timeout -gt 0) {
        Start-Sleep -Seconds 2
        $status = adb -e shell getprop sys.boot_completed 2>$null
        if ($status -and $status.Trim() -eq "1") {
            $booted = $true
        }
        $timeout -= 2
    }
    Write-Host "[1/4] Emulator booted and online!" -ForegroundColor Green
} else {
    Write-Host "[1/4] Emulator is already running and online!" -ForegroundColor Green
}

# 2. Bridge port 5299 so emulator can talk to backend API
Write-Host "[2/4] Bridging port 5299 (Backend API) to emulator..." -ForegroundColor Yellow
adb -e reverse tcp:5299 tcp:5299
if ($LASTEXITCODE -eq 0) {
    Write-Host "      Backend bridge active (http://10.0.2.2:5299 & http://127.0.0.1:5299)" -ForegroundColor Green
} else {
    Write-Host "      Warning: adb reverse encountered an issue." -ForegroundColor Yellow
}

# 3. Compile APK (Incremental build)
$apkPath = "$PSScriptRoot\mobile\app\build\outputs\apk\debug\app-debug.apk"
Write-Host "[3/4] Building debug APK..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\mobile"
& ".\gradlew.bat" assembleDebug
Set-Location "$PSScriptRoot"

# 4. Install & Launch
Write-Host "[4/4] Installing and launching app on emulator..." -ForegroundColor Yellow
adb -e install -r "$apkPath"
adb -e shell monkey -p com.smartsolar.microgrid -c android.intent.category.LAUNCHER 1

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS! App is running on the Android Emulator!        " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
