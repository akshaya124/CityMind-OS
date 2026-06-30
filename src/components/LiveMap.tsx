"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom glowing HTML marker
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        width: 24px; 
        height: 24px; 
        background-color: ${color}; 
        border-radius: 50%; 
        border: 3px solid white;
        box-shadow: 0 0 15px ${color};
        animation: pulse 2s infinite;
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export interface IssueLocation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  aiBriefing?: string;
  score?: number;
  budget?: string;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "Critical": return "#ef4444"; // red-500
    case "High": return "#f59e0b"; // amber-500
    case "Medium": return "#3b82f6"; // blue-500
    default: return "#3b82f6";
  }
};

// Component to dynamically fit bounds based on markers
function MapBounds({ issues }: { issues: IssueLocation[] }) {
  const map = useMap();
  useEffect(() => {
    if (issues.length > 0) {
      const bounds = L.latLngBounds(issues.map(i => [i.lat, i.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [issues, map]);
  return null;
}

export default function LiveMap({ issues }: { issues: IssueLocation[] }) {
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[28.7041, 77.1025]} 
        zoom={14} 
        style={{ height: "100%", width: "100%", borderRadius: "1.5rem" }}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapBounds issues={issues} />
        
        {issues.map(issue => (
          <Marker 
            key={issue.id} 
            position={[issue.lat, issue.lng]}
            icon={createCustomIcon(getSeverityColor(issue.severity))}
          >
            <Popup className="custom-popup">
              <div className="p-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  {issue.severity} Priority
                </span>
                <h4 className="font-bold text-sm m-0 text-foreground">{issue.title}</h4>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <style jsx global>{`
        /* Override Leaflet defaults to match our dark theme */
        .leaflet-container {
          background: transparent;
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.9) !important; /* Slate 900 */
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          color: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .leaflet-popup-close-button {
          color: white !important;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); transform: scale(1); }
          50% { box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); transform: scale(1.1); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
