import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "../../context/ThemeContext.tsx";

const styleFor = (theme: string) =>
  theme === "dark" ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11";

interface LocationMapProps {
  coordinates: [number, number];
  title: string;
  location: string;
}

export function LocationMap({ coordinates, title, location }: LocationMapProps) {
  const { theme } = useTheme();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, lat] = coordinates;

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || !container.current) return;

    map.current = new mapboxgl.Map({
      container: container.current,
      accessToken: token,
      style: styleFor(theme),
      center: [lng, lat],
      zoom: 10
    });

    // Build the popup with DOM nodes + textContent: user data is never parsed as HTML
    const content = document.createElement("div");
    content.className = "p-2";
    const heading = document.createElement("h3");
    heading.className = "font-bold text-slate-800";
    heading.textContent = title;
    const subtitle = document.createElement("p");
    subtitle.className = "text-xs text-slate-500";
    subtitle.textContent = location;
    content.append(heading, subtitle);

    new mapboxgl.Marker({ color: "#10b981" })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(content))
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // Theme changes are handled below without recreating the map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lng, lat, title, location]);

  useEffect(() => {
    map.current?.setStyle(styleFor(theme));
  }, [theme]);

  return (
    <div
      ref={container}
      className="h-[350px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl"
    />
  );
}
