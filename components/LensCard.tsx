
import React, { useState } from 'react';
import { Lens, SphereRange } from '../types';
import { 
  ChevronDown, 
  ChevronUp, 
  Ruler, 
  Activity, 
  CheckCircle, 
  Circle, 
  Globe, 
  ShieldCheck,
  Zap,
  Microscope,
  Layers,
  Settings,
  Lightbulb
} from 'lucide-react';

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
    const query = encodeURIComponent(`${lens.manufacturer} ${lens.name} IOL specifications`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const renderConstantRow = (label: string, nominal?: number | null, optimized?: number | null) => {
    if (nominal === undefined && optimized === undefined) return null;
    if (nominal === null && optimized === null) return null;

    return (
      <div className="flex justify-between items-center text-[11px] py-1 border-b border-slate-50 last:border-0">
        <span className="text-slate-400 font-bold uppercase tracking-tighter w-1/3">{label}</span>
        <span className="text-slate-800 font-black text-center w-1/3">{nominal || '-'}</span>
        <span className="text-blue-600 font-black text-right w-1/3">{optimized || '-'}</span>
      </div>
    );
  };

  return (
    <div className={`relative bg-white rounded-[2rem] shadow-sm border overflow-hidden transition-all duration-300 group ${isSelected ? 'ring-4 ring-blue-500/20 border-blue-500 shadow-blue-900/5' : 'border-slate-200 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5'}`}>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleSelect(lens); }} 
        className="absolute top-6 right-6 z-10 p-1"
      >
        {isSelected ? (
          <div className="bg-blue-600 rounded-full p-1 shadow-lg shadow-blue-900/20 animate-in zoom-in-50">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
        ) : (
          <Circle className="w-8 h-8 text-slate-200 group-hover:text-slate-300 transition-colors" />
        )}
      </button>

      <div className="p-8 pb-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lens.manufacturer}</span>
            {lens.note && (
              <div className="group/note relative">
                <Lightbulb className="w-4 h-4 text-yellow-500 fill-yellow-500 animate-pulse" />
                <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-lg border border-yellow-200 shadow-lg opacity-0 group-hover/note:opacity-100 transition-opacity pointer-events-none z-20">
                  {lens.note}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleWebSearch} className="text-slate-300 hover:text-blue-500 transition-colors mr-10" title="Buscar ficha técnica">
            <Globe className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-4">{lens.name}</h3>
        
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${getTypeColor(lens.specifications.opticConcept)}`}>
            {lens.specifications.opticConcept}
          </span>
          {lens.specifications.toric && (
            <span className="px-3 py-1 rounded-lg text-[10px] bg-red-50 border border-red-100 font-black text-red-600 uppercase tracking-wider">
              Toric
            </span>
          )}
          <span className="px-3 py-1 rounded-lg text-[10px] bg-slate-100 border border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
            {lens.specifications.hydro}
          </span>
        </div>
      </div>

      <div className="px-8 py-6 grid grid-cols-2 gap-6 bg-slate-50/50 border-y border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100"><Ruler className="w-5 h-5 text-blue-500"/></div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Rango</p>
            <p className="text-sm font-black text-slate-800">{lens.availability.minSphere} a {lens.availability.maxSphere}D</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100"><Activity className="w-5 h-5 text-blue-500"/></div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">A-Const</p>
            <p className="text-sm font-black text-blue-600">{lens.constants.source.srkt || lens.constants.source.ultrasound || 'N/A'}</p>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full py-4 text-[11px] font-black text-slate-500 hover:text-blue-600 hover:bg-slate-100 flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
      >
        {expanded ? <>Cerrar Detalles <ChevronUp className="w-4 h-4"/></> : <>Especificaciones Técnicas <ChevronDown className="w-4 h-4"/></>}
      </button>
      
      {expanded && (
        <div className="px-8 pb-8 pt-2 bg-white animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-8">
            
            {/* Constantes Exhaustivas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                <Settings className="w-3.5 h-3.5"/> Comparativa de Constantes
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex justify-between mb-4 border-b border-slate-200 pb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/3">Constante</span>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-center w-1/3">Nominal/Ulib</span>
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest text-right w-1/3">Optimizado</span>
                </div>
                {renderConstantRow("SRK/T", lens.constants.source.srkt, lens.constants.optimized.srkt)}
                {renderConstantRow("US", lens.constants.source.ultrasound, lens.constants.optimized.ultrasound)}
                {renderConstantRow("pACD", lens.constants.source.pacd, lens.constants.optimized.pacd)}
                {renderConstantRow("sf", lens.constants.source.sf, lens.constants.optimized.sf)}
                {renderConstantRow("Haigis a0", lens.constants.source.haigis_a0, lens.constants.optimized.haigis_a0)}
                {renderConstantRow("Haigis a1", lens.constants.source.haigis_a1, lens.constants.optimized.haigis_a1)}
                {renderConstantRow("Haigis a2", lens.constants.source.haigis_a2, lens.constants.optimized.haigis_a2)}
                {renderConstantRow("Hoffer Q", lens.constants.source.hoffer_q, lens.constants.optimized.hoffer_q)}
                {renderConstantRow("Holladay 1", lens.constants.source.holladay_1, lens.constants.optimized.holladay_1)}
                {renderConstantRow("Barrett", lens.constants.source.barrett, lens.constants.optimized.barrett)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                <Layers className="w-3.5 h-3.5"/> Dioptrías y Adiciones
              </div>
              <div className="flex flex-wrap gap-2">
                {lens.availability.sphereRanges && lens.availability.sphereRanges.length > 0 ? (
                  lens.availability.sphereRanges.map((range: SphereRange, idx: number) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
                      <p className="text-[10px] font-bold text-slate-500 mb-0.5">Rango {idx + 1}</p>
                      <p className="text-xs font-black text-slate-800">{range.from} a {range.to}D <span className="text-blue-500 ml-1">({range.increment}D)</span></p>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic">Datos de rango no disponibles</span>
                )}
              </div>
              
              {lens.availability.additions && lens.availability.additions.length > 0 && (
                <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-2xl border border-purple-100">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <div className="flex flex-wrap gap-2">
                    {lens.availability.additions.map((a: number, i: number) => (
                      <span key={i} className="bg-white text-purple-700 px-2.5 py-1 rounded-lg text-xs font-black border border-purple-200">+{a}D</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                <Microscope className="w-3.5 h-3.5"/> Datos de Fabricación
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  { label: 'Mat. Óptico', val: lens.specifications.opticMaterial },
                  { label: 'Filtro', val: lens.specifications.filter },
                  { label: 'Ø Óptico', val: lens.specifications.opticDiameter ? `${lens.specifications.opticDiameter}mm` : '-' },
                  { label: 'Ø Haptico', val: lens.specifications.hapticDiameter ? `${lens.specifications.hapticDiameter}mm` : '-' },
                  { label: 'Diseño Háptico', val: lens.specifications.hapticDesign },
                  { label: 'Incisión Sug.', val: lens.specifications.incisionWidth ? `${lens.specifications.incisionWidth}mm` : '-' },
                  { label: 'Ind. Refrac.', val: lens.specifications.refractiveIndex || '-' },
                  { label: 'Núm. Abbe', val: lens.specifications.abbeNumber || '-' }
                ].map((spec, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-50 last:border-0">
                    <span className="text-slate-400 font-bold">{spec.label}</span>
                    <span className="text-slate-800 font-black">{spec.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${lens.specifications.preloaded ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                <ShieldCheck className="w-4 h-4" /> Pre-cargada
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${lens.specifications.achromatic ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                <Activity className="w-4 h-4" /> Acromática
              </div>
            </div>

            <button 
              onClick={handleWebSearch}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10"
            >
              <Globe className="w-4 h-4" /> Investigar Modelo en Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LensCard;
