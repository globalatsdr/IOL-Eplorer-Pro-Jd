import React, { useState } from 'react';
import { Rule } from '../types';
import RuleCreator from './RuleCreator';
import { X, PlusCircle } from 'lucide-react';

interface Props {
  rules: Rule[];
  onClose: () => void;
}

const RulesManager: React.FC<Props> = ({ rules, onClose }) => {
  const [showCreator, setShowCreator] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
          <h2 className="font-bold">Gestor de Reglas</h2>
          <div className="flex gap-2">
            {!showCreator && <button onClick={() => setShowCreator(true)} className="p-2 bg-teal-600 text-white rounded-lg"><PlusCircle className="w-4 h-4"/></button>}
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {showCreator ? <RuleCreator onBack={() => setShowCreator(false)} /> : (
            <div className="p-6">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100">
                  <tr><th className="p-2">Resultado</th><th className="p-2">Edad</th><th className="p-2">LA</th></tr>
                </thead>
                <tbody>
                  {rules.map((r, i) => (
                    <tr key={i} className="border-b"><td className="p-2 font-bold">{r.result}</td><td className="p-2">{r.conditions.ageGroup?.join(', ') || 'Cualquiera'}</td><td className="p-2">{r.conditions.laGroup?.join(', ') || 'Cualquiera'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RulesManager;