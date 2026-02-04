
import React from 'react';
import { DepartmentStats, AuditorMetadata } from '../types';
import { AUDITORS_INFO } from '../constants';
import { estimateTravel, formatTime } from '../services/geoUtils';

interface DepartmentTooltipProps {
  stats: DepartmentStats | undefined;
  name: string;
  onClose: () => void;
  isPresentationMode?: boolean;
}

const DepartmentTooltip: React.FC<DepartmentTooltipProps> = ({ stats, name, onClose, isPresentationMode }) => {
  if (!stats && !name) return null;

  return (
    <div 
      className={`
        bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl flex flex-col
        ${isPresentationMode ? 'fixed top-4 right-4 bottom-4 w-96' : 'absolute top-0 right-0 h-full w-96'} 
        z-[100] transition-all duration-300 animate-in slide-in-from-right
      `}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
        <div>
          <h4 className="font-bold text-slate-800 text-base leading-tight">Dept {stats?.id || '?'}</h4>
          <p className="text-xs text-slate-500 font-medium">{name}</p>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {stats ? (
          <>
            {/* Résumé Couverture */}
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
              <span className="text-blue-600 font-bold text-sm uppercase tracking-wider">Niveau de Couverture</span>
              <span className={`font-black text-blue-800`}>{stats.level}</span>
            </div>
            
            {/* Stats Globales */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Audits 2025</span>
                <span className="text-2xl font-black text-slate-800">{stats.total2025}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Audits 2024</span>
                <span className="text-2xl font-bold text-slate-400">{stats.total2024}</span>
              </div>
            </div>

            {/* Détails par Auditeur */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Analyse par Auditeur (A/R)</p>
                <i className="fa-solid fa-truck-fast text-slate-300"></i>
              </div>
              
              <div className="space-y-4">
                {stats.auditors.sort((a, b) => b.count25 - a.count25).map((a, i) => {
                  const meta = AUDITORS_INFO.find(m => m.name === a.name);
                  const residentialDept = meta?.postalCode.substring(0, 2) || "75";
                  const travel = estimateTravel(residentialDept, stats.id, meta?.team === 'SGS');
                  
                  // Calculs cumulés Aller-Retour
                  const totalKm25 = travel.distanceKm * 2 * a.count25;
                  const totalKm24 = travel.distanceKm * 2 * a.count24;
                  const totalCost25 = travel.costEur !== null ? travel.costEur * 2 * a.count25 : null;
                  const totalCost24 = travel.costEur !== null ? travel.costEur * 2 * a.count24 : null;

                  return (
                    <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                        <div>
                          <span className="text-slate-800 font-bold text-sm">{a.name}</span>
                          <span className="ml-2 text-[10px] text-slate-400">{meta?.city}</span>
                        </div>
                        {meta?.team === 'SGS' && <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded uppercase font-black">SGS</span>}
                      </div>
                      
                      <div className="p-3 space-y-3">
                        {/* Section 2025 */}
                        <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-50">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-blue-600 uppercase">Cumul 2025 ({a.count25} audits)</span>
                            <span className="text-xs font-bold text-slate-700">{totalKm25} km <span className="text-[10px] text-slate-400 font-normal">A/R</span></span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[9px] font-bold text-blue-600 uppercase">Frais 2025</span>
                            <span className="text-xs font-bold text-emerald-600">
                              {totalCost25 !== null ? `${totalCost25.toFixed(2)}€` : "SGS (Inclus)"}
                            </span>
                          </div>
                        </div>

                        {/* Section 2024 */}
                        <div className="grid grid-cols-2 gap-2 opacity-60">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Cumul 2024 ({a.count24} audits)</span>
                            <span className="text-xs font-bold text-slate-500">{totalKm24} km</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Frais 2024</span>
                            <span className="text-xs font-bold text-slate-500">
                              {totalCost24 !== null ? `${totalCost24.toFixed(2)}€` : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <i className="fa-solid fa-map-pin text-slate-200 text-2xl"></i>
            </div>
            <p className="text-slate-400 italic text-sm">Aucune intervention planifiée ou réalisée dans ce département pour la période 2024-2025.</p>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
        <p className="text-[9px] text-slate-400 text-center italic">
          * Les distances sont calculées en base routière estimée (Aller-Retour) avec un coefficient de détour de 1.3.
        </p>
      </div>
    </div>
  );
};

export default DepartmentTooltip;
