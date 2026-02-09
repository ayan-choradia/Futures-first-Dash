import React, { useState, useEffect, useMemo } from 'react';
import { Scenario, DailyRate, MarketData, Holiday } from './types';
import { DEFAULT_MEETINGS, FALLBACK_HOLIDAYS } from './constants';
import { generateDailyRates, calculateMarketData } from './utils/analytics';
import ScenarioControls from './components/ScenarioControls';
import Dashboard from './components/Dashboard';
import ComparisonView from './components/ComparisonView';
import { TrendingUp, GitCompare } from 'lucide-react';

const DEFAULT_SCENARIO: Scenario = {
  id: 'default',
  name: 'Base Case 2026-2027',
  baseSofr: 4.30,
  baseEffr: 4.30,
  meetings: DEFAULT_MEETINGS,
  turns: {
    monthEnd: 5,
    quarterEnd: 10,
    yearEnd: 25
  }
};

const App: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>(FALLBACK_HOLIDAYS);
  const [currentScenario, setCurrentScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([DEFAULT_SCENARIO]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    // We attempt to fetch but fallback is already robust for 26/27
    const fetchHolidays = async () => {
      try {
        const [res26, res27] = await Promise.all([
             fetch('https://date.nager.at/api/v3/publicholidays/2026/US'),
             fetch('https://date.nager.at/api/v3/publicholidays/2027/US')
        ]);
        
        if (res26.ok && res27.ok) {
          const d26 = await res26.json();
          const d27 = await res27.json();
          setHolidays([...d26, ...d27]);
        }
      } catch (e) {
        console.warn("Holiday API error, using fallback", e);
      }
    };
    fetchHolidays();
  }, []);

  const dailyRates = useMemo<DailyRate[]>(() => {
    return generateDailyRates(currentScenario, holidays);
  }, [currentScenario, holidays]);

  const marketData = useMemo<MarketData>(() => {
    return calculateMarketData(dailyRates, currentScenario.meetings);
  }, [dailyRates, currentScenario.meetings]);

  const handleSaveScenario = () => {
    const newId = Date.now().toString();
    const newScenario = { ...currentScenario, id: newId };
    setSavedScenarios(prev => [...prev, newScenario]);
    setCurrentScenario(newScenario); 
    alert(`Scenario "${newScenario.name}" saved!`);
  };

  const handleLoadScenario = (id: string) => {
    const found = savedScenarios.find(s => s.id === id);
    if (found) setCurrentScenario(found);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Top Navbar */}
      <header className="bg-black px-6 py-2 flex items-center justify-between border-b border-slate-800 h-12">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-900/50 p-1.5 rounded border border-indigo-800">
             <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-slate-100">US Rates <span className="text-indigo-400">Analytics</span></h1>
          </div>
        </div>
        <div>
          <button 
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all border ${showComparison ? 'bg-indigo-900 border-indigo-500 text-white' : 'bg-black border-slate-700 text-slate-300 hover:bg-slate-900'}`}
          >
            <GitCompare className="w-3 h-3" />
            {showComparison ? 'Close' : 'Compare'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Sidebar: Inputs */}
        <aside className="w-full md:w-72 flex-shrink-0 border-r border-slate-800 bg-black">
           <ScenarioControls 
             scenario={currentScenario} 
             setScenario={setCurrentScenario} 
             onSave={handleSaveScenario}
             savedScenarios={savedScenarios}
             onLoad={handleLoadScenario}
           />
        </aside>

        {/* Right Area: Dashboard or Comparison */}
        <section className="flex-1 min-w-0 h-full bg-slate-950 flex flex-col">
          {showComparison ? (
            <ComparisonView 
              scenarios={savedScenarios} 
              holidays={holidays} 
              onClose={() => setShowComparison(false)} 
            />
          ) : (
            <Dashboard 
              data={marketData}
              scenario={currentScenario} 
            />
          )}
        </section>

      </main>
    </div>
  );
};

export default App;