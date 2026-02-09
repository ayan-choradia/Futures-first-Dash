import React, { useMemo } from 'react';
import { Scenario, Holiday, DerivedInstrument } from '../types';
import { generateDailyRates, calculateMarketData } from '../utils/analytics';

interface Props {
  scenarios: Scenario[];
  holidays: Holiday[];
  onClose: () => void;
}

const ComparisonView: React.FC<Props> = ({ scenarios, holidays, onClose }) => {
  const [idA, setIdA] = React.useState<string>(scenarios[0]?.id || '');
  const [idB, setIdB] = React.useState<string>(scenarios.length > 1 ? scenarios[1].id : scenarios[0]?.id || '');

  const dataA = useMemo(() => {
    const s = scenarios.find(x => x.id === idA);
    if (!s) return null;
    return calculateMarketData(generateDailyRates(s, holidays), s.meetings).monthly.outrights;
  }, [idA, scenarios, holidays]);

  const dataB = useMemo(() => {
    const s = scenarios.find(x => x.id === idB);
    if (!s) return null;
    return calculateMarketData(generateDailyRates(s, holidays), s.meetings).monthly.outrights;
  }, [idB, scenarios, holidays]);

  if (!dataA || !dataB) return <div className="p-10 text-center text-slate-400">Select scenarios to compare.</div>;

  return (
    <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 flex flex-col h-full animate-in fade-in zoom-in duration-300">
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-xl">
        <h2 className="font-bold text-slate-100">Scenario Comparison (Outrights)</h2>
        <button onClick={onClose} className="text-sm text-slate-400 hover:text-red-400">Close</button>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4 bg-slate-800 border-b border-slate-700">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Scenario A</label>
          <select value={idA} onChange={e => setIdA(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
            {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
           <label className="block text-xs font-bold text-slate-500 mb-1">Scenario B</label>
           <select value={idB} onChange={e => setIdB(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
            {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <table className="min-w-full divide-y divide-slate-700 text-right">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold text-slate-400">Month</th>
              <th className="px-4 py-2 text-xs font-bold text-slate-400">Price A</th>
              <th className="px-4 py-2 text-xs font-bold text-slate-400">Price B</th>
              <th className="px-4 py-2 text-xs font-bold text-indigo-400">Delta</th>
              <th className="px-4 py-2 text-xs font-bold text-slate-400">Rate A</th>
              <th className="px-4 py-2 text-xs font-bold text-slate-400">Rate B</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
             {dataA.map((rowA, i) => {
               const rowB = dataB[i];
               if (!rowB) return null;
               const delta = rowA.price - rowB.price;

               return (
                 <tr key={rowA.id} className="hover:bg-slate-800/50">
                   <td className="px-4 py-3 text-sm font-medium text-slate-200 text-left">{rowA.name}</td>
                   <td className="px-4 py-3 text-sm text-slate-400">{rowA.price.toFixed(3)}</td>
                   <td className="px-4 py-3 text-sm text-slate-400">{rowB.price.toFixed(3)}</td>
                   <td className={`px-4 py-3 text-sm font-bold ${delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                     {delta.toFixed(3)}
                   </td>
                   <td className="px-4 py-3 text-sm text-slate-500">{rowA.rate.toFixed(3)}%</td>
                   <td className="px-4 py-3 text-sm text-slate-500">{rowB.rate.toFixed(3)}%</td>
                 </tr>
               )
             })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonView;