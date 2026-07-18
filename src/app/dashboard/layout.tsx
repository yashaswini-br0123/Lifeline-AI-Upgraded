"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  MessageSquare,
  Pill,
  FileText,
  Calendar,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Loader2,
  Search,
  ShoppingBag,
} from "lucide-react";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number | null;
  bloodType: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

interface UserContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  refreshUser: () => Promise<void>;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  refreshUser: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error("Failed to load user:", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Establishing clinical session...</span>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI Companion", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Drug Research", href: "/dashboard/research", icon: Search },
    { name: "Online Pharmacy", href: "/dashboard/pharmacy", icon: ShoppingBag },
    { name: "Medications", href: "/dashboard/medications", icon: Pill },
    { name: "Medical Records", href: "/dashboard/records", icon: FileText },
    { name: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  ];

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser: fetchUser }}>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
        {/* Mobile Header Nav */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 relative z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Activity className="w-4 h-4 text-white animate-pulse" />
            </div>
            <span className="text-md font-bold tracking-tight bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
              Lifeline AI
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-705 transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Sidebar wrapper */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between p-6 transform md:translate-x-0 transition-transform duration-300 md:static md:h-screen ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Logo Section */}
          <div className="space-y-8">
            <div className="hidden md:flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Activity className="w-4.5 h-4.5 text-white animate-pulse" />
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
                Lifeline AI
              </span>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/15 to-indigo-500/5 border-l-2 border-cyan-400 text-cyan-400"
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User profile footer info */}
          <div className="space-y-4 pt-6 border-t border-slate-800">
            {user && (
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors duration-200 cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5 text-rose-400" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          />
        )}

        {/* Page Content viewport */}
        <main className="flex-1 min-w-0 flex flex-col md:h-screen md:overflow-y-auto">
          {children}
        </main>
      </div>
    </UserContext.Provider>
  );
}
