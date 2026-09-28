# Smart Solar Microgrid - Run Mobile App on Physical Phone
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SMART SOLAR MICROGRID - LAUNCH ON PHONE (SAMSUNG M02)  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check for connected physical device
$devices = adb devices | Select-String -Pattern "\bdevice\b" | Where-Object { $_ -notmatch "emulator" }
if (-not $devices) {
    Write-Host "[!] No physical Android phone detected via USB." -ForegroundColor Red
    Write-Host "    - Make sure your phone is connected with USB cable." -ForegroundColor Yellow
    Write-Host "    - Make sure 'USB Debugging' is enabled in Developer Options." -ForegroundColor Yellow
    Write-Host "    - Tap 'Allow' on your phone if asked." -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/3] Phone detected successfully via USB!" -ForegroundColor Green

# 2. Reverse port 5299 so phone can talk to backend API
Write-Host "[2/3] Bridging port 5299 (Backend API) to your phone..." -ForegroundColor Yellow
adb -d reverse tcp:5299 tcp:5299
if ($LASTEXITCODE -eq 0) {
    Write-Host "      Backend bridge active (http://127.0.0.1:5299 -> localhost:5299)" -ForegroundColor Green
} else {
    Write-Host "      Warning: adb reverse encountered an issue." -ForegroundColor Yellow
}

# 3. Check / Build APK
$apkPath = "$PSScriptRoot\mobile\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkPath)) {
    Write-Host "[3/3] Building debug APK..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot\mobile"
    & ".\gradlew.bat" assembleDebug
    Set-Location "$PSScriptRoot"
}

# 4. Install & Launch
Write-Host "[3/3] Installing and launching app on your phone..." -ForegroundColor Yellow
adb -d install -r "$apkPath"
adb -d shell monkey -p com.smartsolar.microgrid -c android.intent.category.LAUNCHER 1

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS! App is running on your Samsung phone!          " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
