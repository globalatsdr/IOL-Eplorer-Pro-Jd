import React, { useState } from 'react';
import { Lens, SphereRange } from '../types';
import { ChevronDown, ChevronUp, Ruler, Activity, CheckCircle, Circle } from 'lucide-react';

interface Props {
  lens: Lens;
  isSelected: boolean;
  onToggleSelect: (lens: Lens) => void;
}

const LensCard: React.FC<Props> = ({ lens, isSelected, onToggleSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const getTypeColor = (concept: string) => {
    const c = concept.toLowerCase();
    if (c.includes('monofocal')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (c.includes('multifocal')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (c.includes('edof')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className={`relative bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}>
      <button onClick={() => onToggleSelect(lens)} className="absolute top-4 right-4 z-10">
        {isSelected ? <CheckCircle className="w-6 h-6 text-blue-600" /> : <Circle className="w-6 h-6 text-gray-300" />}
      </button>
      <div className="p-5 border-b pr-12">
        <p className="text-[10px] font-bold text-gray-400 uppercase">{lens.manufacturer}</p>
        <h3 className="font-bold text-gray-900 truncate">{lens.name}</h3>
        <div className="flex gap-2 mt-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeColor(lens.specifications.opticConcept)}`}>{lens.specifications.opticConcept}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 border">{lens.specifications.hydro}</span>
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2"><Ruler className="w-3 h-3"/> {lens.availability.minSphere} a {lens.availability.maxSphere}D</div>
        <div className="flex items-center gap-2 font-bold"><Activity className="w-3 h-3"/> A-Const: {lens.constants.source.srkt || lens.constants.source.ultrasound || '-'}</div>
      </div>
      
      <button onClick={() => setExpanded(!expanded)} className="w-full py-2 bg-slate-50 text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 border-t">
        {expanded ? <>Menos info <ChevronUp className="w-3 h-3"/></> : <>Más especificaciones <ChevronDown className="w-3 h-3"/></>}
      </button>
      
      {expanded && (
        <div className="p-4 bg-slate-50/50 text-[10px] space-y-4 border-t">
          <div>
            <h4 className="font-bold text-slate-800 uppercase mb-2">Disponibilidad</h4>
            <div className="flex flex-wrap gap-2">
              {lens.availability.sphereRanges.map((range: SphereRange, idx: number) => (
                <span key={idx} className="bg-white border p-1 rounded">
                  {range.from} a {range.to}D (paso {range.increment})
                </span>
              ))}
            </div>
            {lens.availability.additions.length > 0 && (
              <div className="mt-2">
                Adiciones: {lens.availability.additions.map((a: number) => `+${a}D`).join(', ')}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between"><span>Material:</span> <span className="font-bold">{lens.specifications.opticMaterial}</span></div>
            <div className="flex justify-between"><span>Incision:</span> <span className="font-bold">{lens.specifications.incisionWidth}mm</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LensCard;
