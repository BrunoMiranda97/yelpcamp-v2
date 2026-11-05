import { Link } from "react-router-dom";
import { Button } from "../components/ui/Layout.tsx";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <h1 className="text-3xl font-bold mb-4">Page not found</h1>
      <p className="text-slate-500 mb-8">The trail you are looking for does not exist.</p>
      <Link to="/">
        <Button variant="outline">Back home</Button>
      </Link>
    </div>
  );
}
