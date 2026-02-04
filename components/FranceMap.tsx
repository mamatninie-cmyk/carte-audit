
import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { DepartmentStats, GeoJsonFeature, AuditorMetadata } from '../types';
import { MAP_COLORS, AUDITORS_INFO, AUDITOR_MARKER_COLORS } from '../constants';
import DepartmentTooltip from './DepartmentTooltip';

interface FranceMapProps {
  stats: Map<string, DepartmentStats>;
  isPresentationMode?: boolean;
}

const FranceMap: React.FC<FranceMapProps> = ({ stats, isPresentationMode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<{ stats?: DepartmentStats; name: string; id: string } | null>(null);
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data));
  }, []);

  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const width = 650;
    const height = 650;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const projection = d3.geoConicConformal()
      .center([2.454071, 46.279229])
      .scale(3200)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const g = svg.append("g");

    // 1. Draw Departments (Bottom Layer)
    g.selectAll("path.department")
      .data(geoData.features as GeoJsonFeature[])
      .enter()
      .append("path")
      .attr("class", "department cursor-pointer transition-all duration-300")
      .attr("d", path as any)
      .attr("fill", (d) => {
        const deptId = d.properties.code;
        const s = stats.get(deptId);
        return s ? MAP_COLORS[s.level] : MAP_COLORS['Aucune'];
      })
      .attr("stroke", (d) => (d.properties.code === selectedDept?.id ? "#f59e0b" : "#fff"))
      .attr("stroke-width", (d) => (d.properties.code === selectedDept?.id ? 3 : 0.5))
      .attr("stroke-linejoin", "round")
      .style("filter", (d) => (d.properties.code === selectedDept?.id ? "drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))" : "none"))
      .on("mouseover", function(_, d) {
        if (selectedDept?.id !== d.properties.code) {
          d3.select(this).attr("stroke-width", 1.5).attr("stroke", "#334155");
        }
        setHoveredDept(d.properties.code);
      })
      .on("mouseout", function(_, d) {
        if (selectedDept?.id !== d.properties.code) {
          d3.select(this).attr("stroke-width", 0.5).attr("stroke", "#fff");
        }
        setHoveredDept(null);
      })
      .on("click", function(event, d) {
        event.stopPropagation();
        const deptId = d.properties.code;
        setSelectedDept({
          stats: stats.get(deptId),
          name: d.properties.nom,
          id: deptId
        });
      });

    // 2. Map Auditors
    const deptCentroids = new Map<string, [number, number]>();
    geoData.features.forEach((feature: GeoJsonFeature) => {
      deptCentroids.set(feature.properties.code, d3.geoCentroid(feature as any));
    });

    const auditorGroup = g.append("g").attr("class", "auditors");
    const auditorsByDept = new Map<string, number>();

    AUDITORS_INFO.forEach((auditor) => {
      const deptId = auditor.postalCode.substring(0, 2);
      const centroid = deptCentroids.get(deptId);
      
      if (centroid) {
        const count = auditorsByDept.get(deptId) || 0;
        auditorsByDept.set(deptId, count + 1);

        const angle = (count / 8) * Math.PI * 2;
        const radius = count > 0 ? 0.08 : 0;
        const jitteredCentroid: [number, number] = [
          centroid[0] + Math.cos(angle) * radius,
          centroid[1] + Math.sin(angle) * radius
        ];

        const [x, y] = projection(jitteredCentroid) || [0, 0];

        const marker = auditorGroup.append("g")
          .attr("class", "cursor-pointer")
          .on("click", (event) => {
            event.stopPropagation();
            setSelectedDept({
              stats: stats.get(deptId),
              name: "Localisation Auditeur",
              id: deptId
            });
          });

        marker.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", auditor.team === 'SGS' ? 6.5 : 4.5)
          .attr("fill", auditor.team === 'SGS' ? AUDITOR_MARKER_COLORS.SGS : AUDITOR_MARKER_COLORS.DEFAULT)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .style("filter", "drop-shadow(0px 2px 3px rgba(0,0,0,0.3))");

        if (auditor.team === 'SGS') {
           marker.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 9)
            .attr("fill", "none")
            .attr("stroke", AUDITOR_MARKER_COLORS.SGS)
            .attr("stroke-width", 1)
            .attr("opacity", 0.4)
            .append("animate")
              .attr("attributeName", "r")
              .attr("from", "7")
              .attr("to", "15")
              .attr("dur", "1.5s")
              .attr("repeatCount", "indefinite");
        }
      }
    });

    // Reset selection on SVG click
    svg.on("click", () => {
      setSelectedDept(null);
    });

  }, [geoData, stats, selectedDept]);

  return (
    <div className="relative flex justify-center items-center bg-white rounded-2xl shadow-sm border border-slate-100 p-4 min-h-[650px] overflow-hidden">
      <svg ref={svgRef} width="650" height="650" className="max-w-full h-auto"></svg>
      
      {/* Légende flottante (masquée si sélection active pour libérer de l'espace) */}
      {!selectedDept && (
        <div className="absolute top-4 right-4 bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-slate-100 text-[10px] text-slate-400">
          <i className="fa-solid fa-mouse-pointer mr-1"></i>
          Cliquez sur un département pour les détails
        </div>
      )}

      {selectedDept && (
        <DepartmentTooltip 
          stats={selectedDept.stats} 
          name={selectedDept.name} 
          onClose={() => setSelectedDept(null)}
          isPresentationMode={isPresentationMode}
        />
      )}
      
      {/* Légendes de base */}
      {!selectedDept && (
        <div className="absolute top-4 left-4 flex flex-col space-y-4 animate-in fade-in slide-in-from-left duration-500">
          <div className="bg-white/80 backdrop-blur shadow-sm border border-slate-100 p-4 rounded-xl">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Couverture</h3>
            <div className="space-y-2">
              {Object.entries(MAP_COLORS).reverse().map(([label, color]) => (
                <div key={label} className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: color }}></div>
                  <span className="text-[10px] font-bold text-slate-600">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur shadow-sm border border-slate-100 p-4 rounded-xl">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Auditeurs</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-3.5 h-3.5 rounded-full border border-white ring-1 ring-amber-500 bg-amber-500"></div>
                </div>
                <span className="text-[10px] font-bold text-slate-600">Salarié SGS</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full border border-white ring-1 ring-slate-800 bg-slate-800"></div>
                <span className="text-[10px] font-bold text-slate-600">Autres (VIT / ST)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FranceMap;
