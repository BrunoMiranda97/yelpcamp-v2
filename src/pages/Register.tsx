import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, User, Mail, Lock, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext.tsx";
import { Button, Card } from "../components/ui/Layout.tsx";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        authLogin(data.user, data.token);
        navigate("/campgrounds");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px-40px)] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 sm:p-10 shadow-2xl rounded-3xl border-slate-200 dark:border-slate-800 transition-colors">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl">
              <UserPlus className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-slate-100 uppercase">Create Account</h1>
            <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Join the YelpCamp community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
               <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-12 py-3.5 text-sm font-medium text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-12 py-3.5 text-sm font-medium text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-12 py-3.5 text-sm font-medium text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/30 p-4 border border-red-100 dark:border-red-900/30">
                <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase text-center font-mono">{error}</p>
              </div>
            )}

            <Button type="submit" isLoading={loading} size="lg" className="h-14 w-full rounded-2xl text-xs font-black uppercase tracking-[0.2em] font-mono">
              Register <ShieldCheck className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            Already registered? <Link to="/login" className="text-emerald-600 hover:underline">Sign In</Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
