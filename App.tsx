import React, { useEffect, useState, useMemo, useRef } from 'react';
import { IOL_XML_DATA, CLINICAL_CONCEPTS } from './constants';
import { parseIOLData } from './utils/parser';
import { Lens, FilterTab, BasicFilters, DrAlfonsoInputs } from './types';
import LensCard from './components/LensCard';
import ComparisonView from './components/ComparisonView';
import { getLensRecommendations, ALL_RULES } from './services/recommendationService';
import RulesManager from './components/RulesManager';
import { Upload, Lock, RotateCcw } from 'lucide-react';

const EXTERNAL_DB_URL = "https://raw.githubusercontent.com/globalatsdr/IOLs-Database/refs/heads/main/IOLexport.xml";
const STORAGE_KEY_XML = 'iol_data_cache_v2';
const STORAGE_KEY_OVERRIDES = 'iol_override_data_cache_v1';

const isObject = (item: any) => (item && typeof item === 'object' && !Array.isArray(item));

const deepMerge = (target: any, source: any): any => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key]) && key in target && isObject(target[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
};

function App() {
  const [baseLenses, setBaseLenses] = useState<Lens[]>([]);
  const [overrideData, setOverrideData] = useState<Record<string, Partial<Lens>>>({});
  const [activeTab, setActiveTab] = useState<FilterTab>(FilterTab.BASIC);
  const [loading, setLoading] = useState(true);
  const xmlFileInputRef = useRef<HTMLInputElement>(null);

  const DR_ALFONSO_UNLOCK_PASSWORD = "3907/";
  const [passwordInput, setPasswordInput] = useState('');
  
  const isDrAlfonsoUnlocked = passwordInput === DR_ALFONSO_UNLOCK_PASSWORD;

  const [selectedLensIds, setSelectedLensIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [isRulesManagerOpen, setIsRulesManagerOpen] = useState(false);

  const [basicFilters, setBasicFilters] = useState<BasicFilters>({
    manufacturer: 'all',
    clinicalConcept: 'all',
    opticConcept: 'all',
    toric: 'all',
    technology: 'all'
  });

  const [drAlfonsoInputs, setDrAlfonsoInputs] = useState<DrAlfonsoInputs>({
    age: '', axialLength: '', lensStatus: 'any', refraction: 'any', lensMaterial: 'any',
    hapticDesign: 'any', opticConcept: 'any', toric: 'any', technology: 'any',
    lvc: 'any', udva: 'any', contactLenses: 'any', anteriorChamber: 'any', retina: 'any',
  });
  
  const [recommendedConcepts, setRecommendedConcepts] = useState<string[]>([]);
  
  const lenses = useMemo(() => {
    if (Object.keys(overrideData).length === 0) return baseLenses;
    return baseLenses.map(lens => overrideData[lens.id] ? deepMerge(lens, overrideData[lens.id]) : lens);
  }, [baseLenses, overrideData]);

  useEffect(() => {
    const concepts = getLensRecommendations(drAlfonsoInputs);
    setRecommendedConcepts(concepts);
  }, [drAlfonsoInputs]);

  useEffect(() => {
    const hasEnhance = recommendedConcepts.some(c => c.includes('Enhance'));
    if (activeTab === FilterTab.DR_ALFONSO && hasEnhance) {
      setDrAlfonsoInputs((prev: DrAlfonsoInputs) => prev.opticConcept !== 'Monofocal +' ? { ...prev, opticConcept: 'Monofocal +' } : prev);
    }
  }, [recommendedConcepts, activeTab]);

  const uniqueManufacturers = useMemo(() => Array.from(new Set(lenses.map(l => l.manufacturer))).sort(), [lenses]);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const cachedOverrides = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (cachedOverrides) try { setOverrideData(JSON.parse(cachedOverrides)); } catch (e) {}
      
      const cachedXML = localStorage.getItem(STORAGE_KEY_XML);
      let dataLoaded = false;
      if (cachedXML) {
        try {
          const data = parseIOLData(cachedXML);
          if (data.length > 0) { setBaseLenses(data); dataLoaded = true; }
        } catch (e) {}
      }
      if (!dataLoaded) try { setBaseLenses(parseIOLData(IOL_XML_DATA)); } catch (e) {}

      try {
        const response = await fetch(EXTERNAL_DB_URL);
        if (!response.ok) throw new Error();
        const text = await response.text();
        const newData = parseIOLData(text);
        if (newData.length > 0) {
          setBaseLenses(newData);
          localStorage.setItem(STORAGE_KEY_XML, text);
        }
      } catch (error) { console.log("Offline mode active"); } finally { setLoading(false); }
    };
    initData();
  }, []);

  const handleXMLUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        try {
          const parsedData = parseIOLData(text);
          setBaseLenses(parsedData);
          localStorage.setItem(STORAGE_KEY_XML, text);
          setSelectedLensIds(new Set());
          alert(`Cargadas ${parsedData.length} lentes.`);
        } catch (err) { alert('Error al leer XML.'); }
      }
    };
    reader.readAsText(file);
    if (xmlFileInputRef.current) xmlFileInputRef.current.value = '';
  };

  const toggleLensSelection = (lens: Lens) => {
    const newSelection = new Set(selectedLensIds);
    if (newSelection.has(lens.id)) newSelection.delete(lens.id);
    else {
      if (newSelection.size >= 5) { alert("Máximo 5 lentes."); return; }
      newSelection.add(lens.id);
    }
    setSelectedLensIds(newSelection);
  };

  const handleClinicalConceptChange = (val: string) => {
    let mappedOpticConcept = basicFilters.opticConcept;
    if (val === "Partial Range of Field-Narrow") mappedOpticConcept = "monofocal";
    else if (val === "Partial Range of Field-Enhance") mappedOpticConcept = "Monofocal +";
    else if (val === "Partial Range of Field-Extend") mappedOpticConcept = "EDoF";
    else if (val === "Full Range of Field-Steep") mappedOpticConcept = "bifocal";
    else if (val === "Full Range of Field-Smooth") mappedOpticConcept = "multifocal";
    else if (val === "Full Range of Field-Continuous") mappedOpticConcept = "multifocal";
    else if (val === "all") mappedOpticConcept = "all";
    setBasicFilters({ ...basicFilters, clinicalConcept: val, opticConcept: mappedOpticConcept });
  };

  const handleResetFilters = () => {
    setBasicFilters({ manufacturer: 'all', clinicalConcept: 'all', opticConcept: 'all', toric: 'all', technology: 'all' });
    setDrAlfonsoInputs({ age: '', axialLength: '', lensStatus: 'any', refraction: 'any', lensMaterial: 'any', hapticDesign: 'any', opticConcept: 'any', toric: 'any', technology: 'any', lvc: 'any', udva: 'any', contactLenses: 'any', anteriorChamber: 'any', retina: 'any' });
  };

  const filteredLenses = useMemo(() => {
    if (activeTab === FilterTab.DR_ALFONSO) {
      return lenses.filter(lens => {
        if (drAlfonsoInputs.opticConcept !== 'any' && lens.specifications.opticConcept !== drAlfonsoInputs.opticConcept) return false;
        if (drAlfonsoInputs.toric !== 'any') {
          const isToric = lens.specifications.toric;
          if (drAlfonsoInputs.toric === 'yes' && !isToric) return false;
          if (drAlfonsoInputs.toric === 'no' && isToric) return false;
        }
        return true;
      });
    }
    return lenses.filter(lens => {
      if (activeTab === FilterTab.BASIC) {
        if (basicFilters.manufacturer !== 'all' && lens.manufacturer !== basicFilters.manufacturer) return false;
        if (basicFilters.opticConcept !== 'all' && lens.specifications.opticConcept.toLowerCase() !== basicFilters.opticConcept.toLowerCase()) return false;
        if (basicFilters.toric !== 'all') {
          const isToric = lens.specifications.toric;
          if (basicFilters.toric === 'yes' && !isToric) return false;
          if (basicFilters.toric === 'no' && isToric) return false;
        }
      }
      return true;
    });
  }, [lenses, activeTab, basicFilters, drAlfonsoInputs]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando base de datos...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <input type="file" ref={xmlFileInputRef} onChange={handleXMLUpload} accept=".xml" className="hidden" />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">IOL Explorer Pro</h1>
        <div className="flex items-center gap-4">
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Código" className="bg-slate-100 border-none text-sm w-24 rounded-lg px-2 py-1" />
          <button onClick={() => xmlFileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"><Upload className="w-4 h-4" /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="flex gap-2 mb-8 max-w-md mx-auto bg-slate-200 p-1 rounded-xl">
          <button onClick={() => setActiveTab(FilterTab.BASIC)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === FilterTab.BASIC ? 'bg-white shadow' : 'text-slate-600'}`}>Básico</button>
          <button onClick={() => isDrAlfonsoUnlocked && setActiveTab(FilterTab.DR_ALFONSO)} className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${activeTab === FilterTab.DR_ALFONSO ? 'bg-white shadow' : isDrAlfonsoUnlocked ? 'text-slate-600' : 'text-slate-400 opacity-50'}`}>Dr. Alfonso {!isDrAlfonsoUnlocked && <Lock className="w-3 h-3" />}</button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
          <div className="flex justify-end mb-4">
            <button onClick={handleResetFilters} className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"><RotateCcw className="w-3 h-3"/> Reset All</button>
          </div>
          {activeTab === FilterTab.BASIC ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Fabricante</label>
                <select className="w-full p-2 bg-slate-50 border rounded-lg" value={basicFilters.manufacturer} onChange={e => setBasicFilters({...basicFilters, manufacturer: e.target.value})}>
                  <option value="all">Todos</option>
                  {uniqueManufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-blue-700">Concepto Clínico</label>
                <select className="w-full p-2 bg-blue-50 border border-blue-200 rounded-lg" value={basicFilters.clinicalConcept} onChange={e => handleClinicalConceptChange(e.target.value)}>
                  <option value="all">Selección Libre</option>
                  {CLINICAL_CONCEPTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="font-bold text-teal-800">Parámetros del Paciente</h3>
                 <button onClick={() => setIsRulesManagerOpen(true)} className="text-xs bg-slate-100 px-2 py-1 rounded">Reglas</button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <input type="number" placeholder="Edad" className="p-2 bg-slate-50 border rounded-lg" value={drAlfonsoInputs.age} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, age: e.target.value})} />
                <input type="number" placeholder="LA" className="p-2 bg-slate-50 border rounded-lg" value={drAlfonsoInputs.axialLength} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, axialLength: e.target.value})} />
              </div>
              {recommendedConcepts.length > 0 && (
                <div className="p-4 bg-teal-50 border border-teal-100 rounded-lg flex flex-wrap gap-2">
                  {recommendedConcepts.map(c => <span key={c} className="bg-white px-3 py-1 rounded-full text-xs font-bold text-teal-700 border border-teal-200">{c}</span>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLenses.map(lens => (
            <LensCard key={lens.id} lens={lens} isSelected={selectedLensIds.has(lens.id)} onToggleSelect={toggleLensSelection} />
          ))}
        </div>
      </main>

      {selectedLensIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg flex justify-between items-center max-w-7xl mx-auto z-30">
          <span className="font-medium">{selectedLensIds.size} lentes seleccionadas</span>
          <button onClick={() => setShowComparison(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Comparar</button>
        </div>
      )}

      {showComparison && <ComparisonView lenses={lenses.filter(l => selectedLensIds.has(l.id))} onClose={() => setShowComparison(false)} onRemove={id => {const n = new Set(selectedLensIds); n.delete(id); setSelectedLensIds(n);}} onFindSimilar={()=>{}} />}
      {isRulesManagerOpen && <RulesManager rules={ALL_RULES} onClose={() => setIsRulesManagerOpen(false)} />}
    </div>
  );
}

export default App;
