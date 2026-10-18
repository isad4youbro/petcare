$pidFile = Join-Path $PSScriptRoot 'data\server.pid'
if (Test-Path -LiteralPath $pidFile) {
    $petcareProcessId = [int](Get-Content -LiteralPath $pidFile)
    $petcareProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$petcareProcessId" -ErrorAction SilentlyContinue
    $petcareServerPath = Join-Path $PSScriptRoot 'server.py'
    if ($petcareProcess -and $petcareProcess.CommandLine.Contains($petcareServerPath)) {
        Stop-Process -Id $petcareProcessId
        Write-Output 'PetCare stopped.'
    } else {
        Write-Output 'The saved PetCare process is no longer running.'
    }
}
