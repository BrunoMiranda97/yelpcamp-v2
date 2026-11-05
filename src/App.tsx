import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Header } from "./components/layout/Header.tsx";
import { Footer } from "./components/layout/Footer.tsx";
import { RequireAuth } from "./components/RequireAuth.tsx";

// Map-heavy pages (Mapbox is ~1.5 MB) load on demand, keeping the first paint light
const CampgroundsIndex = lazy(() => import("./pages/CampgroundsIndex.tsx"));
const CampgroundShow = lazy(() => import("./pages/CampgroundShow.tsx"));
const NewCampground = lazy(() => import("./pages/NewCampground.tsx"));
const EditCampground = lazy(() => import("./pages/EditCampground.tsx"));

const PageFallback = () => (
  <div className="flex justify-center py-32">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
  </div>
);

export default function App() {
  return (
    <div className="flex flex-col min-h-screen font-sans overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header />

      <main className="flex-1 bg-white dark:bg-slate-950 transition-colors">
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/campgrounds" element={<CampgroundsIndex />} />
          <Route path="/campgrounds/new" element={<RequireAuth><NewCampground /></RequireAuth>} />
          <Route path="/campgrounds/:id" element={<CampgroundShow />} />
          <Route path="/campgrounds/:id/edit" element={<RequireAuth><EditCampground /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
