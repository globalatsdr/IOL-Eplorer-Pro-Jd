import React, { useState } from 'react';
import { Lens, SphereRange } from '../types';
import { ChevronDown, ChevronUp, Ruler, Activity, CheckCircle, Circle, Globe } from 'lucide-react';

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
    if (c.includes('bifocal')) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleWebSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = encodeURIComponent(`${lens.manufacturer} ${lens.name} IOL`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  return (
    <div className={`relative bg-white rounded-xl shadow-sm border overflow-hidden transition-all group ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}>
      <button onClick={() => onToggleSelect(lens)} className="absolute top-4 right-4 z-10">
        {isSelected ? <CheckCircle className="w-6 h-6 text-blue-600" /> : <Circle className="w-6 h-6 text-gray-300 group-hover:text-slate-400" />}
      </button>

      <div className="p-5 border-b pr-12">
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{lens.manufacturer}</p>
          <button onClick={handleWebSearch} className="text-slate-300 hover:text-blue-500 transition-colors" title="Buscar en la web">
            <Globe className="w-3.5 h-3.5" />
          </button>
        </div>
        <h3 className="font-bold text-gray-900 truncate mt-0.5">{lens.name}</h3>
        <div className="flex gap-2 mt-2">
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase ${getTypeColor(lens.specifications.opticConcept)}`}>
            {lens.specifications.opticConcept}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[9px] bg-slate-100 border font-bold text-slate-500 uppercase">
            {lens.specifications.hydro}
          </span>
          {lens.specifications.toric && (
            <span className="px-2 py-0.5 rounded-md text-[9px] bg-red-50 border border-red-100 font-black text-red-600 uppercase">
              Tórica
            </span>
          )}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4 text-xs text-slate-600 bg-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 rounded-lg"><Ruler className="w-3.5 h-3.5 text-slate-400"/></div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Esfera</p>
            <p className="font-bold">{lens.availability.minSphere} a {lens.availability.maxSphere}D</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 rounded-lg"><Activity className="w-3.5 h-3.5 text-slate-400"/></div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">A-Const (SRK/T)</p>
            <p className="font-black text-blue-600">{lens.constants.source.srkt || lens.constants.source.ultrasound || '-'}</p>
          </div>
        </div>
      </div>
      
      <button onClick={() => setExpanded(!expanded)} className="w-full py-2 bg-slate-50 text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-1 border-t transition-colors">
        {expanded ? <>Menos info <ChevronUp className="w-3 h-3"/></> : <>Más especificaciones <ChevronDown className="w-3 h-3"/></>}
      </button>
      
      {expanded && (
        <div className="p-4 bg-slate-50/50 text-[10px] space-y-4 border-t animate-in slide-in-from-top-2">
          <div>
            <h4 className="font-black text-slate-800 uppercase mb-2 tracking-widest text-[9px]">Disponibilidad Detallada</h4>
            <div className="flex flex-wrap gap-2">
              {lens.availability.sphereRanges.length > 0 ? (
                lens.availability.sphereRanges.map((range: SphereRange, idx: number) => (
                  <span key={idx} className="bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">
                    {range.from} a {range.to}D (paso {range.increment}D)
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">No hay rangos especificados</span>
              )}
            </div>
            {lens.availability.additions && lens.availability.additions.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="font-bold text-purple-600 uppercase text-[9px]">Adiciones:</span>
                <div className="flex gap-1.5">
                  {lens.availability.additions.map((a: number, i: number) => (
                    <span key={i} className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-black border border-purple-100">+{a}D</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2 border-t border-slate-200/50">
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-400">Material Óptico:</span> 
              <span className="font-bold text-slate-700">{lens.specifications.opticMaterial}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-400">Diseño Háp.:</span> 
              <span className="font-bold text-slate-700">{lens.specifications.hapticDesign}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-400">Incisión Sug.:</span> 
              <span className="font-bold text-slate-700">{lens.specifications.incisionWidth ? `${lens.specifications.incisionWidth}mm` : 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-400">Filtro:</span> 
              <span className="font-bold text-slate-700">{lens.specifications.filter}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-400">Pre-cargada:</span> 
              <span className={`font-black uppercase ${lens.specifications.preloaded ? 'text-green-600' : 'text-slate-400'}`}>
                {lens.specifications.preloaded ? 'Sí' : 'No'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-400">Diámetro Ópt.:</span> 
              <span className="font-bold text-slate-700">{lens.specifications.opticDiameter ? `${lens.specifications.opticDiameter}mm` : '-'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LensCard;