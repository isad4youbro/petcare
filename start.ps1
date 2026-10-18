Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath '.\frontend\dist\index.html')) {
    Push-Location -LiteralPath '.\frontend'
    try {
        if (-not (Test-Path -LiteralPath '.\node_modules')) {
            npm.cmd ci
            if ($LASTEXITCODE -ne 0) { throw 'Failed to install frontend dependencies.' }
        }
        npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Failed to build frontend.' }
    } finally { Pop-Location }
}
python backend/server.py
