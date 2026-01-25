# Changelog

Všechny významné změny v projektu Progressor jsou dokumentovány v tomto souboru.

Formát je založen na [Keep a Changelog](https://keepachangelog.com/cs/1.0.0/),
a projekt dodržuje [Semantic Versioning](https://semver.org/lang/cs/).

## [0.6.0] - 2026-01-25

### Bezpečnost
- **httpOnly cookies** - JWT tokeny nyní v bezpečných httpOnly cookies místo localStorage
- **Refresh token rotace** - automatická rotace refresh tokenů při každém obnovení
- **Session management** - nová tabulka sessions pro správu přihlášení
- **CSP hlavičky** - Content Security Policy pro ochranu proti XSS
- **Security headers** - X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **JWT hardening** - přidány claims iss, aud, jti pro lepší validaci
- **Sort whitelist** - ochrana ORDER BY proti SQL injection

### Přidáno
- Endpoint `/api/auth/refresh` pro obnovení access tokenu
- Endpoint `/api/auth/logout` pro odhlášení
- Endpoint `/api/auth/logout-all` pro odhlášení ze všech zařízení
- Paginace v API (`limit`, `offset`, `hasMore`)
- ETag caching pro tags a clients endpoints

### Vylepšeno
- **React Query optimalizace** - staleTime 5 min, gcTime 10 min
- **HTTP caching** - ETag + Cache-Control hlavičky
- **Zod validace** - date range a pagination schémata
- CORS omezen na konkrétní domény

### Migrace
- Nová migrace `0006_sessions.sql` pro sessions tabulku
- Po nasazení spustit: `npm run db:migrate:prod`

## [0.5.1] - 2026-01-24

### Vylepšeno
- Výkonnostní optimalizace frontendu
- Databázové optimalizace: indexy, batch operace, eliminace N+1

## [0.5.0] - 2026-01-23

### Bezpečnost
- Bcrypt hashování hesel (cost factor 12)
- Rate limiting na auth endpointy
- Zod validace vstupů
- LIKE pattern escapování

## [0.4.0] - 2025-12-26

### Přidáno
- Odesílání emailů pro reset hesla přes Resend API
- Emaily odesílány z domény prolnuto.cz
- HTML šablona pro reset hesla email

### Vylepšeno
- Přepracovaná CORS implementace pro lepší kompatibilitu
- Lepší error handling v auth endpointech
- Deployment přes GitHub (Cloudflare Pages Git integrace)

### Opraveno
- Oprava autentizace - kompatibilita s Cloudflare Workers
- Oprava chybějícího JWT_SECRET

### Bezpečnost
- Secrets (JWT_SECRET, RESEND_API_KEY) uloženy jako encrypted Cloudflare secrets

## [0.3.0] - 2024-12-22

### Opraveno
- Oprava chyby s datumy při navigaci mezi měsíci ve statistikách
- Oprava UTC timezone problému při ukládání a zobrazování záznamů
- Záznamy se nyní správně zobrazují v odpovídajících měsících

### Přidáno
- Changelog a verzování aplikace
- Odkaz na changelog v patičce

## [0.2.0] - 2024-12-21

### Přidáno
- Modul statistik s přehledem práce za období
- Podpora pro fakturaci - hodinová sazba u klientů
- Export statistik do CSV
- Výběr období (den, týden, měsíc, vlastní rozsah)
- Přehled odpracovaného času podle klientů a tagů
- Landing page s představením aplikace
- Funkce pro obnovení hesla (reset password)
- Stránka pro zapomenuté heslo

### Vylepšeno
- Navigace mezi stránkami Záznamy a Statistiky

## [0.1.0] - 2024-12-20

### Přidáno
- Základní funkcionalita aplikace
- Registrace a přihlašování uživatelů
- Přirozené zadávání záznamů jedním řádkem
- Automatické parsování data, času, délky práce
- Podpora pro tagy (#projekt) a klienty (@klient)
- Seznam záznamů s možností úprav a mazání
- Cloud tagů a seznam klientů
- Filtrování podle tagů, klientů a vyhledávání
- Nasazení na Cloudflare (Pages + Workers + D1)
