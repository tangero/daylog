import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!getCurrentUser()) {
      navigate("/login");
    }
  }, [navigate]);

  return <>{children}</>;
}
