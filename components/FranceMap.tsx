
import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { DepartmentStats, GeoJsonFeature, AuditorMetadata } from '../types';
import { MAP_COLORS, AUDITORS_INFO, AUDITOR_MARKER_COLORS } from '../constants';
import DepartmentTooltip from './DepartmentTooltip';

interface FranceMapProps {
  stats: Map<string, DepartmentStats>;
}

const FranceMap: React.FC<FranceMapProps> = ({ stats }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [tooltip, setTooltip] = useState<{ stats?: DepartmentStats; auditor?: AuditorMetadata; name: string; x: number; y: number } | null>(null);

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
      .attr("class", "department cursor-pointer transition-colors duration-200")
      .attr("d", path as any)
      .attr("fill", (d) => {
        const deptId = d.properties.code;
        const s = stats.get(deptId);
        return s ? MAP_COLORS[s.level] : MAP_COLORS['Aucune'];
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke-width", 1.5).attr("stroke", "#334155");
        const deptId = d.properties.code;
        setTooltip({
          stats: stats.get(deptId),
          name: d.properties.nom,
          x: event.pageX,
          y: event.pageY
        });
      })
      .on("mousemove", function(event) {
        if (tooltip && !tooltip.auditor) {
          setTooltip(prev => prev ? ({ ...prev, x: event.pageX, y: event.pageY }) : null);
        }
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke-width", 0.5).attr("stroke", "#fff");
        setTooltip(null);
      });

    // 2. Map Auditors to coordinates (Jittered within their department) - (Top Layer)
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

        // Ensure markers are on top and highly visible
        const marker = auditorGroup.append("g")
          .attr("class", "cursor-pointer")
          .on("mouseover", (event) => {
            event.stopPropagation();
            setTooltip({
              auditor,
              name: auditor.name,
              x: event.pageX,
              y: event.pageY
            });
          })
          .on("mouseout", () => {
             setTooltip(null);
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
           
           marker.append("animate")
            .attr("attributeName", "opacity")
            .attr("from", "1")
            .attr("to", "0")
            .attr("dur", "1.5s")
            .attr("repeatCount", "indefinite");
        }
      }
    });

  }, [geoData, stats]);

  return (
    <div className="relative flex justify-center items-center bg-white rounded-2xl shadow-sm border border-slate-100 p-4 min-h-[650px]">
      <svg ref={svgRef} width="650" height="650" className="max-w-full h-auto"></svg>
      
      {/* Dynamic Legend / UI Elements */}
      <div className="absolute top-4 right-4 bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-slate-100 text-[10px] text-slate-400">
        <i className="fa-solid fa-circle-info mr-1"></i>
        Interactivité: Survoler départements ou marqueurs
      </div>

      {tooltip && !tooltip.auditor && (
        <DepartmentTooltip 
          stats={tooltip.stats} 
          name={tooltip.name} 
          x={tooltip.x} 
          y={tooltip.y} 
        />
      )}

      {tooltip && tooltip.auditor && (
        <div 
          className="absolute z-[60] pointer-events-none bg-slate-900 text-white p-4 rounded-xl shadow-2xl w-60 border border-slate-700 transition-all duration-200"
          style={{ left: Math.min(window.innerWidth - 260, tooltip.x + 15), top: tooltip.y + 15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-black text-sm tracking-tight">{tooltip.auditor.name}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${tooltip.auditor.team === 'SGS' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
              {tooltip.auditor.team}
            </span>
          </div>
          <div className="space-y-2 border-t border-slate-700/50 pt-2">
            <div className="flex items-start">
              <i className="fa-solid fa-house-user mt-0.5 mr-3 text-blue-400"></i>
              <div>
                <p className="font-bold leading-tight">{tooltip.auditor.city}</p>
                <p className="text-[10px] opacity-60">Code Postal: {tooltip.auditor.postalCode}</p>
              </div>
            </div>
            <div className="flex items-center">
              <i className="fa-solid fa-id-badge mr-3 text-emerald-400 w-4"></i>
              <span className="text-[11px] opacity-90">{tooltip.auditor.type === 'SAL' ? 'Salarié SGS' : 'Consultant ST'}</span>
            </div>
            <div className="flex items-center">
              <i className="fa-solid fa-map mr-3 text-slate-400 w-4"></i>
              <span className="text-[11px] opacity-90">Dept de base: {tooltip.auditor.postalCode.substring(0, 2)}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 left-4 flex flex-col space-y-4">
        {/* Coverage Legend */}
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

        {/* Auditor Legend */}
        <div className="bg-white/80 backdrop-blur shadow-sm border border-slate-100 p-4 rounded-xl">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Auditeurs</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-3.5 h-3.5 rounded-full border border-white ring-1 ring-amber-500 bg-amber-500"></div>
                <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-amber-500 animate-ping opacity-25"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-600">Salarié SG</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full border border-white ring-1 ring-slate-800 bg-slate-800"></div>
              <span className="text-[10px] font-bold text-slate-600">Autres (VIT / ST)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FranceMap;
