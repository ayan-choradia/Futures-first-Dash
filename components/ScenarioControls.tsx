import React from 'react';
import { Scenario, Meeting } from '../types';
import { Save, FolderOpen, RotateCcw } from 'lucide-react';

interface Props {
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  onSave: () => void;
  savedScenarios: Scenario[];
  onLoad: (id: string) => void;
}

const ScenarioControls: React.FC<Props> = ({ scenario, setScenario, onSave, savedScenarios, onLoad }) => {
  
  const handleBaseChange = (field: 'baseSofr' | 'baseEffr', val: string) => {
    const num = val === '' ? null : parseFloat(val);
    if (field === 'baseEffr' && val === '') {
        setScenario({ ...scenario, baseEffr: null });
    } else {
        setScenario({ ...scenario, [field]: num });
    }
  };

  const handleTurnChange = (field: 'monthEnd' | 'quarterEnd' | 'yearEnd', val: string) => {
    setScenario({
      ...scenario,
      turns: { ...scenario.turns, [field]: parseFloat(val) || 0 }
    });
  };

  const handleMeetingChange = (index: number, val: string) => {
    const newMeetings = [...scenario.meetings];
    newMeetings[index] = {
      ...newMeetings[index],
      hikeBps: parseFloat(val) || 0
    };
    setScenario({ ...scenario, meetings: newMeetings });
  };

  return (
    <div className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800 h-full overflow-y-auto custom-scrollbar">
      <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
        <RotateCcw className="w-5 h-5 text-indigo-400" /> Inputs
      </h2>

      {/* Scenario Manager */}
      <div className="mb-6 bg-slate-800 p-3 rounded-lg border border-slate-700">
        <div className="flex gap-2 mb-2">
           <input 
             type="text" 
             value={scenario.name}
             onChange={(e) => setScenario({...scenario, name: e.target.value})}
             className="flex-1 px-2 py-1 text-sm bg-slate-700 border border-slate-600 text-white rounded focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
             placeholder="Scenario Name"
           />
           <button onClick={onSave} className="bg-indigo-600 text-white p-1 rounded hover:bg-indigo-500 transition-colors">
             <Save className="w-4 h-4" />
           </button>
        </div>
        <div className="flex items-center gap-2">
           <FolderOpen className="w-4 h-4 text-slate-400" />
           <select 
            className="flex-1 text-sm p-1 bg-slate-700 border border-slate-600 text-white rounded focus:outline-none focus:border-indigo-500"
            onChange={(e) => onLoad(e.target.value)}
            value=""
           >
             <option value="" disabled>Load Scenario...</option>
             {savedScenarios.map(s => (
               <option key={s.id} value={s.id}>{s.name}</option>
             ))}
           </select>
        </div>
      </div>

      {/* Base Rates */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Base Rates (%)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Current SOFR</label>
            <input 
              type="number" 
              step="0.01"
              value={scenario.baseSofr}
              onChange={(e) => handleBaseChange('baseSofr', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Current EFFR</label>
            <input 
              type="number" 
              step="0.01"
              value={scenario.baseEffr ?? ''}
              placeholder={scenario.baseSofr.toString()}
              onChange={(e) => handleBaseChange('baseEffr', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 italic">* Calculation uses EFFR (or SOFR if blank) as 'E'</p>
      </div>

      {/* Turn Premiums */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Turn Premiums (bps)</h3>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Month-End</label>
            <input 
              type="number"
              value={scenario.turns.monthEnd}
              onChange={(e) => handleTurnChange('monthEnd', e.target.value)}
              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 text-white rounded text-sm text-center focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Qtr-End</label>
            <input 
              type="number"
              value={scenario.turns.quarterEnd}
              onChange={(e) => handleTurnChange('quarterEnd', e.target.value)}
              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 text-white rounded text-sm text-center focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Year-End</label>
            <input 
              type="number"
              value={scenario.turns.yearEnd}
              onChange={(e) => handleTurnChange('yearEnd', e.target.value)}
              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 text-white rounded text-sm text-center focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Meetings */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">FOMC Meetings</h3>
        <div className="space-y-2">
          {scenario.meetings.map((m, idx) => (
            <div key={m.date} className="flex items-center justify-between text-sm bg-slate-800/50 p-2 rounded border border-slate-800">
              <span className="text-slate-300 font-medium w-24">
                {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="5"
                  value={m.hikeBps}
                  onChange={(e) => handleMeetingChange(idx, e.target.value)}
                  className={`w-20 px-2 py-1 rounded text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-900 border ${m.hikeBps > 0 ? 'text-red-400 border-red-900/50' : m.hikeBps < 0 ? 'text-green-400 border-green-900/50' : 'text-slate-400 border-slate-700'}`}
                />
                <span className="text-xs text-slate-500 w-6">bps</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScenarioControls;
