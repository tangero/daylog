import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { logoutUser, getCurrentUser, getUserProfile } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function Header() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    firstName?: string;
    lastName?: string;
  } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setProfile({
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">progressor.work</h1>
          <span className="text-xl font-bold text-muted-foreground">
            {profile?.firstName} {profile?.lastName}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              Profil uživatele
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              Odhlásit se
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
