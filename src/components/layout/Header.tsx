import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/lib/auth";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold">DayLog</h1>

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
