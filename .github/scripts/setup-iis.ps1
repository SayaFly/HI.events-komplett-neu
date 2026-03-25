<#
.SYNOPSIS
    Initial IIS configuration for dev-veranstaltungen.de on Windows Server 2022.

.DESCRIPTION
    Fully automated setup that installs and configures EVERYTHING the project needs
    from scratch on a fresh Windows Server 2022 machine (including Standard Evaluation).
    Compatible with both Windows PowerShell 5.1 and PowerShell 7.x (pwsh).

    Phase 1 – Package manager
        - Installs Chocolatey (Windows package manager) if not already present.

    Phase 2 – Runtime dependencies
        - Visual C++ Redistributable 2015-2022 (x64) – required by PHP
        - PHP 8.2 (NTS, x64) with all required extensions
        - Composer (PHP dependency manager)
        - Node.js 20 LTS (includes npm)

    Phase 3 – IIS & web platform components
        - Enables all required IIS Windows features (Web-Server, CGI, compression …)
        - Installs IIS URL Rewrite Module 2.1

    Phase 4 – IIS site configuration
        - Registers PHP as a FastCGI handler
        - Creates two IIS application pools  (API + SPA)
        - Creates two IIS websites           (API + SPA)
        - Creates the deployment directories and Laravel writable sub-directories
        - Grants the app-pool identity the required file-system permissions

    Run ONCE on the target server before the first deployment.
    The process must have local Administrator privileges.

    NOTE: The GitHub Actions self-hosted runner must be installed and registered
    (labelled "IIS") on this server BEFORE triggering any deployment workflow.
    See: https://docs.github.com/en/actions/hosting-your-own-runners/adding-self-hosted-runners

.NOTES
    Called by .github/workflows/setup-iis.yml
    Can also be run manually in an elevated PowerShell session:

        .\setup-iis.ps1 `
            -BackendPath   "C:\inetpub\api.dev-veranstaltungen.de" `
            -FrontendPath  "C:\inetpub\dev-veranstaltungen.de" `
            -BackendDomain "api.dev-veranstaltungen.de" `
            -FrontendDomain "dev-veranstaltungen.de" `
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
    # Default matches Chocolatey's php package install location
    [string] $PhpCgiPath    = 'C:\tools\php82\php-cgi.exe',
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

# Helper: import a module with Windows PowerShell compatibility shim when running
# under PowerShell 7+ (Core edition), where modules like ServerManager and
# WebAdministration are not natively available.
function Import-CompatModule([string]$Name) {
    if ($PSVersionTable.PSEdition -eq 'Core') {
        Import-Module $Name -UseWindowsPowerShell -ErrorAction Stop
    } else {
        Import-Module $Name -ErrorAction Stop
    }
}

# Helper: install a Chocolatey package only when it is not already present.
function Install-ChocoPackage {
    param(
        [string]$Name,
        [string]$Version = '',
        [string[]]$Params = @()
    )
    # choco list is local-only by default in Chocolatey 2.x; --exact matches the package name exactly.
    $installed = choco list --exact $Name 2>$null | Select-String "^$Name "
    if ($installed) {
        Write-Skip "choco: $Name"
        return
    }
    $chocoArgs = @('install', $Name, '-y', '--no-progress')
    if ($Version) { $chocoArgs += "--version=$Version" }
    if ($Params)  { $chocoArgs += $Params }
    & choco @chocoArgs
    Write-OK "Installed: $Name"
}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1 – Chocolatey (Windows package manager)
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Phase 1 – Installing Chocolatey"

if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = `
        [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression (
        (New-Object System.Net.WebClient).DownloadString(
            'https://community.chocolatey.org/install.ps1'
        )
    )
    # Reload PATH so that choco is immediately available in this session
    $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                [System.Environment]::GetEnvironmentVariable('Path', 'User')
    Write-OK "Chocolatey installed"
} else {
    Write-Skip "Chocolatey"
}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2 – Runtime dependencies
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Phase 2 – Installing runtime dependencies"

# Visual C++ Redistributable 2015-2022 (x64) – required by PHP NTS builds
Install-ChocoPackage -Name 'vcredist140'

# PHP 8.2 NTS (non-thread-safe) for IIS FastCGI
Install-ChocoPackage -Name 'php' -Version '8.2.*' -Params @(
    '--params', '"/InstallDir:C:\tools\php82 /ThreadSafe:false"'
)

# Ensure the PHP install directory is in the system PATH
$phpDir = Split-Path $PhpCgiPath
$machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
if ($machinePath -notlike "*$phpDir*") {
    [System.Environment]::SetEnvironmentVariable(
        'Path', "$machinePath;$phpDir", 'Machine'
    )
    $env:Path += ";$phpDir"
    Write-OK "Added $phpDir to system PATH"
} else {
    Write-Skip "PHP directory already in PATH"
}

# Verify php.exe is usable and enable the extensions required by Laravel
$phpIni = Join-Path $phpDir 'php.ini'
if (Test-Path (Join-Path $phpDir 'php.ini-production')) {
    if (-not (Test-Path $phpIni)) {
        Copy-Item (Join-Path $phpDir 'php.ini-production') $phpIni
        Write-OK "Created php.ini from php.ini-production"
    }
}
if (Test-Path $phpIni) {
    $ini = Get-Content $phpIni -Raw
    $extensions = @(
        'extension=pdo_mysql',
        'extension=openssl',
        'extension=mbstring',
        'extension=tokenizer',
        'extension=xml',
        'extension=ctype',
        'extension=json',
        'extension=bcmath',
        'extension=intl',
        'extension=fileinfo',
        'extension=gd',
        'extension=curl',
        'extension=zip'
    )
    $changed = $false
    foreach ($ext in $extensions) {
        # Uncomment if commented out (;extension=…) or append if missing
        $extName = $ext -replace 'extension=', ''
        if ($ini -match "(?m)^;$([regex]::Escape($ext))") {
            $ini = $ini -replace "(?m)^;$([regex]::Escape($ext))", $ext
            $changed = $true
        } elseif ($ini -notmatch "(?m)^$([regex]::Escape($ext))") {
            $ini += "`n$ext"
            $changed = $true
        }
    }
    # Set post/upload size limits
    if ($ini -notmatch '(?m)^post_max_size\s*=\s*64M') {
        $ini = $ini -replace '(?m)^post_max_size\s*=.*',       'post_max_size = 64M'
        $changed = $true
    }
    if ($ini -notmatch '(?m)^upload_max_filesize\s*=\s*64M') {
        $ini = $ini -replace '(?m)^upload_max_filesize\s*=.*', 'upload_max_filesize = 64M'
        $changed = $true
    }
    if ($changed) {
        Set-Content $phpIni $ini -NoNewline
        Write-OK "php.ini updated with required extensions"
    } else {
        Write-Skip "php.ini extensions already enabled"
    }
}

# Composer
Install-ChocoPackage -Name 'composer'

# Node.js 20 LTS (bundles npm)
Install-ChocoPackage -Name 'nodejs-lts' -Version '20.*'

# Reload PATH after installing Node / Composer so they are available below
$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
            [System.Environment]::GetEnvironmentVariable('Path', 'User')

Write-OK "Runtime dependencies ready"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3 – IIS Windows Features + URL Rewrite Module
# ─────────────────────────────────────────────────────────────────────────────
Write-Step "Phase 3 – Enabling IIS Windows features"

# ServerManager provides Get-WindowsFeature / Install-WindowsFeature.
# On PS7 (Core edition) this module needs the Windows PowerShell compatibility shim.
Import-CompatModule 'ServerManager'

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

Import-CompatModule 'WebAdministration'

# IIS URL Rewrite Module 2.1 (required for Laravel / SPA routing)
Write-Step "Installing IIS URL Rewrite Module"
$rewriteKey = 'HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite'
if (Test-Path $rewriteKey) {
    Write-Skip "IIS URL Rewrite Module"
} else {
    # Download and install the MSI silently
    $msiUrl  = 'https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi'
    $msiPath = "$env:TEMP\rewrite_amd64.msi"
    Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /quiet /norestart" -Wait
    Remove-Item $msiPath -Force
    Write-OK "IIS URL Rewrite Module installed"
}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 4 – IIS site configuration
# ─────────────────────────────────────────────────────────────────────────────

# ── 4.1  PHP FastCGI handler ────────────────────────────────────────────────
Write-Step "Registering PHP FastCGI handler"

if (-not (Test-Path $PhpCgiPath)) {
    Write-Warning "php-cgi.exe not found at '$PhpCgiPath'. Verify the PHP install path and re-run."
} else {
    $existing = Get-WebConfiguration 'system.webServer/fastCgi/application' |
        Where-Object { $_.fullPath -eq $PhpCgiPath }

    if (-not $existing) {
        Add-WebConfiguration 'system.webServer/fastCgi' -Value @{
            fullPath            = $PhpCgiPath
            maxInstances        = 4
            idleTimeout         = 300
            activityTimeout     = 300
            requestTimeout      = 90
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

# ── 4.2  Deployment directories ─────────────────────────────────────────────
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

# ── 4.3  IIS Application Pools ──────────────────────────────────────────────
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

# ── 4.4  IIS Websites ───────────────────────────────────────────────────────
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

# ── 4.5  File-system permissions for the app-pool identity ──────────────────
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
Write-Host "`n✅  IIS-Einrichtung abgeschlossen." -ForegroundColor Green
Write-Host @"

Nächste Schritte:
  1. SSL-Zertifikat installieren und HTTPS-Bindings (Port 443) einrichten für:
       - $BackendDomain
       - $FrontendDomain

  2. Repository auf den Server klonen oder kopieren, z. B.:
       git clone https://github.com/SayaFly/HI.events-komplett-neu C:\deploy\HI.events-komplett-neu

  3. APP_KEY und JWT_SECRET einmalig erzeugen (im backend-Verzeichnis des Quellcodes):
       php artisan key:generate --show
       php artisan jwt:secret  --show

  4. Deployment-Skript als Administrator ausführen (beim ersten Deployment mit -Migrationen und -Seeder):
       .\.github\scripts\deploy.ps1 ``
           -QuellPfad    "C:\deploy\HI.events-komplett-neu" ``
           -BackendPfad  "$BackendPath" ``
           -FrontendPfad "$FrontendPath" ``
           -AppKey       "base64:..." ``
           -AppUrl       "https://$BackendDomain" ``
           -ViteApiUrl   "https://$BackendDomain/api" ``
           -DbHost       "127.0.0.1" ``
           -DbDatenbank  "event_veranstaltungen" ``
           -DbBenutzer   "ev_user" ``
           -DbPasswort   "sicheres_passwort" ``
           -JwtSecret    "jwt_geheimnis" ``
           -Migrationen ``
           -Seeder

  5. Standard-Admin-Passwort nach dem ersten Login sofort ändern (admin@dev-veranstaltungen.de / password).
"@

