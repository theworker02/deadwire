$ErrorActionPreference = "Stop"
npm run demo
if (-not (Test-Path "site/assets/deadwire-recovery-demo.svg")) { throw "Animated demo asset is missing." }
if (-not (Test-Path "site/presentation.html")) { throw "Presentation page is missing." }
Write-Output "Deadwire demo assets are present."
