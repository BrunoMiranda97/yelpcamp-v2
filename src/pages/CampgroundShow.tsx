import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight, MapPin, User, Clock, DollarSign } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence } from "motion/react";
import { Button, Card } from "../components/ui/Layout.tsx";
import { Modal } from "../components/ui/Modal.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import { useTheme } from "../context/ThemeContext.tsx";
import { Skeleton } from "../components/ui/Skeleton.tsx";

export default function CampgroundShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [campground, setCampground] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewBody, setReviewBody] = useState("");
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    fetch(`/api/campgrounds/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCampground(data);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.setStyle(theme === 'dark' ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11");
  }, [theme]);

  useEffect(() => {
    if (loading || !campground || !mapContainer.current) return;
    
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;
    
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: theme === 'dark'
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/light-v11",
      center: campground.geometry?.coordinates || [0, 0],
      zoom: 10,
    });

    const map = mapInstance.current;

    new mapboxgl.Marker({ color: '#10b981' })
      .setLngLat(campground.geometry?.coordinates || [0, 0])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<div class="p-2"><h3 class="font-bold text-slate-800">${campground.title}</h3><p class="text-xs text-slate-500">${campground.location}</p></div>`)
      )
      .addTo(map);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [loading, campground]);

  const nextImage = () => {
    if (!campground?.images) return;
    setCurrentImageIndex((prev) => (prev + 1) % campground.images.length);
  };

  const prevImage = () => {
    if (!campground?.images) return;
    setCurrentImageIndex((prev) => (prev - 1 + campground.images.length) % campground.images.length);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBody) return;

    setSubmittingReview(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/campgrounds/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ body: reviewBody, rating })
      });

      if (!res.ok) throw new Error("Failed to post review");
      
      const savedReview = await res.json();
      setCampground((prev: any) => ({
        ...prev,
        reviews: [...(prev.reviews || []), savedReview]
      }));
      setReviewBody("");
      setRating(5);
    } catch (err) {
      setErrorStatus("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/campgrounds/${id}/reviews/${reviewToDelete}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete");
      setCampground((prev: any) => ({
        ...prev,
        reviews: prev.reviews.filter((r: any) => r._id !== reviewToDelete)
      }));
      setReviewToDelete(null);
    } catch (err) {
      setErrorStatus("Failed to delete review");
    }
  };

  const handleDeleteCampground = async () => {
    setIsDeleteModalOpen(false);
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/campgrounds/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete campground");
      navigate("/campgrounds");
    } catch (err) {
      setErrorStatus("Failed to delete campground");
    }
  };

  if (loading) return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-8">
      <Skeleton className="h-[500px] w-full rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="h-[400px] lg:col-span-2 w-full rounded-2xl" />
        <Skeleton className="h-[400px] col-span-1 w-full rounded-2xl" />
      </div>
    </div>
  );

  const images = campground.images || [];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCampground}
        title="Confirm Deletion"
        confirmText="Delete Site"
        confirmVariant="danger"
      >
        Are you sure you want to remove this campground listing? This action is permanent.
      </Modal>

      <Modal
        isOpen={!!reviewToDelete}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleDeleteReview}
        title="Remove Review"
        confirmText="Remove"
        confirmVariant="danger"
      >
        Are you sure you want to delete this review?
      </Modal>

      <Modal
        isOpen={!!errorStatus}
        onClose={() => setErrorStatus(null)}
        onConfirm={() => setErrorStatus(null)}
        title="Operation Failed"
        confirmText="Acknowledged"
      >
        {errorStatus}
      </Modal>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-10">
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-2xl relative bg-white dark:bg-slate-900/50 backdrop-blur-xl">
            {/* Image Carousel */}
            <div className="relative h-[500px] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={images[currentImageIndex]?.url || "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1200&auto=format&fit=crop"}
                  alt={`${campground.title} - View ${currentImageIndex + 1}`}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>

              {hasMultipleImages && (
                <>
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <button 
                      onClick={prevImage}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white transition-all active:scale-90"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <button 
                      onClick={nextImage}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white transition-all active:scale-90"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${currentImageIndex === idx ? 'bg-white w-4' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-10">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{campground.title}</h1>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-500">${campground.price}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest text-right">Per night</p>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-sans text-lg">
                {campground.description}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    Location
                  </div>
                  <span className="font-semibold text-sm truncate">{campground.location}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" />
                    Submitted by
                  </div>
                  <span className="font-semibold text-sm">{campground.author?.username || "Explorer"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5" />
                    Base Price
                  </div>
                  <span className="font-semibold text-sm">${campground.price}/night</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    Listed
                  </div>
                  <span className="font-semibold text-sm">{new Date(campground.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              {user && (user.id === campground.author?._id || user.isAdmin) && (
                 <div className="flex gap-4 mt-10">
                   <Link to={`/campgrounds/${id}/edit`}>
                     <Button variant="outline" className="px-8 font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">Edit site</Button>
                   </Link>
                   <Button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    variant="danger" 
                    className="px-8 font-bold bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                   >
                    Delete listing
                   </Button>
                 </div>
              )}
            </div>
          </Card>

          {/* Social Proof / Reviews Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Explorer Reviews</h2>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                <span className="text-emerald-500 font-black text-sm">
                  {campground.avgRating > 0 ? campground.avgRating : "Brand New"}
                </span>
                <span className="text-emerald-500/60 text-xs font-bold uppercase tracking-tighter ml-1">
                  ({campground.reviews?.length || 0})
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campground.reviews?.length > 0 ? (
                campground.reviews?.slice().reverse().map((review: any) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={review._id} 
                    className="p-6 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm relative group overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[120px]">
                          {review.author?.username || "Observer"}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Verified Reviewer</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-emerald-500 text-emerald-500" : "text-slate-200 dark:text-slate-800"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed min-h-[60px] italic">"{review.body}"</p>
                    
                    {user && (user.id === review.author?._id || user.isAdmin) && (
                      <button
                        onClick={() => setReviewToDelete(review._id)}
                        className="mt-4 text-[10px] font-black uppercase text-red-500/60 hover:text-red-500 transition-colors tracking-widest"
                      >
                        [ Remove review ]
                      </button>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                   <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Be the first to leave a mark</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Space: Map and Action */}
        <div className="space-y-8 col-span-1">
          <div className="sticky top-24 space-y-8">
            <div 
              ref={mapContainer} 
              className="h-[350px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl"
            />

            <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Leave an Impression</h3>
              
              {user ? (
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Rate your stay</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          onClick={() => setRating(s)} 
                          className={`w-8 h-8 cursor-pointer transition-all active:scale-75 ${rating >= s ? "fill-emerald-500 text-emerald-500" : "text-slate-200 dark:text-slate-800 hover:text-emerald-300"}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Your Journey</label>
                    <textarea
                      required
                      placeholder="Tell us about the wilderness..."
                      rows={5}
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      className="w-full border-0 rounded-2xl p-5 text-sm bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all dark:text-white"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    isLoading={submittingReview} 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-full py-4 shadow-lg shadow-emerald-500/20"
                  >
                    Post impression
                  </Button>
                </form>
              ) : (
                <div className="p-8 border-2 border-dashed rounded-3xl text-center">
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4 leading-relaxed">Sign in to leave a review</p>
                  <Link to="/login">
                    <Button variant="outline" className="w-full rounded-full border-slate-200 dark:border-slate-800 uppercase text-[10px] font-black tracking-widest">Login</Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
