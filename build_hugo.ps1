# Check for wasm-pack
if (-not (Get-Command "wasm-pack" -ErrorAction SilentlyContinue)) {
    Write-Error "wasm-pack is not installed. Please run 'cargo install wasm-pack' or download the installer."
    exit 1
}

Write-Host "Building Neom Mathventure for Web..."
wasm-pack build --target web

if (-not $?) {
    Write-Error "Build failed."
    exit 1
}

$distDir = "hugo_dist/neom"

# Create distribution directory
if (Test-Path $distDir) {
    Remove-Item $distDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $distDir | Out-Null

Write-Host "Copying assets..."
Copy-Item "www/index.html" -Destination $distDir
Copy-Item "www/css" -Destination $distDir -Recurse
Copy-Item "www/js" -Destination $distDir -Recurse
Copy-Item "www/locales" -Destination $distDir -Recurse
Copy-Item "pkg" -Destination $distDir -Recurse     
Copy-Item "www/music" -Destination $distDir -Recurse

Write-Host "Removing .gitignore files from build..."
Get-ChildItem -Path $distDir -Filter ".gitignore" -Recurse | Remove-Item -Force


Write-Host "Build complete!"
Write-Host "To host in Hugo:"
Write-Host "1. Copy the contents of 'hugo_dist' to your Hugo site's 'static' folder."
Write-Host "   (You should have 'static/neom/...')"
Write-Host "2. Run your Hugo server."
Write-Host "3. Access the game at /neom/"
