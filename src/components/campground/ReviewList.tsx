import { Star } from "lucide-react";
import { motion } from "motion/react";
import { canModify } from "../../context/AuthContext.tsx";
import type { Review, User } from "../../types.ts";

interface ReviewListProps {
  reviews: Review[];
  avgRating: number;
  user: User | null;
  onDelete: (reviewId: string) => void;
}

export function ReviewList({ reviews, avgRating, user, onDelete }: ReviewListProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Explorer Reviews</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
          <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
          <span className="text-emerald-500 font-black text-sm">{avgRating > 0 ? avgRating : "Brand New"}</span>
          <span className="text-emerald-500/60 text-xs font-bold uppercase tracking-tighter ml-1">({reviews.length})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.length > 0 ? (
          reviews
            .slice()
            .reverse()
            .map((review) => (
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
                  <div className="flex gap-0.5" aria-label={`Rated ${review.rating} out of 5`}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < review.rating ? "fill-emerald-500 text-emerald-500" : "text-slate-200 dark:text-slate-800"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed min-h-[60px] italic">"{review.body}"</p>

                {canModify(user, review.author?._id) && (
                  <button
                    type="button"
                    onClick={() => onDelete(review._id)}
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
  );
}
