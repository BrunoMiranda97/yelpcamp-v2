import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, Star, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { useCampgrounds, useMapData } from "../hooks/useApp.ts";
import { CampgroundCardSkeleton } from "../components/ui/Skeleton.tsx";
import { Card, Button } from "../components/ui/Layout.tsx";
import ClusterMap from "../components/ClusterMap.tsx";

export default function CampgroundsIndex() {
  const { campgrounds, loading, loadingMore, error, hasMore, fetchMore } = useCampgrounds();
  const { mapData } = useMapData();
  const [search, setSearch] = useState("");
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, fetchMore]);

  const filteredCampgrounds = campgrounds.filter((c: any) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMapData = mapData.filter((c: any) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  );

  if (error) throw new Error(error);

  return (
    <div className="flex flex-col w-full min-h-screen pb-20">
      <ClusterMap campgrounds={filteredMapData} />
      
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2 text-center sm:text-left tracking-tight">Explorer Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl text-center sm:text-left">
            Discover pristine campsites across America. Your next adventure starts here.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link to="/campgrounds/new" className="text-emerald-500 hover:text-emerald-600 font-semibold text-sm transition-colors">
              + Share a Campsite
            </Link>
            
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Find a campsite..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-900 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {filteredCampgrounds.map((camp: any, idx: number) => {
            const isLast = filteredCampgrounds.length === idx + 1;
            return (
              <motion.div
                key={camp._id}
                ref={isLast ? lastElementRef : null}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(idx % 10 * 0.05, 0.5) }}
              >
                <Card className="flex flex-col md:flex-row overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group bg-white dark:bg-slate-900/50 backdrop-blur-sm">
                  <div className="md:w-1/3 min-h-[260px] overflow-hidden relative">
                    <img
                      src={camp.images?.[0]?.url || "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&auto=format&fit=crop"}
                      alt={camp.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-white/20">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {camp.avgRating > 0 ? camp.avgRating : "New"}
                      </span>
                    </div>
                  </div>
                  <div className="md:w-2/3 p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
                          {camp.title}
                        </h3>
                        <div className="text-right">
                          <span className="block text-xl font-black text-emerald-500 dark:text-emerald-400">
                            ${camp.price}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                            per night
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-6 font-sans leading-relaxed">
                        {camp.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                        <MapPin className="w-3.5 h-3.5" />
                        {camp.location}
                      </div>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                      <Link to={`/campgrounds/${camp._id}`} className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto px-10 bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-full transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                          View details
                        </Button>
                      </Link>
                      
                      {camp.author && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">
                            Host: {camp.author.username}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {(loading || loadingMore) && (
          <div className="grid grid-cols-1 gap-8 mt-8">
            {[...Array(loading ? 3 : 1)].map((_, i) => (
              <CampgroundCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && filteredCampgrounds.length === 0 && (
          <div className="text-center py-32 border-2 border-dashed rounded-3xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-6">
              <Search className="text-slate-400" />
            </div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-2">No results found</h4>
            <p className="text-slate-500 font-medium">Try broadening your search or exploring a different region.</p>
          </div>
        )}
        
        {loadingMore && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        )}
        
        {!hasMore && filteredCampgrounds.length > 0 && (
          <div className="text-center py-16">
            <div className="inline-block px-6 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">You've reached the edge of the wilderness</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
