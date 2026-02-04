
import React from 'react';
import { DepartmentStats, AuditorMetadata } from '../types';
import { AUDITORS_INFO } from '../constants';
import { estimateTravel, formatTime } from '../services/geoUtils';

interface DepartmentTooltipProps {
  stats: DepartmentStats | undefined;
  name: string;
  x: number;
  y: number;
}

const DepartmentTooltip: React.FC<DepartmentTooltipProps> = ({ stats, name, x, y }) => {
  if (!stats && !name) return null;

  return (
    <div 
      className="absolute z-50 pointer-events-none bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-2xl w-80 text-sm"
      style={{ left: Math.min(window.innerWidth - 320, x + 15), top: y + 15 }}
    >
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <h4 className="font-bold text-slate-800 text-base">Dept {stats?.id || '?'} - {name}</h4>
      </div>
      
      {stats ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg">
            <span className="text-slate-500 font-medium">Couverture:</span>
            <span className="font-bold text-blue-700">{stats.level}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 p-2 rounded-lg text-center">
              <span className="block text-[10px] uppercase text-slate-400 font-bold">Audits 2025</span>
              <span className="text-lg font-black text-slate-800">{stats.total2025}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-center">
              <span className="block text-[10px] uppercase text-slate-400 font-bold">Auditeurs</span>
              <span className="text-lg font-bold text-slate-600">{stats.auditorsCount}</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Interventions & Logistique</p>
            <div className="max-h-64 overflow-y-auto pr-1 custom-scrollbar space-y-3">
              {stats.auditors.sort((a, b) => b.count25 - a.count25).map((a, i) => {
                const meta = AUDITORS_INFO.find(m => m.name === a.name);
                const residentialDept = meta?.postalCode.substring(0, 2) || "75";
                const travel = estimateTravel(residentialDept, stats.id, meta?.team === 'SGS');

                return (
                  <div key={i} className="bg-slate-50/50 rounded-lg p-2 border border-slate-100">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-bold flex items-center">
                          {a.name}
                          {meta?.team === 'SGS' && <span className="ml-1.5 bg-amber-100 text-amber-700 text-[9px] px-1 rounded uppercase font-black">SGS</span>}
                        </span>
                        <span className="text-[10px] text-slate-400 leading-tight">Résidence: {meta?.city || 'Inconnue'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-600 font-bold text-sm">{a.count25} audits</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Distance</span>
                        <span className="text-[11px] font-semibold text-slate-600">{travel.distanceKm} km</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Temps</span>
                        <span className="text-[11px] font-semibold text-slate-600">{formatTime(travel.timeMinutes)}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Cout Est.</span>
                        <span className="text-[11px] font-bold text-emerald-600">
                          {travel.costEur !== null ? `${travel.costEur}€` : "Frais SGS"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-slate-400 italic py-4 text-center">Aucune intervention en 2025</p>
      )}
    </div>
  );
};

export default DepartmentTooltip;
