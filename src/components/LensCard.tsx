import React, { useState } from 'react';
import { Lens, ConstantValues } from '../types';
import Tooltip from './Tooltip';
import { ChevronDown, ChevronUp, Eye, Ruler, Activity, CheckCircle, Circle, Table } from 'lucide-react';

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

  const renderVal = (val: any, suffix = '') => {
    if (val !== null && val !== undefined && val !== '') {
        return `${val}${suffix}`;
    }
    return '-';
  };

  const hasHaigis = (c?: ConstantValues) => {
    return c && c.haigis_a0 !== null && c.haigis_a0 !== undefined;
  };
  
  const hasConstants = (key: keyof ConstantValues) => {
    return (lens.constants.source && lens.constants.source[key] != null) || (lens.constants.optimized && lens.constants.optimized[key] != null);
  }

  const sourceTypeDisplay = lens.constants.sourceType ? lens.constants.sourceType.charAt(0).toUpperCase() + lens.constants.sourceType.slice(1) : 'Source';

  return (
    <div 
      className={`relative bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleSelect(lens); }}
        className="absolute top-4 right-4 z-10 p-1 rounded-full bg-white hover:bg-gray-50 transition-colors"
        title={isSelected ? "Unselect" : "Select to compare"}
      >
        {isSelected ? (
          <CheckCircle className="w-6 h-6 text-blue-600 fill-blue-50" />
        ) : (
          <Circle className="w-6 h-6 text-gray-300 hover:text-gray-400" />
        )}
      </button>

      <div className="p-5 border-b border-gray-100 pr-12">
        <div className="mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lens.manufacturer}</p>
            <h3 className="text-lg font-bold text-gray-900 leading-tight mt-1">{lens.name}</h3>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(lens.specifications.opticConcept)}`}>
            {lens.specifications.opticConcept}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
             {lens.specifications.hydro}
          </span>
          {lens.specifications.hapticDesign && (
             <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100" title="Haptic Design">
                {lens.specifications.hapticDesign}
             </span>
          )}
           {lens.specifications.toric && (
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded border border-amber-200">
              Toric
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center text-gray-600">
          <Ruler className="w-4 h-4 mr-2 text-gray-400" />
          <span>Range: {lens.availability.totalDiopterRange > 0 ? `${lens.availability.totalDiopterRange} D` : 'N/A'}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Eye className="w-4 h-4 mr-2 text-gray-400" />
          <span>Mat: {lens.specifications.opticMaterial || 'N/A'}</span>
        </div>
        <div className="flex items-center text-gray-600 col-span-2">
           <Activity className="w-4 h-4 mr-2 text-gray-400" />
           <span className="flex items-center">
             A-Const: {renderVal(lens.constants.source.ultrasound || lens.constants.source.srkt)}
           </span>
        </div>
      </div>

      <div className={`bg-gray-50 border-t border-gray-100 overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[1200px]' : 'max-h-0'}`}>
        <div className="p-5 text-sm space-y-6">
          
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3 border-b border-slate-200 pb-1">Optics & Dimensions</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
               <div className="col-span-2 flex justify-between"><span className="text-gray-500">Optic Design:</span> <span className="font-medium text-gray-900">{renderVal(lens.specifications.opticDesign)}</span></div>
               <div className="flex justify-between"><span className="text-gray-500">Optic Ø:</span> <span className="font-medium text-gray-900">{renderVal(lens.specifications.opticDiameter, ' mm')}</span></div>
               <div className="flex justify-between"><span className="text-gray-500">Haptic Ø:</span> <span className="font-medium text-gray-900">{renderVal(lens.specifications.hapticDiameter, ' mm')}</span></div>
               <div className="col-span-2 flex justify-between"><span className="text-gray-500">Haptic Design:</span> <span className="font-medium text-gray-900 text-right max-w-[60%]">{renderVal(lens.specifications.hapticDesign)}</span></div>
               <div className="col-span-2 flex justify-between"><span className="text-gray-500">Haptic Material:</span> <span className="font-medium text-gray-900">{renderVal(lens.specifications.hapticMaterial)}</span></div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3 border-b border-slate-200 pb-1">Material Details</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
               <div className="flex justify-between">
                 <div className="flex items-center">
                    <span className="text-gray-500">Refr. Index:</span>
                    <Tooltip content="Refractive Index" />
                 </div>
                 <span className="font-medium text-gray-900">{renderVal(lens.specifications.refractiveIndex)}</span>
               </div>
               <div className="flex justify-between">
                 <div className="flex items-center">
                    <span className="text-gray-500">Abbe #:</span>
                    <Tooltip content="Abbe Number" />
                 </div>
                 <span className="font-medium text-gray-900">{renderVal(lens.specifications.abbeNumber)}</span>
               </div>
               <div className="col-span-2 flex justify-between"><span className="text-gray-500">Filter:</span> <span className="font-medium text-gray-900 capitalize">{renderVal(lens.specifications.filter)}</span></div>
            </div>
          </div>

           <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3 border-b border-slate-200 pb-1">Surgical Info</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
               <div className="flex justify-between"><span className="text-gray-500">Incision:</span> <span className="font-medium text-gray-900">{renderVal(lens.specifications.incisionWidth, ' mm')}</span></div>
               <div className="flex justify-between"><span className="text-gray-500">Preloaded:</span> <span className="font-medium text-gray-900">{lens.specifications.preloaded ? 'Yes' : 'No'}</span></div>
               <div className="col-span-2 flex justify-between"><span className="text-gray-500">Injector:</span> <span className="font-medium text-gray-900">{renderVal(lens.specifications.injectorSize, ' mm')}</span></div>
               <div className="col-span-2 flex justify-between"><span className="text-gray-500">Location:</span> <span className="font-medium text-gray-900">{renderVal(lens.specifications.intendedLocation)}</span></div>
            </div>
          </div>
          
          <div>
             <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-2 flex items-center gap-2">
                 <Table className="w-3 h-3" /> Biometry Constants
             </h4>
             <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs text-left bg-white">
                    <thead className="bg-gray-100 text-gray-600 font-semibold">
                        <tr>
                            <th className="px-3 py-2 border-b border-gray-200">Formula</th>
                            <th className="px-3 py-2 border-b border-gray-200">{sourceTypeDisplay}</th>
                            <th className="px-3 py-2 border-b border-gray-200">Optimized</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {hasConstants('ultrasound') && (
                            <tr>
                                <td className="px-3 py-1.5 font-medium text-gray-500">Ultrasound (A)</td>
                                <td className="px-3 py-1.5 text-gray-900">{renderVal(lens.constants.source?.ultrasound)}</td>
                                <td className="px-3 py-1.5 text-blue-600 font-medium">{renderVal(lens.constants.optimized?.ultrasound)}</td>
                            </tr>
                        )}
                        {hasConstants('srkt') && (
                            <tr>
                                <td className="px-3 py-1.5 font-medium text-gray-500">SRK/T (A)</td>
                                <td className="px-3 py-1.5 text-gray-900">{renderVal(lens.constants.source?.srkt)}</td>
                                <td className="px-3 py-1.5 text-blue-600 font-medium">{renderVal(lens.constants.optimized?.srkt)}</td>
                            </tr>
                        )}
                        {hasConstants('hoffer_q') && (
                            <tr>
                                <td className="px-3 py-1.5 font-medium text-gray-500">Hoffer Q (pACD)</td>
                                <td className="px-3 py-1.5 text-gray-900">{renderVal(lens.constants.source?.hoffer_q)}</td>
                                <td className="px-3 py-1.5 text-blue-600 font-medium">{renderVal(lens.constants.optimized?.hoffer_q)}</td>
                            </tr>
                        )}
                        {hasConstants('holladay_1') && (
                             <tr>
                                <td className="px-3 py-1.5 font-medium text-gray-500">Holladay 1 (sf)</td>
                                <td className="px-3 py-1.5 text-gray-900">{renderVal(lens.constants.source?.holladay_1)}</td>
                                <td className="px-3 py-1.5 text-blue-600 font-medium">{renderVal(lens.constants.optimized?.holladay_1)}</td>
                            </tr>
                        )}
                        {hasConstants('barrett') && (
                             <tr>
                                <td className="px-3 py-1.5 font-medium text-gray-500">Barrett (LF)</td>
                                <td className="px-3 py-1.5 text-gray-900">{renderVal(lens.constants.source?.barrett)}</td>
                                <td className="px-3 py-1.5 text-blue-600 font-medium">{renderVal(lens.constants.optimized?.barrett)}</td>
                            </tr>
                        )}
                        {hasHaigis(lens.constants.source) || hasHaigis(lens.constants.optimized) ? (
                            <tr>
                                <td className="px-3 py-1.5 font-medium text-gray-500">Haigis</td>
                                <td className="px-3 py-1.5 text-gray-900">
                                    {hasHaigis(lens.constants.source) ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span>a0: {lens.constants.source.haigis_a0}</span>
                                            <span>a1: {lens.constants.source.haigis_a1}</span>
                                            <span>a2: {lens.constants.source.haigis_a2}</span>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-3 py-1.5 text-blue-600 font-medium">
                                     {hasHaigis(lens.constants.optimized) ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span>a0: {lens.constants.optimized.haigis_a0}</span>
                                            <span>a1: {lens.constants.optimized.haigis_a1}</span>
                                            <span>a2: {lens.constants.optimized.haigis_a2}</span>
                                        </div>
                                    ) : '-'}
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
             </div>
             
             <div className="mt-3 text-xs flex justify-between border-t border-gray-100 pt-2">
                  <span className="text-gray-500">Spherical Aberration (SA) Correction:</span>
                  <span className="font-bold text-gray-900">{renderVal(lens.specifications.saCorrection, ' μm')}</span>
             </div>
          </div>

          <div>
             <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-2">Availability</h4>
             <div className="flex flex-wrap gap-2">
                {lens.availability.sphereRanges.map((range, idx) => (
                    <span key={idx} className="text-xs text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded">
                        Range: {range.from} to {range.to} (step {range.increment})
                    </span>
                ))}
             </div>
             {lens.availability.additions.length > 0 && (
                 <div className="mt-2 text-xs">
                    <span className="text-gray-500 mr-2">Additions:</span>
                    <span className="font-medium text-purple-700">
                        {lens.availability.additions.map(a => `+${a}D`).join(", ")}
                    </span>
                 </div>
             )}
          </div>
        </div>
      </div>

      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 bg-gray-50 border-t border-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-100 flex justify-center items-center text-xs font-medium transition-colors"
      >
        {expanded ? (
          <>Less Details <ChevronUp className="w-3 h-3 ml-1" /></>
        ) : (
          <>Full Specifications & Constants <ChevronDown className="w-3 h-3 ml-1" /></>
        )}
      </button>
    </div>
  );
};

export default LensCard;