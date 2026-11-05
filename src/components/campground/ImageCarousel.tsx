import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { CampgroundImage } from "../../types.ts";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1200&auto=format&fit=crop";

export function ImageCarousel({ images, title }: { images: CampgroundImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const current = index < count ? index : 0;

  const go = (delta: number) => setIndex((prev) => (prev + delta + count) % count);

  return (
    <div className="relative h-[500px] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current]?.url || FALLBACK_IMAGE}
          alt={`${title} - View ${current + 1}`}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full w-full object-cover"
        />
      </AnimatePresence>

      {count > 1 && (
        <>
          <div className="absolute inset-y-0 left-0 flex items-center pl-4">
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white transition-all active:scale-90"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white transition-all active:scale-90"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((img, idx) => (
              <button
                key={img.url + idx}
                type="button"
                aria-label={`Show image ${idx + 1}`}
                onClick={() => setIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${current === idx ? "bg-white w-4" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
