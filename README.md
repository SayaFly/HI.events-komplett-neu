# event-veranstaltungen.de

Vollständiges Event-Management-System mit Laravel 11 Backend (API) und React + TypeScript + Mantine UI Frontend (Dashboard).

## Projektstruktur

```
/
├── backend/          # Laravel 11 PHP API
├── frontend/         # React + TypeScript + Mantine UI Dashboard
└── database/
    └── schema.sql    # MariaDB Datenbankschema + Seed-Daten
```

## Technologie-Stack

- **Backend:** PHP 8.2 / Laravel 11, JWT-Authentifizierung (tymon/jwt-auth)
- **Frontend:** TypeScript / React 18, Mantine UI v7, Vite, Zustand, Axios
- **Datenbank:** MariaDB 10.6+
- **Webserver:** IIS 7 (web.config für URL-Rewriting enthalten)

## Features

### Dashboard
- Statistik-Übersicht (Einnahmen, Bestellungen, Benutzer, Tickets)
- Einnahmen-Diagramm (letzte 6 Monate)
- Bestätigungsrate-Ring
- Letzte Bestellungen

### Veranstaltungen
- Erstellen, Bearbeiten, Löschen
- Veröffentlichen / Absagen
- Suche und Statusfilter mit Paginierung

### Kategorien
- CRUD mit Farbauswahl und Icon
- Veranstaltungsanzahl pro Kategorie

### Tickets
- Tickettypen: Standard, VIP, Kostenlos, Frühbucher
- Verfügbarkeitsanzeige, Verkaufsstart/-ende

### Bestellungen
- Vollständige Bestellübersicht mit Suche/Filter
- Detailansicht mit Positionen und Zahlungsinfo
- Statusverwaltung

### Benutzerverwaltung
- Rollen: Admin, Veranstalter, Benutzer
- Konto aktivieren/deaktivieren

## Installation

### 1. Datenbank einrichten

```sql
mysql -u root -p < database/schema.sql
```

### 2. Backend (Laravel)

```bash
cd backend
cp .env.example .env
# .env anpassen: DB_*, APP_URL

composer install
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
```

### 3. Frontend (React)

```bash
cd frontend
npm install
npm run build
# dist/ in IIS-Verzeichnis deployen
```

## IIS 7 Deployment

### Backend
- Dokumentenstamm auf `backend/public/` zeigen lassen
- `backend/web.config` und `backend/public/web.config` sind bereits vorhanden
- URL-Rewrite-Modul für IIS muss installiert sein

### Frontend
- Build-Ausgabe (`frontend/dist/`) in IIS-Verzeichnis kopieren
- `frontend/web.config` aus dem Projektverzeichnis in `dist/` kopieren
- Statische Inhalte werden direkt von IIS ausgeliefert

### PHP-Handler für IIS 7
In `applicationHost.config` oder `web.config` des Backend-Verzeichnisses:
```xml
<handlers>
  <add name="PHP_FastCGI" path="*.php" verb="*"
       modules="FastCgiModule"
       scriptProcessor="C:\PHP\php-cgi.exe"
       resourceType="Either" />
</handlers>
```

## Standard-Zugangsdaten

Nach dem Import von `database/schema.sql`:

| E-Mail | Passwort | Rolle |
|---|---|---|
| admin@event-veranstaltungen.de | password | Admin |

**Passwort nach dem ersten Login ändern!**

## API-Endpunkte (Übersicht)

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | /api/v1/auth/login | Anmelden |
| POST | /api/v1/auth/logout | Abmelden |
| GET | /api/v1/dashboard/stats | Dashboard-Statistiken |
| GET | /api/v1/events | Veranstaltungen auflisten |
| POST | /api/v1/events | Veranstaltung erstellen |
| GET | /api/v1/categories | Kategorien auflisten |
| GET | /api/v1/tickets | Tickets auflisten |
| GET | /api/v1/orders | Bestellungen auflisten |
| GET | /api/v1/users | Benutzer auflisten |