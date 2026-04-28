import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "../components/ui/Layout.tsx";

export default function Home() {
  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* Background Hero */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1600&auto=format&fit=crop" 
          alt="Wilderness" 
          className="h-full w-full object-cover brightness-[0.4]"
        />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-7xl">
            Welcome to YelpCamp!
          </h1>
          <p className="mb-8 text-lg font-medium text-slate-200 sm:text-xl">
            Discover and share your favorite campgrounds with the world.
          </p>
          <Link to="/campgrounds">
            <Button size="lg" className="h-12 px-8 rounded-md bg-white text-slate-900 hover:bg-slate-100 font-bold">
              View Campgrounds
            </Button>
          </Link>
        </motion.div>
      </div>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-medium tracking-widest uppercase">
        YelpCamp © 2026
      </div>
    </div>
  );
}
