import React, { useEffect, useState, useMemo, useRef } from 'react';
import { IOL_XML_DATA } from './constants';
import { parseIOLData } from './utils/parser';
import { Lens, FilterTab, BasicFilters, AdvancedFilters } from './types';
import LensCard from './components/LensCard';
import ComparisonView from './components/ComparisonView';
import Tooltip from './components/Tooltip';
import DualRangeSlider from './components/DualRangeSlider';
import { Search, ChevronDown, AlertCircle, Upload, RotateCcw, ArrowLeftRight, Lock, Unlock, KeyRound, WifiOff, Globe, Layers, Calculator } from 'lucide-react';

// --- CONFIGURACIÓN DE BASE DE DATOS EXTERNA ---
const EXTERNAL_DB_URL = "https://raw.githubusercontent.com/globalatsdr/IOLs-Database/main/IOLexport.xml";

function App() {
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>(FilterTab.BASIC);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PASSWORD CONFIGURATION ---
  const UNLOCK_PASSWORD = "1234!"; 
  const [passwordInput, setPasswordInput] = useState('');
  const isAdvancedUnlocked = passwordInput === UNLOCK_PASSWORD;

  // Comparison State
  const [selectedLensIds, setSelectedLensIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);

  // Default Filter States
  const initialBasicFilters: BasicFilters = {
    manufacturer: 'all',
    opticConcept: 'all',
    toric: 'all'
  };

  const initialAdvFilters: AdvancedFilters = {
    filterMinSphere: 10,
    filterMaxSphere: 30,
    isPreloaded: false,
    isYellowFilter: false,
    hydroType: 'all',
    keyword: ''
  };

  // Filters State
  const [basicFilters, setBasicFilters] = useState<BasicFilters>(initialBasicFilters);
  const [advFilters, setAdvFilters] = useState<AdvancedFilters>(initialAdvFilters);
  
  // Calculator State
  const [calculatorInputs, setCalculatorInputs] = useState({
    age: '',
    axialLength: '',
    refractiveState: 'emetrope',
  });

  const handleCalculatorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCalculatorInputs(prev => ({ ...prev, [name]: value }));
  };


  // Function to reset everything
  const resetAll = () => {
    setSelectedLensIds(new Set());
    setBasicFilters(initialBasicFilters);
    setAdvFilters(initialAdvFilters);
    setShowComparison(false);
  };

  // Extract unique values for dropdowns
  const uniqueManufacturers = useMemo(() => 
    Array.from(new Set(lenses.map(l => l.manufacturer))).sort()
  , [lenses]);

  const uniqueConcepts = useMemo(() => 
    Array.from(new Set(lenses.map(l => l.specifications.opticConcept).filter(Boolean))).sort()
  , [lenses]);

  // Load Data Logic
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${EXTERNAL_DB_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`Failed to fetch external DB: ${response.status}`);
        const text = await response.text();
        const parsedData = parseIOLData(text);
        if (parsedData.length === 0) throw new Error("Parsed 0 lenses");
        setLenses(parsedData);
        setIsOfflineMode(false);
      } catch (error) {
        console.warn("Falling back to local data.", error);
        try {
          const localData = parseIOLData(IOL_XML_DATA);
          setLenses(localData);
          setIsOfflineMode(true);
        } catch (localError) {
          console.error("Critical: Failed to parse local data", localError);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if ((activeTab === FilterTab.ADVANCED || activeTab === FilterTab.SELECT_IOL) && !isAdvancedUnlocked) {
      setActiveTab(FilterTab.BASIC);
    }
  }, [isAdvancedUnlocked, activeTab]);

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
          setSelectedLensIds(new Set());
          setIsOfflineMode(false);
          alert(`Successfully loaded ${parsedData.length} lenses.`);
        } catch (err) {
          alert('Error parsing XML file.');
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

  const handleFindZeissSimilar = (targetLens: Lens) => {
    const zeissName = uniqueManufacturers.find(m => m.toLowerCase().includes('zeiss'));
    if (!zeissName) {
      alert("No Zeiss lenses found.");
      return;
    }
    setBasicFilters({
      manufacturer: zeissName,
      opticConcept: targetLens.specifications.opticConcept,
      toric: targetLens.specifications.toric ? 'yes' : 'no'
    });
    setActiveTab(FilterTab.BASIC);
    setShowComparison(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredLenses = useMemo(() => {
    return lenses.filter(lens => {
      if (activeTab === FilterTab.ADVANCED && advFilters.keyword) {
        const kw = advFilters.keyword.toLowerCase();
        if (!(lens.name.toLowerCase().includes(kw) || lens.manufacturer.toLowerCase().includes(kw))) return false;
      }
      if (activeTab === FilterTab.BASIC) {
        if (basicFilters.manufacturer !== 'all' && lens.manufacturer !== basicFilters.manufacturer) return false;
        if (basicFilters.opticConcept !== 'all' && lens.specifications.opticConcept !== basicFilters.opticConcept) return false;
        if (basicFilters.toric !== 'all') {
          const isToric = lens.specifications.toric;
          if (basicFilters.toric === 'yes' && !isToric) return false;
          if (basicFilters.toric === 'no' && isToric) return false;
        }
        return true;
      } else {
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
  }, [lenses, activeTab, basicFilters, advFilters]);

  const selectedLensesForComparison = useMemo(() => {
    return lenses.filter(l => selectedLensIds.has(l.id));
  }, [lenses, selectedLensIds]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 animate-pulse">Processing IOL Database...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xml" className="hidden" />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="logo.png" 
              alt="Logo" 
              className="h-10 w-auto object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">IOL Explorer</h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
             <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                {isAdvancedUnlocked ? <Unlock className="w-4 h-4 text-emerald-500" /> : <KeyRound className="w-4 h-4 text-slate-400" />}
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
                <a 
                  href="https://iolcon.org/lensesTable.php" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
                >
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="hidden sm:inline">IOLcon</span>
                </a>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload XML</span>
                </button>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isOfflineMode && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <WifiOff className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-amber-800 font-medium">Offline / Fallback Mode Active</p>
                <p className="text-xs text-amber-700 mt-0.5">Could not download database from GitHub. Showing local data.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Header with Reset Button */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="flex space-x-1 rounded-xl bg-slate-200 p-1 w-full max-w-xl shadow-inner">
            <button
              onClick={() => setActiveTab(FilterTab.BASIC)}
              className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition duration-150 ease-in-out
                ${activeTab === FilterTab.BASIC ? 'bg-white text-blue-700 shadow' : 'text-slate-600 hover:bg-white/50'}`}
            >
              Basic Filters
            </button>
            <button
              onClick={() => isAdvancedUnlocked && setActiveTab(FilterTab.ADVANCED)}
              disabled={!isAdvancedUnlocked}
              className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition duration-150 ease-in-out flex items-center justify-center gap-2
                ${activeTab === FilterTab.ADVANCED ? 'bg-white text-blue-700 shadow' : isAdvancedUnlocked ? 'text-slate-600 hover:bg-white/50' : 'text-slate-400 opacity-60'}`}
            >
              Advanced Search
              {!isAdvancedUnlocked && <Lock className="w-3 h-3" />}
            </button>
             <button
              onClick={() => isAdvancedUnlocked && setActiveTab(FilterTab.SELECT_IOL)}
              disabled={!isAdvancedUnlocked}
              className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition duration-150 ease-in-out flex items-center justify-center gap-2
                ${activeTab === FilterTab.SELECT_IOL ? 'bg-white text-blue-700 shadow' : isAdvancedUnlocked ? 'text-slate-600 hover:bg-white/50' : 'text-slate-400 opacity-60'}`}
            >
              <Calculator className="w-4 h-4" />
              Select IOL
              {!isAdvancedUnlocked && <Lock className="w-3 h-3" />}
            </button>
          </div>
          
          <button 
            onClick={resetAll}
            className="absolute right-0 flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-sm group"
            title="Reset all filters and selections"
          >
            <RotateCcw className="w-4 h-4 transition-transform group-hover:rotate-[-90deg]" />
            <span className="hidden md:inline">Reset All</span>
          </button>
        </div>

        {/* Filter Panels */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
          {activeTab === FilterTab.BASIC ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">Manufacturer <Tooltip content="The company that manufactures the lens." /></label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                    value={basicFilters.manufacturer}
                    onChange={(e) => setBasicFilters({...basicFilters, manufacturer: e.target.value})}
                  >
                    <option value="all">All Manufacturers</option>
                    {uniqueManufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700"><ChevronDown className="h-4 w-4" /></div>
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">Optic Concept <Tooltip content="Optical design principle." /></label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                    value={basicFilters.opticConcept}
                    onChange={(e) => setBasicFilters({...basicFilters, opticConcept: e.target.value})}
                  >
                    <option value="all">All Concepts</option>
                    {uniqueConcepts.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700"><ChevronDown className="h-4 w-4" /></div>
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">Toric <Tooltip content="Corrects astigmatism." /></label>
                <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
                  {['all', 'yes', 'no'].map((opt) => (
                     <button
                       key={opt}
                       onClick={() => setBasicFilters({...basicFilters, toric: opt})}
                       className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-colors
                         ${basicFilters.toric === opt ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                       {opt === 'all' ? 'Any' : opt}
                     </button>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === FilterTab.ADVANCED ? (
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                <input 
                  type="text" 
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by Name or Manufacturer..."
                  value={advFilters.keyword}
                  onChange={(e) => setAdvFilters({...advFilters, keyword: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="md:col-span-2 px-2">
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">Availability Range Requirement <Tooltip content="Define required diopter coverage." /></label>
                    <DualRangeSlider 
                      min={-10} max={60} minValue={advFilters.filterMinSphere} maxValue={advFilters.filterMaxSphere}
                      onChange={(min, max) => setAdvFilters({...advFilters, filterMinSphere: min, filterMaxSphere: max})} unit="D"
                    />
                     <p className="text-xs text-slate-400 mt-1">Lenses covering <strong>{advFilters.filterMinSphere}D</strong> to <strong>{advFilters.filterMaxSphere}D</strong>.</p>
                 </div>
                 <div>
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">Material Type <Tooltip content="Acrylic material type." /></label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg focus:outline-none focus:border-blue-500"
                      value={advFilters.hydroType}
                      onChange={(e) => setAdvFilters({...advFilters, hydroType: e.target.value})}
                    >
                      <option value="all">All Materials</option>
                      <option value="hydrophobic">Hydrophobic</option>
                      <option value="hydrophilic">Hydrophilic</option>
                    </select>
                 </div>
                 <div className="flex flex-col justify-center gap-3">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={advFilters.isPreloaded} onChange={(e) => setAdvFilters({...advFilters, isPreloaded: e.target.checked})} />
                      <span className="text-slate-700 group-hover:text-blue-600 transition-colors flex items-center">Preloaded Only <Tooltip content="In injector system." /></span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={advFilters.isYellowFilter} onChange={(e) => setAdvFilters({...advFilters, isYellowFilter: e.target.checked})} />
                      <span className="text-slate-700 group-hover:text-blue-600 transition-colors flex items-center">Yellow/Blue Filter <Tooltip content="Blue-light filtering." /></span>
                    </label>
                 </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                  Edad
                  <Tooltip content="Edad del paciente en años." />
                </label>
                <input
                  type="number"
                  name="age"
                  value={calculatorInputs.age}
                  onChange={handleCalculatorChange}
                  placeholder="e.g., 65"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                  Longitud Axial (mm)
                  <Tooltip content="Longitud axial del ojo en milímetros." />
                </label>
                <input
                  type="number"
                  name="axialLength"
                  step="0.01"
                  value={calculatorInputs.axialLength}
                  onChange={handleCalculatorChange}
                  placeholder="e.g., 23.5"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                  Estado Refractivo
                  <Tooltip content="Estado refractivo previo del ojo." />
                </label>
                <div className="relative">
                  <select
                    name="refractiveState"
                    value={calculatorInputs.refractiveState}
                    onChange={handleCalculatorChange}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="emetrope">Emétrope</option>
                    <option value="myopic">Miópico</option>
                    <option value="hyperopic">Hipermétropico</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700"><ChevronDown className="h-4 w-4" /></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Header / Counter */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              Available Lenses
            </h2>
            <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-200">
              {filteredLenses.length}
            </span>
          </div>
        </div>

        {/* Results Grid */}
        {filteredLenses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No lenses found</h3>
            <p className="text-slate-500">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLenses.map(lens => (
              <LensCard key={lens.id} lens={lens} isSelected={selectedLensIds.has(lens.id)} onToggleSelect={toggleLensSelection} />
            ))}
          </div>
        )}
      </main>

      {selectedLensIds.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-slate-200 shadow-lg z-30">
           <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">{selectedLensIds.size}</div>
                 <span className="text-slate-700 font-medium">Lenses Selected</span>
                 <button onClick={clearSelection} className="text-xs text-red-500 hover:text-red-700 ml-2 font-medium">Clear</button>
              </div>
              <button onClick={() => setShowComparison(true)} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors">
                <ArrowLeftRight className="w-5 h-5" /> Compare Lenses
              </button>
           </div>
        </div>
      )}

      {showComparison && (
        <ComparisonView lenses={selectedLensesForComparison} onClose={() => setShowComparison(false)} onRemove={removeLensFromComparison} onFindSimilar={handleFindZeissSimilar} />
      )}
    </div>
  );
}

export default App;