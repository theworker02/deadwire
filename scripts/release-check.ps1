$ErrorActionPreference = "Stop"
npm run typecheck
npm test
node --check site/app.js
if (-not (Test-Path "site/presentation.html")) { throw "Presentation page is missing." }
Write-Output "Deadwire release checks completed."
