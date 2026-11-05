import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, DollarSign, Image as ImageIcon, Send, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { canModify, useAuth } from "../context/AuthContext.tsx";
import { useCampground } from "../hooks/useCampgrounds.ts";
import { campgroundsApi, errorMessage } from "../services/api.ts";
import { Button, Card } from "../components/ui/Layout.tsx";
import { Skeleton } from "../components/ui/Skeleton.tsx";
import { Modal } from "../components/ui/Modal.tsx";

export default function EditCampground() {
  const { id = "" } = useParams();
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    price: "",
    description: "",
    imageUrl: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth(); // guaranteed by <RequireAuth>
  const { campground, loading, error: loadError } = useCampground(id);

  useEffect(() => {
    if (!campground) return;
    // Only the owner (or an admin) may edit; the API enforces this too
    if (!canModify(user, campground.author?._id)) {
      navigate(`/campgrounds/${id}`, { replace: true });
      return;
    }
    setFormData({
      title: campground.title,
      location: campground.location,
      price: String(campground.price),
      description: campground.description,
      imageUrl: campground.images?.[0]?.url || ""
    });
  }, [campground, user, id, navigate]);

  useEffect(() => {
    if (loadError) setError(loadError.status === 404 ? "Campground not found" : "Failed to load campground data");
  }, [loadError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await campgroundsApi.update(id, { ...formData, price: Number(formData.price) });
      navigate(`/campgrounds/${id}`);
    } catch (err) {
      setError(errorMessage(err, "Failed to update campground"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    setIsDeleteModalOpen(false);
    try {
      await campgroundsApi.remove(id);
      navigate("/campgrounds");
    } catch (err) {
      setError(errorMessage(err, "Failed to delete campground"));
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <Skeleton className="h-[600px] w-full rounded-3xl" />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-slate-500 gap-2 font-mono uppercase text-[10px] tracking-widest">
          <ArrowLeft className="h-3 w-3" />
          <span>Return</span>
        </Button>
        
        <Button 
          variant="danger" 
          size="sm" 
          onClick={() => setIsDeleteModalOpen(true)}
          isLoading={submitting}
          className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest font-mono"
        >
          Destruct
        </Button>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Destruction"
        confirmText="Destroy"
        confirmVariant="danger"
        isLoading={submitting}
      >
        You are about to permanently erase this discovery from the archives. This protocol cannot be reversed. Proceed with caution.
      </Modal>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-8 sm:p-12 shadow-2xl rounded-3xl border-slate-200 dark:border-slate-800 transition-colors">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100 uppercase">Update Site</h1>
            <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Modifying {formData.title}</p>
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
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
                  Nightly Cost
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
               <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>

             <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
                Image URL
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all resize-none"
              />
            </div>

            <Button
              type="submit"
              isLoading={submitting}
              size="lg"
              className="h-14 w-full rounded-2xl text-xs font-black uppercase tracking-[0.3em] font-mono shadow-xl"
            >
              Update Discovery <Send className="ml-2 h-4 w-4 invisible" />
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
