import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Home, User, Bot, FileText, Users, Building2, UserCheck, Heart, 
  MessageSquare, Search, Bell, LogOut, Briefcase, TrendingUp, Handshake, Sparkles // <-- Add Sparkles here
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  uid: string;
  name: string;
  email: string;
  role: 'artisan' | 'mentor' | 'investor';
}

// MERGED: This object now correctly defines the role-based navigation
const navLinks = {
  artisan: [
  { url: "/dashboard", icon: Home, title: "Dashboard" },
  { url: "/profile", icon: User, title: "Profile" },
  { url: "/ai-tools", icon: Sparkles, title: "AI Tools" }, // Consolidated link
  { url: "/collaboration", icon: Handshake, title: "Collaboration" },
  { url: "/my-business", icon: Building2, title: "My Business" },
  { url: "/marketplace", icon: Briefcase, title: "Marketplace" },
  { url: "/discover-mentors", icon: UserCheck, title: "Discover Mentors" },
  { url: "/my-mentors", icon: Heart, title: "My Mentors" },
  { url: "/forum", icon: MessageSquare, title: "Forum" },
  { url: "/communities", icon: Users, title: "Communities" },
  { url: "/chat", icon: MessageSquare, title: "Chat" },
],
  mentor: [
    { url: "/dashboard", icon: Home, title: "Dashboard" },
    { url: "/profile", icon: User, title: "Profile" },
    { url: "/discover-artisans", icon: Users, title: "Discover Artisans" },
    { url: "/my-artisans", icon: UserCheck, title: "My Artisans" },
    { url: "/forum", icon: MessageSquare, title: "Forum" },
    { url: "/communities", icon: Users, title: "Communities" },
    { url: "/chat", icon: MessageSquare, title: "Chat" },
  ],
  investor: [
    { url: "/dashboard", icon: Home, title: "Dashboard" },
    { url: "/profile", icon: User, title: "Profile" },
    { url: "/discover-artisans", icon: Users, title: "Discover Artisans" },
    { url: "/marketplace", icon: Briefcase, title: "Marketplace" },
    { url: "/portfolio", icon: TrendingUp, title: "Portfolio" },
    { url: "/forum", icon: MessageSquare, title: "Forum" },
    { url: "/communities", icon: Users, title: "Communities" },
    { url: "/chat", icon: MessageSquare, title: "Chat" },
  ]
};


export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('kalasetu_user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('kalasetu_user');
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out",
    });
    navigate('/');
  };

  const getNavigationItems = () => {
    if (!user) return [];
    return navLinks[user.role];
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // This structure now matches your original, polished version
  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="w-64 flex-shrink-0 bg-card border-r border-border flex-col hidden sm:flex">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-hero rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-bold text-foreground">KalaSetu</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {getNavigationItems().map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "hover:bg-muted"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Header - RESTORED from your original design */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 h-full">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground capitalize">
                {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" /> */}
                {/* <Input placeholder="Search..." className="pl-10 w-64" /> */}
              </div>

              {/* <Button size="icon" variant="ghost" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-primary">3</Badge>
              </Button> */}

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <Avatar>
                  <AvatarFallback className="bg-primary text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button size="icon" variant="ghost" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - now correctly constrained */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}