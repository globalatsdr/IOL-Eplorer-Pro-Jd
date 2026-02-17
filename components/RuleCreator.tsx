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
    if (!result) return alert("Seleccione un resultado.");
    const sc = [];
    if (lvc !== 'any') sc.push(lvc);
    if (udva !== 'any') sc.push(udva);
    if (contactLenses !== 'any') sc.push(contactLenses);
    if (anteriorChamber !== 'any') sc.push(anteriorChamber);
    if (retina !== 'any') sc.push(retina);
    const rule = {
      result,
      conditions: {
        ...(ageGroups.length > 0 && { ageGroup: ageGroups.map(Number) }),
        ...(laGroups.length > 0 && { laGroup: laGroups.map(Number) }),
        ...(lensStatuses.length > 0 && { lensStatus: lensStatuses }),
        ...(sc.length > 0 && { specialConditions: sc })
      }
    };
    setGeneratedCode(JSON.stringify(rule, null, 2) + ",");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="p-6 overflow-y-auto">
        <button onClick={onBack} className="flex items-center gap-2 mb-4 text-slate-600"><ArrowLeft className="w-4 h-4"/> Volver</button>
        <div className="space-y-6 max-w-2xl">
          <div>
            <label className="block font-bold mb-2">1. Resultado Clínico</label>
            <select value={result} onChange={e => setResult(e.target.value)} className="w-full p-2 border rounded">
              <option value="">Seleccionar...</option>
              {CLINICAL_CONCEPTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={handleGenerateCode} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Generar Código</button>
          {generatedCode && (
            <pre className="bg-slate-800 text-white p-4 rounded text-xs overflow-x-auto">{generatedCode}</pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default RuleCreator;