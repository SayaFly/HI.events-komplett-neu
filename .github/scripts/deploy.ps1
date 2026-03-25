<#
.SYNOPSIS
    Deployment-Skript für dev-veranstaltungen.de auf Windows Server 2022 / IIS.

.DESCRIPTION
    Vollautomatisches Deployment ohne GitHub Actions oder YAML-Workflows.
    Führt den gesamten Build- und Deployment-Prozess direkt auf dem Server aus.

    Ablauf:
      Phase 1  – Backend-Abhängigkeiten installieren (Composer)
      Phase 2  – Frontend bauen (npm ci + Vite + web.config kopieren)
      Phase 3  – Dateien deployen (Robocopy → IIS-Verzeichnisse)
      Phase 4  – Laravel .env konfigurieren
      Phase 5  – Datenbankmigrationen ausführen (optional)
      Phase 6  – Datenbank-Seeder ausführen (optional, nur beim ersten Deployment)
      Phase 7  – Dateisystemrechte setzen
      Phase 8  – Laravel-Caches aufwärmen
      Phase 9  – IIS-Anwendungspools neu starten
      Phase 10 – Smoke-Test des Health-Endpunkts

    Voraussetzungen:
      • Windows Server 2022 mit IIS, eingerichtet durch setup-iis.ps1
      • PHP 8.2+, Composer und Node.js 20 LTS auf dem Server installiert
      • Skript muss unter einem Konto mit lokalen Administratorrechten ausgeführt werden

    Manueller Aufruf (in einer erhöhten PowerShell-Sitzung):

        .\deploy.ps1 `
            -QuellPfad    "C:\deploy\HI.events-komplett-neu" `
            -BackendPfad  "C:\inetpub\api.dev-veranstaltungen.de" `
            -FrontendPfad "C:\inetpub\dev-veranstaltungen.de" `
            -AppKey       "base64:..." `
            -AppUrl       "https://api.dev-veranstaltungen.de" `
            -ViteApiUrl   "https://api.dev-veranstaltungen.de/api" `
            -DbHost       "127.0.0.1" `
            -DbDatenbank  "event_veranstaltungen" `
            -DbBenutzer   "ev_user" `
            -DbPasswort   "sicheres_passwort" `
            -JwtSecret    "jwt_geheimnis" `
            -Migrationen

        (Parameter -Seeder zusätzlich nur beim allerersten Deployment angeben.)

    APP_KEY erzeugen (einmalig, vor dem ersten Deployment):
        php artisan key:generate --show

    JWT_SECRET erzeugen (einmalig, vor dem ersten Deployment):
        php artisan jwt:secret --show

.NOTES
    Ersetzt den GitHub Actions Workflow deploy.yml.
    Läuft nach der einmaligen Servereinrichtung mit setup-iis.ps1.
#>
[CmdletBinding()]
param (
    # ── Quellcode ──────────────────────────────────────────────────────────────
    [Parameter(Mandatory)][string] $QuellPfad,
    # Lokales Verzeichnis mit dem geklonten Repository (z. B. C:\deploy\HI.events-komplett-neu)

    # ── Deployment-Ziele ───────────────────────────────────────────────────────
    [Parameter(Mandatory)][string] $BackendPfad,
    # IIS-Dokumentenstamm für das Backend   (z. B. C:\inetpub\api.dev-veranstaltungen.de)
    [Parameter(Mandatory)][string] $FrontendPfad,
    # IIS-Dokumentenstamm für das Frontend  (z. B. C:\inetpub\dev-veranstaltungen.de)

    # ── IIS-Konfiguration ──────────────────────────────────────────────────────
    [string] $BackendPool  = 'event-api',
    [string] $FrontendPool = 'event-frontend',
    [string] $AppPoolUser  = 'IIS AppPool\event-api',

    # ── Laravel .env ───────────────────────────────────────────────────────────
    [Parameter(Mandatory)][string] $AppKey,
    [Parameter(Mandatory)][string] $AppUrl,
    [Parameter(Mandatory)][string] $DbHost,
    [string]              $DbPort      = '3306',
    [Parameter(Mandatory)][string] $DbDatenbank,
    [Parameter(Mandatory)][string] $DbBenutzer,
    [Parameter(Mandatory)][string] $DbPasswort,
    [string]              $MailPasswort = '',
    [Parameter(Mandatory)][string] $JwtSecret,

    # ── Frontend-Build ─────────────────────────────────────────────────────────
    [Parameter(Mandatory)][string] $ViteApiUrl,

    # ── Optionale Schritte ─────────────────────────────────────────────────────
    [switch] $Migrationen,   # Datenbankmigrationen ausführen
    [switch] $Seeder         # Datenbank-Seeder ausführen (nur beim ersten Deployment)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ─────────────────────────────────────────────────────────────────────────────
# Hilfsfunktionen
# ─────────────────────────────────────────────────────────────────────────────
function Write-Schritt([string]$Nachricht) {
    Write-Host "`n═══ $Nachricht ═══" -ForegroundColor Cyan
}
function Write-OK([string]$Nachricht) {
    Write-Host "  [OK] $Nachricht" -ForegroundColor Green
}
function Write-Info([string]$Nachricht) {
    Write-Host "  [--] $Nachricht" -ForegroundColor DarkGray
}

$Startzeit = Get-Date

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1 – Backend-Abhängigkeiten installieren (Composer)
# ─────────────────────────────────────────────────────────────────────────────
Write-Schritt "Phase 1 – Backend-Abhängigkeiten installieren (Composer)"

$BackendQuelle = Join-Path $QuellPfad 'backend'
if (-not (Test-Path $BackendQuelle)) {
    throw "Backend-Quellverzeichnis nicht gefunden: $BackendQuelle"
}

Push-Location $BackendQuelle
try {
    composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress
    Write-OK "Composer install abgeschlossen"
} finally {
    Pop-Location
}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2 – Frontend bauen (npm + Vite)
# ─────────────────────────────────────────────────────────────────────────────
Write-Schritt "Phase 2 – Frontend bauen (npm + Vite)"

$FrontendQuelle = Join-Path $QuellPfad 'frontend'
if (-not (Test-Path $FrontendQuelle)) {
    throw "Frontend-Quellverzeichnis nicht gefunden: $FrontendQuelle"
}

Push-Location $FrontendQuelle
try {
    "VITE_API_URL=$ViteApiUrl" | Set-Content .env -Encoding UTF8
    Write-OK "Frontend .env geschrieben (VITE_API_URL=$ViteApiUrl)"

    npm ci --no-audit
    Write-OK "npm ci abgeschlossen"

    npm run build
    Write-OK "Vite-Build abgeschlossen"

    # IIS web.config in den dist-Ordner kopieren
    Copy-Item (Join-Path $FrontendQuelle 'web.config') `
              (Join-Path $FrontendQuelle 'dist\web.config') -Force
    Write-OK "IIS web.config in dist/ kopiert"
} finally {
    Pop-Location
}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3 – Dateien deployen (Robocopy → IIS-Verzeichnisse)
# ─────────────────────────────────────────────────────────────────────────────
Write-Schritt "Phase 3 – Dateien deployen (Robocopy)"

# Backend deployen
robocopy $BackendQuelle $BackendPfad /MIR /XD ".git" "tests" /XF ".gitignore" /NFL /NDL /NJH /NJS
if ($LASTEXITCODE -gt 7) { throw "robocopy (Backend) fehlgeschlagen mit Exit-Code $LASTEXITCODE" }
Write-OK "Backend deployt nach: $BackendPfad"

# Frontend deployen (nur den kompilierten dist-Ordner)
$FrontendDist = Join-Path $FrontendQuelle 'dist'
robocopy $FrontendDist $FrontendPfad /MIR /NFL /NDL /NJH /NJS
if ($LASTEXITCODE -gt 7) { throw "robocopy (Frontend) fehlgeschlagen mit Exit-Code $LASTEXITCODE" }
Write-OK "Frontend deployt nach: $FrontendPfad"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 4 – Laravel .env konfigurieren
# ─────────────────────────────────────────────────────────────────────────────
Write-Schritt "Phase 4 – Backend .env konfigurieren"

$EnvDatei = Join-Path $BackendPfad '.env'
if (-not (Test-Path $EnvDatei)) {
    Copy-Item (Join-Path $BackendPfad '.env.example') $EnvDatei -Force
    Write-Info ".env aus .env.example erstellt"
}

$Inhalt = Get-Content $EnvDatei -Raw

# Grundeinstellungen
$Inhalt = $Inhalt -replace '(?m)^APP_KEY=.*',       "APP_KEY=$AppKey"
$Inhalt = $Inhalt -replace '(?m)^APP_URL=.*',       "APP_URL=$AppUrl"
$Inhalt = $Inhalt -replace '(?m)^APP_ENV=.*',       'APP_ENV=production'
$Inhalt = $Inhalt -replace '(?m)^APP_DEBUG=.*',     'APP_DEBUG=false'

# Datenbankverbindung
$Inhalt = $Inhalt -replace '(?m)^DB_CONNECTION=.*', 'DB_CONNECTION=mariadb'
$Inhalt = $Inhalt -replace '(?m)^DB_HOST=.*',       "DB_HOST=$DbHost"
$Inhalt = $Inhalt -replace '(?m)^DB_PORT=.*',       "DB_PORT=$DbPort"
$Inhalt = $Inhalt -replace '(?m)^DB_DATABASE=.*',   "DB_DATABASE=$DbDatenbank"
$Inhalt = $Inhalt -replace '(?m)^DB_USERNAME=.*',   "DB_USERNAME=$DbBenutzer"
$Inhalt = $Inhalt -replace '(?m)^DB_PASSWORD=.*',   "DB_PASSWORD=$DbPasswort"

# Mail (nur wenn angegeben)
if ($MailPasswort) {
    $Inhalt = $Inhalt -replace '(?m)^MAIL_PASSWORD=.*', "MAIL_PASSWORD=$MailPasswort"
}

# JWT-Secret (ergänzen falls nicht vorhanden)
if ($Inhalt -notmatch '(?m)^JWT_SECRET=') {
    $Inhalt += "`nJWT_SECRET=$JwtSecret`n"
} else {
    $Inhalt = $Inhalt -replace '(?m)^JWT_SECRET=.*', "JWT_SECRET=$JwtSecret"
}

Set-Content $EnvDatei $Inhalt -NoNewline -Encoding UTF8
Write-OK ".env konfiguriert"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 5 – Datenbankmigrationen (optional)
# ─────────────────────────────────────────────────────────────────────────────
if ($Migrationen) {
    Write-Schritt "Phase 5 – Datenbankmigrationen ausführen"
    Push-Location $BackendPfad
    try {
        php artisan migrate --force --ansi
        Write-OK "Migrationen abgeschlossen"
    } finally {
        Pop-Location
    }
} else {
    Write-Info "Phase 5 – Migrationen übersprungen (Parameter -Migrationen nicht gesetzt)"
}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 6 – Datenbank-Seeder (optional, nur beim ersten Deployment)
# ─────────────────────────────────────────────────────────────────────────────
if ($Seeder) {
    Write-Schritt "Phase 6 – Datenbank-Seeder ausführen"
    Push-Location $BackendPfad
    try {
        php artisan db:seed --force --ansi
        Write-OK "Seeder abgeschlossen"
    } finally {
        Pop-Location
    }
} else {
    Write-Info "Phase 6 – Seeder übersprungen (Parameter -Seeder nicht gesetzt; nur beim ersten Deployment nötig)"
}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 7 – Dateisystemrechte setzen
# ─────────────────────────────────────────────────────────────────────────────
Write-Schritt "Phase 7 – Dateisystemrechte setzen für $AppPoolUser"

$SchreibPfade = @(
    (Join-Path $BackendPfad 'storage'),
    (Join-Path $BackendPfad 'bootstrap\cache')
)

foreach ($Pfad in $SchreibPfade) {
    if (-not (Test-Path $Pfad)) {
        New-Item -ItemType Directory -Path $Pfad -Force | Out-Null
    }
    $Acl   = Get-Acl $Pfad
    $Regel = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $AppPoolUser,
        'Modify',
        'ContainerInherit,ObjectInherit',
        'None',
        'Allow'
    )
    $Acl.SetAccessRule($Regel)
    Set-Acl $Pfad $Acl
    Write-OK "Schreibrechte (Modify) gesetzt: $Pfad"
}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 8 – Laravel-Caches aufwärmen
# ─────────────────────────────────────────────────────────────────────────────
Write-Schritt "Phase 8 – Laravel-Caches aufwärmen"

Push-Location $BackendPfad
try {
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    Write-OK "Laravel-Caches optimiert (config, route, view)"
} finally {
    Pop-Location
}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 9 – IIS-Anwendungspools neu starten
# ─────────────────────────────────────────────────────────────────────────────
Write-Schritt "Phase 9 – IIS-Anwendungspools neu starten"

Import-Module WebAdministration -ErrorAction Stop

foreach ($Pool in @($BackendPool, $FrontendPool)) {
    if (Test-Path "IIS:\AppPools\$Pool") {
        Restart-WebAppPool -Name $Pool
        Write-OK "Anwendungspool neu gestartet: $Pool"
    } else {
        Write-Warning "Anwendungspool nicht gefunden: $Pool"
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 10 – Smoke-Test
# ─────────────────────────────────────────────────────────────────────────────
Write-Schritt "Phase 10 – Smoke-Test"

$HealthUrl = "$AppUrl/up"
try {
    $Antwort = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 15
    Write-OK "Health-Check erfolgreich – HTTP $($Antwort.StatusCode) ($HealthUrl)"
} catch {
    Write-Warning "Health-Check fehlgeschlagen (Endpunkt möglicherweise noch nicht erreichbar): $_"
}

# ─────────────────────────────────────────────────────────────────────────────
$Dauer = (Get-Date) - $Startzeit
Write-Host "`n✅  Deployment abgeschlossen in $([math]::Round($Dauer.TotalSeconds, 1)) Sekunden." -ForegroundColor Green
Write-Host @"

Nächste Schritte:
  1. Anwendung im Browser aufrufen:
       Frontend: $(($AppUrl -replace 'api\.',''))
       Backend:  $AppUrl
  2. Standard-Admin-Passwort sofort ändern (Login: admin@dev-veranstaltungen.de / password).
"@
