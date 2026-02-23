import React from 'react';
import { Rule } from '../types';
import { X } from 'lucide-react';
import { 
  AGE_GROUPS, 
  LA_GROUPS, 
  LENS_STATUS_OPTIONS, 
  LVC_OPTIONS, 
  UDVA_OPTIONS, 
  CONTACT_LENS_OPTIONS, 
  ANTERIOR_CHAMBER_OPTIONS, 
  RETINA_OPTIONS 
} from '../constants';

// Helper para obtener el texto de una opción a partir de su ID
const getOptionLabel = (options: {id: string, label: string}[], id: string) => {
  const option = options.find(o => o.id === id);
  return option ? option.label : id;
};

interface Props {
  rules: Rule[];
  onClose: () => void;
}

const RulesManager: React.FC<Props> = ({ rules, onClose }) => {
  const renderCondition = (label: string, value: any, options?: {id: string, label: string}[]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    
    let displayValue;
    if (Array.isArray(value)) {
      displayValue = options ? value.map(id => getOptionLabel(options, id)).join(', ') : value.join(', ');
    } else {
      displayValue = options ? getOptionLabel(options, value) : value;
    }

    return (
      <div className="flex items-start gap-2 text-xs">
        <span className="font-bold text-slate-500">{label}:</span>
        <span className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">{displayValue}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Gestor de Reglas Clínicas</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <p className="text-sm font-bold text-blue-800">Resultado: <span className="font-black text-blue-900">{rule.result}</span></p>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {renderCondition('Edad', rule.conditions.ageGroup, AGE_GROUPS)}
                  {renderCondition('Longitud Axial', rule.conditions.laGroup, LA_GROUPS)}
                  {renderCondition('Estado Cristalino', rule.conditions.lensStatus, LENS_STATUS_OPTIONS)}
                  {renderCondition('Cirugía Refractiva', rule.conditions.lvc, LVC_OPTIONS)}
                  {renderCondition('AVSC Lejana', rule.conditions.udva, UDVA_OPTIONS)}
                  {renderCondition('Lentes Contacto', rule.conditions.contactLenses, CONTACT_LENS_OPTIONS)}
                  {renderCondition('Cám. Anterior', rule.conditions.anteriorChamber, ANTERIOR_CHAMBER_OPTIONS)}
                  {renderCondition('Retina', rule.conditions.retina, RETINA_OPTIONS)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesManager;