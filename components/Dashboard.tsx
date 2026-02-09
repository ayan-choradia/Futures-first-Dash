import React, { useState } from 'react';
import { MarketData, DerivedInstrument, Scenario } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Sliders } from 'lucide-react';

interface Props {
  data: MarketData;
  scenario: Scenario;
}

const formatPrice = (val: number) => val.toFixed(3);
const formatSens = (val: number) => {
    const pct = Math.round(val * 100);
    return pct === 0 ? '' : `${pct}%`;
};

// Heatmap coloring for sensitivity
const getSensColor = (val: number) => {
    if (Math.abs(val) < 0.05) return 'text-slate-600';
    const opacity = Math.min(Math.abs(val), 1);
    if (val > 0.05) return `text-emerald-400 font-medium`;
    if (val < -0.05) return `text-rose-400 font-medium`;
    return 'text-slate-600';
};

const AnalyticTable = ({ 
  title, 
  instruments, 
  meetings,
  onSelect,
  selectedId
}: { 
  title: string, 
  instruments: DerivedInstrument[], 
  meetings: {date:string}[],
  onSelect: (i: DerivedInstrument) => void,
  selectedId: string | null
}) => {
  return (
    <div className="bg-black border border-slate-800 flex flex-col h-full overflow-hidden">
        <div className="bg-slate-900/80 px-2 py-1 border-b border-slate-800 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{title}</span>
            <span className="text-[9px] text-slate-500 font-mono">{instruments.length}</span>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-right text-[10px] font-mono border-collapse">
                <thead className="bg-slate-900 sticky top-0 z-10">
                    <tr>
                        <th className="px-2 py-1 text-left text-slate-500 border-b border-slate-800">Tenor</th>
                        <th className="px-2 py-1 text-yellow-500 border-b border-slate-800">Price</th>
                        {meetings.map(m => (
                            <th key={m.date} className="px-1 py-1 text-slate-500 border-b border-l border-slate-800 min-w-[30px] whitespace-nowrap">
                                {new Date(m.date).toLocaleDateString('en-US',{month:'short',day:'numeric'}).split(' ')[0]} <span className="text-[8px] text-slate-600">'{m.date.substring(2,4)}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {instruments.map(inst => (
                        <tr 
                            key={inst.id} 
                            onClick={() => onSelect(inst)}
                            className={`cursor-pointer transition-colors border-b border-slate-900 ${selectedId === inst.id ? 'bg-indigo-900/40' : 'hover:bg-slate-800/30'}`}
                        >
                            <td className="px-2 py-0.5 text-left font-bold text-indigo-300 border-r border-slate-800/50 whitespace-nowrap">{inst.id}</td>
                            <td className={`px-2 py-0.5 border-r border-slate-800/50 ${inst.price < 0 ? 'text-red-400' : 'text-slate-200'}`}>{formatPrice(inst.price)}</td>
                            {meetings.map(m => {
                                const s = inst.meetingSensitivities[m.date] || 0;
                                return (
                                    <td key={m.date} className={`px-1 py-0.5 border-r border-slate-800/30 ${getSensColor(s)}`}>
                                        {formatSens(s)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

const AnalysisChart = ({ 
  selected, 
  meetings 
}: { 
  selected: DerivedInstrument | null, 
  meetings: {date:string}[] 
}) => {
    if (!selected) return (
        <div className="h-full flex items-center justify-center text-slate-600 text-xs uppercase tracking-widest">
            Select Instrument
        </div>
    );

    const chartData = meetings.map(m => ({
        date: m.date,
        shortDate: new Date(m.date).toLocaleDateString('en-US', {month:'short', year:'2-digit'}),
        impact: (selected.meetingSensitivities[m.date] || 0) * 100 
    }));

    return (
        <div className="h-full flex flex-col p-2">
            <div className="flex justify-between items-center mb-1">
                <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {selected.name}
                        <span className="text-xs font-normal text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            Sensitivity Profile
                        </span>
                    </h3>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-500">Price</span>
                    <span className="text-2xl font-mono text-yellow-400">{selected.price.toFixed(3)}</span>
                </div>
            </div>
            <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top: 10, right: 10, bottom: 20, left: 0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis 
                            dataKey="shortDate" 
                            stroke="#555" 
                            tick={{fontSize: 10, fill: '#888'}} 
                            interval={0} 
                            angle={-45}
                            textAnchor="end"
                            height={40}
                        />
                        <YAxis stroke="#555" tick={{fontSize: 10, fill: '#666'}} />
                        <Tooltip 
                            cursor={{fill: '#ffffff05'}}
                            contentStyle={{backgroundColor: '#000', borderColor: '#333', fontSize: '12px'}}
                            formatter={(val: number) => [`${val.toFixed(1)}%`, 'Impact']}
                        />
                        <ReferenceLine y={0} stroke="#444" />
                        <Bar dataKey="impact" fill="#6366f1" radius={[2, 2, 0, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const Dashboard: React.FC<Props> = ({ data, scenario }) => {
  const [selectedInst, setSelectedInst] = useState<DerivedInstrument | null>(data.monthly.spreads[0] || null);
  const meetings = scenario.meetings;

  return (
    <div className="h-full bg-slate-950 p-1 flex flex-col gap-1 overflow-hidden">
        
        {/* ROW 1: SR1 MONTHLY (25% Height) */}
        <div className="h-[25%] min-h-0 flex gap-1">
            <div className="w-[30%] flex flex-col">
                 <AnalyticTable 
                    title="SR1 Outrights" 
                    instruments={data.monthly.outrights} 
                    meetings={meetings} 
                    onSelect={setSelectedInst} 
                    selectedId={selectedInst?.id || null}
                />
            </div>
            <div className="w-[35%] flex flex-col">
                <AnalyticTable 
                    title="SR1 Spreads (1M)" 
                    instruments={data.monthly.spreads} 
                    meetings={meetings} 
                    onSelect={setSelectedInst} 
                    selectedId={selectedInst?.id || null}
                />
            </div>
            <div className="w-[35%] flex flex-col">
                <AnalyticTable 
                    title="SR1 Flies" 
                    instruments={data.monthly.flies} 
                    meetings={meetings} 
                    onSelect={setSelectedInst} 
                    selectedId={selectedInst?.id || null}
                />
            </div>
        </div>

        {/* ROW 2: SR3 QUARTERLY (25% Height) */}
        <div className="h-[25%] min-h-0 flex gap-1">
             <div className="w-[25%] flex flex-col">
                 <AnalyticTable 
                    title="SR3 Outrights" 
                    instruments={data.quarterly.outrights} 
                    meetings={meetings} 
                    onSelect={setSelectedInst} 
                    selectedId={selectedInst?.id || null}
                />
            </div>
            <div className="w-[25%] flex flex-col">
                 <AnalyticTable 
                    title="SR3 Spreads" 
                    instruments={data.quarterly.spreads} 
                    meetings={meetings} 
                    onSelect={setSelectedInst} 
                    selectedId={selectedInst?.id || null}
                />
            </div>
            <div className="w-[25%] flex flex-col">
                 <AnalyticTable 
                    title="SR3 Flies" 
                    instruments={data.quarterly.flies} 
                    meetings={meetings} 
                    onSelect={setSelectedInst} 
                    selectedId={selectedInst?.id || null}
                />
            </div>
            <div className="w-[25%] flex flex-col">
                 <AnalyticTable 
                    title="SR3 Strat (Defly/Condor)" 
                    instruments={[...data.quarterly.deflies, ...data.quarterly.condors]} 
                    meetings={meetings} 
                    onSelect={setSelectedInst} 
                    selectedId={selectedInst?.id || null}
                />
            </div>
        </div>

        {/* ROW 3: ANALYSIS & KPI (Remaining ~50%) */}
        <div className="flex-1 min-h-0 flex gap-1 bg-black border border-slate-800">
            <div className="w-64 p-3 border-r border-slate-800 flex flex-col">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <Sliders className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Stats</span>
                </div>
                
                <div className="space-y-4">
                     <div className="bg-slate-900/50 p-3 rounded border border-slate-800/50">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Start Rate</div>
                        <div className="text-2xl font-mono text-white mt-1">{scenario.baseSofr.toFixed(2)}%</div>
                     </div>
                     <div className="bg-slate-900/50 p-3 rounded border border-slate-800/50">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Net Hikes</div>
                        <div className="text-2xl font-mono text-green-400 mt-1">
                            {scenario.meetings.reduce((a,b) => a + b.hikeBps, 0)} <span className="text-sm text-slate-600">bps</span>
                        </div>
                     </div>
                     <div className="bg-slate-900/50 p-3 rounded border border-slate-800/50">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Scenario</div>
                        <div className="text-xs text-slate-300 mt-1 line-clamp-2 leading-tight">{scenario.name}</div>
                     </div>
                </div>
            </div>
            <div className="flex-1">
                <AnalysisChart selected={selectedInst} meetings={meetings} />
            </div>
        </div>

    </div>
  );
};

export default Dashboard;