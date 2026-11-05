import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapPin, User, Clock, DollarSign } from "lucide-react";
import { Button, Card } from "../components/ui/Layout.tsx";
import { Modal } from "../components/ui/Modal.tsx";
import { Skeleton } from "../components/ui/Skeleton.tsx";
import { ImageCarousel } from "../components/campground/ImageCarousel.tsx";
import { LocationMap } from "../components/campground/LocationMap.tsx";
import { ReviewList } from "../components/campground/ReviewList.tsx";
import { ReviewForm } from "../components/campground/ReviewForm.tsx";
import { canModify, useAuth } from "../context/AuthContext.tsx";
import { useCampground } from "../hooks/useCampgrounds.ts";
import { campgroundsApi, errorMessage, reviewsApi } from "../services/api.ts";

export default function CampgroundShow() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { campground, loading, error, reload } = useCampground(id);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const handleReviewSubmit = async (body: string, rating: number) => {
    try {
      await reviewsApi.create(id, body, rating);
      await reload(); // refreshes reviews and the server-computed average
    } catch (err) {
      setErrorStatus(errorMessage(err, "Failed to submit review"));
      throw err;
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    try {
      await reviewsApi.remove(id, reviewToDelete);
      setReviewToDelete(null);
      await reload();
    } catch (err) {
      setReviewToDelete(null);
      setErrorStatus(errorMessage(err, "Failed to delete review"));
    }
  };

  const handleDeleteCampground = async () => {
    setIsDeleteModalOpen(false);
    try {
      await campgroundsApi.remove(id);
      navigate("/campgrounds");
    } catch (err) {
      setErrorStatus(errorMessage(err, "Failed to delete campground"));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 space-y-8">
        <Skeleton className="h-[500px] w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-[400px] lg:col-span-2 w-full rounded-2xl" />
          <Skeleton className="h-[400px] col-span-1 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !campground) {
    const notFound = error?.status === 404;
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <h1 className="text-3xl font-bold mb-4">{notFound ? "Campground not found" : "Something went wrong"}</h1>
        <p className="text-slate-500 mb-8">
          {notFound ? "This campsite may have been removed." : error?.message ?? "Please try again later."}
        </p>
        <Link to="/campgrounds">
          <Button variant="outline">Back to campgrounds</Button>
        </Link>
      </div>
    );
  }

  const details = [
    { icon: MapPin, label: "Location", value: campground.location, className: "truncate" },
    { icon: User, label: "Submitted by", value: campground.author?.username || "Explorer" },
    { icon: DollarSign, label: "Base Price", value: `$${campground.price}/night` },
    { icon: Clock, label: "Listed", value: new Date(campground.createdAt).toLocaleDateString() }
  ];

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
        <div className="lg:col-span-2 space-y-10">
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-2xl relative bg-white dark:bg-slate-900/50 backdrop-blur-xl">
            <ImageCarousel images={campground.images} title={campground.title} />

            <div className="p-10">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{campground.title}</h1>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-500">${campground.price}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest text-right">Per night</p>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-sans text-lg">{campground.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-slate-100 dark:border-slate-800">
                {details.map(({ icon: Icon, label, value, className }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </div>
                    <span className={`font-semibold text-sm ${className ?? ""}`}>{value}</span>
                  </div>
                ))}
              </div>

              {canModify(user, campground.author?._id) && (
                <div className="flex gap-4 mt-10">
                  <Link to={`/campgrounds/${id}/edit`}>
                    <Button variant="outline" className="px-8 font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      Edit site
                    </Button>
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

          <ReviewList
            reviews={campground.reviews}
            avgRating={campground.avgRating}
            user={user}
            onDelete={setReviewToDelete}
          />
        </div>

        <div className="space-y-8 col-span-1">
          <div className="sticky top-24 space-y-8">
            <LocationMap
              coordinates={campground.geometry?.coordinates ?? [0, 0]}
              title={campground.title}
              location={campground.location}
            />
            <ReviewForm isAuthenticated={!!user} onSubmit={handleReviewSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}
