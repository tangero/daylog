# Progressor - Setup Guide

## Prerekvizity

- Node.js 18+
- npm
- Cloudflare účet (free tier stačí)
- Wrangler CLI (nainstaluje se jako závislost)

## Lokální vývoj

### 1. Instalace závislostí

```bash
npm install
```

### 2. Vytvoření D1 databáze

```bash
# Přihlásit se do Cloudflare
npx wrangler login

# Vytvořit databázi
npx wrangler d1 create progressor-db
```

Po vytvoření dostaneš output jako:

```
[[d1_databases]]
binding = "DB"
database_name = "progressor-db"
database_id = "xxxxx-xxxxx-xxxxx"
```

**Zkopíruj `database_id` do `wrangler.toml`** (nahraď `placeholder-id`).

### 3. Aplikace migrací

```bash
# Lokální databáze
npx wrangler d1 execute progressor-db --local --file=./worker/db/migrations/0001_init.sql

# Produkční databáze
npx wrangler d1 execute progressor-db --file=./worker/db/migrations/0001_init.sql
```

### 4. Nastavení JWT secret pro produkci

```bash
npx wrangler secret put JWT_SECRET
# Zadej silný náhodný řetězec
```

### 5. Spuštění vývojového serveru

V jednom terminálu spusť frontend:

```bash
npm run dev
```

V druhém terminálu spusť Worker API:

```bash
npm run worker:dev
```

Aplikace běží na:
- Frontend: http://localhost:5173
- API: http://localhost:8787

## Deployment

### 1. Deploy Worker API

```bash
npm run worker:deploy
```

### 2. Deploy Frontend na Cloudflare Pages

1. Jdi na https://dash.cloudflare.com
2. Pages → Create a project
3. Connect to Git → Vyber repozitář
4. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Environment variables (pokud potřeba)

Nebo pomocí CLI:

```bash
npx wrangler pages deploy dist --project-name=progressor
```

## Struktura projektu

```
progressor/
├── src/                    # Frontend (React)
│   ├── components/         # React komponenty
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utility funkce (parser)
│   └── pages/              # Stránky
├── worker/                 # Backend (Cloudflare Worker)
│   ├── routes/             # API endpointy
│   └── db/migrations/      # SQL migrace
├── public/                 # Statické soubory
├── dist/                   # Build output
├── wrangler.toml           # Cloudflare konfigurace
└── package.json
```

## API Endpointy

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| POST | /api/auth/register | Registrace |
| POST | /api/auth/login | Přihlášení |
| GET | /api/entries | Seznam záznamů |
| POST | /api/entries | Nový záznam |
| DELETE | /api/entries/:id | Smazat záznam |
| GET | /api/tags | Seznam tagů |
| GET | /api/clients | Seznam klientů |
| GET | /api/health | Health check |

## Formát věty

```
[DATUM] [ČAS] [DÉLKA] POPIS [#tagy] [@klient]
```

Příklady:
- `30m Práce na projektu #dev @acme`
- `22.1. 8:00 1h Meeting s týmem #meeting`
- `1.5h Code review #dev #review @klient`

## Troubleshooting

### npm install selhává s EPERM

```bash
npm install --cache /tmp/npm-cache
```

### Wrangler nevidi databázi

Zkontroluj, že `database_id` v `wrangler.toml` odpovídá skutečné databázi:

```bash
npx wrangler d1 list
```
