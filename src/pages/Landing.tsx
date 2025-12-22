import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">
            Progressor
          </h1>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Přihlásit se
            </Link>
            <Link
              to="/register"
              className="btn btn-primary"
            >
              Začít zdarma
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Zaznamenávej svou práci
          <br />
          <span className="text-primary-600">jedním řádkem</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Jednoduchý nástroj pro freelancery a konzultanty.
          Žádné složité formuláře, jen jeden řádek textu a máš hotovo.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/register"
            className="btn btn-primary text-lg px-8 py-4"
          >
            Vyzkoušet zdarma
          </Link>
          <a
            href="#features"
            className="px-8 py-4 text-lg text-gray-700 hover:text-gray-900 transition-colors"
          >
            Zjistit více
          </a>
        </div>
      </section>

      {/* Demo Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Jak to funguje?
          </h3>

          {/* Input Demo */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-primary-200">
              <input
                type="text"
                value="22.1. 30m Konzultace s klientem #development @ACME"
                readOnly
                className="w-full text-lg bg-transparent border-none outline-none text-gray-800"
              />
            </div>
          </div>

          {/* Parsed Output */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <span className="pill pill-date">
              📅 22. ledna
            </span>
            <span className="pill pill-time">
              ⏰ nyní
            </span>
            <span className="pill pill-duration">
              ⏱ 30 minut
            </span>
            <span className="pill pill-description">
              📝 Konzultace s klientem
            </span>
            <span className="pill pill-tag">
              #development
            </span>
            <span className="pill pill-client">
              @ACME
            </span>
          </div>

          <p className="text-center text-gray-600 text-sm">
            Progressor automaticky rozpozná datum, čas, délku práce, popis, projekty i klienty
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Proč Progressor?
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              Bleskově rychlé
            </h4>
            <p className="text-gray-600">
              Jeden řádek textu a máš záznam uložený. Žádné klikání do formulářů,
              žádné vybírání z nabídek. Prostě napiš a hotovo.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              Chytré parsování
            </h4>
            <p className="text-gray-600">
              Automaticky rozpozná datum (včera, 22.1., pondělí), čas, délku práce
              (30m, 2h), hashtagy a klienty. Přizpůsobí se tvému stylu psaní.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              Přehledné statistiky
            </h4>
            <p className="text-gray-600">
              Zobrazí ti, kolik času trávíš na jednotlivých projektech a klientech.
              Ideální pro fakturaci a reporting.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              Snadné vyhledávání
            </h4>
            <p className="text-gray-600">
              Rychle najdeš všechny záznamy pro konkrétního klienta nebo projekt.
              Filtruj podle tagů, klientů nebo data.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💡</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              Inteligentní našeptávač
            </h4>
            <p className="text-gray-600">
              Při psaní # nebo @ ti nabídne tvé nejpoužívanější projekty a klienty.
              Šetří čas a zabraňuje překlepům.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              Postavené pro freelancery
            </h4>
            <p className="text-gray-600">
              Navrženo pro lidi, kteří potřebují rychle logovat práci bez zbytečné
              složitosti. Prostě to funguje.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-primary-600 rounded-2xl p-12 text-white shadow-xl">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Připraven začít?
          </h3>
          <p className="text-xl text-primary-100 mb-8">
            Registrace trvá 30 sekund. Žádná platební karta není potřeba.
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
          >
            Vytvořit účet zdarma
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-600">
          <p className="text-sm">
            &copy; 2025 Progressor. Jednoduchý nástroj pro zaznamenávání práce.
          </p>
        </div>
      </footer>
    </div>
  )
}
