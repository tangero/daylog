import LoginForm from "@/components/auth/LoginForm";
import { loginUser } from "@/lib/auth";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <LoginForm onLogin={loginUser} />
    </div>
  );
}
