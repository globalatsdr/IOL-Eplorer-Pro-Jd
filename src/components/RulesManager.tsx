import React, { useState } from 'react';
import { Rule } from '../types';
import { specialConditionsOptions, AGE_RANGES, LA_RANGES } from '../services/recommendationService';
import RuleCreator from './RuleCreator'; // Import the new creator component
import { X, Check, Ban, PlusCircle } from 'lucide-react';

interface Props {
  rules: Rule[];
  onClose: () => void;
}

const RulesManager: React.FC<Props> = ({ rules, onClose }) => {
  const [showCreator, setShowCreator] = useState(false);

  const mapAgeGroupToString = (group?: number[]): string => {
    if (!group || group.length === 0) return 'Cualquiera';
    return group.map(g => AGE_RANGES[g] || '?').join(', ');
  };

  const mapLaGroupToString = (group?: number[]): string => {
    if (!group || group.length === 0) return 'Cualquiera';
    return group.map(g => LA_RANGES[g] || '?').join(', ');
  };

  const renderSpecialConditions = (rule: Rule) => {
    const required = rule.conditions.specialConditions?.map(key => specialConditionsOptions[key] || key);
    const negated = rule.conditions.negatedConditions?.map(key => specialConditionsOptions[key] || key);

    if (!required && !negated) {
      return <span className="text-slate-400">-</span>;
    }

    return (
      <div className="flex flex-col gap-1.5">
        {required && required.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-slate-800">
              <strong className="font-semibold text-green-700">Requiere:</strong> {required.join(', ')}
            </span>
          </div>
        )}
        {negated && negated.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Ban className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-slate-800">
              <strong className="font-semibold text-red-700">Prohíbe:</strong> {negated.join(', ')}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Gestor de Reglas Clínicas</h2>
          <div className="flex items-center gap-4">
            {!showCreator && (
              <button 
                onClick={() => setShowCreator(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Crear Nueva Regla
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>
        </div>
        
        {showCreator ? (
          <RuleCreator onBack={() => setShowCreator(false)} />
        ) : (
          <>
            <div className="overflow-auto flex-1 p-6">
              <p className="text-sm text-slate-600 mb-4">
                Actualmente hay <strong>{rules.length}</strong> reglas definidas. Estas determinan qué "Concepto Clínico" se recomienda.
              </p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-3 font-semibold text-slate-700">Resultado (Concepto Clínico)</th>
                      <th className="p-3 font-semibold text-slate-700">Grupo Edad</th>
                      <th className="p-3 font-semibold text-slate-700">Grupo LA</th>
                      <th className="p-3 font-semibold text-slate-700">Estado Cristalino</th>
                      <th className="p-3 font-semibold text-slate-700">Condiciones Especiales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rules.map((rule, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-teal-800 align-top">{rule.result}</td>
                        <td className="p-3 align-top">{mapAgeGroupToString(rule.conditions.ageGroup)}</td>
                        <td className="p-3 align-top">{mapLaGroupToString(rule.conditions.laGroup)}</td>
                        <td className="p-3 align-top capitalize">
                          {rule.conditions.lensStatus?.join(', ') || 'Cualquiera'}
                        </td>
                        <td className="p-3 align-top">
                          {renderSpecialConditions(rule)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
                 <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 shadow-sm transition-colors"
                 >
                    Cerrar
                 </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RulesManager;
