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
  FileJson,
  Database,
  Trash2,
  Stethoscope,
  Sparkles,
  ArrowRightCircle,
  Settings2
} from 'lucide-react';

const EXTERNAL_DB_URL = "https://raw.githubusercontent.com/globalatsdr/IOLs-Database/refs/heads/main/IOLexport.xml";
const STORAGE_KEY_XML = 'iol_data_cache_v3';
const STORAGE_KEY_OVERRIDES = 'iol_override_data_cache_v2';

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

  // Efecto para obtener recomendaciones y sincronizar Concepto Óptico
  useEffect(() => {
    const concepts = getLensRecommendations(drAlfonsoInputs);
    setRecommendedConcepts(concepts);
    
    // Auto-poblar concepto óptico si hay una recomendación clara
    if (concepts.length === 1) {
      const concept = concepts[0];
      let mapped = 'any';
      if (concept.includes("Narrow")) mapped = "monofocal";
      else if (concept.includes("Enhance")) mapped = "Monofocal +";
      else if (concept.includes("Extend")) mapped = "EDoF";
      else if (concept.includes("Full Range")) mapped = "multifocal";
      
      if (drAlfonsoInputs.opticConcept === 'any') {
        setDrAlfonsoInputs(prev => ({ ...prev, opticConcept: mapped }));
      }
    }
  }, [drAlfonsoInputs.age, drAlfonsoInputs.axialLength, drAlfonsoInputs.lensStatus, drAlfonsoInputs.lvc, drAlfonsoInputs.udva, drAlfonsoInputs.contactLenses, drAlfonsoInputs.anteriorChamber, drAlfonsoInputs.retina]);

  const uniqueManufacturers = useMemo(() => Array.from(new Set(lenses.map(l => l.manufacturer))).sort(), [lenses]);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const cachedOverrides = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (cachedOverrides) {
        try { setOverrideData(JSON.parse(cachedOverrides)); } catch (e) {}
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
      } catch (error) { console.log("Modo offline"); } finally { setLoading(false); }
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
          alert(`Base de datos actualizada: ${parsedData.length} lentes.`);
        } catch (err) { alert('Error al procesar el XML.'); }
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
        alert('Modificaciones aplicadas.');
      } catch (err) { alert('Error al cargar el JSON.'); }
    };
    reader.readAsText(file);
    if (overrideFileInputRef.current) overrideFileInputRef.current.value = '';
  };

  const handleClearOverrides = () => {
    if (window.confirm("¿Seguro que quieres eliminar todas las modificaciones personalizadas (JSON) y volver a los datos originales del archivo?")) {
      setOverrideData({});
      localStorage.removeItem(STORAGE_KEY_OVERRIDES);
    }
  };

  const handleResetFilters = () => {
    setBasicFilters({ manufacturer: 'all', clinicalConcept: 'all', opticConcept: 'all', toric: 'all', technology: 'all' });
    setAdvFilters({ filterMinSphere: 10, filterMaxSphere: 30, isPreloaded: false, isYellowFilter: false, hydroType: 'all', keyword: '' });
    setDrAlfonsoInputs({ age: '', axialLength: '', lensStatus: 'any', refraction: 'any', lensMaterial: 'any', hapticDesign: 'any', opticConcept: 'any', toric: 'any', technology: 'any', lvc: 'any', udva: 'any', contactLenses: 'any', anteriorChamber: 'any', retina: 'any' });
  };

  const findZeissEquivalent = (lens: Lens) => {
    const conceptToFilter = lens.specifications.opticConcept;
    const isToric = lens.specifications.toric ? 'yes' : 'no';
    
    setBasicFilters({
      manufacturer: 'ZEISS',
      clinicalConcept: 'all',
      opticConcept: conceptToFilter,
      toric: isToric,
      technology: 'all'
    });
    
    setAdvFilters(prev => ({
      ...prev,
      keyword: ''
    }));
    
    setActiveTab(FilterTab.BASIC);
    setShowComparison(false);
    
    setTimeout(() => {
      window.scrollTo({ top: 450, behavior: 'smooth' });
    }, 150);
  };

  const toggleLensSelection = (lens: Lens) => {
    const newSelection = new Set(selectedLensIds);
    if (newSelection.has(lens.id)) newSelection.delete(lens.id);
    else {
      if (newSelection.size >= 5) { alert("Máximo 5 lentes para comparar."); return; }
      newSelection.add(lens.id);
    }
    setSelectedLensIds(newSelection);
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
        // Filtros Técnicos de Dr. Alfonso
        if (drAlfonsoInputs.opticConcept !== 'any' && lens.specifications.opticConcept.toLowerCase() !== drAlfonsoInputs.opticConcept.toLowerCase()) return false;
        
        if (drAlfonsoInputs.technology !== 'any' && lens.specifications.technology?.toLowerCase() !== drAlfonsoInputs.technology.toLowerCase()) return false;
        
        if (drAlfonsoInputs.hapticDesign !== 'any') {
            const h = lens.specifications.hapticDesign.toLowerCase();
            const filter = drAlfonsoInputs.hapticDesign.toLowerCase();
            if (filter === 'c-loop' && !h.includes('c loop') && !h.includes('c-loop')) return false;
            if (filter === 'plato' && !h.includes('plate') && !h.includes('4 loop') && !h.includes('square')) return false;
            if (filter === '3 piezas' && !h.includes('3-piece') && !h.includes('3 piece')) return false;
            if (filter === 'lamina' && !h.includes('lamina')) return false;
        }
        
        if (drAlfonsoInputs.lensMaterial !== 'any') {
            const m = lens.specifications.hydro.toLowerCase();
            if (drAlfonsoInputs.lensMaterial === 'hidrofilico' && !m.includes('hydrophilic')) return false;
            if (drAlfonsoInputs.lensMaterial === 'hidrofobico' && !m.includes('hydrophobic')) return false;
        }

        if (drAlfonsoInputs.toric !== 'any') {
          const isToric = lens.specifications.toric;
          if (drAlfonsoInputs.toric === 'yes' && !isToric) return false;
          if (drAlfonsoInputs.toric === 'no' && isToric) return false;
        }
      }
      return true;
    });
  }, [lenses, activeTab, basicFilters, advFilters, drAlfonsoInputs]);

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 gap-4"><Database className="w-10 h-10 animate-pulse text-blue-500"/>Cargando IOL Explorer Pro...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <input type="file" ref={xmlFileInputRef} onChange={handleXMLUpload} accept=".xml" className="hidden" />
      <input type="file" ref={overrideFileInputRef} onChange={handleOverrideUpload} accept=".json" className="hidden" />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm px-4 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center overflow-hidden">
             <img src="logo.png" alt="IOL Explorer Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">IOL Explorer <span className="text-blue-600">Pro</span></h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Advance Clinical Service</span>
          </div>
          <a href="https://iolcon.org" target="_blank" rel="noopener noreferrer" className="ml-4 flex items-center gap-2 text-[11px] bg-slate-100 text-slate-600 px-3 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-all group">
            <ExternalLink className="w-3.5 h-3.5" /> <span className="hidden sm:inline">IOLcon.org</span>
          </a>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button onClick={() => xmlFileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm text-xs font-bold text-slate-700 hover:text-blue-600 transition-all border border-slate-200/50">
              <Upload className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Cargar XML</span>
            </button>
            <button onClick={() => overrideFileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 hover:bg-white rounded-lg transition-all text-xs font-bold text-slate-700 hover:text-orange-600">
              <FileJson className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Modificaciones</span>
            </button>
            <div className="w-px h-8 bg-slate-200 mx-1"></div>
            <button onClick={handleClearOverrides} className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-orange-600" title="Borrar todas las modificaciones personalizadas">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={handleResetFilters} className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-red-600" title="Limpiar filtros">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="h-10 w-px bg-slate-200 mx-1"></div>
          
          <div className="relative">
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              placeholder="Unlock" 
              className="bg-slate-100 border border-slate-200 text-xs w-20 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            />
            {!isAdvancedUnlocked && !isDrAlfonsoUnlocked && <Lock className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="relative max-w-2xl mx-auto mb-10 shadow-xl shadow-blue-900/5 rounded-2xl overflow-hidden group">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por modelo, fabricante o tecnología..." 
            className="w-full pl-14 pr-6 py-5 bg-white border-none text-slate-800 placeholder:text-slate-400 font-medium focus:ring-0 text-lg"
            value={advFilters.keyword}
            onChange={e => setAdvFilters({...advFilters, keyword: e.target.value})}
          />
          {Object.keys(overrideData).length > 0 && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border border-orange-100">
              <Info className="w-3 h-3"/> Overrides Activos
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-8 max-w-xl mx-auto bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200">
          <button onClick={() => setActiveTab(FilterTab.BASIC)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === FilterTab.BASIC ? 'bg-white shadow-lg text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Estándar</button>
          <button onClick={() => isAdvancedUnlocked && setActiveTab(FilterTab.ADVANCED)} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === FilterTab.ADVANCED ? 'bg-white shadow-lg text-blue-600' : isAdvancedUnlocked ? 'text-slate-500' : 'text-slate-400 opacity-50 cursor-not-allowed'}`}>Avanzado {!isAdvancedUnlocked && <Lock className="w-3 h-3" />}</button>
          <button onClick={() => isDrAlfonsoUnlocked && setActiveTab(FilterTab.DR_ALFONSO)} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === FilterTab.DR_ALFONSO ? 'bg-white shadow-lg text-teal-600' : isDrAlfonsoUnlocked ? 'text-slate-500' : 'text-slate-400 opacity-50 cursor-not-allowed'}`}>Dr. Alfonso {!isDrAlfonsoUnlocked && <Lock className="w-3 h-3" />}</button>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-10">
          {activeTab === FilterTab.BASIC && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Fabricante</label>
                <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none" value={basicFilters.manufacturer} onChange={e => setBasicFilters({...basicFilters, manufacturer: e.target.value})}>
                  <option value="all">Todos</option>
                  {uniqueManufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-blue-500 uppercase tracking-widest ml-1">Concepto Clínico</label>
                <select className="w-full p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-800 outline-none" value={basicFilters.clinicalConcept} onChange={e => {
                  const val = e.target.value;
                  let mapped = basicFilters.opticConcept;
                  if (val === "Partial Range of Field-Narrow") mapped = "monofocal";
                  else if (val === "Partial Range of Field-Enhance") mapped = "Monofocal +";
                  else if (val === "Partial Range of Field-Extend") mapped = "EDoF";
                  else if (val.includes("Full Range")) mapped = "multifocal";
                  else if (val === "all") mapped = "all";
                  setBasicFilters({ ...basicFilters, clinicalConcept: val, opticConcept: mapped });
                }}>
                  <option value="all">Selección Libre</option>
                  {CLINICAL_CONCEPTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Concepto Óptico</label>
                <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={basicFilters.opticConcept} onChange={e => setBasicFilters({...basicFilters, opticConcept: e.target.value})}>
                  <option value="all">Cualquiera</option>
                  <option value="monofocal">Monofocal</option>
                  <option value="Monofocal +">Monofocal +</option>
                  <option value="EDoF">EDoF</option>
                  <option value="multifocal">Multifocal</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tórica</label>
                <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={basicFilters.toric} onChange={e => setBasicFilters({...basicFilters, toric: e.target.value})}>
                  <option value="all">Indiferente</option>
                  <option value="yes">Sólo Tóricas</option>
                  <option value="no">Sólo No Tóricas</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === FilterTab.ADVANCED && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight"><Zap className="w-4 h-4 text-blue-500"/> Dioptrías Disponibles</h4>
                <DualRangeSlider 
                  min={-15} max={45} step={0.5} 
                  minValue={advFilters.filterMinSphere} maxValue={advFilters.filterMaxSphere} 
                  onChange={(min, max) => setAdvFilters({...advFilters, filterMinSphere: min, filterMaxSphere: max})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Material</label>
                  <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold" value={advFilters.hydroType} onChange={e => setAdvFilters({...advFilters, hydroType: e.target.value})}>
                    <option value="all">Todos</option>
                    <option value="hydrophilic">Hidrofílico</option>
                    <option value="hydrophobic">Hidrofóbico</option>
                  </select>
                </div>
                <div className="flex flex-col justify-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${advFilters.isPreloaded ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                      {advFilters.isPreloaded && <ShieldCheck className="w-3.5 h-3.5" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={advFilters.isPreloaded} onChange={e => setAdvFilters({...advFilters, isPreloaded: e.target.checked})} />
                    <span className="text-xs text-slate-700 font-bold uppercase tracking-tight">Pre-cargada</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${advFilters.isYellowFilter ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-white border-slate-300'}`}>
                      {advFilters.isYellowFilter && <ShieldCheck className="w-3.5 h-3.5" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={advFilters.isYellowFilter} onChange={e => setAdvFilters({...advFilters, isYellowFilter: e.target.checked})} />
                    <span className="text-xs text-slate-700 font-bold uppercase tracking-tight">Filtro Amarillo</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === FilterTab.DR_ALFONSO && (
            <div className="space-y-12">
              {/* Bloque 1: Perfil del Paciente */}
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                   <h3 className="font-black text-teal-900 flex items-center gap-2 uppercase tracking-tighter text-lg"><Eye className="w-6 h-6 text-teal-600"/> Perfil del Paciente</h3>
                   <button onClick={() => setIsRulesManagerOpen(true)} className="text-[10px] bg-teal-600 text-white px-4 py-2 rounded-xl font-black hover:bg-teal-700 transition-all uppercase tracking-widest shadow-lg shadow-teal-900/10">Engine Rules</button>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Edad', val: drAlfonsoInputs.age, key: 'age', type: 'number' },
                    { label: 'L. Axial', val: drAlfonsoInputs.axialLength, key: 'axialLength', type: 'number' },
                    { label: 'Estado Cristalino', val: drAlfonsoInputs.lensStatus, key: 'lensStatus', options: { 'any': 'Cualquiera', 'catarata': 'Catarata', 'transparente': 'Transparente', 'disfuncional': 'Disfuncional', 'presbicia': 'Presbicia' } },
                    { label: 'UDVA', val: drAlfonsoInputs.udva, key: 'udva', options: UDVA_OPTIONS }
                  ].map(item => (
                    <div key={item.key} className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{item.label}</label>
                      {item.options ? (
                        <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold" value={item.val} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, [item.key]: e.target.value as any})}>
                          {Object.entries(item.options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      ) : (
                        <input type={item.type} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold" value={item.val} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, [item.key]: e.target.value})} />
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'LVC', val: drAlfonsoInputs.lvc, key: 'lvc', options: LVC_OPTIONS },
                    { label: 'Lentes Contacto', val: drAlfonsoInputs.contactLenses, key: 'contactLenses', options: CONTACT_LENS_OPTIONS },
                    { label: 'Cámara Anterior', val: drAlfonsoInputs.anteriorChamber, key: 'anteriorChamber', options: ANTERIOR_CHAMBER_OPTIONS },
                    { label: 'Retina', val: drAlfonsoInputs.retina, key: 'retina', options: RETINA_OPTIONS }
                  ].map(item => (
                    <div key={item.key} className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{item.label}</label>
                      <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold" value={item.val} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, [item.key]: e.target.value})}>
                        {Object.entries(item.options!).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloque 2: Resultados Reales */}
              <div className="space-y-6 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                   <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-900/20">
                    <Stethoscope className="w-6 h-6"/>
                   </div>
                   <div className="flex flex-col">
                     <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg leading-none">Análisis y Concepto Clínico Sugerido</h3>
                     <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Algoritmo Alfonso Engine</span>
                   </div>
                </div>

                {recommendedConcepts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedConcepts.map((concept, idx) => (
                      <div key={idx} className="group bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-5 rounded-3xl flex items-center justify-between hover:shadow-xl hover:shadow-emerald-900/5 transition-all animate-in fade-in slide-in-from-bottom-3" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center border border-emerald-200 shadow-sm text-emerald-600">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-0.5">Recomendación {idx + 1}</p>
                            <p className="text-sm font-black text-slate-800">{concept}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            let mapped = "any";
                            if (concept.includes("Narrow")) mapped = "monofocal";
                            else if (concept.includes("Enhance")) mapped = "Monofocal +";
                            else if (concept.includes("Extend")) mapped = "EDoF";
                            else if (concept.includes("Full Range")) mapped = "multifocal";
                            
                            setDrAlfonsoInputs(prev => ({ ...prev, opticConcept: mapped }));
                          }}
                          className="p-2 text-slate-300 hover:text-emerald-600 transition-colors"
                          title="Aplicar Concepto Óptico sugerido"
                        >
                          <ArrowRightCircle className="w-7 h-7" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <div>
                      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Sin coincidencias exactas</p>
                      <p className="text-slate-400 text-[11px] font-medium max-w-xs mx-auto mt-1">Ajuste los parámetros del paciente para que el motor de reglas pueda sugerir un concepto clínico.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bloque 3: Filtros de Búsqueda Técnicos */}
              <div className="space-y-8 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                   <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20">
                    <Settings2 className="w-6 h-6"/>
                   </div>
                   <div className="flex flex-col">
                     <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg leading-none">Criterios de Selección de Lente</h3>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Refinamiento Técnico</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-blue-500 uppercase tracking-widest ml-1">Concepto Óptico</label>
                    <select className="w-full p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-800 outline-none" value={drAlfonsoInputs.opticConcept} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, opticConcept: e.target.value})}>
                      <option value="any">Cualquiera</option>
                      <option value="monofocal">Monofocal</option>
                      <option value="Monofocal +">Monofocal +</option>
                      <option value="EDoF">EDoF</option>
                      <option value="multifocal">Multifocal</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tecnología</label>
                    <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={drAlfonsoInputs.technology} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, technology: e.target.value})}>
                      <option value="any">Cualquiera</option>
                      <option value="refractiva">Refractiva</option>
                      <option value="difractiva">Difractiva</option>
                      <option value="hibrida">Híbrida</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Diseño Háptico</label>
                    <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={drAlfonsoInputs.hapticDesign} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, hapticDesign: e.target.value})}>
                      <option value="any">Cualquiera</option>
                      <option value="c-loop">C-Loop</option>
                      <option value="plato">Plato</option>
                      <option value="lamina">Lámina Modificada</option>
                      <option value="3 piezas">3 Piezas</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Material</label>
                    <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={drAlfonsoInputs.lensMaterial} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, lensMaterial: e.target.value as any})}>
                      <option value="any">Cualquiera</option>
                      <option value="hidrofobico">Hidrofóbico</option>
                      <option value="hidrofilico">Hidrofílico</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <p className="text-[11px] font-bold italic leading-snug">Los filtros técnicos actúan sobre la base de datos de lentes para refinar la búsqueda clínica del Dr. Alfonso.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-3 mb-8 ml-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Explorar Lentes</h2>
          <span className="text-blue-600 font-black text-lg">{filteredLenses.length}</span>
          <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Modelos Disponibles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLenses.map(lens => (
            <LensCard key={lens.id} lens={lens} isSelected={selectedLensIds.has(lens.id)} onToggleSelect={toggleLensSelection} />
          ))}
        </div>
      </main>

      {selectedLensIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl p-4 bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex justify-between items-center z-50 animate-in slide-in-from-bottom-5 border border-white/10">
          <div className="flex items-center gap-5">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-900/40">{selectedLensIds.size}</div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight">Comparativa Activa</p>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{selectedLensIds.size === 5 ? 'Límite alcanzado' : 'Selecciona hasta 5'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedLensIds(new Set())} className="text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Limpiar</button>
            <button onClick={() => setShowComparison(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-900/40 uppercase tracking-tight">Comparar</button>
          </div>
        </div>
      )}

      {showComparison && <ComparisonView lenses={lenses.filter(l => selectedLensIds.has(l.id))} onClose={() => setShowComparison(false)} onRemove={id => {const n = new Set(selectedLensIds); n.delete(id); setSelectedLensIds(n);}} onFindSimilar={findZeissEquivalent} />}
      {isRulesManagerOpen && <RulesManager rules={ALL_RULES} onClose={() => setIsRulesManagerOpen(false)} />}
    </div>
  );
}

export default App;