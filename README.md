# event-veranstaltungen.de

Vollständiges Event-Management-System für **event-veranstaltungen.de**

**Stack:**
- Backend: **PHP 8.2+ / Laravel 11** (REST API)
- Frontend: **React 18 / TypeScript / Mantine UI 7**
- Datenbank: **MariaDB 10.6+**
- Server: **IIS 7** (Windows Server)

---
Vollständiges Event-Management-System mit Laravel 11 Backend (API) und React + TypeScript + Mantine UI Frontend (Dashboard).

## Projektstruktur

```
/
├── backend/          Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/Api/   API-Controller
│   │   ├── Http/Middleware/        Middlewares
│   │   └── Models/                 Eloquent-Modelle
│   ├── bootstrap/app.php           Laravel 11 Konfiguration
│   ├── config/cors.php             CORS-Konfiguration
│   ├── routes/api.php              API-Routen
│   ├── public/web.config           IIS 7 Backend-Konfiguration
│   └── .env.example                Umgebungsvariablen
│
├── frontend/         React/TypeScript Dashboard
│   ├── src/
│   │   ├── api/          API-Client (Axios)
│   │   ├── components/   UI-Komponenten
│   │   ├── contexts/     Zustand Store (Auth)
│   │   ├── pages/        Seiten
│   │   ├── types/        TypeScript-Typen
│   │   └── utils/        Hilfsfunktionen
│   ├── public/web.config IIS 7 Frontend-Konfiguration
│   └── .env.example      Umgebungsvariablen
│
└── database/
    └── schema.sql        MariaDB-Datenbankschema + Seed-Daten
```

---

## Installation

### 1. Datenbank einrichten (MariaDB)

```sql
SOURCE database/schema.sql;
```

Standard-Admin-Login nach Import:
- **E-Mail:** `admin@event-veranstaltungen.de`
- **Passwort:** `password` (bitte sofort ändern!)

### 2. Backend (Laravel 11)

```bash
cd backend
composer install --no-dev --optimize-autoloader
copy .env.example .env
# .env bearbeiten: DB_*, MAIL_*, APP_URL eintragen
php artisan key:generate
php artisan storage:link
php artisan config:cache
php artisan route:cache
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
copy .env.example .env
# VITE_API_URL auf Ihre API-URL setzen
npm run build
# Build liegt in frontend/dist/
```

---

## IIS 7 Konfiguration

### Voraussetzungen

1. **PHP 8.2+** als FastCGI in IIS installiert (Pfad in `backend/public/web.config` anpassen)
2. **URL Rewrite Module** für IIS installiert
3. **PHP-Erweiterungen:** `pdo_mysql`, `openssl`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`

### Websites einrichten

**API:** `api.event-veranstaltungen.de` → Physischer Pfad: `backend/public/`

**Frontend:** `www.event-veranstaltungen.de` → Physischer Pfad: `frontend/dist/`

### Verzeichnisberechtigungen

IIS-Anwendungspool-Benutzer benötigt **Schreibrechte** auf:
- `backend/storage/`
- `backend/bootstrap/cache/`

---

## Funktionen

- **Dashboard** – Statistiken, Umsatzdiagramm, letzte Bestellungen
- **Events** – CRUD, Status, Kategorien, Duplikation
- **Tickets** – Typen (kostenpflichtig/kostenlos/Spende), Kontingent, Promo-Codes
- **Bestellungen** – Übersicht, Details, Status-Verwaltung, Rückerstattung
- **Teilnehmer** – Suche, Filter, CSV-Export
- **Check-In** – QR-Code/Ticket-Nr. scannen, Echtzeit-Feedback
- **Veranstalter** – Mehrere Veranstalter, Mitarbeiterverwaltung
- **Veranstaltungsorte** – Adresse, Kapazität, Online-Events
- **Nachrichten** – E-Mail an alle Teilnehmer
- **Benutzerverwaltung** – Rollen: Admin, Veranstalter, Mitarbeiter, Besucher
- **Einstellungen** – Website, E-Mail-Konfiguration

---

## Benutzerrollen

| Rolle | Rechte |
|-------|--------|
| `admin` | Vollzugriff |
| `organizer` | Eigene Events, Tickets, Bestellungen, Teilnehmer |
| `staff` | Check-In, Teilnehmerliste |
| `attendee` | Öffentliche API |
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
