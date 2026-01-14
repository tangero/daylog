import { Link } from 'react-router-dom'

const CURRENT_VERSION = '0.4.1'

interface ChangelogEntry {
  version: string
  date: string
  sections: {
    type: 'added' | 'changed' | 'fixed' | 'removed' | 'improved'
    items: string[]
  }[]
}

const changelog: ChangelogEntry[] = [
  {
    version: '0.4.1',
    date: '2025-01-14',
    sections: [
      {
        type: 'added',
        items: [
          'Týdenní statistika hodin po dnech (Po 8h | Út 3h...) s možností listování mezi týdny',
          'Samostatná stránka Hashtagy s přehledem projektů',
          'Samostatná stránka Klienti s přehledem fakturovatelných hodin',
          'Kompaktní vyhledávání přesunuté do hlavičky',
          'Nová favicon s logem Progressor',
          'Moderní landing page s interaktivním demo formátu zápisu',
        ],
      },
      {
        type: 'changed',
        items: [
          'Záznamy seskupeny po dnech s barevným podbarvením',
          'Hlavička dne zobrazuje @Klienti (fakturovatelné) + celkem',
          'Záznamy na jednom řádku: čas + délka + popis',
          'Editace záznamu kliknutím (bez ikony tužky)',
          'Tlačítko [-] pro smazání místo ikony koše',
        ],
      },
      {
        type: 'fixed',
        items: [
          'Parser akceptuje datum s tečkou na konci (13.1. i 13.1)',
        ],
      },
    ],
  },
  {
    version: '0.3.0',
    date: '2024-12-22',
    sections: [
      {
        type: 'fixed',
        items: [
          'Oprava chyby s datumy při navigaci mezi měsíci ve statistikách',
          'Oprava UTC timezone problému při ukládání a zobrazování záznamů',
          'Záznamy se nyní správně zobrazují v odpovídajících měsících',
        ],
      },
      {
        type: 'added',
        items: ['Changelog a verzování aplikace', 'Odkaz na changelog v patičce'],
      },
    ],
  },
  {
    version: '0.2.0',
    date: '2024-12-21',
    sections: [
      {
        type: 'added',
        items: [
          'Modul statistik s přehledem práce za období',
          'Podpora pro fakturaci - hodinová sazba u klientů',
          'Export statistik do CSV',
          'Výběr období (den, týden, měsíc, vlastní rozsah)',
          'Přehled odpracovaného času podle klientů a tagů',
          'Landing page s představením aplikace',
          'Funkce pro obnovení hesla (reset password)',
          'Stránka pro zapomenuté heslo',
        ],
      },
      {
        type: 'improved',
        items: ['Navigace mezi stránkami Záznamy a Statistiky'],
      },
    ],
  },
  {
    version: '0.1.0',
    date: '2024-12-20',
    sections: [
      {
        type: 'added',
        items: [
          'Základní funkcionalita aplikace',
          'Registrace a přihlašování uživatelů',
          'Přirozené zadávání záznamů jedním řádkem',
          'Automatické parsování data, času, délky práce',
          'Podpora pro tagy (#projekt) a klienty (@klient)',
          'Seznam záznamů s možností úprav a mazání',
          'Cloud tagů a seznam klientů',
          'Filtrování podle tagů, klientů a vyhledávání',
          'Nasazení na Cloudflare (Pages + Workers + D1)',
        ],
      },
    ],
  },
]

const sectionLabels: Record<string, { label: string; color: string }> = {
  added: { label: 'Přidáno', color: 'bg-green-100 text-green-800' },
  changed: { label: 'Změněno', color: 'bg-blue-100 text-blue-800' },
  fixed: { label: 'Opraveno', color: 'bg-yellow-100 text-yellow-800' },
  removed: { label: 'Odebráno', color: 'bg-red-100 text-red-800' },
  improved: { label: 'Vylepšeno', color: 'bg-purple-100 text-purple-800' },
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const months = [
    'ledna', 'února', 'března', 'dubna', 'května', 'června',
    'července', 'srpna', 'září', 'října', 'listopadu', 'prosince',
  ]
  return `${day}. ${months[month - 1]} ${year}`
}

export default function Changelog() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              Progressor
            </Link>
            <span className="text-sm text-gray-500">v{CURRENT_VERSION}</span>
          </div>
          <Link
            to="/"
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            Zpět na hlavní stránku
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Changelog</h1>
        <p className="text-gray-600 mb-8">
          Historie změn a nových funkcí v aplikaci Progressor
        </p>

        <div className="space-y-8">
          {changelog.map((entry) => (
            <article
              key={entry.version}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <header className="flex items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  v{entry.version}
                </h2>
                <time className="text-sm text-gray-500">
                  {formatDate(entry.date)}
                </time>
                {entry.version === CURRENT_VERSION && (
                  <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                    Aktuální verze
                  </span>
                )}
              </header>

              <div className="space-y-4">
                {entry.sections.map((section, idx) => (
                  <div key={idx}>
                    <h3
                      className={`inline-block px-2 py-1 text-xs font-medium rounded mb-2 ${sectionLabels[section.type].color}`}
                    >
                      {sectionLabels[section.type].label}
                    </h3>
                    <ul className="space-y-1 ml-4">
                      {section.items.map((item, itemIdx) => (
                        <li
                          key={itemIdx}
                          className="text-gray-700 text-sm flex items-start gap-2"
                        >
                          <span className="text-gray-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-600">
          <p className="text-sm">
            &copy; 2025-2026 Progressor. Jednoduchý nástroj pro zaznamenávání práce.
          </p>
        </div>
      </footer>
    </div>
  )
}
