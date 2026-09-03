# ==============================================================================
# NeuroPath - Script Pengemasan Berkas Lomba (Clean ZIP Generator)
# ==============================================================================
# Jalankan skrip ini dengan perintah:
#   powershell -ExecutionPolicy Bypass -File .\pack-for-jury.ps1
#
# Skrip ini akan membuat file 'NeuroPath_Submission.zip' yang bersih, super ringan,
# dan bebas dari folder besar (node_modules, .next, .git) sehingga siap kirim ke juri.
# ==============================================================================

$outputZip = Join-Path $PSScriptRoot "NeuroPath_Submission.zip"

Write-Host "Mempersiapkan berkas submission NeuroPath untuk juri lomba..." -ForegroundColor Cyan

if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

$tempFolder = Join-Path $env:TEMP "NeuroPath_CleanPackage"
if (Test-Path $tempFolder) {
    Remove-Item -Path $tempFolder -Recurse -Force
}
New-Item -ItemType Directory -Path $tempFolder | Out-Null

# Folder dan file yang diikutkan secara eksplisit
$includeFolders = @("src", "public", "contracts", "scripts")
$includeFiles = @(
    "package.json",
    "package-lock.json",
    ".npmrc",
    ".env.local.example",
    "next.config.mjs",
    "hardhat.config.js",
    "eslint.config.mjs",
    "jsconfig.json",
    "vercel.json",
    "README.md",
    "PRODUCT.md",
    "contractAddress.json",
    "service-account.example.json",
    ".gitignore",
    "pack-for-jury.ps1"
)

Write-Host "Menyalin berkas bersih..." -ForegroundColor Yellow

# Salin direktori utama
foreach ($folder in $includeFolders) {
    $srcPath = Join-Path $PSScriptRoot $folder
    if (Test-Path $srcPath) {
        $destPath = Join-Path $tempFolder $folder
        Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
    }
}

# Salin file konfigurasi utama
foreach ($file in $includeFiles) {
    $srcFile = Join-Path $PSScriptRoot $file
    if (Test-Path $srcFile) {
        Copy-Item -Path $srcFile -Destination $tempFolder -Force
    }
}

Write-Host "Mengompres ke berkas ZIP..." -ForegroundColor Yellow
Compress-Archive -Path "$tempFolder\*" -DestinationPath $outputZip -Force

# Bersihkan folder sementara
Remove-Item -Path $tempFolder -Recurse -Force

if (Test-Path $outputZip) {
    $zipItem = Get-Item $outputZip
    $sizeMB = [math]::Round($zipItem.Length / 1MB, 2)

    Write-Host ""
    Write-Host "SELESAI! Berkas ZIP berhasil dibuat:" -ForegroundColor Green
    Write-Host "   Lokasi : $outputZip" -ForegroundColor White
    Write-Host "   Ukuran : $sizeMB MB" -ForegroundColor White
    Write-Host ""
    Write-Host "File ini siap dikirimkan ke panitia/juri lomba!" -ForegroundColor Cyan
} else {
    Write-Host "Gagal membuat berkas ZIP." -ForegroundColor Red
}
