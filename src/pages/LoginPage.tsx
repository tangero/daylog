import LoginForm from "@/components/auth/LoginForm";
import { loginUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <LoginForm onLogin={loginUser} />
        <div className="text-center">
          <Button
            variant="link"
            onClick={() => navigate("/register")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Nemáte účet? Zaregistrujte se
          </Button>
        </div>
      </div>
    </div>
  );
}
