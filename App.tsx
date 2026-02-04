
import React, { useMemo, useState } from 'react';
import FranceMap from './components/FranceMap';
import { calculateDepartmentStats } from './services/dataProcessor';
import { CoverageLevel, DepartmentStats } from './types';

const App: React.FC = () => {
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  
  const stats: Map<string, DepartmentStats> = useMemo(() => calculateDepartmentStats(), []);

  const aggregates = useMemo(() => {
    const counts: Record<string, number> = {
      [CoverageLevel.EXCELLENT]: 0,
      [CoverageLevel.GOOD]: 0,
      [CoverageLevel.AVERAGE]: 0,
      [CoverageLevel.WEAK]: 0,
      [CoverageLevel.NONE]: 0,
    };
    stats.forEach((s: DepartmentStats) => {
      counts[s.level]++;
    });
    counts[CoverageLevel.NONE] = 95 - Array.from(stats.keys()).length;
    return counts;
  }, [stats]);

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${isPresentationMode ? 'p-0' : ''}`}>
      {/* Header - Masqué en mode présentation */}
      {!isPresentationMode && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <i className="fa-solid fa-map-location-dot text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Couverture Audit France 2025</h1>
              <p className="text-xs text-slate-500 font-medium">Analyse géographique des interventions</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
             <button 
              onClick={() => setIsPresentationMode(true)}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors px-4 py-2 rounded-lg text-sm font-bold text-slate-600"
              title="Optimiser pour PowerPoint"
            >
              <i className="fa-solid fa-display"></i>
              <span>Mode Présentation</span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex flex-col items-end">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Total Interventions</span>
              <span className="text-lg font-bold text-slate-800">
                {Array.from(stats.values()).reduce((acc: number, curr: DepartmentStats) => acc + curr.total2025, 0)}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Bouton pour quitter le mode présentation (flottant) */}
      {isPresentationMode && (
        <button 
          onClick={() => setIsPresentationMode(false)}
          className="fixed bottom-4 right-4 z-[100] bg-white/90 backdrop-blur shadow-lg border border-slate-200 px-3 py-2 rounded-full text-slate-600 hover:text-blue-600 transition-all text-xs font-bold flex items-center gap-2"
        >
          <i className="fa-solid fa-compress"></i>
          Quitter le plein écran
        </button>
      )}

      <main className={`flex-1 ${isPresentationMode ? 'p-0' : 'p-6'} max-w-7xl mx-auto w-full`}>
        <div className={`grid grid-cols-1 ${isPresentationMode ? '' : 'lg:grid-cols-12'} gap-6`}>
          
          {/* Map Column */}
          <div className={`${isPresentationMode ? 'col-span-1' : 'lg:col-span-8'}`}>
            <div className="space-y-6">
              <section>
                <FranceMap stats={stats} />
              </section>

              {!isPresentationMode && (
                <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(aggregates).reverse().map(([level, count]) => (
                    <div key={level} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-slate-400 mb-1">{level}</span>
                        <span className="text-2xl font-bold text-slate-800">{count}</span>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>
          </div>

          {/* Sidebar - Masquée en mode présentation */}
          {!isPresentationMode && (
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <i className="fa-solid fa-chart-line mr-2 text-blue-500"></i>
                  Top Départements
                </h2>
                <div className="space-y-4">
                  {Array.from(stats.values())
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 6)
                    .map((dept) => (
                      <div key={dept.id} className="flex items-center group">
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs mr-3">
                          {dept.id}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-bold text-slate-700">Département {dept.id}</span>
                            <span className="text-xs font-semibold text-blue-600">{dept.total2025} audits</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (dept.score / 50) * 100)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {!isPresentationMode && (
        <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center">
          <p className="text-xs text-slate-400">Analyse Interactive Audit 2025 - Optimisé pour l'intégration web</p>
        </footer>
      )}
    </div>
  );
};

export default App;
