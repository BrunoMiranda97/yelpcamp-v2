import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, DollarSign, Image as ImageIcon, AlignLeft, Send, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext.tsx";
import { Button, Card } from "../components/ui/Layout.tsx";

export default function NewCampground() {
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    price: "",
    description: "",
    imageUrl: ""
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("location", formData.location);
      data.append("price", formData.price);
      data.append("description", formData.description);
      data.append("imageUrl", formData.imageUrl);
      
      if (files) {
        for (let i = 0; i < files.length; i++) {
          data.append("images", files[i]);
        }
      }

      const res = await fetch("/api/campgrounds", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // Content-Type is set automatically for FormData
        },
        body: data,
      });

      if (res.ok) {
        const data = await res.json();
        navigate(`/campgrounds/${data._id}`);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to create campground");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-8 text-slate-500 gap-2 font-mono uppercase text-[10px] tracking-widest">
        <ArrowLeft className="h-3 w-3" />
        <span>Directory</span>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-8 sm:p-12 shadow-2xl rounded-3xl border-slate-200 dark:border-slate-800 transition-colors">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100 uppercase">New Discovery</h1>
            <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Register new campground location</p>
          </div>

          {error && (
            <div className="mb-8 rounded-xl bg-red-50 dark:bg-red-950/30 p-4 border border-red-100 dark:border-red-900/30">
              <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase text-center font-mono">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
                  Site Codename
                </label>
                <div className="relative">
                   <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    placeholder="Wild Echo Valley"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
                  Nightly Cycle Cost
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    placeholder="25.00"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
               <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
                Geographic Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  placeholder="Sierra Nevada, CA"
                />
              </div>
            </div>

             <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
                  Campground Visuals (File Selection)
                </label>
                <div className="relative">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 mb-3 text-slate-400" />
                        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight text-center px-4">
                          {files ? `${files.length} file(s) selected` : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono uppercase">PNG, JPG or JPEG</p>
                      </div>
                      <input 
                        type="file" 
                        multiple 
                        className="hidden" 
                        onChange={(e) => setFiles(e.target.files)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
                  Or provide image URL (Optional)
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
                Site Intelligence (Description)
              </label>
              <div className="relative">
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all resize-none"
                  placeholder="Brief history of exploration at this campground..."
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              size="lg"
              className="h-14 w-full rounded-2xl text-xs font-black uppercase tracking-[0.3em] font-mono shadow-xl"
            >
              Initialize Campground <Send className="ml-2 h-4 w-4 invisible" />
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
