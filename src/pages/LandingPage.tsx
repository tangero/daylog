import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock, Tag, Filter, BarChart, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-primary mr-2" />
              <span className="text-2xl font-bold">DayLog</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Přihlásit se
              </Button>
              <Button onClick={() => navigate("/register")}>
                Začít zdarma
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Zaznamenávejte svůj čas{" "}
              <span className="text-primary">efektivně</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              DayLog je jednoduchý a intuitivní nástroj pro sledování vašich
              denních aktivit. Pište záznamy přirozeným způsobem a získejte
              přehled o svém čase.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Button
                  onClick={() => navigate("/register")}
                  className="w-full flex items-center justify-center px-8 py-3 text-base font-medium"
                >
                  Vyzkoušet zdarma
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-start">
              <div className="rounded-lg bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Přirozený zápis</h3>
              <p className="mt-2 text-gray-500">
                Zapisujte aktivity tak, jak mluvíte. DayLog automaticky rozpozná
                čas, trvání a tagy.
              </p>
            </div>

            <div className="flex flex-col items-start">
              <div className="rounded-lg bg-primary/10 p-3">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Chytré značky</h3>
              <p className="mt-2 text-gray-500">
                Používejte hashtagy pro kategorizaci aktivit a sledujte, čemu
                věnujete nejvíce času.
              </p>
            </div>

            <div className="flex flex-col items-start">
              <div className="rounded-lg bg-primary/10 p-3">
                <Filter className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Pokročilé filtry</h3>
              <p className="mt-2 text-gray-500">
                Filtrujte a vyhledávejte v záznamech podle data, tagů nebo
                textu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Jak to funguje?
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Jednoduše zapište aktivitu a DayLog se postará o zbytek
            </p>
          </div>

          <div className="mt-16">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-8">
                <div className="font-mono text-sm bg-gray-100 p-4 rounded">
                  22 Jan 2024 8:00 30m Práce na projektu #práce #projekt
                </div>
                <div className="mt-4 text-gray-500">
                  ↓ DayLog automaticky rozpozná
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-primary mr-2" />
                    <span>Datum a čas: 22. ledna 2024, 8:00</span>
                  </div>
                  <div className="flex items-center">
                    <BarChart className="h-4 w-4 text-primary mr-2" />
                    <span>Trvání: 30 minut</span>
                  </div>
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 text-primary mr-2" />
                    <span>Tagy: #práce, #projekt</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-12 sm:px-12 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
              <div className="lg:self-center">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  <span className="block">Připraveni začít?</span>
                </h2>
                <p className="mt-4 text-lg leading-6 text-white/90">
                  Zaregistrujte se zdarma a začněte sledovat svůj čas
                  efektivněji.
                </p>
                <Button
                  onClick={() => navigate("/register")}
                  variant="secondary"
                  className="mt-8"
                >
                  Vytvořit účet zdarma
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-400">DayLog</span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} DayLog. Všechna práva vyhrazena.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
