import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VerificationPendingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white text-center">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Ověřte svůj email</h1>
          <p className="text-gray-500">
            Na váš email jsme odeslali odkaz pro ověření. Prosím zkontrolujte
            svou emailovou schránku a klikněte na odkaz pro dokončení
            registrace.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            Přejít na přihlášení
          </Button>
          <p className="text-sm text-gray-500">
            Neobdrželi jste email?{" "}
            <Button variant="link" className="p-0 h-auto">
              Poslat znovu
            </Button>
          </p>
        </div>
      </Card>
    </div>
  );
}
