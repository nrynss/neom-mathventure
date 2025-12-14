Write-Host "Building Neom Mathventure for Web..."
wasm-pack build --target web

if (-not $?) {
    Write-Error "Build failed."
    exit 1
}

$distDir = "hugo_dist/neom-mathventure"

# Create distribution directory
if (Test-Path $distDir) {
    Remove-Item $distDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $distDir | Out-Null

Write-Host "Copying assets..."
Copy-Item "www/index.html" -Destination $distDir
Copy-Item "www/css" -Destination $distDir -Recurse
if (Test-Path "www/js") {
    Copy-Item "www/js" -Destination $distDir -Recurse
}
Copy-Item "www/locales" -Destination $distDir -Recurse
Copy-Item "www/music" -Destination $distDir -Recurse
Copy-Item "pkg" -Destination $distDir -Recurse

Write-Host "Build complete!"
Write-Host "To host in Hugo:"
Write-Host "1. Copy the contents of 'hugo_dist' to your Hugo site's 'static' folder."
Write-Host "2. Access the game at /neom-mathventure/"
