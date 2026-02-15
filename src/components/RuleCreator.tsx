import React, { useState } from 'react';
import { CLINICAL_CONCEPTS, LVC_OPTIONS, UDVA_OPTIONS, CONTACT_LENS_OPTIONS, ANTERIOR_CHAMBER_OPTIONS, RETINA_OPTIONS } from '../constants';
import { AGE_RANGES, LA_RANGES, LENS_STATUS_OPTIONS } from '../services/recommendationService';
import { Clipboard, Check, ArrowLeft, Lightbulb } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const RuleCreator: React.FC<Props> = ({ onBack }) => {
  const [result, setResult] = useState('');
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [laGroups, setLaGroups] = useState<string[]>([]);
  const [lensStatuses, setLensStatuses] = useState<string[]>([]);
  
  // New state for dropdowns
  const [lvc, setLvc] = useState('any');
  const [udva, setUdva] = useState('any');
  const [contactLenses, setContactLenses] = useState('any');
  const [anteriorChamber, setAnteriorChamber] = useState('any');
  const [retina, setRetina] = useState('any');

  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleGenerateCode = () => {
    if (!result) {
        alert("Por favor, introduzca un 'Resultado del Concepto Clínico'.");
        return;
    }

    const specialConditions: string[] = [];
    if (lvc !== 'any') specialConditions.push(lvc);
    if (udva !== 'any') specialConditions.push(udva);
    if (contactLenses !== 'any') specialConditions.push(contactLenses);
    if (anteriorChamber !== 'any') specialConditions.push(anteriorChamber);
    if (retina !== 'any') specialConditions.push(retina);
      
    const ruleObject: any = {
      result: result,
      conditions: {}
    };

    if (ageGroups.length > 0) ruleObject.conditions.ageGroup = ageGroups.map(Number);
    if (laGroups.length > 0) ruleObject.conditions.laGroup = laGroups.map(Number);
    if (lensStatuses.length > 0) ruleObject.conditions.lensStatus = lensStatuses;
    if (specialConditions.length > 0) ruleObject.conditions.specialConditions = specialConditions;

    const codeString = JSON.stringify(ruleObject, null, 2)
      .replace(/"(\w+)":/g, '$1:') // Remove quotes from keys
      .replace(/'/g, '"'); // Keep double quotes for string values

    setGeneratedCode(`${codeString},`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="flex-1 flex flex-col h-full">
        <div className="p-6 overflow-y-auto flex-1">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h3 className="text-lg font-bold text-slate-800">Asistente de Creación de Reglas</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Inputs */}
                <div className="space-y-6">
                    <div>
                        <label className="font-semibold text-slate-800">1. Resultado del Concepto Clínico <span className="text-red-500">*</span></label>
                        <p className="text-xs text-slate-500 mb-2">Este será el concepto recomendado si todas las condiciones se cumplen.</p>
                        <select value={result} onChange={(e) => setResult(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
                           <option value="">-- Seleccione un concepto --</option>
                           {CLINICAL_CONCEPTS.map(c => <option key={c} value={c}>{c}</option>)}
                           <option value="Narrow">Narrow</option>
                        </select>
                    </div>

                    <div>
                        <label className="font-semibold text-slate-800">2. Grupos de Edad (Opcional)</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                           {Object.entries(AGE_RANGES).map(([key, label]) => (
                             <label key={key} className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer ${ageGroups.includes(key) ? 'bg-teal-50 border-teal-300' : 'bg-white'}`}>
                                <input type="checkbox" checked={ageGroups.includes(key)} onChange={() => handleToggle(setAgeGroups, key)} className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
                                <span className="text-sm">{label}</span>
                             </label>
                           ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="font-semibold text-slate-800">3. Grupos de Longitud Axial (Opcional)</label>
                         <div className="grid grid-cols-3 gap-2 mt-2">
                           {Object.entries(LA_RANGES).map(([key, label]) => (
                             <label key={key} className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer ${laGroups.includes(key) ? 'bg-teal-50 border-teal-300' : 'bg-white'}`}>
                                <input type="checkbox" checked={laGroups.includes(key)} onChange={() => handleToggle(setLaGroups, key)} className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
                                <span className="text-sm">{label}</span>
                             </label>
                           ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="font-semibold text-slate-800">4. Estado del Cristalino (Opcional)</label>
                         <div className="grid grid-cols-2 gap-2 mt-2">
                           {LENS_STATUS_OPTIONS.map(status => (
                             <label key={status} className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer ${lensStatuses.includes(status) ? 'bg-teal-50 border-teal-300' : 'bg-white'}`}>
                                <input type="checkbox" checked={lensStatuses.includes(status)} onChange={() => handleToggle(setLensStatuses, status)} className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
                                <span className="text-sm capitalize">{status}</span>
                             </label>
                           ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="font-semibold text-slate-800">5. Condiciones Adicionales (Opcional)</label>
                        <p className="text-xs text-slate-500 mb-2">Seleccione las condiciones específicas que deben cumplirse.</p>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">LVC</label>
                                <select value={lvc} onChange={e => setLvc(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm">
                                    {Object.entries(LVC_OPTIONS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">UDVA</label>
                                <select value={udva} onChange={e => setUdva(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm">
                                    {Object.entries(UDVA_OPTIONS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Lentes de Contacto</label>
                                <select value={contactLenses} onChange={e => setContactLenses(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm">
                                    {Object.entries(CONTACT_LENS_OPTIONS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Cámara Anterior</label>
                                <select value={anteriorChamber} onChange={e => setAnteriorChamber(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm">
                                    {Object.entries(ANTERIOR_CHAMBER_OPTIONS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Retina</label>
                                <select value={retina} onChange={e => setRetina(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm">
                                    {Object.entries(RETINA_OPTIONS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Code Generation Output */}
                <div className="space-y-4">
                    <button onClick={handleGenerateCode} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-md font-semibold hover:bg-blue-700 transition-colors shadow">
                        Generar Código de la Regla
                    </button>
                    {generatedCode && (
                        <div className="relative">
                           <div className="bg-slate-800 text-white p-4 rounded-lg font-mono text-xs overflow-x-auto">
                               <pre><code>{generatedCode}</code></pre>
                           </div>
                           <button onClick={copyToClipboard} className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-slate-600 text-white rounded-md text-xs hover:bg-slate-500">
                               {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
                               {copied ? 'Copiado!' : 'Copiar'}
                           </button>
                        </div>
                    )}
                     <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                        <div className="flex items-center gap-3">
                            <Lightbulb className="w-8 h-8 text-amber-500 flex-shrink-0" />
                            <div>
                               <h4 className="font-bold text-amber-900">Instrucciones</h4>
                               <p className="text-xs text-amber-800 mt-1">
                                   1. Rellene el formulario y genere el código.<br/>
                                   2. Copie el código generado.<br/>
                                   3. Abra el archivo <strong>src/services/recommendationService.ts</strong>.<br/>
                                   4. Pegue el código dentro del array <strong>`ALL_RULES`</strong>.
                               </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
            <button 
                onClick={onBack}
                className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 shadow-sm transition-colors"
            >
                Volver a la Lista
            </button>
        </div>
    </div>
  );
};

export default RuleCreator;