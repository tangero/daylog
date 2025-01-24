import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ChangelogPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          ← Zpět
        </Button>

        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-6">Changelog</h1>

          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-primary mb-4">
                [1.0.2] - 2024-01-24
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Added</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Přidáno podrobnější logování pro debugování registrace
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Changed</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Vylepšena konfigurace D1 databáze</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-primary mb-4">
                [1.0.1] - 2024-01-24
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Fixed</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Oprava chybějících tabulek v produkční D1 databázi</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-primary mb-4">
                [1.0.0] - 2024-01-24
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Added</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Základní funkcionalita aplikace</li>
                    <li>Přihlášení a registrace uživatelů</li>
                    <li>Správa aktivit (přidávání, editace, mazání)</li>
                    <li>Filtrování aktivit podle tagů</li>
                    <li>Vyhledávání v aktivitách</li>
                    <li>Emailové notifikace pro registraci a reset hesla</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Fixed</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Oprava registračního procesu a validace</li>
                    <li>Oprava ukládání do D1 databáze</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Changed</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Vylepšení UI/UX designu</li>
                    <li>Optimalizace výkonu při načítání aktivit</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
