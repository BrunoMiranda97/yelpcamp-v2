import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { User, Plus, Moon, Sun, Tent } from "lucide-react";
import Home from "./pages/Home.tsx";
import CampgroundsIndex from "./pages/CampgroundsIndex.tsx";
import CampgroundShow from "./pages/CampgroundShow.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import NewCampground from "./pages/NewCampground.tsx";
import EditCampground from "./pages/EditCampground.tsx";
import { useAuth } from "./context/AuthContext.tsx";
import { useTheme } from "./context/ThemeContext.tsx";
import { Button } from "./components/ui/Layout.tsx";

export default function App() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen font-sans overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shrink-0 sticky top-0 z-50 transition-all shadow-sm dark:shadow-lg">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold tracking-tight hover:scale-105 transition-transform flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
               <Tent className="w-5 h-5 text-white" />
            </div>
            YelpCamp
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative group py-2">
               Home
               <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/campgrounds" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative group py-2">
               Campgrounds
               <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {user && (
              <Link to="/campgrounds/new" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative group py-2">
                 New Campground
                 <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleTheme}
            className="rounded-full w-9 h-9 p-0 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            {theme === "light" ? <Moon className="h-4 w-4 text-slate-600" /> : <Sun className="h-4 w-4 text-emerald-400" />}
          </Button>

          {user ? (
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">Hello, <span className="text-emerald-600 dark:text-emerald-400 font-bold">{user.username}</span>!</span>
              <button 
                onClick={logout} 
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-6 text-sm font-medium">
              <Link to="/login" className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Login</Link>
              <Link to="/register" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-full font-bold hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-all transform active:scale-95 shadow-xl shadow-slate-200 dark:shadow-white/5">
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 bg-white dark:bg-slate-950 transition-colors">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/campgrounds" element={<CampgroundsIndex />} />
          <Route path="/campgrounds/:id" element={<CampgroundShow />} />
          <Route path="/campgrounds/:id/edit" element={<EditCampground />} />
          <Route path="/campgrounds/new" element={<NewCampground />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>

      <footer className="h-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center px-6 shrink-0 text-slate-500 text-xs transition-colors">
        <p>© 2026 YelpCamp. All rights reserved.</p>
      </footer>
    </div>
  );
}
