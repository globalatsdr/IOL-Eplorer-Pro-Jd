import React, { useEffect, useState, useMemo, useRef } from 'react';
import { IOL_XML_DATA, CLINICAL_CONCEPTS } from './constants';
import { parseIOLData } from './utils/parser';
import { Lens, FilterTab, BasicFilters, AdvancedFilters, DrAlfonsoInputs } from './types';
import LensCard from './components/LensCard';
import ComparisonView from './components/ComparisonView';
import Tooltip from './components/Tooltip';
import DualRangeSlider from './components/DualRangeSlider';
import { getLensRecommendations, specialConditionsOptions, ALL_RULES } from './services/recommendationService';
import RulesManager from './components/RulesManager'; // Import the new component
import { Search, ChevronDown, AlertCircle, Upload, ArrowLeftRight, Lock, Unlock, KeyRound, Stethoscope, Globe, RotateCcw, User, CheckSquare, ListTree, Lightbulb, Filter, Database } from 'lucide-react';

// --- CONFIGURACIÓN DE BASE DE DATOS EXTERNA ---
// URL directa al archivo RAW en GitHub
const EXTERNAL_DB_URL = "https://raw.githubusercontent.com/globalatsdr/IOLs-Database/refs/heads/main/IOLexport.xml";
const STORAGE_KEY = 'iol_data_cache_v2';

function App() {
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>(FilterTab.BASIC);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PASSWORD CONFIGURATION ---
  const ADVANCED_UNLOCK_PASSWORD = "1234!";
  const DR_ALFONSO_UNLOCK_PASSWORD = "3907/";
  const [passwordInput, setPasswordInput] = useState('');
  
  const isAdvancedUnlocked = passwordInput === ADVANCED_UNLOCK_PASSWORD;
  const isDrAlfonsoUnlocked = passwordInput === DR_ALFONSO_UNLOCK_PASSWORD;

  // Comparison State
  const [selectedLensIds, setSelectedLensIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);

  // New state for the Rules Manager modal
  const [isRulesManagerOpen, setIsRulesManagerOpen] = useState(false);

  // Filters State
  const [basicFilters, setBasicFilters] = useState<BasicFilters>({
    manufacturer: 'all',
    clinicalConcept: 'all',
    opticConcept: 'all',
    toric: 'all'
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
    age: '',
    axialLength: '',
    lensStatus: 'any',
    refraction: 'any',
    lensMaterial: 'any',
    lvc: 'any',
    ucva: 'any',
    contactLenses: 'any',
    anteriorChamber: 'any',
    estafiloma: 'any',
  });
  
  const [recommendedConcepts, setRecommendedConcepts] = useState<string[]>([]);

  // Effect to update recommendations when inputs change
  useEffect(() => {
    const concepts = getLensRecommendations(drAlfonsoInputs);
    setRecommendedConcepts(concepts);
  }, [drAlfonsoInputs]);


  // Extract unique values for dropdowns
  const uniqueManufacturers = useMemo(() => 
    Array.from(new Set(lenses.map(l => l.manufacturer))).sort()
  , [lenses]);

  const uniqueConcepts = useMemo(() => 
    Array.from(new Set(lenses.map(l => l.specifications.opticConcept).filter(Boolean))).sort()
  , [lenses]);

  // Load Data Logic
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      
      const cachedXML = localStorage.getItem(STORAGE_KEY);
      let dataLoaded = false;

      if (cachedXML) {
        try {
          const data = parseIOLData(cachedXML);
          if (data.length > 0) {
            setLenses(data);
            dataLoaded = true;
          }
        } catch (e) {
          console.error("Cache corrupted", e);
        }
      }

      if (!dataLoaded) {
        try {
          const defaultData = parseIOLData(IOL_XML_DATA);
          setLenses(defaultData);
        } catch (e) {
          console.error("Default data error", e);
        }
      }

      try {
        const response = await fetch(EXTERNAL_DB_URL);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const text = await response.text();
        const newData = parseIOLData(text);

        if (newData.length > 0) {
          setLenses(newData);
          localStorage.setItem(STORAGE_KEY, text);
          setIsOfflineMode(false);
        }
      } catch (error) {
        console.warn("Could not fetch remote data, using cached/default data.", error);
        setIsOfflineMode(true);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // Effect to switch back to Basic tab if password becomes invalid
  useEffect(() => {
    if (activeTab === FilterTab.ADVANCED && !isAdvancedUnlocked) {
      setActiveTab(FilterTab.BASIC);
    }
    if (activeTab === FilterTab.DR_ALFONSO && !isDrAlfonsoUnlocked) {
      setActiveTab(FilterTab.BASIC);
    }
  }, [isAdvancedUnlocked, isDrAlfonsoUnlocked, activeTab]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        try {
          const parsedData = parseIOLData(text);
          setLenses(parsedData);
          localStorage.setItem(STORAGE_KEY, text);
          setSelectedLensIds(new Set());
          setIsOfflineMode(true); 
          alert(`Successfully loaded and saved ${parsedData.length} lenses.`);
        } catch (err) {
          alert('Error parsing XML file. Please check the format.');
          console.error(err);
        }
      }
      setLoading(false);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleLensSelection = (lens: Lens) => {
    const newSelection = new Set(selectedLensIds);
    if (newSelection.has(lens.id)) {
      newSelection.delete(lens.id);
    } else {
      if (newSelection.size >= 5) {
        alert("You can compare up to 5 lenses at a time.");
        return;
      }
      newSelection.add(lens.id);
    }
    setSelectedLensIds(newSelection);
  };

  const removeLensFromComparison = (id: string) => {
    const newSelection = new Set(selectedLensIds);
    newSelection.delete(id);
    setSelectedLensIds(newSelection);
    if (newSelection.size === 0) setShowComparison(false);
  };

  const clearSelection = () => setSelectedLensIds(new Set());

  const handleResetFilters = () => {
    setBasicFilters({
      manufacturer: 'all',
      clinicalConcept: 'all',
      opticConcept: 'all',
      toric: 'all'
    });
    setAdvFilters({
      filterMinSphere: 10,
      filterMaxSphere: 30,
      isPreloaded: false,
      isYellowFilter: false,
      hydroType: 'all',
      keyword: ''
    });
    setDrAlfonsoInputs({
      age: '',
      axialLength: '',
      lensStatus: 'any',
      refraction: 'any',
      lensMaterial: 'any',
      lvc: 'any',
      ucva: 'any',
      contactLenses: 'any',
      anteriorChamber: 'any',
      estafiloma: 'any',
    });
  };

  const handleFindZeissSimilar = (targetLens: Lens) => {
    const zeissName = uniqueManufacturers.find(m => m.toLowerCase().includes('zeiss'));
    if (!zeissName) {
      alert("No Zeiss lenses found in the current database.");
      return;
    }
    setBasicFilters({
      manufacturer: zeissName,
      clinicalConcept: 'all',
      opticConcept: targetLens.specifications.opticConcept,
      toric: targetLens.specifications.toric ? 'yes' : 'no'
    });
    setActiveTab(FilterTab.BASIC);
    setShowComparison(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClinicalConceptChange = (val: string) => {
    let mappedOpticConcept = basicFilters.opticConcept;

    if (val === "Partial Range of Field-Narrow") mappedOpticConcept = "monofocal";
    else if (val === "Partial Range of Field-Enhance") mappedOpticConcept = "monofocal";
    else if (val === "Partial Range of Field-Extend") mappedOpticConcept = "EDoF";
    else if (val === "Full Range of Field-Steep") mappedOpticConcept = "bifocal";
    else if (val === "Full Range of Field-Smooth") mappedOpticConcept = "multifocal";
    else if (val === "Full Range of Field-Continuous") mappedOpticConcept = "multifocal";
    else if (val === "all") mappedOpticConcept = "all";

    setBasicFilters({
      ...basicFilters,
      clinicalConcept: val,
      opticConcept: mappedOpticConcept
    });
  };

  const mapClinicalToOptic = (clinicalConcepts: string[]): string[] => {
    const opticConcepts = new Set<string>();
    clinicalConcepts.forEach(val => {
      if (val.toLowerCase().includes("narrow")) opticConcepts.add("monofocal");
      else if (val.toLowerCase().includes("enhance")) opticConcepts.add("monofocal");
      else if (val.toLowerCase().includes("extend")) opticConcepts.add("edof");
      else if (val.toLowerCase().includes("steep")) opticConcepts.add("bifocal");
      else if (val.toLowerCase().includes("smooth")) opticConcepts.add("multifocal");
      else if (val.toLowerCase().includes("continuous")) {
        opticConcepts.add("trifocal");
        opticConcepts.add("multifocal");
      }
    });
    return Array.from(opticConcepts);
  }

  const filteredLenses = useMemo(() => {
    if (activeTab === FilterTab.DR_ALFONSO) {
      const hasBlock1Input = drAlfonsoInputs.age || drAlfonsoInputs.axialLength || drAlfonsoInputs.lensStatus !== 'any';
      if (!hasBlock1Input || recommendedConcepts.length === 0) return [];

      const targetOpticConcepts = mapClinicalToOptic(recommendedConcepts);
      
      return lenses.filter(lens => {
        const opticConceptLower = lens.specifications.opticConcept.toLowerCase();
        const matchesConcept = targetOpticConcepts.some(c => opticConceptLower.includes(c));
        if (!matchesConcept) return false;

        if (drAlfonsoInputs.lensMaterial !== 'any') {
          const lensMaterialLower = lens.specifications.hydro.toLowerCase();
          if (!lensMaterialLower.includes(drAlfonsoInputs.lensMaterial)) return false;
        }

        return true;
      });
    }
    
    return lenses.filter(lens => {
      if (activeTab === FilterTab.ADVANCED && advFilters.keyword) {
        const kw = advFilters.keyword.toLowerCase();
        const match = lens.name.toLowerCase().includes(kw) || 
                      lens.manufacturer.toLowerCase().includes(kw);
        if (!match) return false;
      }

      if (activeTab === FilterTab.BASIC) {
        if (basicFilters.manufacturer !== 'all' && lens.manufacturer !== basicFilters.manufacturer) return false;
        if (basicFilters.opticConcept !== 'all') {
           const lensConcept = lens.specifications.opticConcept.toLowerCase();
           const filterConcept = basicFilters.opticConcept.toLowerCase();
           if (lensConcept !== filterConcept) return false;
        }
        if (basicFilters.toric !== 'all') {
          const isToric = lens.specifications.toric;
          if (basicFilters.toric === 'yes' && !isToric) return false;
          if (basicFilters.toric === 'no' && isToric) return false;
        }
        return true;
      } else { // ADVANCED
        if (lens.availability.minSphere > advFilters.filterMinSphere) return false;
        if (lens.availability.maxSphere < advFilters.filterMaxSphere) return false;
        if (advFilters.isPreloaded && !lens.specifications.preloaded) return false;
        if (advFilters.isYellowFilter) {
           const filterStr = lens.specifications.filter.toLowerCase();
           if (!filterStr.includes('yellow') && !filterStr.includes('blue-light')) return false;
        }
        if (advFilters.hydroType !== 'all') {
            if (!lens.specifications.hydro.toLowerCase().includes(advFilters.hydroType)) return false;
        }
        return true;
      }
    });
  }, [lenses, activeTab, basicFilters, advFilters, drAlfonsoInputs, recommendedConcepts]);

  const selectedLensesForComparison = useMemo(() => {
    return lenses.filter(l => selectedLensIds.has(l.id));
  }, [lenses, selectedLensIds]);

  const noLensesMessage = useMemo(() => {
    if (activeTab === FilterTab.DR_ALFONSO) {
        const hasBlock1Input = drAlfonsoInputs.age || drAlfonsoInputs.axialLength || drAlfonsoInputs.lensStatus !== 'any';
        
        if (!hasBlock1Input) {
            return "Introduzca los parámetros principales del paciente para iniciar la recomendación.";
        }
        if (recommendedConcepts.length === 0) {
            return "No se ha podido determinar un concepto clínico con los datos actuales. Pruebe a ajustar los parámetros.";
        }
        return "Se han encontrado conceptos clínicos compatibles, pero ninguna lente de la base de datos cumple con todos los criterios seleccionados (incluyendo material).";
    }
    return "Pruebe a ajustar los filtros para ver más resultados.";
  }, [activeTab, drAlfonsoInputs, recommendedConcepts.length]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 animate-pulse">Processing IOL Database...</div>;
  }
  
  const renderResults = () => {
     if (filteredLenses.length === 0) {
       return (
         <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No se encontraron lentes</h3>
            <p className="text-slate-500 mt-1 max-w-md mx-auto">{noLensesMessage}</p>
         </div>
       );
     }
     return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredLenses.map(lens => (
           <LensCard 
             key={lens.id} 
             lens={lens} 
             isSelected={selectedLensIds.has(lens.id)}
             onToggleSelect={toggleLensSelection}
           />
         ))}
       </div>
     );
  };
  
  // Grouped options for the new dropdowns
  const lvcOptions = {
      'any': 'Cualquiera',
      'lvc_hiper_mayor_4': 'Hipermetrópico >= 4D',
      'lvc_hiper_menor_4': 'Hipermetrópico < 4D',
      'lvc_miopico_2_4': 'Miópico (-2 a -4D)',
      'lvc_miopico_5_7': 'Miópico (-5 a -7D)',
      'lvc_miopico_8_10': 'Miópico (-8 a -10D)',
      'kr': 'KR'
  };
  const ucvaOptions = { 'any': 'Cualquiera', 'ucva_menor_07': '< 0.7', 'ucva_mayor_07': '> 0.7' };
  const contactLensOptions = { 'any': 'Cualquiera', 'no_usa_lc': 'No Usa LC', 'apenas_tolera_lc': 'Apenas Tolera LC', 'tolera_lc': 'Tolera LC' };
  const anteriorChamberOptions = { 'any': 'Cualquiera', 'camara_estrecha': 'Estrecha', 'camara_normal': 'Normal' };


  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".xml" 
        className="hidden" 
      />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="logo.png" 
              alt="Logo" 
              className="h-10 w-auto object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const nextEl = e.currentTarget.nextElementSibling;
                if(nextEl) nextEl.classList.remove('hidden');
              }}
            />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">IOL Explorer</h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
             <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                {isAdvancedUnlocked || isDrAlfonsoUnlocked ? (
                  <Unlock className="w-4 h-4 text-emerald-500" />
                ) : (
                  <KeyRound className="w-4 h-4 text-slate-400" />
                )}
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Admin Code"
                  className="bg-transparent border-none text-sm w-24 focus:ring-0 focus:outline-none placeholder-slate-400 text-slate-700"
                />
             </div>

             <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

             <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 hidden md:block">{lenses.length} lenses</span>
                {isOfflineMode ? (
                    <Tooltip content="Using cached data. Cannot connect to GitHub." />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-emerald-500" title="Live data from GitHub" />
                )}
             </div>

             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
             >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload XML</span>
             </button>

             <a 
                href="https://iolcon.org/lensesTable.php" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-sm font-medium transition-colors"
             >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">IOLcon</span>
             </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex space-x-1 rounded-xl bg-slate-200 p-1 mb-8 max-w-lg mx-auto relative">
          <button
            onClick={() => setActiveTab(FilterTab.BASIC)}
            className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition duration-150 ease-in-out
              ${activeTab === FilterTab.BASIC ? 'bg-white text-blue-700 shadow' : 'text-slate-600 hover:bg-white/[0.12] hover:text-blue-800'}`}
          >
            Basic Filters
          </button>
          
          <button
            onClick={() => { if (isAdvancedUnlocked) setActiveTab(FilterTab.ADVANCED); }}
            disabled={!isAdvancedUnlocked}
            className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition duration-150 ease-in-out flex items-center justify-center gap-2
              ${activeTab === FilterTab.ADVANCED ? 'bg-white text-blue-700 shadow' : isAdvancedUnlocked ? 'text-slate-600 hover:bg-white/[0.12] hover:text-blue-800' : 'text-slate-400 opacity-60 cursor-not-allowed'}`}
          >
            Advanced Search
            {!isAdvancedUnlocked && <Lock className="w-3 h-3" />}
          </button>

          <button
            onClick={() => { if (isDrAlfonsoUnlocked) setActiveTab(FilterTab.DR_ALFONSO); }}
            disabled={!isDrAlfonsoUnlocked}
            className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition duration-150 ease-in-out flex items-center justify-center gap-2
              ${activeTab === FilterTab.DR_ALFONSO ? 'bg-white text-teal-700 shadow' : isDrAlfonsoUnlocked ? 'text-slate-600 hover:bg-white/[0.12] hover:text-teal-800' : 'text-slate-400 opacity-60 cursor-not-allowed'}`}
          >
            <User className="w-4 h-4" />
            Dr. Alfonso
            {!isDrAlfonsoUnlocked && <Lock className="w-3 h-3" />}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 relative">
          
          <div className="absolute top-4 right-5">
             <button 
                onClick={handleResetFilters}
                className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors px-2 py-1 rounded hover:bg-slate-50"
             >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All
             </button>
          </div>

          {activeTab === FilterTab.BASIC ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">Manufacturer</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500" value={basicFilters.manufacturer} onChange={(e) => setBasicFilters({...basicFilters, manufacturer: e.target.value})}>
                    <option value="all">All Manufacturers</option>
                    {uniqueManufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700"><ChevronDown className="h-4 w-4" /></div>
                </div>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2 text-blue-800"><Stethoscope className="w-3.5 h-3.5 mr-1.5" />Clinical Concept</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-blue-50 border border-blue-200 text-blue-900 font-medium py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500" value={basicFilters.clinicalConcept} onChange={(e) => handleClinicalConceptChange(e.target.value)}>
                    <option value="all">Custom Selection</option>
                    {CLINICAL_CONCEPTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-700"><ChevronDown className="h-4 w-4" /></div>
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">Optic Concept</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500" value={basicFilters.opticConcept} onChange={(e) => setBasicFilters({...basicFilters, opticConcept: e.target.value, clinicalConcept: 'all'})}>
                    <option value="all">All Concepts</option>
                    {Array.from(new Set([...uniqueConcepts, 'monofocal', 'multifocal', 'EDoF', 'bifocal', 'trifocal'])).sort().map(c => (<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700"><ChevronDown className="h-4 w-4" /></div>
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">Toric</label>
                <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200 h-[50px] items-center">
                  {['all', 'yes', 'no'].map((opt) => (<button key={opt} onClick={() => setBasicFilters({...basicFilters, toric: opt})} className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-colors ${basicFilters.toric === opt ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>{opt === 'all' ? 'Any' : opt}</button>))}
                </div>
              </div>
            </div>
          ) : activeTab === FilterTab.ADVANCED ? (
            <div className="space-y-6 pt-6">
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div><input type="text" className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Search by Name or Manufacturer..." value={advFilters.keyword} onChange={(e) => setAdvFilters({...advFilters, keyword: e.target.value})} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="md:col-span-2 px-2"><label className="flex items-center text-sm font-semibold text-slate-700 mb-2">Availability Range Requirement</label><DualRangeSlider min={-10} max={60} minValue={advFilters.filterMinSphere} maxValue={advFilters.filterMaxSphere} onChange={(min, max) => setAdvFilters({...advFilters, filterMinSphere: min, filterMaxSphere: max})} unit="D" /><p className="text-xs text-slate-400 mt-1">Find lenses covering <strong>{advFilters.filterMinSphere}D</strong> to <strong>{advFilters.filterMaxSphere}D</strong>.</p></div>
                 <div><label className="flex items-center text-sm font-semibold text-slate-700 mb-2">Material Type</label><select className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg focus:outline-none focus:border-blue-500" value={advFilters.hydroType} onChange={(e) => setAdvFilters({...advFilters, hydroType: e.target.value})}><option value="all">All Materials</option><option value="hydrophobic">Hydrophobic</option><option value="hydrophilic">Hydrophilic</option></select></div>
                 <div className="flex flex-col justify-center gap-3"><label className="flex items-center space-x-3 cursor-pointer group"><input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={advFilters.isPreloaded} onChange={(e) => setAdvFilters({...advFilters, isPreloaded: e.target.checked})} /><span className="text-slate-700 group-hover:text-blue-600 transition-colors flex items-center">Preloaded Only</span></label><label className="flex items-center space-x-3 cursor-pointer group"><input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={advFilters.isYellowFilter} onChange={(e) => setAdvFilters({...advFilters, isYellowFilter: e.target.checked})} /><span className="text-slate-700 group-hover:text-blue-600 transition-colors flex items-center">Yellow/Blue Filter</span></label></div>
              </div>
            </div>
          ) : ( 
            <>
              <div className="pt-6 space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-teal-800 flex items-center gap-2"><ListTree className="w-5 h-5" />Bloque 1: Parámetros Principales</h3>
                      {isDrAlfonsoUnlocked && (
                         <button 
                           onClick={() => setIsRulesManagerOpen(true)}
                           className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                           title="Gestionar Reglas Clínicas"
                         >
                           <Database className="w-4 h-4" />
                           Gestionar Reglas
                         </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                        <div><label className="block text-sm font-semibold text-slate-700 mb-1">Edad</label><input type="number" value={drAlfonsoInputs.age} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, age: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-teal-500" placeholder="Ej: 58" /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 mb-1">Longitud Axial</label><input type="number" value={drAlfonsoInputs.axialLength} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, axialLength: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-teal-500" placeholder="Ej: 23.5" /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 mb-1">Cristalino</label><select value={drAlfonsoInputs.lensStatus} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, lensStatus: e.target.value as DrAlfonsoInputs['lensStatus']})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-teal-500"><option value="any">Cualquiera</option><option value="transparente">Transparente</option><option value="presbicia">Presbicia</option><option value="disfuncional">Disfuncional</option><option value="catarata">Catarata</option><option value="otro">Otro</option></select></div>
                        <div><label className="block text-sm font-semibold text-slate-700 mb-1">Refracción</label><select value={drAlfonsoInputs.refraction} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, refraction: e.target.value as DrAlfonsoInputs['refraction']})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-teal-500"><option value="any">Cualquiera</option><option value="hipermetrope_extremo">Hipermetrope extremo</option><option value="hipermetrope_alto">Hipermetrope Alto</option><option value="emetrope">Emetrope +/-</option><option value="miope_alto">Miope Alto</option><option value="miope_extremo">Miope Extremo</option></select></div>
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-4 flex items-center gap-2"><CheckSquare className="w-5 h-5" />Bloque 2: Condiciones Adicionales</h3>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4 items-end">
                        <div><label className="block text-sm font-semibold text-slate-700 mb-1">LVC</label><select value={drAlfonsoInputs.lvc} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, lvc: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-teal-500">{Object.entries(lvcOptions).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}</select></div>
                        <div><label className="block text-sm font-semibold text-slate-700 mb-1">UCVA</label><select value={drAlfonsoInputs.ucva} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, ucva: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-teal-500">{Object.entries(ucvaOptions).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}</select></div>
                        <div><label className="block text-sm font-semibold text-slate-700 mb-1">Lentes de Contacto</label><select value={drAlfonsoInputs.contactLenses} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, contactLenses: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-teal-500">{Object.entries(contactLensOptions).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}</select></div>
                        <div><label className="block text-sm font-semibold text-slate-700 mb-1">Cámara Anterior</label><select value={drAlfonsoInputs.anteriorChamber} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, anteriorChamber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-teal-500">{Object.entries(anteriorChamberOptions).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}</select></div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Estafiloma</label>
                            <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200 h-[42px] items-center">
                                {(['any', 'yes', 'no'] as const).map((opt) => (<button key={opt} onClick={() => setDrAlfonsoInputs({...drAlfonsoInputs, estafiloma: opt})} className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${drAlfonsoInputs.estafiloma === opt ? 'bg-white text-teal-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>{opt === 'any' ? 'N/A' : opt}</button>))}
                            </div>
                        </div>
                     </div>
                </div>
                
                 <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-bold text-teal-800 mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500" />Bloque 3: Conceptos Clínicos Compatibles</h3>
                    {recommendedConcepts.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {recommendedConcepts.map(concept => (
                              <span key={concept} className="px-4 py-2 rounded-full text-sm font-bold bg-teal-100 text-teal-900 border border-teal-200 shadow-sm animate-in fade-in duration-300">
                                {concept}
                              </span>
                            ))}
                        </div>
                    ) : (
                      <p className="text-slate-500">Introduzca datos en el Bloque 1 para ver los conceptos recomendados.</p>
                    )}
                 </div>
                 
                 <div>
                    <h3 className="text-lg font-bold text-teal-800 mb-4 flex items-center gap-2"><Filter className="w-5 h-5" />Bloque 4: Filtros Opcionales de Lente</h3>
                    <div className="max-w-xs">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Material de la Lente</label>
                        <select value={drAlfonsoInputs.lensMaterial} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, lensMaterial: e.target.value as DrAlfonsoInputs['lensMaterial']})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-teal-500">
                            <option value="any">Cualquiera</option>
                            <option value="hidrofilico">Hidrofílico</option>
                            <option value="hidrofobico">Hidrofóbico</option>
                        </select>
                    </div>
                 </div>
              </div>

              <div className="border-t border-slate-200 -mx-6 mt-8 mb-6"></div>
              <div className="px-0">
                 <h2 className="text-2xl font-bold text-slate-800 mb-6">
                    Resultados de la Recomendación
                 </h2>
                 {renderResults()}
              </div>
            </>
          )}
        </div>
        
        {activeTab !== FilterTab.DR_ALFONSO && renderResults()}

      </main>

      {selectedLensIds.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-slate-200 shadow-lg z-30 animate-in slide-in-from-bottom-5">
           <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                   {selectedLensIds.size}
                 </div>
                 <span className="text-slate-700 font-medium">Lentes Seleccionadas</span>
                 <button onClick={clearSelection} className="text-xs text-red-500 hover:text-red-700 ml-2 font-medium">Clear</button>
              </div>
              <button 
                onClick={() => setShowComparison(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors"
              >
                <ArrowLeftRight className="w-5 h-5" />
                Comparar Lentes
              </button>
           </div>
        </div>
      )}

      {showComparison && (
        <ComparisonView 
          lenses={selectedLensesForComparison} 
          onClose={() => setShowComparison(false)}
          onRemove={removeLensFromComparison}
          onFindSimilar={handleFindZeissSimilar}
        />
      )}

      {isRulesManagerOpen && (
        <RulesManager 
          rules={ALL_RULES}
          onClose={() => setIsRulesManagerOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
