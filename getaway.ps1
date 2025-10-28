Write-Host "Starting Getaway" -ForegroundColor Green

$configPath = ".env"
$frontendEnvPath = "frontend/.env"

if (!(Test-Path $configPath)) {
    Write-Host ".env file not found" -ForegroundColor Red
    exit 1
}

Get-Content $configPath | ForEach-Object {
    if ($_ -match "^\s*#") { return }
    if ($_ -match "^\s*$") { return }
    $parts = $_ -split "=", 2
    if ($parts.Length -eq 2) {
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        Set-Item -Path "Env:$name" -Value $value
    }
}


if ($env:DASHBOARD_ADDR -match "^([^:]+):(\d+)$") {
    $env:DASHBOARD_HOST = $matches[1]
    $env:DASHBOARD_PORT = $matches[2]
} else {
    Write-Host "Invalid DASHBOARD_ADDR format" -ForegroundColor Red
    exit 1
}


$frontendEnvContent = @()

Get-Content $configPath | ForEach-Object {
    if ($_ -match "^\s*#") { return }  
    if ($_ -match "^\s*$") { return }  
    $parts = $_ -split "=", 2
    if ($parts.Length -eq 2) {
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        $frontendEnvContent += "VITE_$name=$value"
    }
}

$frontendEnvDir = Split-Path $frontendEnvPath -Parent
if (!(Test-Path $frontendEnvDir)) {
    New-Item -ItemType Directory -Path $frontendEnvDir | Out-Null
}

$frontendEnvContent | Set-Content $frontendEnvPath -Encoding UTF8

$root = Get-Location
$gatewayDir = Join-Path $root "gateway"
$policyDir = Join-Path $root "policy"
$frontendDir = Join-Path $root "frontend"

function Start-ServiceWindow($title, $workingDir, $command,$address) {
    Write-Host "Starting $title @ $address" -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$workingDir`"; $command" -WindowStyle Normal
}

Start-Process cargo -ArgumentList "build" -WorkingDirectory $gatewayDir -WindowStyle Hidden -NoNewWindow -Wait
Start-Process cargo -ArgumentList "build" -WorkingDirectory $policyDir -WindowStyle Hidden -NoNewWindow -Wait


Start-ServiceWindow "Gateway" $gatewayDir "cargo run" "http://$env:GATEWAY_ADDR"
Start-ServiceWindow "Policy Service" $policyDir "cargo run" "http://$env:POLICY_ADDR"
Start-ServiceWindow "Dashboard" $frontendDir "npm run dev" "http://$env:DASHBOARD_ADDR"

Write-Host "All services started successfully!" -ForegroundColor Green  
