# Changelog

Všechny významné změny v projektu Progressor jsou dokumentovány v tomto souboru.

Formát je založen na [Keep a Changelog](https://keepachangelog.com/cs/1.0.0/),
a projekt dodržuje [Semantic Versioning](https://semver.org/lang/cs/).

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
