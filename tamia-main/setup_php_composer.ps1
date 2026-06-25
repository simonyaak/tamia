$ErrorActionPreference = "Stop"

$workspaceDir = "c:\Users\Simon\Downloads\tamia-main\tamia-main"
$phpDir = Join-Path $workspaceDir "php"
$zipFile = Join-Path $workspaceDir "php.zip"

if (-not (Test-Path $phpDir)) {
    New-Item -ItemType Directory -Path $phpDir | Out-Null
}

Write-Host "Downloading PHP 8.4.22..."
Invoke-WebRequest -Uri "https://windows.php.net/downloads/releases/php-8.4.22-nts-Win32-vs17-x64.zip" -OutFile $zipFile

Write-Host "Extracting PHP..."
Expand-Archive -Path $zipFile -DestinationPath $phpDir -Force
Remove-Item $zipFile

Write-Host "Configuring php.ini..."
$iniPath = Join-Path $phpDir "php.ini"
if (-not (Test-Path $iniPath)) {
    Copy-Item (Join-Path $phpDir "php.ini-development") $iniPath
}

# Enable extensions in php.ini
$iniContent = Get-Content $iniPath
# Uncomment extensions
$iniContent = $iniContent -replace ';extension_dir = "ext"', 'extension_dir = "ext"'
$iniContent = $iniContent -replace ';extension=curl', 'extension=curl'
$iniContent = $iniContent -replace ';extension=fileinfo', 'extension=fileinfo'
$iniContent = $iniContent -replace ';extension=gd', 'extension=gd'
$iniContent = $iniContent -replace ';extension=mbstring', 'extension=mbstring'
$iniContent = $iniContent -replace ';extension=openssl', 'extension=openssl'
$iniContent = $iniContent -replace ';extension=pdo_sqlite', 'extension=pdo_sqlite'
$iniContent = $iniContent -replace ';extension=sqlite3', 'extension=sqlite3'
$iniContent = $iniContent -replace ';extension=zip', 'extension=zip'
$iniContent | Set-Content $iniPath

Write-Host "Downloading Composer..."
$composerPhar = Join-Path $phpDir "composer.phar"
Invoke-WebRequest -Uri "https://getcomposer.org/composer.phar" -OutFile $composerPhar

# Create composer.bat
$composerBat = Join-Path $phpDir "composer.bat"
$phpExePath = Join-Path $phpDir "php.exe"
"@echo off`r`n`"$phpExePath`" `"$composerPhar`" %*" | Out-File -FilePath $composerBat -Encoding ascii

Write-Host "PHP and Composer installed successfully at $phpDir!"
