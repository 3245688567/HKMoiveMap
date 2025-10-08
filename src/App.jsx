import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Optional: fix marker icon paths (needed in Vite)
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

import scenes from "./scenes.json";

// Fix for missing marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default function App() {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [searchTerm, setSearchTerm] = useState(""); // State for search bar
  const [openAccordions, setOpenAccordions] = useState(new Set()); // State for open accordion items

  useEffect(() => {
    // Prevent reinitialization on re-render or in React.StrictMode
    if (mapRef.current) return;

    // Create the map
    const map = L.map("map").setView([22.3193, 114.1694], 12);
    mapRef.current = map;

    // Add the base map layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Add scene markers
    scenes.forEach((scene) => {
      const marker = L.marker([scene.lat, scene.lng]).addTo(map);
      marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-lg">${scene.movie}</h3>
          <p><b>地點:</b> ${scene.title}</p>
          <img src="${scene.image}" alt="${scene.title}" class="rounded-lg mt-2 mb-2" width="200"/>
          <p class="text-sm text-gray-600">${scene.description}</p>
        </div>
      `);
      markersRef.current[scene.id] = marker; // Store marker with a unique ID
    });

    return () => {
      map.remove(); // Cleanup when component unmounts
    };
  }, []);

  const handleLocationClick = (scene) => {
    if (mapRef.current) {
      mapRef.current.setView([scene.lat, scene.lng], 15); // Zoom to location
      markersRef.current[scene.id].openPopup(); // Open the popup
    }
  };

  const handleAccordionToggle = (movieTitle) => {
    setOpenAccordions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(movieTitle)) {
        newSet.delete(movieTitle);
      } else {
        newSet.add(movieTitle);
      }
      return newSet;
    });
  };

  // Filter scenes based on search term
  const filteredScenes = scenes.filter((scene) =>
    scene.movie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered scenes by movie title for accordion
  const groupedScenes = filteredScenes.reduce((acc, scene) => {
    if (!acc[scene.movie]) {
      acc[scene.movie] = [];
    }
    acc[scene.movie].push(scene);
    return acc;
  }, {});

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-50 shadow-lg p-4 overflow-y-auto">
        <h1 className="text-xl font-bold mb-4">香港電影場景地圖庫</h1>
        <p className="text-gray-600 text-sm mb-4">
          探索香港電影的經典拍攝場景。
        </p>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="搜尋電影名稱..."
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Accordion Layout */}
        <div className="space-y-2">
          {Object.entries(groupedScenes).map(([movieTitle, scenesInMovie]) => (
            <div key={movieTitle} className="border border-gray-200 rounded-lg">
              <div
                className="flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 cursor-pointer font-medium text-gray-700"
                onClick={() => handleAccordionToggle(movieTitle)}
              >
                <span>{movieTitle} ({scenesInMovie.length})</span>
                <span>{openAccordions.has(movieTitle) ? '▲' : '▼'}</span>
              </div>
              {openAccordions.has(movieTitle) && (
                <ul className="p-2 space-y-1 bg-white">
                  {scenesInMovie.map((scene) => (
                    <li
                      key={scene.id}
                      className="p-2 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleLocationClick(scene)}
                    >
                      <p className="font-medium text-gray-800">{scene.title}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {Object.keys(groupedScenes).length === 0 && (
            <p className="text-gray-500 text-center mt-4">沒有找到相關電影。</p>
          )}
        </div>
      </aside>

      {/* Map */}
      <main className="flex-1 h-screen">
        <div id="map" className="h-full w-full" />
      </main>
    </div>
  );
}
