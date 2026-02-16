import React, { useState, useMemo } from 'react';
import { Lens } from '../types';
import { X, ArrowDownAZ, ArrowUpAZ, Sparkles } from 'lucide-react';

interface Props {
  lenses: Lens[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onFindSimilar: (lens: Lens) => void;
}

const ComparisonView: React.FC<Props> = ({ lenses, onClose, onRemove, onFindSimilar }) => {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const features = useMemo(() => [
    { 
      label: 'Lens ID', 
      getValue: (l: Lens) => l.id, 
      getSortValue: (l: Lens) => parseInt(l.id, 10) || 0
    },
    { 
      label: 'Manufacturer', 
      getValue: (l: Lens) => l.manufacturer, 
      getSortValue: (l: Lens) => l.manufacturer 
    },
    { 
      label: 'Model Name', 
      getValue: (l: Lens) => l.name, 
      getSortValue: (l: Lens) => l.name 
    },
    { 
      label: 'Tecnología', 
      getValue: (l: Lens) => l.specifications.technology || '-', 
      getSortValue: (l: Lens) => l.specifications.technology || '' 
    },
    { 
      label: 'Optic Material', 
      getValue: (l: Lens) => l.specifications.opticMaterial, 
      getSortValue: (l: Lens) => l.specifications.opticMaterial 
    },
    { 
      label: 'Haptic Material', 
      getValue: (l: Lens) => l.specifications.hapticMaterial || '-', 
      getSortValue: (l: Lens) => l.specifications.hapticMaterial || '' 
    },
    { 
      label: 'Type', 
      getValue: (l: Lens) => l.specifications.opticConcept, 
      getSortValue: (l: Lens) => l.specifications.opticConcept 
    },
    { 
      label: 'Toric', 
      getValue: (l: Lens) => l.specifications.toric ? 'Yes' : 'No', 
      getSortValue: (l: Lens) => l.specifications.toric ? 1 : 0 
    },
    { 
      label: 'Optic Design', 
      getValue: (l: Lens) => l.specifications.opticDesign, 
      getSortValue: (l: Lens) => l.specifications.opticDesign 
    },
    { 
      label: 'Refractive Index', 
      getValue: (l: Lens) => l.specifications.refractiveIndex || '-', 
      getSortValue: (l: Lens) => l.specifications.refractiveIndex || -1 
    },
    { 
      label: 'Abbe Number', 
      getValue: (l: Lens) => l.specifications.abbeNumber || '-', 
      getSortValue: (l: Lens) => l.specifications.abbeNumber || -1 
    },
    { 
      label: 'Achromatic', 
      getValue: (l: Lens) => l.specifications.achromatic ? 'Yes' : 'No', 
      getSortValue: (l: Lens) => l.specifications.achromatic ? 1 : 0 
    },
    { 
      label: 'Filter', 
      getValue: (l: Lens) => l.specifications.filter, 
      getSortValue: (l: Lens) => l.specifications.filter 
    },
    { 
      label: 'Source A-Constant (Ultra)', 
      getValue: (l: Lens) => l.constants.source.ultrasound || '-', 
      getSortValue: (l: Lens) => l.constants.source.ultrasound || -1 
    },
    { 
      label: 'Source A-Constant (SRK/T)', 
      getValue: (l: Lens) => l.constants.source.srkt || '-', 
      getSortValue: (l: Lens) => l.constants.source.srkt || -1 
    },
    { 
      label: 'Optimized SRK/T', 
      getValue: (l: Lens) => l.constants.optimized.srkt || '-', 
      getSortValue: (l: Lens) => l.constants.optimized.srkt || -1 
    },
     { 
      label: 'Optimized Hoffer Q', 
      getValue: (l: Lens) => l.constants.optimized.hoffer_q || '-', 
      getSortValue: (l: Lens) => l.constants.optimized.hoffer_q || -1 
    },
    { 
      label: 'SA Correction', 
      getValue: (l: Lens) => l.specifications.saCorrection || '-', 
      getSortValue: (l: Lens) => l.specifications.saCorrection || -999 
    },
    { 
      label: 'Incision Width', 
      getValue: (l: Lens) => l.specifications.incisionWidth ? `${l.specifications.incisionWidth}mm` : '-', 
      getSortValue: (l: Lens) => l.specifications.incisionWidth || 999 
    },
    { 
      label: 'Optic Diameter', 
      getValue: (l: Lens) => l.specifications.opticDiameter ? `${l.specifications.opticDiameter}mm` : '-', 
      getSortValue: (l: Lens) => l.specifications.opticDiameter || 0 
    },
    { 
      label: 'Haptic Diameter', 
      getValue: (l: Lens) => l.specifications.hapticDiameter ? `${l.specifications.hapticDiameter}mm` : '-', 
      getSortValue: (l: Lens) => l.specifications.hapticDiameter || 0 
    },
    { 
      label: 'Haptic Design', 
      getValue: (l: Lens) => l.specifications.hapticDesign, 
      getSortValue: (l: Lens) => l.specifications.hapticDesign 
    },
    { 
      label: 'Preloaded', 
      getValue: (l: Lens) => l.specifications.preloaded ? 'Yes' : 'No', 
      getSortValue: (l: Lens) => l.specifications.preloaded ? 1 : 0 
    },
    { 
      label: 'Diopter Range', 
      getValue: (l: Lens) => `${l.availability.totalDiopterRange}D`, 
      getSortValue: (l: Lens) => l.availability.totalDiopterRange 
    },
    { 
      label: 'Additions', 
      getValue: (l: Lens) => l.availability.additions.length > 0 ? l.availability.additions.join(', ') : '-', 
      getSortValue: (l: Lens) => l.availability.additions.length 
    },
  ], []);

  const sortedLenses = useMemo(() => {
    if (!sortKey) return lenses;
    
    const feature = features.find(f => f.label === sortKey);
    if (!feature) return lenses;

    return [...lenses].sort((a, b) => {
      const valA = feature.getSortValue(a);
      const valB = feature.getSortValue(b);
      
      if (valA === valB) return 0;
      
      if (valA === -1 || valA === -999 || valA === '') return 1;
      if (valB === -1 || valB === -999 || valB === '') return -1;

      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return sortDirection === 'asc' ? -1 : 1;
    });
  }, [lenses, sortKey, sortDirection, features]);

  const toggleDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Compare Lenses</h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="flex items-center gap-2 text-sm bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-gray-500 pl-2 font-medium">Sort by:</span>
                <select 
                  className="bg-transparent border-none text-gray-700 font-medium focus:ring-0 cursor-pointer text-sm py-1"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                >
                  <option value="">Default Order</option>
                  {features.map(f => (
                    <option key={f.label} value={f.label}>{f.label}</option>
                  ))}
                </select>
                <div className="h-4 w-px bg-gray-200 mx-1"></div>
                <button 
                  onClick={toggleDirection}
                  disabled={!sortKey}
                  className={`p-1.5 rounded-md transition-colors ${!sortKey ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 text-blue-600'}`}
                  title={sortDirection === 'asc' ? "Ascending" : "Descending"}
                >
                  {sortDirection === 'asc' 
                    ? <ArrowDownAZ className="w-4 h-4" /> 
                    : <ArrowUpAZ className="w-4 h-4" />
                  }
                </button>
             </div>
             
             <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>

             <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
               <X className="w-6 h-6 text-gray-500" />
             </button>
          </div>
        </div>

        <div className="overflow-auto flex-1 p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-600 min-w-[200px] sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Feature
                </th>
                {sortedLenses.map(lens => (
                  <th key={lens.id} className="p-4 bg-white border-b-2 border-gray-200 min-w-[250px] relative group transition-colors hover:bg-slate-50">
                    <div className="flex justify-between items-center gap-2">
                       <span className="font-bold text-blue-900 text-lg">{lens.name}</span>
                       <button 
                         onClick={() => onRemove(lens.id)}
                         className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                         title="Remove from comparison"
                       >
                         <X className="w-5 h-5" />
                       </button>
                    </div>
                    <div className="text-xs text-gray-500 font-normal mt-1 mb-3">
                      {lens.manufacturer}
                      {lens.constants.sourceType && (
                        <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-200">
                          {lens.constants.sourceType}
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => onFindSimilar(lens)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-md border border-slate-200 transition-colors"
                      title={`Find Zeiss lenses similar to ${lens.name}`}
                    >
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                      Find Zeiss Equivalent
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors group/row">
                  <td className="p-4 border-b border-gray-100 font-medium text-gray-500 bg-gray-50 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover/row:bg-gray-100 transition-colors">
                    {feature.label}
                  </td>
                  {sortedLenses.map(lens => (
                    <td key={lens.id} className={`p-4 border-b border-gray-100 text-gray-900 border-l border-dashed border-gray-200 ${sortKey === feature.label ? 'bg-blue-50/30 font-semibold text-blue-900' : ''}`}>
                      {feature.getValue(lens)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
             <button 
                onClick={onClose}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
             >
                Close Comparison
             </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;
