import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Button, Card } from "../ui/Layout.tsx";

interface ReviewFormProps {
  isAuthenticated: boolean;
  /** Resolves when the review was saved; rejects to keep the draft. */
  onSubmit: (body: string, rating: number) => Promise<void>;
}

export function ReviewForm({ isAuthenticated, onSubmit }: ReviewFormProps) {
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(body.trim(), rating);
      setBody("");
      setRating(5);
    } catch {
      // The parent reports the error; keep the draft so the user can retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-xl">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Leave an Impression</h3>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset>
            <legend className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Rate your stay</legend>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-label={`${s} star${s > 1 ? "s" : ""}`}
                  aria-pressed={rating === s}
                  onClick={() => setRating(s)}
                  className="transition-all active:scale-75"
                >
                  <Star
                    className={`w-8 h-8 ${rating >= s ? "fill-emerald-500 text-emerald-500" : "text-slate-200 dark:text-slate-800 hover:text-emerald-300"}`}
                  />
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="review-body" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Your Journey
            </label>
            <textarea
              id="review-body"
              required
              maxLength={2000}
              placeholder="Tell us about the wilderness..."
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full border-0 rounded-2xl p-5 text-sm bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all dark:text-white"
            />
          </div>
          <Button
            type="submit"
            isLoading={submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-full py-4 shadow-lg shadow-emerald-500/20"
          >
            Post impression
          </Button>
        </form>
      ) : (
        <div className="p-8 border-2 border-dashed rounded-3xl text-center">
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4 leading-relaxed">Sign in to leave a review</p>
          <Link to="/login">
            <Button variant="outline" className="w-full rounded-full border-slate-200 dark:border-slate-800 uppercase text-[10px] font-black tracking-widest">
              Login
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
