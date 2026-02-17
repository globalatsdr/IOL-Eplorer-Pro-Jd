import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  IOL_XML_DATA, 
  CLINICAL_CONCEPTS, 
  LVC_OPTIONS, 
  UDVA_OPTIONS, 
  CONTACT_LENS_OPTIONS, 
  ANTERIOR_CHAMBER_OPTIONS, 
  RETINA_OPTIONS 
} from './constants';
import { parseIOLData } from './utils/parser';
import { Lens, FilterTab, BasicFilters, AdvancedFilters, DrAlfonsoInputs } from './types';
import LensCard from './components/LensCard';
import ComparisonView from './components/ComparisonView';
import DualRangeSlider from './components/DualRangeSlider';
import { getLensRecommendations, ALL_RULES } from './services/recommendationService';
import RulesManager from './components/RulesManager';
import { 
  Upload, 
  Lock, 
  RotateCcw, 
  Search, 
  ShieldCheck, 
  Zap, 
  Eye, 
  Info,
  ExternalLink,
  FileJson
} from 'lucide-react';

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
  const overrideFileInputRef = useRef<HTMLInputElement>(null);

  const ADVANCED_UNLOCK_PASSWORD = "1234!";
  const DR_ALFONSO_UNLOCK_PASSWORD = "3907/";
  const [passwordInput, setPasswordInput] = useState('');
  
  const isAdvancedUnlocked = passwordInput === ADVANCED_UNLOCK_PASSWORD;
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

  const [advFilters, setAdvFilters] = useState<AdvancedFilters>({
    filterMinSphere: 10,
    filterMaxSphere: 30,
    isPreloaded: false,
    isYellowFilter: false,
    hydroType: 'all',
    keyword: ''
  });

  const [drAlfonsoInputs, setDrAlfonsoInputs] = useState<DrAlfonsoInputs>({
    age: '', axialLength: '', lensStatus: 'any', refraction: 'any', lensMaterial: 'any',
    hapticDesign: 'any', opticConcept: 'any', toric: 'any', technology: 'any',
    lvc: 'any', udva: 'any', contactLenses: 'any', anteriorChamber: 'any', retina: 'any',
  });
  
  const [recommendedConcepts, setRecommendedConcepts] = useState<string[]>([]);
  
  const lenses = useMemo(() => {
    if (Object.keys(overrideData).length === 0) return baseLenses;
    return baseLenses.map(lens => 
      overrideData[lens.id] ? deepMerge(lens, overrideData[lens.id]) : lens
    );
  }, [baseLenses, overrideData]);

  useEffect(() => {
    const concepts = getLensRecommendations(drAlfonsoInputs);
    setRecommendedConcepts(concepts);
  }, [drAlfonsoInputs]);

  const uniqueManufacturers = useMemo(() => Array.from(new Set(lenses.map(l => l.manufacturer))).sort(), [lenses]);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      
      const cachedOverrides = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (cachedOverrides) {
        try { setOverrideData(JSON.parse(cachedOverrides)); } catch (e) { console.error("Error loading overrides"); }
      }

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
        if (response.ok) {
          const text = await response.text();
          const newData = parseIOLData(text);
          if (newData.length > 0) {
            setBaseLenses(newData);
            localStorage.setItem(STORAGE_KEY_XML, text);
          }
        }
      } catch (error) { console.log("Usando DB local/cache"); } finally { setLoading(false); }
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

  const handleOverrideUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setOverrideData(json);
        localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(json));
        alert('Modificaciones cargadas con éxito.');
      } catch (err) { alert('Error al leer el archivo JSON de modificaciones.'); }
    };
    reader.readAsText(file);
    if (overrideFileInputRef.current) overrideFileInputRef.current.value = '';
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
    setAdvFilters({ filterMinSphere: 10, filterMaxSphere: 30, isPreloaded: false, isYellowFilter: false, hydroType: 'all', keyword: '' });
    setDrAlfonsoInputs({ age: '', axialLength: '', lensStatus: 'any', refraction: 'any', lensMaterial: 'any', hapticDesign: 'any', opticConcept: 'any', toric: 'any', technology: 'any', lvc: 'any', udva: 'any', contactLenses: 'any', anteriorChamber: 'any', retina: 'any' });
  };

  const filteredLenses = useMemo(() => {
    return lenses.filter(lens => {
      if (advFilters.keyword && !lens.name.toLowerCase().includes(advFilters.keyword.toLowerCase()) && !lens.manufacturer.toLowerCase().includes(advFilters.keyword.toLowerCase())) return false;

      if (activeTab === FilterTab.BASIC) {
        if (basicFilters.manufacturer !== 'all' && lens.manufacturer !== basicFilters.manufacturer) return false;
        if (basicFilters.opticConcept !== 'all' && lens.specifications.opticConcept.toLowerCase() !== basicFilters.opticConcept.toLowerCase()) return false;
        if (basicFilters.toric !== 'all') {
          const isToric = lens.specifications.toric;
          if (basicFilters.toric === 'yes' && !isToric) return false;
          if (basicFilters.toric === 'no' && isToric) return false;
        }
      } else if (activeTab === FilterTab.ADVANCED) {
        if (lens.availability.minSphere > advFilters.filterMinSphere || lens.availability.maxSphere < advFilters.filterMaxSphere) return false;
        if (advFilters.isPreloaded && !lens.specifications.preloaded) return false;
        if (advFilters.isYellowFilter && !lens.specifications.filter.toLowerCase().includes('yellow')) return false;
        if (advFilters.hydroType !== 'all' && lens.specifications.hydro.toLowerCase() !== advFilters.hydroType) return false;
      } else if (activeTab === FilterTab.DR_ALFONSO) {
        if (drAlfonsoInputs.opticConcept !== 'any' && lens.specifications.opticConcept !== drAlfonsoInputs.opticConcept) return false;
        if (drAlfonsoInputs.toric !== 'any') {
          const isToric = lens.specifications.toric;
          if (drAlfonsoInputs.toric === 'yes' && !isToric) return false;
          if (drAlfonsoInputs.toric === 'no' && isToric) return false;
        }
      }
      return true;
    });
  }, [lenses, activeTab, basicFilters, advFilters, drAlfonsoInputs]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando base de datos...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <input type="file" ref={xmlFileInputRef} onChange={handleXMLUpload} accept=".xml" className="hidden" />
      <input type="file" ref={overrideFileInputRef} onChange={handleOverrideUpload} accept=".json" className="hidden" />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">IOL Explorer Pro</h1>
          <a href="https://iolcon.org" target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100 transition-colors">
            <ExternalLink className="w-3 h-3" /> IOLcon.org
          </a>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button onClick={() => xmlFileInputRef.current?.click()} className="p-2 hover:bg-white rounded-md transition-all text-slate-600" title="Cargar XML Base">
              <Upload className="w-4 h-4" />
            </button>
            <button onClick={() => overrideFileInputRef.current?.click()} className="p-2 hover:bg-white rounded-md transition-all text-slate-600" title="Cargar Modificaciones (JSON)">
              <FileJson className="w-4 h-4" />
            </button>
            <button onClick={handleResetFilters} className="p-2 hover:bg-white rounded-md transition-all text-slate-600" title="Limpiar Filtros">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-8 w-px bg-slate-200 mx-1"></div>
          
          <input 
            type="password" 
            value={passwordInput} 
            onChange={(e) => setPasswordInput(e.target.value)} 
            placeholder="Pass" 
            className="bg-slate-100 border-none text-xs w-16 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-400" 
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="flex gap-2 mb-8 max-w-xl mx-auto bg-slate-200 p-1 rounded-xl">
          <button onClick={() => setActiveTab(FilterTab.BASIC)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === FilterTab.BASIC ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:bg-white/50'}`}>Basic</button>
          <button onClick={() => isAdvancedUnlocked && setActiveTab(FilterTab.ADVANCED)} className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeTab === FilterTab.ADVANCED ? 'bg-white shadow text-blue-600' : isAdvancedUnlocked ? 'text-slate-600 hover:bg-white/50' : 'text-slate-400 opacity-50 cursor-not-allowed'}`}>Advanced {!isAdvancedUnlocked && <Lock className="w-3 h-3" />}</button>
          <button onClick={() => isDrAlfonsoUnlocked && setActiveTab(FilterTab.DR_ALFONSO)} className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeTab === FilterTab.DR_ALFONSO ? 'bg-white shadow text-teal-600' : isDrAlfonsoUnlocked ? 'text-slate-600 hover:bg-white/50' : 'text-slate-400 opacity-50 cursor-not-allowed'}`}>Dr. Alfonso {!isDrAlfonsoUnlocked && <Lock className="w-3 h-3" />}</button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar modelo o marca..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm"
                value={advFilters.keyword}
                onChange={e => setAdvFilters({...advFilters, keyword: e.target.value})}
              />
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
              {Object.keys(overrideData).length > 0 && <span className="text-orange-500 flex items-center gap-1"><Info className="w-3 h-3"/> Datos Modificados Activos</span>}
            </div>
          </div>

          {activeTab === FilterTab.BASIC && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fabricante</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={basicFilters.manufacturer} onChange={e => setBasicFilters({...basicFilters, manufacturer: e.target.value})}>
                  <option value="all">Todos los fabricantes</option>
                  {uniqueManufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-600 uppercase mb-2">Concepto Clínico</label>
                <select className="w-full p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 font-medium" value={basicFilters.clinicalConcept} onChange={e => handleClinicalConceptChange(e.target.value)}>
                  <option value="all">Selección Libre</option>
                  {CLINICAL_CONCEPTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Concepto Óptico</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={basicFilters.opticConcept} onChange={e => setBasicFilters({...basicFilters, opticConcept: e.target.value})}>
                  <option value="all">Cualquiera</option>
                  <option value="monofocal">Monofocal</option>
                  <option value="Monofocal +">Monofocal +</option>
                  <option value="EDoF">EDoF</option>
                  <option value="multifocal">Multifocal</option>
                  <option value="bifocal">Bifocal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Toricidad</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={basicFilters.toric} onChange={e => setBasicFilters({...basicFilters, toric: e.target.value})}>
                  <option value="all">Ambos</option>
                  <option value="yes">Sólo Tóricas</option>
                  <option value="no">Sólo No Tóricas</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === FilterTab.ADVANCED && (
            <div className="space-y-8 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Zap className="w-4 h-4 text-blue-500"/> Rango de Esfera Disponible</h4>
                  <DualRangeSlider 
                    min={-15} max={40} step={0.5} 
                    minValue={advFilters.filterMinSphere} maxValue={advFilters.filterMaxSphere} 
                    onChange={(min, max) => setAdvFilters({...advFilters, filterMinSphere: min, filterMaxSphere: max})} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Material</label>
                    <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={advFilters.hydroType} onChange={e => setAdvFilters({...advFilters, hydroType: e.target.value})}>
                      <option value="all">Cualquier Material</option>
                      <option value="hydrophilic">Hidrofílico</option>
                      <option value="hydrophobic">Hidrofóbico</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${advFilters.isPreloaded ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                        {advFilters.isPreloaded && <ShieldCheck className="w-3 h-3" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={advFilters.isPreloaded} onChange={e => setAdvFilters({...advFilters, isPreloaded: e.target.checked})} />
                      <span className="text-sm text-slate-600 font-medium">Pre-cargada</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${advFilters.isYellowFilter ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-white border-slate-300 group-hover:border-yellow-400'}`}>
                        {advFilters.isYellowFilter && <ShieldCheck className="w-3 h-3" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={advFilters.isYellowFilter} onChange={e => setAdvFilters({...advFilters, isYellowFilter: e.target.checked})} />
                      <span className="text-sm text-slate-600 font-medium">Filtro Amarillo</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === FilterTab.DR_ALFONSO && (
            <div className="space-y-6 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                 <h3 className="font-bold text-teal-800 flex items-center gap-2"><Eye className="w-5 h-5"/> Perfil del Paciente</h3>
                 <button onClick={() => setIsRulesManagerOpen(true)} className="text-[10px] bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-bold border border-teal-100 hover:bg-teal-100 transition-colors uppercase tracking-wider">Ver Reglas Expertas</button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Edad</span>
                  <input type="number" placeholder="Edad" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 transition-shadow" value={drAlfonsoInputs.age} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, age: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">L. Axial (mm)</span>
                  <input type="number" placeholder="LA" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 transition-shadow" value={drAlfonsoInputs.axialLength} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, axialLength: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">LVC Previo</span>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={drAlfonsoInputs.lvc} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, lvc: e.target.value})}>
                    {Object.entries(LVC_OPTIONS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">UDVA</span>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={drAlfonsoInputs.udva} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, udva: e.target.value})}>
                    {Object.entries(UDVA_OPTIONS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lentes de Contacto</span>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={drAlfonsoInputs.contactLenses} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, contactLenses: e.target.value})}>
                    {Object.entries(CONTACT_LENS_OPTIONS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cámara Anterior</span>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={drAlfonsoInputs.anteriorChamber} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, anteriorChamber: e.target.value})}>
                    {Object.entries(ANTERIOR_CHAMBER_OPTIONS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Retina</span>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={drAlfonsoInputs.retina} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, retina: e.target.value})}>
                    {Object.entries(RETINA_OPTIONS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
              </div>

              {recommendedConcepts.length > 0 && (
                <div className="p-5 bg-teal-50 border border-teal-100 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                    <Info className="w-4 h-4" /> Recomendaciones IA Basadas en Reglas
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recommendedConcepts.map(c => (
                      <span key={c} className="bg-white px-4 py-1.5 rounded-lg text-xs font-bold text-teal-700 border border-teal-200 shadow-sm animate-in slide-in-from-bottom-5">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="font-bold text-slate-800">
            Resultados <span className="text-blue-600 ml-1 font-black">{filteredLenses.length}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLenses.map(lens => (
            <LensCard key={lens.id} lens={lens} isSelected={selectedLensIds.has(lens.id)} onToggleSelect={toggleLensSelection} />
          ))}
        </div>
      </main>

      {selectedLensIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl p-4 bg-slate-900/90 backdrop-blur-md text-white rounded-2xl shadow-2xl flex justify-between items-center z-30 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center font-black text-lg">{selectedLensIds.size}</div>
            <div>
              <p className="text-sm font-bold">Lentes seleccionadas</p>
              <p className="text-[10px] text-slate-400">Máximo 5 para comparar</p>
            </div>
          </div>
          <button onClick={() => setShowComparison(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg">Comparar ahora</button>
        </div>
      )}

      {showComparison && <ComparisonView lenses={lenses.filter(l => selectedLensIds.has(l.id))} onClose={() => setShowComparison(false)} onRemove={id => {const n = new Set(selectedLensIds); n.delete(id); setSelectedLensIds(n);}} onFindSimilar={()=>{}} />}
      {isRulesManagerOpen && <RulesManager rules={ALL_RULES} onClose={() => setIsRulesManagerOpen(false)} />}
    </div>
  );
}

export default App;