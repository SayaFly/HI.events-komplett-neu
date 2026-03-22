<#
.SYNOPSIS
    Initial IIS configuration for event-veranstaltungen.de on Windows Server 2022.

.DESCRIPTION
    - Enables the required IIS Windows features
    - Registers PHP as a FastCGI handler in IIS
    - Creates two IIS application pools  (API + SPA)
    - Creates two IIS websites           (API + SPA)
    - Creates the deployment directories
    - Grants the app-pool identity Modify rights on
        backend\storage\ and backend\bootstrap\cache\

    Run ONCE on the target server before the first deployment.
    The process must have local Administrator privileges.

.NOTES
    Called by .github/workflows/setup-iis.yml
    Can also be run manually in an elevated PowerShell session:

        .\setup-iis.ps1 `
            -BackendPath   "C:\inetpub\api.event-veranstaltungen.de" `
            -FrontendPath  "C:\inetpub\www.event-veranstaltungen.de" `
            -BackendDomain "api.event-veranstaltungen.de" `
            -FrontendDomain "www.event-veranstaltungen.de" `
            -PhpCgiPath    "C:\PHP\php-cgi.exe" `
            -BackendPool   "event-api" `
            -FrontendPool  "event-frontend" `
            -AppPoolUser   "IIS AppPool\event-api"
#>
[CmdletBinding()]
param (
    [Parameter(Mandatory)][string] $BackendPath,
    [Parameter(Mandatory)][string] $FrontendPath,
    [Parameter(Mandatory)][string] $BackendDomain,
    [Parameter(Mandatory)][string] $FrontendDomain,
    [Parameter(Mandatory)][string] $PhpCgiPath,
    [string] $BackendPool   = 'event-api',
    [string] $FrontendPool  = 'event-frontend',
    [string] $AppPoolUser   = "IIS AppPool\$BackendPool"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ─────────────────────────────────────────────────────────────────────────────
function Write-Step([string]$msg) {
    Write-Host "`n═══ $msg ═══" -ForegroundColor Cyan
}
function Write-OK([string]$msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}
function Write-Skip([string]$msg) {
    Write-Host "  [--] $msg (already configured)" -ForegroundColor DarkGray
}

# ─────────────────────────────────────────────────────────────────────────────
# 1. IIS Windows Features
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Installing IIS Windows features"

$features = @(
    'Web-Server',
    'Web-Common-Http',
    'Web-Default-Doc',
    'Web-Dir-Browsing',
    'Web-Http-Errors',
    'Web-Static-Content',
    'Web-Http-Redirect',
    'Web-Http-Logging',
    'Web-Stat-Compression',
    'Web-Dyn-Compression',
    'Web-Filtering',
    'Web-CGI',
    'Web-ISAPI-Ext',
    'Web-ISAPI-Filter',
    'Web-Mgmt-Console',
    'Web-Mgmt-Compat'
)

foreach ($f in $features) {
    $state = (Get-WindowsFeature -Name $f).InstallState
    if ($state -eq 'Installed') {
        Write-Skip $f
    } else {
        Install-WindowsFeature -Name $f -IncludeManagementTools | Out-Null
        Write-OK $f
    }
}

Import-Module WebAdministration -ErrorAction Stop

# ─────────────────────────────────────────────────────────────────────────────
# 2. PHP FastCGI handler
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Registering PHP FastCGI handler"

if (-not (Test-Path $PhpCgiPath)) {
    Write-Warning "php-cgi.exe not found at '$PhpCgiPath'. Install PHP 8.2+ first, then re-run."
} else {
    $existing = Get-WebConfiguration 'system.webServer/fastCgi/application' |
        Where-Object { $_.fullPath -eq $PhpCgiPath }

    if (-not $existing) {
        Add-WebConfiguration 'system.webServer/fastCgi' -Value @{
            fullPath           = $PhpCgiPath
            maxInstances       = 4
            idleTimeout        = 300
            activityTimeout    = 300
            requestTimeout     = 90
            instanceMaxRequests = 10000
        }
        Write-OK "FastCGI application registered: $PhpCgiPath"
    } else {
        Write-Skip "FastCGI application already registered"
    }

    # Register the *.php handler at the server level
    $handlerName = 'PHP_via_FastCGI'
    $handler = Get-WebConfiguration "system.webServer/handlers/add[@name='$handlerName']" `
                   -PSPath 'MACHINE/WEBROOT/APPHOST' -ErrorAction SilentlyContinue

    if (-not $handler) {
        Add-WebConfiguration 'system.webServer/handlers' `
            -PSPath 'MACHINE/WEBROOT/APPHOST' `
            -Value @{
                name            = $handlerName
                path            = '*.php'
                verb            = 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS'
                modules         = 'FastCgiModule'
                scriptProcessor = $PhpCgiPath
                resourceType    = 'Either'
                requireAccess   = 'Script'
            }
        Write-OK "PHP handler added: $handlerName"
    } else {
        Write-Skip "PHP handler already exists"
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# 3. Deployment directories
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Creating deployment directories"

foreach ($dir in @($BackendPath, $FrontendPath)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-OK "Created: $dir"
    } else {
        Write-Skip $dir
    }
}

# Ensure Laravel's writable directories exist
foreach ($sub in @('storage\app\public', 'storage\framework\cache\data',
                   'storage\framework\sessions', 'storage\framework\views',
                   'storage\logs', 'bootstrap\cache')) {
    $p = Join-Path $BackendPath $sub
    if (-not (Test-Path $p)) {
        New-Item -ItemType Directory -Path $p -Force | Out-Null
        Write-OK "Created: $p"
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# 4. IIS Application Pools
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Creating IIS application pools"

foreach ($pool in @($BackendPool, $FrontendPool)) {
    if (Test-Path "IIS:\AppPools\$pool") {
        Write-Skip "App pool: $pool"
    } else {
        New-WebAppPool -Name $pool | Out-Null
        Set-ItemProperty "IIS:\AppPools\$pool" -Name managedRuntimeVersion -Value ''
        Set-ItemProperty "IIS:\AppPools\$pool" -Name startMode           -Value 'AlwaysRunning'
        Set-ItemProperty "IIS:\AppPools\$pool" -Name autoStart           -Value $true
        Write-OK "App pool created: $pool"
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# 5. IIS Websites
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Creating IIS websites"

$sites = @(
    @{ Name = "event-api";      Pool = $BackendPool;  Path = $BackendPath;  Host = $BackendDomain  },
    @{ Name = "event-frontend"; Pool = $FrontendPool; Path = $FrontendPath; Host = $FrontendDomain }
)

foreach ($s in $sites) {
    if (Get-Website -Name $s.Name -ErrorAction SilentlyContinue) {
        Write-Skip "Website: $($s.Name)"
    } else {
        New-Website `
            -Name            $s.Name `
            -ApplicationPool $s.Pool `
            -PhysicalPath    $s.Path `
            -HostHeader      $s.Host `
            -Port            80 | Out-Null
        Write-OK "Website created: $($s.Name) → $($s.Path)"
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# 6. File-system permissions for the app-pool identity
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Setting file-system permissions for $AppPoolUser"

$writablePaths = @(
    (Join-Path $BackendPath 'storage'),
    (Join-Path $BackendPath 'bootstrap\cache')
)

foreach ($p in $writablePaths) {
    if (-not (Test-Path $p)) {
        New-Item -ItemType Directory -Path $p -Force | Out-Null
    }
    $acl  = Get-Acl $p
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $AppPoolUser,
        'Modify',
        'ContainerInherit,ObjectInherit',
        'None',
        'Allow'
    )
    $acl.SetAccessRule($rule)
    Set-Acl $p $acl
    Write-OK "Modify rights granted on: $p"
}

# Read-only access to the rest of the backend path
$acl  = Get-Acl $BackendPath
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $AppPoolUser,
    'ReadAndExecute',
    'ContainerInherit,ObjectInherit',
    'None',
    'Allow'
)
$acl.SetAccessRule($rule)
Set-Acl $BackendPath $acl
Write-OK "ReadAndExecute rights granted on: $BackendPath"

$acl  = Get-Acl $FrontendPath
$acl.SetAccessRule(
    (New-Object System.Security.AccessControl.FileSystemAccessRule(
        $AppPoolUser,
        'ReadAndExecute',
        'ContainerInherit,ObjectInherit',
        'None',
        'Allow'
    ))
)
Set-Acl $FrontendPath $acl
Write-OK "ReadAndExecute rights granted on: $FrontendPath"

# ─────────────────────────────────────────────────────────────────────────────
Write-Host "`n✅  IIS setup complete." -ForegroundColor Green
Write-Host @"

Next steps:
  1. Install an SSL certificate and add HTTPS bindings for:
       - $BackendDomain  (port 443)
       - $FrontendDomain (port 443)
  2. Add required GitHub Secrets and run the 'CI/CD – Windows Server 2022 / IIS'
     workflow with 'run_seed = true' for the very first deployment.
  3. Change the default admin password after logging in for the first time.
"@
