import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function Landing() {
  const [activeDemo, setActiveDemo] = useState(0)

  const demoExamples = [
    {
      input: "22.1. 2h Schůzka s klientem #meeting @ACME",
      parsed: [
        { type: 'date', icon: '📅', text: '22. ledna', color: 'blue' },
        { type: 'time', icon: '⏰', text: 'nyní', color: 'purple' },
        { type: 'duration', icon: '⏱', text: '2 hodiny', color: 'green' },
        { type: 'description', icon: '📝', text: 'Schůzka s klientem', color: 'gray' },
        { type: 'tag', icon: '#', text: 'meeting', color: 'orange' },
        { type: 'client', icon: '@', text: 'ACME', color: 'pink' }
      ]
    },
    {
      input: "včera 30m Code review #development @TechCorp",
      parsed: [
        { type: 'date', icon: '📅', text: 'včera', color: 'blue' },
        { type: 'time', icon: '⏰', text: 'nyní', color: 'purple' },
        { type: 'duration', icon: '⏱', text: '30 minut', color: 'green' },
        { type: 'description', icon: '📝', text: 'Code review', color: 'gray' },
        { type: 'tag', icon: '#', text: 'development', color: 'orange' },
        { type: 'client', icon: '@', text: 'TechCorp', color: 'pink' }
      ]
    },
    {
      input: "pondělí 14:30 1.5h Workshop pro tým #training",
      parsed: [
        { type: 'date', icon: '📅', text: 'pondělí', color: 'blue' },
        { type: 'time', icon: '⏰', text: '14:30', color: 'purple' },
        { type: 'duration', icon: '⏱', text: '1.5 hodiny', color: 'green' },
        { type: 'description', icon: '📝', text: 'Workshop pro tým', color: 'gray' },
        { type: 'tag', icon: '#', text: 'training', color: 'orange' }
      ]
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demoExamples.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const currentDemo = demoExamples[activeDemo]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 7V12C4 16.418 7.582 20 12 20C16.418 20 20 16.418 20 12V7L12 2Z" fill="white" fillOpacity="0.9"/>
                <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary-600">
              Progressor
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Přihlásit se
            </Link>
            <Link
              to="/register"
              className="btn btn-primary shadow-lg shadow-primary-600/30"
            >
              Začít zdarma
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-primary-700 font-medium text-sm mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          Pro freelancery a konzultanty
        </div>

        <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          Zaznamenávej práci
          <br />
          <span className="bg-gradient-to-r from-primary-600 to-blue-500 text-transparent bg-clip-text">
            jedním řádkem
          </span>
        </h2>

        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Žádné složité formuláře. Prostě napiš jeden řádek textu
          a inteligentní parser udělá zbytek za tebe.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/register"
            className="btn btn-primary text-lg px-8 py-4 shadow-xl shadow-primary-600/30 hover:shadow-2xl hover:shadow-primary-600/40 transition-all transform hover:-translate-y-0.5"
          >
            Vyzkoušet zdarma
          </Link>
          <a
            href="#demo"
            className="px-8 py-4 text-lg text-gray-700 hover:text-gray-900 transition-colors font-medium flex items-center gap-2"
          >
            Ukázat mi to
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Jak to funguje?
          </h3>
          <p className="text-lg text-gray-600">
            Napiš jeden řádek a sleduj, jak se automaticky rozloží na jednotlivé části
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
          {/* Input Animation */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Napiš svůj záznam
            </label>
            <div className="relative bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-1">
              <div className="bg-white rounded-lg p-5 border-2 border-primary-300">
                <div className="text-lg text-gray-800 font-mono">
                  {currentDemo.input}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Arrow */}
          <div className="flex justify-center mb-8">
            <svg className="w-8 h-8 text-primary-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          {/* Parsed Output with Color Coding */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Progressor automaticky rozpozná
            </label>
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex flex-wrap gap-3 justify-center">
                {currentDemo.parsed.map((item, idx) => (
                  <div
                    key={idx}
                    className={`
                      pill pill-${item.type === 'tag' ? 'tag' :
                             item.type === 'client' ? 'client' :
                             item.type === 'duration' ? 'duration' :
                             item.type === 'date' ? 'date' :
                             item.type === 'time' ? 'time' : 'description'}
                      transform transition-all duration-300 hover:scale-110
                      animate-[fadeIn_0.5s_ease-in-out_${idx * 0.1}s_both]
                    `}
                    style={{
                      animationDelay: `${idx * 0.15}s`
                    }}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="font-semibold">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Format Examples */}
          <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Datum</div>
              <div className="text-xs text-gray-500">včera, 22.1., pondělí</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">⏱</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Délka</div>
              <div className="text-xs text-gray-500">30m, 2h, 1.5h</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🏷</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Tagy</div>
              <div className="text-xs text-gray-500">#projekt @klient</div>
            </div>
          </div>

          {/* Demo Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {demoExamples.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDemo(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === activeDemo
                    ? 'bg-primary-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Ukázka ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Proč Progressor?
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Navrženo pro lidi, kteří chtějí zaznamenávat práci rychle a bez zbytečné složitosti
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <span className="text-3xl">⚡</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              Bleskově rychlé
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Jeden řádek textu a máš záznam uložený. Žádné klikání do formulářů,
              žádné vybírání z nabídek. Prostě napiš a hotovo.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🤖</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              Chytré parsování
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Automaticky rozpozná datum (včera, 22.1., pondělí), čas, délku práce
              (30m, 2h, 1.5h), hashtagy a klienty. Přizpůsobí se tvému stylu psaní.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <span className="text-3xl">📊</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              Přehledné statistiky
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Zobrazí ti, kolik času trávíš na jednotlivých projektech a klientech.
              Ideální pro fakturaci a reporting.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🔍</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              Snadné vyhledávání
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Rychle najdeš všechny záznamy pro konkrétního klienta nebo projekt.
              Filtruj podle tagů, klientů nebo data.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <span className="text-3xl">💡</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              Inteligentní našeptávač
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Při psaní # nebo @ ti nabídne tvé nejpoužívanější projekty a klienty.
              Šetří čas a zabraňuje překlepům.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🎯</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              Postavené pro freelancery
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Navrženo pro lidi, kteří potřebují rychle logovat práci bez zbytečné
              složitosti. Prostě to funguje.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-5xl font-bold mb-2">10s</div>
              <div className="text-primary-100 text-lg">průměrný čas zápisu</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100%</div>
              <div className="text-primary-100 text-lg">zdarma navždy</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">0</div>
              <div className="text-primary-100 text-lg">kreditní karta není potřeba</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-br from-primary-600 to-blue-600 rounded-3xl p-12 md:p-16 text-white shadow-2xl relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <h3 className="text-3xl md:text-5xl font-bold mb-4">
              Připraven začít?
            </h3>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Registrace trvá 30 sekund. Žádná platební karta není potřeba.
            </p>
            <Link
              to="/register"
              className="inline-block bg-white text-primary-600 px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Vytvořit účet zdarma
            </Link>
            <p className="mt-6 text-blue-100 text-sm">
              Už máš účet? <Link to="/login" className="underline font-semibold hover:text-white">Přihlas se</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4 7V12C4 16.418 7.582 20 12 20C16.418 20 20 16.418 20 12V7L12 2Z" fill="white" fillOpacity="0.9"/>
                  <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="font-bold text-gray-900">Progressor</div>
                <div className="text-sm text-gray-600">Jednoduchý time tracking</div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link to="/changelog" className="hover:text-primary-600 transition-colors">
                Changelog (v0.4.1)
              </Link>
              <span className="text-gray-400">•</span>
              <span>&copy; 2025-2026 Progressor</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
