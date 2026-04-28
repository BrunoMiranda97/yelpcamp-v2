import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ClusterMapProps {
  campgrounds: any[];
}

const ClusterMap: React.FC<ClusterMapProps> = ({ campgrounds }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || !mapContainer.current) {
        if (!token) console.warn("MapBox Token missing. Discovery Map disabled.");
        return;
    }

    mapboxgl.accessToken = token;

    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
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
        data: {
          type: 'FeatureCollection',
          features: campgrounds.map(c => ({
            type: 'Feature',
            geometry: c.geometry || { type: 'Point', coordinates: [0, 0] },
            properties: {
              id: c._id,
              title: c.title,
              location: c.location
            }
          }))
        } as any,
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
            if (err) return;
            map.easeTo({
              center: (features[0].geometry as any).coordinates,
              zoom: zoom
            });
          }
        );
      });

      map.on('click', 'unclustered-point', (e) => {
          const coordinates = (e.features![0].geometry as any).coordinates.slice();
          const { title, id } = e.features![0].properties as any;

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          new mapboxgl.Popup({ className: 'custom-popup' })
              .setLngLat(coordinates)
              .setHTML(`<div class="p-2 dark:text-slate-800"><h3 className="font-bold">${title}</h3><a href="/campgrounds/${id}" class="text-emerald-600 text-xs mt-1 block">View Site</a></div>`)
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
      source.setData({
        type: 'FeatureCollection',
        features: campgrounds.map(c => ({
          type: 'Feature',
          geometry: c.geometry || { type: 'Point', coordinates: [0, 0] },
          properties: {
            id: c._id,
            title: c.title,
            location: c.location
          }
        }))
      } as any);
    }
  }, [campgrounds]);

  return (
    <div className="w-full h-[400px] overflow-hidden border-b border-slate-200 dark:border-slate-800 group relative">
       <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default ClusterMap;
