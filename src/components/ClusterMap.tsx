import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { MapPoint } from '../types.ts';

interface ClusterMapProps {
  campgrounds: MapPoint[];
}

function toFeatureCollection(campgrounds: MapPoint[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: campgrounds.map((c) => ({
      type: 'Feature',
      geometry: c.geometry ?? { type: 'Point', coordinates: [0, 0] },
      properties: { id: c._id, title: c.title, location: c.location }
    }))
  };
}

const ClusterMap: React.FC<ClusterMapProps> = ({ campgrounds }) => {
  // The map is created once; its 'load' handler must see the latest data, not the first render's
  const latestCampgrounds = useRef(campgrounds);
  latestCampgrounds.current = campgrounds;
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || !mapContainer.current) {
        if (!token) console.warn("MapBox Token missing. Discovery Map disabled.");
        return;
    }
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      accessToken: token,
      style: document.documentElement.classList.contains('dark') 
        ? 'mapbox://styles/mapbox/dark-v11' 
        : 'mapbox://styles/mapbox/light-v11',
      center: [-103.5917, 40.6699],
      zoom: 3,
      cooperativeGestures: true
    });

    const map = mapInstance.current;

    map.on('load', () => {
      map.addSource('campgrounds', {
        type: 'geojson',
        data: toFeatureCollection(latestCampgrounds.current),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'campgrounds',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#10b981',
            10,
            '#059669',
            30,
            '#047857'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            30,
            40
          ]
        }
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'campgrounds',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'campgrounds',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#10b981',
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': document.documentElement.classList.contains('dark') ? '#0f172a' : '#fff'
        }
      });

      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        const clusterId = features[0].properties?.cluster_id;
        (map.getSource('campgrounds') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err || zoom == null) return;
            map.easeTo({
              center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
              zoom: zoom
            });
          }
        );
      });

      map.on('click', 'unclustered-point', (e) => {
          const coordinates = (e.features![0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
          const { title, id } = e.features![0].properties as { title: string; id: string };

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          // Build the popup with DOM nodes + textContent: user data is never parsed as HTML
          const container = document.createElement('div');
          container.className = 'p-2 dark:text-slate-800';
          const heading = document.createElement('h3');
          heading.className = 'font-bold';
          heading.textContent = String(title ?? '');
          const link = document.createElement('a');
          link.href = `/campgrounds/${encodeURIComponent(String(id))}`;
          link.className = 'text-emerald-600 text-xs mt-1 block';
          link.textContent = 'View Site';
          container.append(heading, link);

          new mapboxgl.Popup({ className: 'custom-popup' })
              .setLngLat(coordinates)
              .setDOMContent(container)
              .addTo(map);
      });

      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Sync data source without re-mounting the map
  useEffect(() => {
    if (mapInstance.current && mapInstance.current.getSource('campgrounds')) {
      const source = mapInstance.current.getSource('campgrounds') as mapboxgl.GeoJSONSource;
      source.setData(toFeatureCollection(campgrounds));
    }
  }, [campgrounds]);

  return (
    <div className="w-full h-[400px] overflow-hidden border-b border-slate-200 dark:border-slate-800 group relative">
       <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default ClusterMap;
