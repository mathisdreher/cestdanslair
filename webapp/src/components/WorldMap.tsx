"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface GeoEntry {
  region: string;
  count: number;
  iso: string;
  searchTerm: string;
  percentage: string;
}

interface WorldMapProps {
  geoData: GeoEntry[];
}

// ISO-3 to ISO-3166-1 numeric (used by world-atlas topojson)
const ISO3_TO_NUMERIC: Record<string, string> = {
  FRA: "250", USA: "840", CHN: "156", RUS: "643", UKR: "804",
  DEU: "276", GBR: "826", ITA: "380", ESP: "724", IRN: "364",
  ISR: "376", PSE: "275", SYR: "760", TUR: "792", JPN: "392",
  KOR: "410", IND: "356", BRA: "076", MEX: "484", CAN: "124",
  AUS: "036", DZA: "012", MAR: "504", TUN: "788", LBN: "422",
  IRQ: "368", AFG: "004", GRL: "304", POL: "616", GRC: "300",
  BEL: "056", LBY: "434", MLI: "466", NER: "562", SDN: "736",
  VEN: "862", SAU: "682", QAT: "634", EGY: "818", PAK: "586",
};

function getColor(count: number, maxCount: number): string {
  if (count === 0) return "transparent";
  const ratio = Math.log(count + 1) / Math.log(maxCount + 1);
  // Blue scale from light to dark
  if (ratio > 0.85) return "#1e3a8a"; // 900
  if (ratio > 0.7) return "#1e40af";  // 800
  if (ratio > 0.55) return "#1d4ed8"; // 700
  if (ratio > 0.4) return "#2563eb";  // 600
  if (ratio > 0.25) return "#3b82f6"; // 500
  if (ratio > 0.12) return "#60a5fa"; // 400
  return "#93c5fd";                    // 300
}

export default function WorldMap({ geoData }: WorldMapProps) {
  const router = useRouter();
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Build lookup maps
  const { countByNumeric, dataByNumeric, maxCount } = useMemo(() => {
    const countMap: Record<string, number> = {};
    const dataMap: Record<string, GeoEntry> = {};
    let max = 0;
    geoData.forEach((g) => {
      const numeric = ISO3_TO_NUMERIC[g.iso];
      if (numeric) {
        countMap[numeric] = g.count;
        dataMap[numeric] = g;
        if (g.count > max) max = g.count;
      }
    });
    return { countByNumeric: countMap, dataByNumeric: dataMap, maxCount: max };
  }, [geoData]);

  return (
    <div className="relative">
      <div
        className="rounded-lg overflow-hidden border"
        style={{ borderColor: "var(--card-border)", background: "#0c1929" }}
      >
        <ComposableMap
          projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
          width={800}
          height={420}
          style={{ width: "100%", height: "auto" }}
        >
          <ZoomableGroup center={[10, 20]} zoom={1}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const numericId = geo.id;
                  const count = countByNumeric[numericId] || 0;
                  const entry = dataByNumeric[numericId];
                  const fill = count > 0 ? getColor(count, maxCount) : "#1e293b";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(e) => {
                        if (entry) {
                          setTooltipContent(`${entry.region}: ${entry.count} vidéos (${entry.percentage}%)`);
                        } else {
                          setTooltipContent(geo.properties.name || "");
                        }
                        setTooltipPos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        setTooltipPos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setTooltipContent("")}
                      onClick={() => {
                        if (entry) {
                          router.push(`/videos?q=${encodeURIComponent(entry.searchTerm)}`);
                        }
                      }}
                      style={{
                        default: {
                          fill,
                          stroke: "#334155",
                          strokeWidth: 0.5,
                          outline: "none",
                          cursor: entry ? "pointer" : "default",
                        },
                        hover: {
                          fill: entry ? "#f59e0b" : "#334155",
                          stroke: "#94a3b8",
                          strokeWidth: entry ? 1 : 0.5,
                          outline: "none",
                          cursor: entry ? "pointer" : "default",
                        },
                        pressed: {
                          fill: entry ? "#d97706" : "#334155",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 28,
            background: "#1e293b",
            border: "1px solid #334155",
            color: "#f8fafc",
          }}
        >
          {tooltipContent}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted justify-center">
        <span>Mentions:</span>
        {[
          { color: "#93c5fd", label: "Faible" },
          { color: "#3b82f6", label: "Moyen" },
          { color: "#1e3a8a", label: "Élevé" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: l.color }} />
            <span>{l.label}</span>
          </div>
        ))}
        <span className="ml-3 italic">Cliquez sur un pays pour explorer ses vidéos</span>
      </div>

      {/* Top countries sidebar list */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {geoData.slice(0, 15).map((geo, i) => (
          <button
            key={geo.iso}
            onClick={() => router.push(`/videos?q=${encodeURIComponent(geo.searchTerm)}`)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-all hover:border-blue-500 hover:bg-blue-500/10"
            style={{ borderColor: "var(--card-border)" }}
          >
            <span className="text-xs font-mono text-muted w-5">#{i + 1}</span>
            <span className="truncate font-medium flex-1">{geo.region}</span>
            <span className="text-accent font-bold">{geo.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
