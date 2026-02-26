import { Link, useLocation } from "react-router-dom";
import {
  Heart,
  Users,
  ImageIcon,
  PlusCircle,
  UserPlus,
  Home,
} from "lucide-react";
import HomePage from "@/pages/Index";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/matches", label: "Matches", icon: Heart },
  { to: "/posts", label: "Profile", icon: Users },
  { to: "/create-post", label: "Create Post", icon: PlusCircle },
  { to: "/notifications", label: "Notifications", icon: Heart }, // Changed from Profile to Notifications
];

const Navbar = () => {
  const { pathname } = useLocation();

  return (
    <>
      {/* Desktop Nav */}
      <nav className="sticky top-0 z-50 hidden md:block border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="gradient-primary rounded-xl p-2">
              <Heart
                className="h-5 w-5 text-primary-foreground"
                fill="currentColor"
              />
            </div>
            <span className="text-xl font-bold text-foreground">Clique83</span>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  pathname === to
                    ? "gradient-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/90 backdrop-blur-xl">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                pathname === to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
