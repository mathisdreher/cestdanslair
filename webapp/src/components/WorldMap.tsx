"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

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
  KOR: "410", PRK: "408", IND: "356", BRA: "076", MEX: "484", CAN: "124",
  AUS: "036", DZA: "012", MAR: "504", TUN: "788", LBN: "422",
  IRQ: "368", AFG: "004", GRL: "304", POL: "616", GRC: "300",
  BEL: "056", LBY: "434", MLI: "466", NER: "562", SDN: "729",
  VEN: "862", SAU: "682", QAT: "634", EGY: "818", PAK: "586",
  // New countries
  FIN: "246", ARG: "032", SWE: "752", PRT: "620", NLD: "528",
  AUT: "040", HUN: "348", IRL: "372", ROU: "642", SRB: "688",
  HRV: "191", NOR: "578", DNK: "208", CHE: "756", CZE: "203",
  COL: "170", CHL: "152", PER: "604", CUB: "192", ETH: "231",
  NGA: "566", SEN: "686", CMR: "120", KEN: "404", GEO: "268",
  BLR: "112", MDA: "498", TWN: "158", MMR: "104", THA: "764",
  VNM: "704", KHM: "116", PHL: "608", IDN: "360", YEM: "887",
  JOR: "400", ARE: "784", BFA: "854", MDG: "450", CIV: "384",
  CAF: "140", SOM: "706", BOL: "068",
};

function getColor(count: number, maxCount: number): string {
  if (count === 0) return "transparent";
  const ratio = Math.log(count + 1) / Math.log(maxCount + 1);
  // Indigo scale from light to dark
  if (ratio > 0.85) return "#312e81"; // indigo-900
  if (ratio > 0.7) return "#3730a3";  // indigo-800
  if (ratio > 0.55) return "#4338ca"; // indigo-700
  if (ratio > 0.4) return "#4f46e5";  // indigo-600
  if (ratio > 0.25) return "#6366f1"; // indigo-500
  if (ratio > 0.12) return "#818cf8"; // indigo-400
  return "#a5b4fc";                    // indigo-300
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
      const numerics = ISO3_TO_NUMERIC[g.iso];
      if (numerics) {
        // Some ISOs map to multiple numeric codes (e.g. Corée → both Koreas)
        const codes = [numerics];
        // For Corée, also map to North Korea
        if (g.iso === "KOR") codes.push("408");
        codes.forEach((numeric) => {
          countMap[numeric] = g.count;
          dataMap[numeric] = g;
        });
        if (g.count > max) max = g.count;
      }
    });
    return { countByNumeric: countMap, dataByNumeric: dataMap, maxCount: max };
  }, [geoData]);

  return (
    <div className="relative">
      <div
        className="rounded-lg overflow-hidden border"
        style={{ borderColor: "var(--card-border)", background: "#080e1a" }}
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
                  const numericId = String(geo.id);
                  const count = countByNumeric[numericId] || 0;
                  const entry = dataByNumeric[numericId];
                  const fill = count > 0 ? getColor(count, maxCount) : "#141d2f";

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
                          stroke: "#1e3050",
                          strokeWidth: 0.5,
                          outline: "none",
                          cursor: entry ? "pointer" : "default",
                        },
                        hover: {
                          fill: entry ? "#fbbf24" : "#1e3050",
                          stroke: "#8896b3",
                          strokeWidth: entry ? 1 : 0.5,
                          outline: "none",
                          cursor: entry ? "pointer" : "default",
                        },
                        pressed: {
                          fill: entry ? "#d97706" : "#1e3050",
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
            background: "#141d2f",
            border: "1px solid #1e3050",
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
          { color: "#a5b4fc", label: "Faible" },
          { color: "#6366f1", label: "Moyen" },
          { color: "#312e81", label: "Élevé" },
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
