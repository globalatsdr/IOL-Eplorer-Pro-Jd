import React, { useState } from 'react';
import { CLINICAL_CONCEPTS, LVC_OPTIONS, UDVA_OPTIONS, CONTACT_LENS_OPTIONS, ANTERIOR_CHAMBER_OPTIONS, RETINA_OPTIONS } from '../constants';
import { ArrowLeft, Code, ClipboardCheck, Info } from 'lucide-react';



interface Props {
  onClose: () => void;
}

const RuleCreator: React.FC<Props> = ({ onClose }) => {
  const [result, setResult] = useState('');
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [selectedLA, setSelectedLA] = useState<number | null>(null);
  const [lensStatus, setLensStatus] = useState<string>('any');
  
  // Special Conditions
  const [lvc, setLvc] = useState('any');
  const [udva, setUdva] = useState('any');
  const [contactLenses, setContactLenses] = useState('any');
  const [anteriorChamber, setAnteriorChamber] = useState('any');
  const [retina, setRetina] = useState('any');
  
  const [generatedCode, setGeneratedCode] = useState('');

  const ageLabels = ["35-44", "45-54", "55-64", "65-74", "75-85"];
  const laLabels = ["14-18,5", "19-22", "22,5-24,5", "25-29", "30-35"];

  const handleGenerateCode = () => {
    if (!result) return alert("Por favor, seleccione un Resultado Clínico.");

    const conditions: any = {};
    if (selectedAge !== null) conditions.ageGroup = [(selectedAge + 1).toString()];
    if (selectedLA !== null) conditions.laGroup = [(selectedLA + 1).toString()];
    if (lensStatus !== 'any') conditions.lensStatus = [lensStatus];
    if (lvc !== 'any') conditions.lvc = [lvc];
    if (udva !== 'any') conditions.udva = [udva];
    if (contactLenses !== 'any') conditions.contactLenses = [contactLenses];
    if (anteriorChamber !== 'any') conditions.anteriorChamber = [anteriorChamber];
    if (retina !== 'any') conditions.retina = [retina];

    const rule = {
      result,
      conditions
    };

    setGeneratedCode(JSON.stringify(rule, null, 2) + ",");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert("Código copiado al portapapeles");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      <div className="p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors">
              <ArrowLeft className="w-4 h-4"/> Cancelar
            </button>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Nueva Regla Clínica</h3>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8">
            {/* 1. Resultado */}
            <div className="space-y-3">
              <label className="block text-[11px] font-black text-blue-500 uppercase tracking-widest">1. Concepto Clínico (Resultado)</label>
              <select 
                value={result} 
                onChange={e => setResult(e.target.value)} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar Resultado...</option>
                {CLINICAL_CONCEPTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 2. Edad */}
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">2. Grupo de Edad</label>
                <div className="flex flex-wrap gap-2">
                  {ageLabels.map((label, idx) => (
                    <button
                      key={label}
                      onClick={() => setSelectedAge(selectedAge === idx ? null : idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                        selectedAge === idx 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/20' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Longitud Axial */}
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">3. Longitud Axial (mm)</label>
                <div className="flex flex-wrap gap-2">
                  {laLabels.map((label, idx) => (
                    <button
                      key={label}
                      onClick={() => setSelectedLA(selectedLA === idx ? null : idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                        selectedLA === idx 
                        ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-900/20' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-teal-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Estado Cristalino */}
            <div className="space-y-3">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">4. Estado Cristalino</label>
              <select 
                value={lensStatus} 
                onChange={e => setLensStatus(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none"
              >
                <option value="any">Cualquiera</option>
                <option value="catarata">Catarata</option>
                <option value="transparente">Transparente</option>
                <option value="disfuncional">Disfuncional</option>
                <option value="presbicia">Presbicia</option>
              </select>
            </div>

            {/* 5. Condiciones Especiales */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-[11px] font-black text-orange-500 uppercase tracking-widest">
                <Info className="w-3.5 h-3.5"/> Condiciones Especiales (Deben cumplirse todas)
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">LVC</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={lvc} onChange={e => setLvc(e.target.value)}>
                    {LVC_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">UCVA</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={udva} onChange={e => setUdva(e.target.value)}>
                    {UDVA_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Lentes de Contacto</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={contactLenses} onChange={e => setContactLenses(e.target.value)}>
                    {CONTACT_LENS_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cámara Anterior</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={anteriorChamber} onChange={e => setAnteriorChamber(e.target.value)}>
                    {ANTERIOR_CHAMBER_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Retina</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={retina} onChange={e => setRetina(e.target.value)}>
                    {RETINA_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerateCode} 
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
            >
              <Code className="w-5 h-5" /> Generar Código de Regla
            </button>
          </div>

          {generatedCode && (
            <div className="bg-slate-900 rounded-3xl p-8 space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between text-white">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Snippet de Código</span>
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-black uppercase tracking-widest transition-colors"
                >
                  <ClipboardCheck className="w-4 h-4" /> Copiar Código
                </button>
              </div>
              <pre className="bg-black/30 p-6 rounded-2xl text-blue-300 text-[11px] font-mono overflow-x-auto leading-relaxed border border-white/5">
                {generatedCode}
              </pre>
              <p className="text-[10px] text-slate-500 font-bold italic">
                * Copia este bloque y agrégalo al array ALL_RULES en services/recommendationService.ts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RuleCreator;