<#
.SYNOPSIS
  One-time Azure setup for GitHub Actions OIDC deployment. Safe to re-run.

.DESCRIPTION
  Creates (or reuses) the "motorcycle-github-deploy" app registration and service
  principal, grants it Website Contributor on the resource group, adds the GitHub
  federated credential for the given GitHub environment, and prints the three
  values to store as GitHub secrets. No client secret is created.

.EXAMPLE
  # Production (the defaults)
  .\scripts\setup-azure-oidc.ps1

.EXAMPLE
  # A dev environment: its own resource group, GitHub environment, and identity
  .\scripts\setup-azure-oidc.ps1 -ResourceGroup motorcycle-dev-rg -Environment dev
#>
param(
  [string]$ResourceGroup = "motorcycle-prod-rg",
  [string]$Environment = "production",
  [string]$Repo = "ryanpaulcariaga/motorcycle",
  [string]$OwnerId = "3658143",
  [string]$RepositoryId = "1352834212",
  [string]$AppName = ""
)

$ErrorActionPreference = "Stop"
$repoParts = $Repo.Split("/")
if ($repoParts.Count -ne 2 -or $OwnerId -notmatch '^\d+$' -or $RepositoryId -notmatch '^\d+$') {
  throw "Repo must be owner/repository, and OwnerId and RepositoryId must be numeric GitHub IDs."
}

# Production keeps the original name; other environments get their own identity.
if (-not $AppName) {
  if ($Environment -eq "production") {
    $AppName = "motorcycle-github-deploy"
  } else {
    $AppName = "motorcycle-github-deploy-$Environment"
  }
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
  throw "Azure CLI not found. Install it (winget install Microsoft.AzureCLI), then open a new PowerShell window."
}

function Invoke-Az {
  param([string[]]$Arguments)
  $output = & az @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "az $($Arguments -join ' ') failed:`n$output"
  }
  return $output
}

Write-Host "1/6 Checking Azure login..."
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
  az login | Out-Null
  $account = az account show | ConvertFrom-Json
}
$subscriptionId = $account.id
$tenantId = $account.tenantId
Write-Host "    Subscription: $($account.name) ($subscriptionId)"

Write-Host "2/6 Checking resource group $ResourceGroup..."
$null = Invoke-Az @("group", "show", "--name", $ResourceGroup, "--query", "id", "-o", "tsv")

Write-Host "3/6 Creating or reusing app registration $AppName..."
$clientId = (az ad app list --display-name $AppName --query "[0].appId" -o tsv)
if (-not $clientId) {
  $clientId = (Invoke-Az @("ad", "app", "create", "--display-name", $AppName, "--query", "appId", "-o", "tsv")).Trim()
  Write-Host "    Created: $clientId"
} else {
  Write-Host "    Reusing: $clientId"
}

Write-Host "4/6 Creating or reusing service principal..."
$spId = (az ad sp list --filter "appId eq '$clientId'" --query "[0].id" -o tsv)
if (-not $spId) {
  $spId = (Invoke-Az @("ad", "sp", "create", "--id", $clientId, "--query", "id", "-o", "tsv")).Trim()
  Write-Host "    Created: $spId"
  Start-Sleep -Seconds 20
} else {
  Write-Host "    Reusing: $spId"
}

Write-Host "5/6 Assigning Website Contributor on $ResourceGroup..."
$scope = "/subscriptions/$subscriptionId/resourceGroups/$ResourceGroup"
$existingRole = (az role assignment list --assignee $spId --role "Website Contributor" --scope $scope --query "[0].id" -o tsv)
if (-not $existingRole) {
  $assigned = $false
  foreach ($attempt in 1..5) {
    az role assignment create --assignee-object-id $spId --assignee-principal-type ServicePrincipal `
      --role "Website Contributor" --scope $scope 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
      $assigned = $true
      break
    }
    Write-Host "    Waiting for the service principal to propagate (attempt $attempt)..."
    Start-Sleep -Seconds 15
  }
  if (-not $assigned) {
    throw "Role assignment failed. You may need Owner or User Access Administrator on the resource group."
  }
  Write-Host "    Assigned."
} else {
  Write-Host "    Already assigned."
}

Write-Host "6/6 Adding GitHub federated credential..."
$subject = "repo:{0}@{1}/{2}@{3}:environment:{4}" -f $repoParts[0], $OwnerId, $repoParts[1], $RepositoryId, $Environment
$issuer = "https://token.actions.githubusercontent.com"
$audience = "api://AzureADTokenExchange"
$credentialName = "github-$Environment"
$existingCredentialJson = (Invoke-Az @("ad", "app", "federated-credential", "list", "--id", $clientId, "-o", "json")) -join "`n"
$existingCredential = $existingCredentialJson |
  ConvertFrom-Json |
  Where-Object { $_.name -eq $credentialName } |
  Select-Object -First 1
$shouldCreateCredential = $true
if ($existingCredential) {
  $existingAudiences = @($existingCredential.audiences)
  if (
    $existingCredential.issuer -eq $issuer -and
    $existingCredential.subject -eq $subject -and
    $existingAudiences.Count -eq 1 -and
    $existingAudiences[0] -eq $audience
  ) {
    $shouldCreateCredential = $false
    Write-Host "    Already exists with the expected issuer, subject, and audience."
  } else {
    Write-Host "    Replacing existing credential '$credentialName' because its claims do not match."
    $null = Invoke-Az @("ad", "app", "federated-credential", "delete", "--id", $clientId, "--federated-credential-id", $existingCredential.id)
  }
}

if ($shouldCreateCredential) {
  $credential = @{
    name      = $credentialName
    issuer    = $issuer
    subject   = $subject
    audiences = @($audience)
  } | ConvertTo-Json -Compress

  # Passing the JSON through a file avoids PowerShell quote-escaping problems.
  $tempFile = Join-Path ([System.IO.Path]::GetTempPath()) "federated-credential.json"
  [System.IO.File]::WriteAllText($tempFile, $credential, (New-Object System.Text.UTF8Encoding($false)))
  try {
    $null = Invoke-Az @("ad", "app", "federated-credential", "create", "--id", $clientId, "--parameters", "@$tempFile")
  } finally {
    Remove-Item $tempFile -ErrorAction SilentlyContinue
  }
  Write-Host "    Created with subject: $subject"
}

Write-Host ""
Write-Host "Done. Add these as GitHub secrets (Settings > Environments > $Environment):"
Write-Host "  AZURE_CLIENT_ID       = $clientId"
Write-Host "  AZURE_TENANT_ID       = $tenantId"
Write-Host "  AZURE_SUBSCRIPTION_ID = $subscriptionId"
