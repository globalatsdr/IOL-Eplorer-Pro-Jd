
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Lens, FilterTab, BasicFilters, AdvancedFilters, DrAlfonsoInputs, EquivalentSettings } from './types';
import LensCard from './components/LensCard';
import ComparisonView from './components/ComparisonView';
import DualRangeSlider from './components/DualRangeSlider';
import { getLensRecommendations, ALL_RULES } from './services/recommendationService';
import RulesManager from './components/RulesManager';
import RuleCreator from './components/RuleCreator';
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
  Trash2,
  Stethoscope,
  Sparkles,
  ArrowRightCircle,
  Settings2,
  LineChart,
  X,
  HelpCircle,
  CheckCircle2,
  Save,
  Download,
  LogOut,
  Bot,
  Send,
  Eraser
} from 'lucide-react';
import Markdown from 'react-markdown';

// Helper para buscar gráficas
const getGraphUrl = (type: 'MTF3' | 'MTF45' | 'Defocus', lensName: string, availableGraphs: Set<string>) => {
  const cleanName = lensName.trim();
  const extensions = ['png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG'];
  
  // Función de limpieza robusta (igual que en parser.ts)
  const safeClean = (str: string) => str.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '');

  // Generar variantes de nombres base (sin extensión)
  const bases = [
    `${type}_${cleanName}`,                     // Ej: MTF3_AcrySof IQ
    `${type}_${cleanName.replace(/\s+/g, '_')}`, // Ej: MTF3_AcrySof_IQ
    `${type}_${safeClean(cleanName)}`           // Ej: MTF3_AcrySof_IQ (limpio)
  ];

  // Eliminar duplicados
  const uniqueBases = Array.from(new Set(bases));

  for (const base of uniqueBases) {
    for (const ext of extensions) {
      const filename = `${base}.${ext}`;
      if (availableGraphs.has(filename)) return `./graphs/${filename}`;
    }
  }
  return null;
};

const GraphImage = ({ src, alt, onClick }: { src: string, alt: string, onClick?: () => void }) => {
  const [error, setError] = React.useState(false);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-red-50">
        <span className="text-red-400 font-bold text-xs mb-1">Error de carga</span>
        <span className="text-red-300 text-[10px] break-all">{src.split('/').pop()}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group cursor-zoom-in" onClick={onClick}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-contain mix-blend-multiply p-2 transition-transform duration-300 group-hover:scale-105" 
        onError={() => setError(true)}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-blue-900/0 group-hover:bg-blue-900/5 transition-colors rounded-xl pointer-events-none">
        <div className="bg-white/90 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100">
           <Search className="w-4 h-4 text-blue-600" />
        </div>
      </div>
    </div>
  );
};

const GraphsModal = ({ lenses, availableGraphs, onClose }: { lenses: Lens[], availableGraphs: Set<string>, onClose: () => void }) => {
  const [selectedGraph, setSelectedGraph] = React.useState<{src: string, alt: string} | null>(null);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <LineChart className="w-6 h-6 text-blue-600" />
              Análisis Gráfico Comparativo
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
              Curvas MTF y Desenfoque
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="grid grid-cols-1 gap-12">
            {lenses.map(lens => {
              const mtf3 = getGraphUrl('MTF3', lens.name, availableGraphs);
              const mtf45 = getGraphUrl('MTF45', lens.name, availableGraphs);
              const defocus = getGraphUrl('Defocus', lens.name, availableGraphs);
              const hasAnyGraph = mtf3 || mtf45 || defocus;

              if (!hasAnyGraph) return null;

              return (
                <div key={lens.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <div className="w-3 h-12 bg-blue-600 rounded-full"></div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{lens.name}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lens.manufacturer}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* MTF 3.0mm */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> MTF (3.0mm)
                      </div>
                      <div className="aspect-[4/3] bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden group relative">
                        {mtf3 ? (
                          <GraphImage 
                            src={mtf3} 
                            alt={`MTF 3.0mm - ${lens.name}`} 
                            onClick={() => setSelectedGraph({ src: mtf3, alt: `MTF 3.0mm - ${lens.name}` })}
                          />
                        ) : (
                          <span className="text-slate-300 text-xs font-bold italic">No disponible</span>
                        )}
                      </div>
                    </div>

                    {/* MTF 4.5mm */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> MTF (4.5mm)
                      </div>
                      <div className="aspect-[4/3] bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden group relative">
                        {mtf45 ? (
                          <GraphImage 
                            src={mtf45} 
                            alt={`MTF 4.5mm - ${lens.name}`} 
                            onClick={() => setSelectedGraph({ src: mtf45, alt: `MTF 4.5mm - ${lens.name}` })}
                          />
                        ) : (
                          <span className="text-slate-300 text-xs font-bold italic">No disponible</span>
                        )}
                      </div>
                    </div>

                    {/* Defocus Curve */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span> Curva de Desenfoque
                      </div>
                      <div className="aspect-[4/3] bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden group relative">
                        {defocus ? (
                          <GraphImage 
                            src={defocus} 
                            alt={`Defocus - ${lens.name}`} 
                            onClick={() => setSelectedGraph({ src: defocus, alt: `Defocus - ${lens.name}` })}
                          />
                        ) : (
                          <span className="text-slate-300 text-xs font-bold italic">No disponible</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {lenses.every(l => !getGraphUrl('MTF3', l.name, availableGraphs) && !getGraphUrl('MTF45', l.name, availableGraphs) && !getGraphUrl('Defocus', l.name, availableGraphs)) && (
               <div className="text-center py-20">
                 <LineChart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                 <p className="text-slate-400 font-bold text-lg">No hay gráficas disponibles para las lentes seleccionadas.</p>
                 <p className="text-slate-300 text-sm mt-2">Asegúrese de que los archivos existen en la carpeta /graphs y están listados en lens_graphs.json</p>
               </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
          <button onClick={onClose} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
            Cerrar Panel
          </button>
        </div>

        {/* LIGHTBOX OVERLAY */}
        {selectedGraph && (
          <div 
            className="absolute inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200"
            onClick={() => setSelectedGraph(null)}
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 text-lg">{selectedGraph.alt}</h3>
              <button 
                onClick={() => setSelectedGraph(null)}
                className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            <div className="flex-1 p-8 flex items-center justify-center bg-slate-50 cursor-zoom-out">
              <img 
                src={selectedGraph.src} 
                alt={selectedGraph.alt} 
                className="max-w-full max-h-full object-contain mix-blend-multiply shadow-2xl rounded-xl bg-white p-4"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ... (rest of App component)

const EXTERNAL_DB_URL = "https://raw.githubusercontent.com/globalatsdr/IOLs-Database/refs/heads/main/IOLexport.xml";
const STORAGE_KEY_XML = 'iol_data_cache_v3';
const STORAGE_KEY_OVERRIDES = 'iol_override_data_cache_v2';
const STORAGE_KEY_HAPTIC_MAPPING_OVERRIDE = 'iol_haptic_mapping_override_v1';
const STORAGE_KEY_MODIFICACIONES_OVERRIDE = 'iol_modificaciones_override_v1';
const STORAGE_KEY_EXCLUIDAS_OVERRIDE = 'iol_excluidas_override_v1';
const STORAGE_KEY_IMAGES_OVERRIDE = 'iol_images_override_v1';
const STORAGE_KEY_GRAPHS_OVERRIDE = 'iol_graphs_override_v1';

const isObject = (item: any) => (item && typeof item === 'object' && !Array.isArray(item));

const deepMerge = (target: any, source: any): any => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (isObject(sourceValue) && key in target && isObject(targetValue)) {
        output[key] = deepMerge(targetValue, sourceValue);
      } else if (sourceValue !== undefined && sourceValue !== null) {
        // Para strings, no sobrescribir con vacíos
        if (typeof sourceValue === 'string') {
          if (sourceValue.trim() !== '') {
            output[key] = sourceValue;
          }
        } else {
          // Para otros tipos (booleanos, números, objetos nuevos), reemplazar/añadir
          output[key] = sourceValue;
        }
      }
    });
  }
  return output;
};

// Función auxiliar para normalizar texto y comparar de forma segura (ignora mayúsculas, espacios, guiones, guiones bajos y caracteres especiales)
const normalizeText = (text: string) => 
  text ? text.toLowerCase().trim()
    .replace(/[^a-z0-9\s]/g, ' ') // Elimina todo lo que no sea letra, número o espacio (paréntesis, puntos, etc.)
    .replace(/[\s\-_]+/g, ' ')    // Normaliza espacios y guiones
    .trim() 
  : '';

function App() {
  const [baseLenses, setBaseLenses] = useState<Lens[]>([]);
  const [overrideData, setOverrideData] = useState<Record<string, Partial<Lens>>>({});
  const [activeTab, setActiveTab] = useState<FilterTab>(FilterTab.BASIC);
  
  const [dataReady, setDataReady] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [availableImages, setAvailableImages] = useState<Set<string>>(new Set());
  const [availableGraphs, setAvailableGraphs] = useState<Set<string>>(new Set());
  const [excludedLenses, setExcludedLenses] = useState<string[]>([]);
  const [hapticMapping, setHapticMapping] = useState<Record<string, string[]>>({});
  const xmlFileInputRef = useRef<HTMLInputElement>(null);

  const ADVANCED_UNLOCK_PASSWORD = "1234!";
  const DR_ALFONSO_UNLOCK_PASSWORD = "131/";
  const [passwordInput, setPasswordInput] = useState('');
  
  const isAdvancedUnlocked = passwordInput === ADVANCED_UNLOCK_PASSWORD || passwordInput === DR_ALFONSO_UNLOCK_PASSWORD;
  const isDrAlfonsoUnlocked = passwordInput === DR_ALFONSO_UNLOCK_PASSWORD;

  const [selectedLensIds, setSelectedLensIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [showGraphsModal, setShowGraphsModal] = useState(false);
  const [isRulesManagerOpen, setIsRulesManagerOpen] = useState(false);
  const [isRuleCreatorOpen, setIsRuleCreatorOpen] = useState(false);

  const [basicFilters, setBasicFilters] = useState<BasicFilters>({
    manufacturer: 'all',
    clinicalConcept: 'all',
    opticConcept: 'all',
    toric: 'all',
    technology: 'all',
    aberration: 'all',
    material: 'all',
    hapticDesign: 'all'
  });

  const [advFilters, setAdvFilters] = useState<AdvancedFilters>({
    filterMinSphere: 10,
    filterMaxSphere: 30,
    isPreloaded: false,
    isYellowFilter: false,
    hydroType: 'all',
    keyword: '',
    intendedLocation: 'all'
  });

  const [drAlfonsoInputs, setDrAlfonsoInputs] = useState<DrAlfonsoInputs>({
    age: '', axialLength: '', lensStatus: 'any', refraction: 'any', lensMaterial: 'any',
    hapticDesign: [], opticConcept: 'any', toric: 'any', technology: 'any',
    lvc: 'any', udva: 'any', contactLenses: 'any', anteriorChamber: 'any', retina: 'any',
    ata: '',
    iolDiopters: '',
  });
  
  const [recommendedConcepts, setRecommendedConcepts] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState({ ageG: '', laG: '' });
  const [isAtAModalOpen, setIsAtAModalOpen] = useState(false);
  const [isClinicalConceptModalOpen, setIsClinicalConceptModalOpen] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminMode, setAdminMode] = useState<'H' | 'M' | 'E' | 'I' | 'G' | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminEditorText, setAdminEditorText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [ataAssetIndex, setAtaAssetIndex] = useState(0);
  const ataAssets = ['ata_info.png', 'ata_info.PNG', 'ata_info.jpg', 'ata_info.jpeg', 'ata_info.pdf'];

  // AI Assistant States
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleAdminLogin = async () => {
    const pw = adminPasswordInput;
    let mode: 'H' | 'M' | 'E' | 'I' | 'G' | null = null;
    let content = '';

    if (pw === 'ioladmin_H') {
      mode = 'H';
      content = JSON.stringify(hapticMapping, null, 2);
    } else if (pw === 'ioladmin_M') {
      mode = 'M';
      // Cargar de cache o fetch
      const cached = localStorage.getItem(STORAGE_KEY_MODIFICACIONES_OVERRIDE);
      if (cached) content = cached;
      else {
         const res = await fetch('./modificaciones.json').catch(() => null);
         if (res && res.ok) content = await res.text();
         else content = '[]';
      }
    } else if (pw === 'ioladmin_E') {
      mode = 'E';
      const cached = localStorage.getItem(STORAGE_KEY_EXCLUIDAS_OVERRIDE);
      if (cached) content = cached;
      else {
         const res = await fetch('./lentesexcluidas.json').catch(() => null);
         if (res && res.ok) content = await res.text();
         else content = '[]';
      }
    } else if (pw === 'ioladmin_I') {
      mode = 'I';
      const cached = localStorage.getItem(STORAGE_KEY_IMAGES_OVERRIDE);
      if (cached) content = cached;
      else {
         const res = await fetch('./lens_images.json').catch(() => null);
         if (res && res.ok) content = await res.text();
         else content = '[]';
      }
    } else if (pw === 'ioladmin_G') {
      mode = 'G';
      const cached = localStorage.getItem(STORAGE_KEY_GRAPHS_OVERRIDE);
      if (cached) content = cached;
      else {
         const res = await fetch('./lens_graphs.json').catch(() => null);
         if (res && res.ok) content = await res.text();
         else content = '[]';
      }
    }

    if (mode) {
      setIsAdminAuthenticated(true);
      setAdminMode(mode);
      setAdminEditorText(content);
      // Opcional: No limpiar el input aquí si queremos mantenerlo? 
      // El usuario pidió "que al cerrar sesión, se quite la contraseña del cuadro de texto"
      // Así que lo limpiamos al cerrar sesión.
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const handleAiChat = async () => {
    if (!aiInput.trim() || isAiLoading) return;

    const userMsg = aiInput.trim();
    setAiInput('');
    const newHistory: { role: 'user' | 'model'; text: string }[] = [
      ...chatMessages,
      { role: 'user', text: userMsg }
    ];
    setChatMessages(newHistory);
    setIsAiLoading(true);

    try {
      const lensesContext = filteredLenses.slice(0, 40).map(l => ({
        n: l.name,
        f: l.manufacturer,
        m: l.specifications.opticMaterial,
        h: l.specifications.hydro,
        d: l.specifications.opticConcept,
        t: l.specifications.technology,
        c: l.specifications.aConstant,
        a: l.specifications.abbeNumber,
        fi: l.specifications.filter
      }));

      const systemPrompt = `Eres el ASISTENTE IA de IOL Explorer. Tienes ${filteredLenses.length} lentes en vista.
DATOS CONTEXTO (Top 40): ${JSON.stringify(lensesContext)}

INSTRUCCIONES:
1. Sé conciso y técnico.
2. Usa tablas para comparar.
3. Justifica recomendaciones con números de Abbe y diseño óptico.
4. Tono profesional.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newHistory,
          systemInstruction: systemPrompt 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error servidor: ${response.status}`);
      }

      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'model', text: data.text }]);
    } catch (error: any) {
      console.error("Error AI Detallado:", error);
      let errMsg = "Error de comunicación con el asistente.";
      if (error.message?.includes('KEY')) {
        errMsg = "Configuración de API pendiente en el servidor.";
      }
      setChatMessages(prev => [...prev, { role: 'model', text: `${errMsg}\n\n(Detalle: ${error.message})` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAdminSave = () => {
    try {
      const parsed = JSON.parse(adminEditorText);
      let key = '';
      if (adminMode === 'H') {
        key = STORAGE_KEY_HAPTIC_MAPPING_OVERRIDE;
        setHapticMapping(parsed);
      } else if (adminMode === 'M') {
        key = STORAGE_KEY_MODIFICACIONES_OVERRIDE;
        // La actualización de overrideData requiere baseLenses cargado
        // Re-ejecutamos una lógica similar a handleLoadModifications pero desde el string editado
        const normalizedJson: Record<string, Partial<Lens>> = {};
        Object.keys(parsed).forEach(k => {
          const matched = baseLenses.find(l => normalizeText(l.name) === normalizeText(k));
          if (matched) normalizedJson[matched.id] = parsed[k];
        });
        setOverrideData(prev => ({ ...prev, ...normalizedJson }));
      } else if (adminMode === 'E') {
        key = STORAGE_KEY_EXCLUIDAS_OVERRIDE;
        setExcludedLenses(parsed.map((n: string) => normalizeText(n)));
      } else if (adminMode === 'I') {
        key = STORAGE_KEY_IMAGES_OVERRIDE;
        setAvailableImages(new Set(parsed));
      } else if (adminMode === 'G') {
        key = STORAGE_KEY_GRAPHS_OVERRIDE;
        setAvailableGraphs(new Set(parsed));
      }

      if (key) {
        localStorage.setItem(key, JSON.stringify(parsed));
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (e) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      alert('Error: JSON inválido. Verifique el formato.');
    }
  };

  const handleAdminDownload = () => {
    const filename = adminMode === 'H' ? 'haptic_mapping.json' :
                     adminMode === 'M' ? 'modificaciones.json' :
                     adminMode === 'E' ? 'lentesexcluidas.json' :
                     adminMode === 'I' ? 'lens_images.json' :
                     'lens_graphs.json';
    const blob = new Blob([adminEditorText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isAtAModalOpen) setAtaAssetIndex(0);
  }, [isAtAModalOpen]);
  
  const lenses = useMemo(() => {
    let processed = baseLenses;
    
    // Aplicar mapeo de hápticos (siempre, para asegurar que mappedHapticDesign existe)
    processed = processed.map(lens => {
      const rawHaptic = (lens.specifications.hapticDesign || '').trim();
      let mapped = 'Other';
      
      if (Object.keys(hapticMapping).length > 0) {
        for (const [category, variants] of Object.entries(hapticMapping)) {
          if (Array.isArray(variants) && variants.some(v => v.toLowerCase() === rawHaptic.toLowerCase())) {
            mapped = category;
            break;
          }
        }
      }
      
      return {
        ...lens,
        specifications: {
          ...lens.specifications,
          mappedHapticDesign: mapped
        }
      };
    });

    if (Object.keys(overrideData).length === 0) return processed;
    return processed.map(lens => 
      overrideData[lens.id] ? deepMerge(lens, overrideData[lens.id]) : lens
    );
  }, [baseLenses, overrideData, hapticMapping]);

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

    const age = drAlfonsoInputs.age ? parseInt(drAlfonsoInputs.age, 10) : 0;
    const la = drAlfonsoInputs.axialLength ? parseFloat(drAlfonsoInputs.axialLength.replace(',', '.')) : 0;
    const ageG = age === 0 ? 'N/A' : age < 50 ? '1' : age <= 65 ? '2' : age <= 75 ? '3' : age <= 85 ? '4' : '5';
    const laG = la === 0 ? 'N/A' : la < 22.5 ? '1' : la <= 24.5 ? '2' : la <= 26 ? '3' : '4';
    setDebugInfo({ ageG, laG });
  }, [drAlfonsoInputs.age, drAlfonsoInputs.axialLength, drAlfonsoInputs.lensStatus, drAlfonsoInputs.lvc, drAlfonsoInputs.udva, drAlfonsoInputs.contactLenses, drAlfonsoInputs.anteriorChamber, drAlfonsoInputs.retina]);

  // Efecto para Angulo-Angulo (AtA) -> Diseño Háptico
  useEffect(() => {
    const ataVal = parseFloat(drAlfonsoInputs.ata.replace(',', '.'));
    if (isNaN(ataVal)) return;

    const newHaptics: string[] = [];
    if (ataVal <= 12) newHaptics.push('C-Loop');
    if (ataVal >= 12) newHaptics.push('Plate');
    if (ataVal > 11.5 && ataVal < 12.5) newHaptics.push('Lamina Modificada');

    setDrAlfonsoInputs(prev => ({
      ...prev,
      hapticDesign: newHaptics
    }));
  }, [drAlfonsoInputs.ata]);

  const uniqueManufacturers = useMemo(() => Array.from(new Set(lenses.map(l => l.manufacturer))).sort(), [lenses]);
  const uniqueLocations = useMemo(() => Array.from(new Set(lenses.map(l => l.specifications.intendedLocation))).sort(), [lenses]);

  useEffect(() => {
    // Cargar imágenes
    fetch('./lens_images.json')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const cached = localStorage.getItem(STORAGE_KEY_IMAGES_OVERRIDE);
        if (cached) {
          try {
            const override = JSON.parse(cached);
            if (Array.isArray(override)) {
              setAvailableImages(new Set(override));
              return;
            }
          } catch(e) {}
        }
        if (Array.isArray(data)) setAvailableImages(new Set(data));
      })
      .catch(err => console.error("Error loading image list", err));

    // Cargar gráficas
    fetch('./lens_graphs.json')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const cached = localStorage.getItem(STORAGE_KEY_GRAPHS_OVERRIDE);
        if (cached) {
          try {
            const override = JSON.parse(cached);
            if (Array.isArray(override)) {
              setAvailableGraphs(new Set(override));
              return;
            }
          } catch(e) {}
        }
        if (Array.isArray(data)) setAvailableGraphs(new Set(data));
      })
      .catch(err => console.error("Error loading graphs list", err));

    // Cargar lentes excluidas
    fetch(`./lentesexcluidas.json?t=${new Date().getTime()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const cached = localStorage.getItem(STORAGE_KEY_EXCLUIDAS_OVERRIDE);
        let finalData = data;
        if (cached) {
          try {
            const override = JSON.parse(cached);
            if (Array.isArray(override)) finalData = override;
          } catch(e) {}
        }
        if (Array.isArray(finalData)) {
          const normalized = finalData.map((name: string) => normalizeText(name));
          setExcludedLenses(normalized);
        }
      })
      .catch(err => console.error("Error loading excluded lenses list", err));
  }, []);

  const initData = async () => {
      

      // 2. Cargar los overrides (modificaciones)
      const applyModifications = (rawJson: any) => {
        const normalizedJson: Record<string, Partial<Lens>> = {};
        Object.keys(rawJson).forEach(key => {
          const item = { ...rawJson[key] };
          const normalizedKey = normalizeText(key);
          
          const noteContent = item.note || item.notes || item.Notas || item.notas ||
            item.specifications?.note || item.specifications?.notes || item.specifications?.Notas || item.specifications?.notas;
          if (noteContent) {
            item.note = noteContent;
            if (item.specifications) {
              delete (item.specifications as any).note; delete (item.specifications as any).notes;
              delete (item.specifications as any).Notas; delete (item.specifications as any).notas;
            }
          }

          const surnameContent = item.surname || item.Surname || item.apodo || item.Apodo ||
            item.specifications?.surname || item.specifications?.Surname || item.specifications?.apodo || item.specifications?.Apodo;
          if (surnameContent) {
            item.surname = surnameContent;
            if (item.specifications) {
              delete (item.specifications as any).surname; delete (item.specifications as any).Surname;
              delete (item.specifications as any).apodo; delete (item.specifications as any).Apodo;
            }
          }

          const abbeContent = item.abbeNumber ?? item.AbbeNumber ?? item.abbenumber ?? item['Abbe Number'] ??
            item.specifications?.abbeNumber ?? item.specifications?.AbbeNumber ?? item.specifications?.abbenumber ?? item.specifications?.['Abbe Number'];
          if (abbeContent !== undefined && abbeContent !== null) {
            if (!item.specifications) item.specifications = {};
            const parsedAbbe = typeof abbeContent === 'string' ? parseFloat(abbeContent.replace(',', '.')) : abbeContent;
            if (!isNaN(parsedAbbe)) item.specifications.abbeNumber = parsedAbbe;
          }

          // Buscar lente por nombre normalizado
          const matchedLens = baseLenses.find(l => normalizeText(l.name) === normalizedKey);
          if (matchedLens) {
            normalizedJson[matchedLens.id] = item;
          }
        });
        setOverrideData(prev => ({ ...prev, ...normalizedJson }));
      };

      const cachedOverrides = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (cachedOverrides) {
        try { setOverrideData(JSON.parse(cachedOverrides)); } catch (e) {}
      }
      
      const editorMOverride = localStorage.getItem(STORAGE_KEY_MODIFICACIONES_OVERRIDE);
      if (editorMOverride) {
        try { applyModifications(JSON.parse(editorMOverride)); } catch (e) {}
      }

      // 3. Cargar mapeo de hápticos con cache-busting
      fetch(`./haptic_mapping.json?t=${new Date().getTime()}`)
        .then(res => res.ok ? res.json() : {})
        .then(mapping => {
          console.log("Haptic mapping loaded:", Object.keys(mapping));
          
          // Aplicar overrides locales si existen
          const cachedHapticOverride = localStorage.getItem(STORAGE_KEY_HAPTIC_MAPPING_OVERRIDE);
          if (cachedHapticOverride) {
            try {
              const override = JSON.parse(cachedHapticOverride);
              const merged = { ...mapping, ...override };
              setHapticMapping(merged);
            } catch (e) {
              setHapticMapping(mapping);
            }
          } else {
            setHapticMapping(mapping);
          }
        })
        .catch(err => console.error("Error loading haptic mapping", err));

      // 4. Cargar datos de lentes
      const loadAndFilterLenses = (data: Lens[]) => {
        if (data.length > 0) {
          setBaseLenses(data);
          return true;
        }
        return false;
      };

      const cachedXML = localStorage.getItem(STORAGE_KEY_XML);
      let dataLoaded = false;
      if (cachedXML) {
        try {
          const data = parseIOLData(cachedXML);
          dataLoaded = loadAndFilterLenses(data);
        } catch (e) {}
      }
      
      if (!dataLoaded) {
        try {
          const data = parseIOLData(IOL_XML_DATA);
          loadAndFilterLenses(data);
        } catch (e) {}
      }

      // 4. Intentar actualizar desde la fuente externa y filtrar
      try {
        const response = await fetch(EXTERNAL_DB_URL);
        if (response.ok) {
          const text = await response.text();
          const newData = parseIOLData(text);
          if (newData.length > 0) {
            loadAndFilterLenses(newData);
            localStorage.setItem(STORAGE_KEY_XML, text);
          }
        }
      } catch (error) {
        console.log("Modo offline");
      } finally {
        setDataReady(true);
      }
    };

  useEffect(() => {
    (async () => {
      await initData();
    })();
  }, []);

  // Timer for loading screen
  useEffect(() => {
    if (hasEntered) return;
    
    const duration = 4000; // 4 seconds
    const intervalTime = 40; // update every 40ms
    const step = 100 / (duration / intervalTime);
    
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);
    
    return () => clearInterval(timer);
  }, [hasEntered]);

  // Auto-enter logic
  useEffect(() => {
    if (!hasEntered && dataReady && loadingProgress >= 100) {
      setHasEntered(true);
    }
  }, [dataReady, loadingProgress, hasEntered]);

  const handleXMLUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        try {
          const parsedData = parseIOLData(text);
          const filteredData = parsedData.filter(lens => !excludedLenses.includes(normalizeText(lens.name)));
          setBaseLenses(filteredData);
          localStorage.setItem(STORAGE_KEY_XML, text);
          setSelectedLensIds(new Set());
          alert(`Base de datos actualizada: ${filteredData.length} lentes (después de excluir ${parsedData.length - filteredData.length}).`);
        } catch (err) { alert('Error al procesar el XML.'); }
      }
    };
    reader.readAsText(file);
    if (xmlFileInputRef.current) xmlFileInputRef.current.value = '';
  };

  const handleLoadModifications = async () => {
    try {
      const response = await fetch(`./modificaciones.json?t=${new Date().getTime()}`);
      if (!response.ok) {
        throw new Error('No se pudo cargar el archivo de modificaciones.');
      }
      
      const rawJson = await response.json();
      const normalizedJson: Record<string, Partial<Lens>> = {};
      const mismatches: string[] = [];
      const appliedCount: string[] = [];

      // Procesar cada entrada del JSON
      Object.keys(rawJson).forEach(key => {
        const item = { ...rawJson[key] }; // Copia para no mutar el original
        const normalizedKey = normalizeText(key);
        
        // 1. Normalización de Notas (Soporta 'note', 'notes', 'Notas', 'notas' y dentro de specifications)
        const noteContent = 
          item.note || 
          item.notes || 
          item.Notas || 
          item.notas ||
          item.specifications?.note || 
          item.specifications?.notes ||
          item.specifications?.Notas ||
          item.specifications?.notas;

        if (noteContent) {
          item.note = noteContent;
          // Limpiar posibles duplicados para evitar ruido en el objeto
          delete (item as any).Notas;
          delete (item as any).notas;
          delete (item as any).notes;
          if (item.specifications) {
            delete (item.specifications as any).note;
            delete (item.specifications as any).notes;
            delete (item.specifications as any).Notas;
            delete (item.specifications as any).notas;
          }
        }

        // 2. Normalización de Surname
        const surnameContent = 
          item.surname || 
          item.Surname || 
          item.apodo || 
          item.Apodo ||
          item.specifications?.surname || 
          item.specifications?.Surname ||
          item.specifications?.apodo ||
          item.specifications?.Apodo;

        if (surnameContent) {
          item.surname = surnameContent;
          // Limpiar posibles duplicados
          delete (item as any).Surname;
          delete (item as any).apodo;
          delete (item as any).Apodo;
          if (item.specifications) {
            delete (item.specifications as any).surname;
            delete (item.specifications as any).Surname;
            delete (item.specifications as any).apodo;
            delete (item.specifications as any).Apodo;
          }
        }

        // 3. Normalización de Abbe Number
        const abbeContent = 
          item.abbeNumber ?? 
          item.AbbeNumber ?? 
          item.abbenumber ?? 
          item['Abbe Number'] ??
          item.specifications?.abbeNumber ?? 
          item.specifications?.AbbeNumber ??
          item.specifications?.abbenumber ??
          item.specifications?.['Abbe Number'];

        if (abbeContent !== undefined && abbeContent !== null) {
          if (!item.specifications) item.specifications = {};
          const parsedAbbe = typeof abbeContent === 'string' ? parseFloat(abbeContent.replace(',', '.')) : abbeContent;
          if (!isNaN(parsedAbbe)) {
            item.specifications.abbeNumber = parsedAbbe;
          }
          
          // Limpiar duplicados en raíz
          delete (item as any).abbeNumber;
          delete (item as any).AbbeNumber;
          delete (item as any).abbenumber;
          delete (item as any)['Abbe Number'];
          // Limpiar duplicados en specifications
          if (item.specifications) {
             delete (item.specifications as any).AbbeNumber;
             delete (item.specifications as any).abbenumber;
             delete (item.specifications as any)['Abbe Number'];
          }
        }

        // 4. BUSCAR LA LENTE: Primero por ID (por si acaso), luego por NOMBRE (más robusto)
        let targetLens = baseLenses.find(l => l.id === key);
        
        if (!targetLens) {
          // Si no se encuentra por ID, buscamos por nombre normalizado
          targetLens = baseLenses.find(l => normalizeText(l.name) === normalizedKey || normalizeText(l.name).includes(normalizedKey));
        }

        if (targetLens) {
          // Si encontramos la lente, guardamos la modificación usando su ID real
          normalizedJson[targetLens.id] = item;
          appliedCount.push(targetLens.name);
        } else {
          mismatches.push(key);
        }
      });

      setOverrideData(normalizedJson);
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(normalizedJson));
      
      if (mismatches.length > 0) {
          alert(`Se aplicaron ${appliedCount.length} modificaciones.\n\nNo se encontraron coincidencias para:\n` + mismatches.join('\n'));
      } else {
          alert(`¡Éxito! Se aplicaron modificaciones a ${appliedCount.length} lentes correctamente.`);
      }

    } catch (err) { 
      console.error(err);
      alert('Error al cargar el archivo modificaciones.json. Asegúrate de que el formato es correcto.'); 
    }
  };

  const handleClearOverrides = () => {
    if (window.confirm("¿Seguro que quieres eliminar todas las modificaciones personalizadas (JSON) y volver a los datos originales del archivo?")) {
      setOverrideData({});
      localStorage.removeItem(STORAGE_KEY_OVERRIDES);
    }
  };

  const handleResetFilters = () => {
    setBasicFilters({ 
      manufacturer: 'all', 
      clinicalConcept: 'all', 
      opticConcept: 'all', 
      toric: 'all', 
      technology: 'all',
      aberration: 'all',
      material: 'all',
      hapticDesign: 'all'
    });
    setAdvFilters({ filterMinSphere: 10, filterMaxSphere: 30, isPreloaded: false, isYellowFilter: false, hydroType: 'all', keyword: '', intendedLocation: 'all' });
    setDrAlfonsoInputs({ 
      age: '', 
      axialLength: '', 
      lensStatus: 'any', 
      refraction: 'any', 
      lensMaterial: 'any', 
      hapticDesign: [], 
      opticConcept: 'any', 
      toric: 'any', 
      technology: 'any', 
      lvc: 'any', 
      udva: 'any', 
      contactLenses: 'any', 
      anteriorChamber: 'any', 
      retina: 'any',
      ata: '',
      iolDiopters: ''
    });
  };

  const findEquivalent = (lens: Lens, manufacturer: string, settings: EquivalentSettings) => {
    setBasicFilters({
      manufacturer: manufacturer,
      clinicalConcept: 'all',
      opticConcept: settings.opticConcept ? lens.specifications.opticConcept : 'all',
      toric: settings.toric ? (lens.specifications.toric ? 'yes' : 'no') : 'all',
      technology: settings.technology ? (lens.specifications.technology || 'all') : 'all',
      aberration: settings.aberration ? (lens.specifications.aberration || 'all') : 'all',
      material: settings.material ? (
        lens.specifications.hydro.toLowerCase().includes('hydrophobic') ? 'hidrofobico' : 
        lens.specifications.hydro.toLowerCase().includes('hydrophilic') ? 'hidrofilico' : 'all'
      ) : 'all',
      hapticDesign: settings.hapticDesign ? (lens.specifications.mappedHapticDesign || 'all') : 'all'
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
      // 1. Filtro de exclusión por nombre (desde lentesexcluidas.json)
      if (excludedLenses.includes(normalizeText(lens.name))) return false;

      if (advFilters.keyword) {
        const kw = advFilters.keyword.toLowerCase();
        const nameMatch = lens.name.toLowerCase().includes(kw);
        const manuMatch = lens.manufacturer.toLowerCase().includes(kw);
        const techMatch = lens.specifications.technology?.toLowerCase().includes(kw);
        const surnameMatch = lens.surname?.toLowerCase().includes(kw);
        if (!nameMatch && !manuMatch && !techMatch && !surnameMatch) return false;
      }

      if (activeTab === FilterTab.BASIC) {
        if (basicFilters.manufacturer !== 'all' && lens.manufacturer !== basicFilters.manufacturer) return false;
        if (basicFilters.opticConcept !== 'all' && lens.specifications.opticConcept?.toLowerCase() !== basicFilters.opticConcept.toLowerCase()) return false;
        if (basicFilters.toric !== 'all') {
          const isToric = lens.specifications.toric;
          if (basicFilters.toric === 'yes' && !isToric) return false;
          if (basicFilters.toric === 'no' && isToric) return false;
        }
        if (basicFilters.technology !== 'all' && lens.specifications.technology?.toLowerCase() !== basicFilters.technology.toLowerCase()) return false;
        if (basicFilters.aberration !== 'all' && lens.specifications.aberration?.toLowerCase() !== basicFilters.aberration.toLowerCase()) return false;
        
        if (basicFilters.material !== 'all') {
          const m = (lens.specifications.hydro || lens.specifications.opticMaterial || "").toLowerCase();
          if (basicFilters.material === 'hidrofilico' && !m.includes('hydrophilic')) return false;
          if (basicFilters.material === 'hidrofobico' && !m.includes('hydrophobic')) return false;
        }

        if (basicFilters.hapticDesign !== 'all') {
          const mapped = lens.specifications.mappedHapticDesign;
          if (mapped !== basicFilters.hapticDesign) return false;
        }
      } else if (activeTab === FilterTab.ADVANCED) {
        if (lens.availability.minSphere > advFilters.filterMinSphere || lens.availability.maxSphere < advFilters.filterMaxSphere) return false;
        if (advFilters.isPreloaded && !lens.specifications.preloaded) return false;
        if (advFilters.isYellowFilter && !lens.specifications.filter.toLowerCase().includes('yellow')) return false;
        
        if (advFilters.hydroType !== 'all') {
          const m = (lens.specifications.hydro || "").toLowerCase();
          if (advFilters.hydroType === 'hydrophilic' && !m.includes('hydrophilic')) return false;
          if (advFilters.hydroType === 'hydrophobic' && !m.includes('hydrophobic')) return false;
        }

        if (advFilters.intendedLocation !== 'all' && lens.specifications.intendedLocation !== advFilters.intendedLocation) return false;
      } else if (activeTab === FilterTab.DR_ALFONSO) {
        // Filtros Técnicos de Dr. Alfonso
        if (drAlfonsoInputs.opticConcept !== 'any' && lens.specifications.opticConcept.toLowerCase() !== drAlfonsoInputs.opticConcept.toLowerCase()) return false;
        
        if (drAlfonsoInputs.technology !== 'any' && lens.specifications.technology?.toLowerCase() !== drAlfonsoInputs.technology.toLowerCase()) return false;
        
        if (drAlfonsoInputs.hapticDesign.length > 0) {
            const mapped = lens.specifications.mappedHapticDesign;
            if (mapped && !drAlfonsoInputs.hapticDesign.includes(mapped)) return false;
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

        if (drAlfonsoInputs.iolDiopters) {
          const diop = parseFloat(drAlfonsoInputs.iolDiopters.replace(',', '.'));
          if (!isNaN(diop)) {
              if (diop < lens.availability.minSphere || diop > lens.availability.maxSphere) return false;
          }
        }
      }
      return true;
    });
  }, [lenses, activeTab, basicFilters, advFilters, drAlfonsoInputs]);

  // --- LOGICA DE BLOQUEO ---
  // Solo se habilitan los botones de carga si isDrAlfonsoUnlocked es true
  const areAdminActionsEnabled = isDrAlfonsoUnlocked;

  if (!hasEntered) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-white p-8">
        <img 
          src="logo.png" 
          alt="IOL Explorer Logo" 
          className={`w-96 h-96 mb-8 transition-all duration-1000 ${loadingProgress < 100 ? 'scale-110' : 'scale-100'}`} 
        />
        
        <div className="w-full max-w-md space-y-6 flex flex-col items-center">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tighter text-white">
              IOL Explorer <span className="text-blue-500">Pro</span>
            </h1>
            <p className="text-slate-400 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">
              Cargando datos del IOL Explorer...
            </p>
          </div>

          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-75 ease-linear"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          
          <div className="flex justify-between w-full text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span>System Initializing</span>
            <span>{Math.round(loadingProgress)}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <input type="file" ref={xmlFileInputRef} onChange={handleXMLUpload} accept=".xml" className="hidden" />

      <header className="bg-black border-b border-white/10 sticky top-0 z-30 shadow-sm px-4 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidePanelOpen(true)} 
            className="w-14 h-14 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-transform active:scale-95 focus:outline-none"
          >
             <img src="logo.png" alt="IOL Explorer Logo" className="w-full h-full object-contain" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white tracking-tight leading-none">IOL Explorer <span className="text-blue-500">Pro</span></h1>
            <span className="text-[10px] text-white/50 font-bold uppercase mt-1 tracking-widest">Dr. Alfonso</span>
          </div>
          <a href="https://iolcon.org" target="_blank" rel="noopener noreferrer" className="ml-4 flex items-center gap-2 text-[11px] bg-white/10 text-white/70 px-3 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-all group border border-white/5">
            <ExternalLink className="w-3.5 h-3.5" /> <span className="hidden sm:inline">IOLcon.org</span>
          </a>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAiSidebarOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-900/20 active:scale-95 group"
          >
            <Bot className="w-4 h-4 group-hover:animate-bounce" />
            <span className="hidden sm:inline">Asistente IA</span>
          </button>
          
          {/* BOTONES ADMINISTRATIVOS - AHORA PROTEGIDOS */}
          <div className={`hidden sm:flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1 transition-opacity ${!areAdminActionsEnabled ? 'opacity-50 grayscale' : ''}`}>
            <button 
              onClick={() => xmlFileInputRef.current?.click()} 
              disabled={!areAdminActionsEnabled}
              className={`flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg shadow-sm text-xs font-bold text-white/90 border border-white/10 ${areAdminActionsEnabled ? 'hover:text-blue-400 cursor-pointer' : 'cursor-not-allowed'}`}
              title={!areAdminActionsEnabled ? "Requiere acceso Dr. Alfonso" : "Cargar base de datos XML"}
            >
              <Upload className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Cargar XML</span>
            </button>
            <button 
              onClick={handleLoadModifications} 
              disabled={!areAdminActionsEnabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-bold text-white/80 ${areAdminActionsEnabled ? 'hover:bg-white/10 hover:text-orange-400 cursor-pointer' : 'cursor-not-allowed'}`}
              title={!areAdminActionsEnabled ? "Requiere acceso Dr. Alfonso" : "Cargar modificaciones internas"}
            >
              <FileJson className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Modificaciones</span>
            </button>
            <div className="w-px h-8 bg-white/20 mx-1"></div>
            <button 
              onClick={handleClearOverrides} 
              disabled={!areAdminActionsEnabled}
              className={`p-2 rounded-lg transition-all text-white/60 ${areAdminActionsEnabled ? 'hover:bg-white/10 hover:text-orange-400 cursor-pointer' : 'cursor-not-allowed'}`}
              title={!areAdminActionsEnabled ? "Requiere acceso Dr. Alfonso" : "Borrar todas las modificaciones personalizadas"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if(window.confirm("¿Deseas limpiar la base de datos local y recargar desde el servidor?")) {
                  localStorage.removeItem(STORAGE_KEY_XML);
                  window.location.reload();
                }
              }} 
              disabled={!areAdminActionsEnabled}
              className={`p-2 rounded-lg transition-all text-white/60 ${areAdminActionsEnabled ? 'hover:bg-white/10 hover:text-blue-400 cursor-pointer' : 'cursor-not-allowed'}`}
              title={!areAdminActionsEnabled ? "Requiere acceso Dr. Alfonso" : "Limpiar caché de base de datos y recargar"}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            {/* Candado visual sobre el grupo si está bloqueado */}
            {!areAdminActionsEnabled && (
                <div className="flex items-center justify-center px-2">
                    <Lock className="w-3 h-3 text-white/40" />
                </div>
            )}
          </div>

          <div className="h-10 w-px bg-white/20 mx-1"></div>
          
          <div className="relative">
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              placeholder="Unlock" 
              className="bg-white/10 border border-white/20 text-xs w-20 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-white/30" 
            />
            {!isAdvancedUnlocked && !isDrAlfonsoUnlocked && <Lock className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"/>}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        {isRuleCreatorOpen && <RuleCreator onClose={() => setIsRuleCreatorOpen(false)} />}
        <div className="relative max-w-2xl mx-auto mb-10 shadow-xl shadow-blue-900/5 rounded-2xl overflow-hidden group">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por modelo, fabricante, tecnología o surname..." 
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

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-10 relative">
            <button 
              onClick={handleResetFilters} 
              className="absolute top-6 right-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors group"
              title="Limpiar todos los filtros"
            >
              <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:rotate-[-90deg]" />
              Limpiar Filtros
            </button>
          {activeTab === FilterTab.BASIC && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Fabricante</label>
                <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none" value={basicFilters.manufacturer} onChange={e => setBasicFilters({...basicFilters, manufacturer: e.target.value})}>
                  <option value="all">Todos</option>
                  {uniqueManufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-blue-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                  Concepto Clínico
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setIsClinicalConceptModalOpen(true);
                    }} 
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </label>
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
                  <option value="bifocal">Bifocal</option>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8 pt-8 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tecnología</label>
                <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={basicFilters.technology} onChange={e => setBasicFilters({...basicFilters, technology: e.target.value})}>
                  <option value="all">Cualquiera</option>
                  <option value="refractiva">Refractiva</option>
                  <option value="difractiva">Difractiva</option>
                  <option value="hibrida">Híbrida</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Aberración</label>
                <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={basicFilters.aberration} onChange={e => setBasicFilters({...basicFilters, aberration: e.target.value})}>
                  <option value="all">Cualquiera</option>
                  <option value="asferica">Asférica</option>
                  <option value="esferica">Esférica</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Material</label>
                <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={basicFilters.material} onChange={e => setBasicFilters({...basicFilters, material: e.target.value})}>
                  <option value="all">Cualquiera</option>
                  <option value="hidrofobico">Hidrofóbico</option>
                  <option value="hidrofilico">Hidrofílico</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Diseño Háptico</label>
                <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={basicFilters.hapticDesign} onChange={e => setBasicFilters({...basicFilters, hapticDesign: e.target.value})}>
                  <option value="all">Cualquiera</option>
                  <option value="C-Loop">C-Loop</option>
                  <option value="Plate">Plato (Plate)</option>
                  <option value="3-Piece">3 Piezas</option>
                  <option value="Other">Otros / Especiales</option>
                </select>
              </div>
            </div>
          </>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Material</label>
                  <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold" value={advFilters.hydroType} onChange={e => setAdvFilters({...advFilters, hydroType: e.target.value})}>
                    <option value="all">Todos</option>
                    <option value="hydrophilic">Hidrofílico</option>
                    <option value="hydrophobic">Hidrofóbico</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación</label>
                  <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold" value={advFilters.intendedLocation} onChange={e => setAdvFilters({...advFilters, intendedLocation: e.target.value})}>
                    <option value="all">Todas</option>
                    {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
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
                          {Array.isArray(item.options) 
                            ? item.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)
                            : Object.entries(item.options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
                        {item.options!.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      Angulo-Angulo (AtA)
                      <button onClick={() => setIsAtAModalOpen(true)} className="text-teal-600 hover:text-teal-700 transition-colors">
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </label>
                    <input 
                      type="text" 
                      placeholder="mm"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold" 
                      value={drAlfonsoInputs.ata} 
                      onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, ata: e.target.value})} 
                    />
                  </div>
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
                      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center gap-1">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Diagnostic Info</p>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-400">AGE G: {debugInfo.ageG}</span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-400">LA G: {debugInfo.laG}</span>
                        </div>
                      </div>
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
                    <div className="relative group">
                      <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold min-h-[48px] flex flex-wrap gap-1 items-center">
                        {drAlfonsoInputs.hapticDesign.length === 0 ? (
                          <span className="text-slate-400">Cualquiera</span>
                        ) : (
                          drAlfonsoInputs.hapticDesign.map(h => (
                            <span key={h} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                              {h}
                              <button onClick={() => setDrAlfonsoInputs(prev => ({ ...prev, hapticDesign: prev.hapticDesign.filter(x => x !== h) }))} className="hover:text-blue-900">×</button>
                            </span>
                          ))
                        )}
                      </div>
                      <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 space-y-1">
                        {['C-Loop', 'Plate', '3-Piece', 'Lamina Modificada', 'Other'].map(option => (
                          <label key={option} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              checked={drAlfonsoInputs.hapticDesign.includes(option)}
                              onChange={e => {
                                const checked = e.target.checked;
                                setDrAlfonsoInputs(prev => ({
                                  ...prev,
                                  hapticDesign: checked 
                                    ? [...prev.hapticDesign, option]
                                    : prev.hapticDesign.filter(h => h !== option)
                                }));
                              }}
                            />
                            <span className="text-xs font-bold text-slate-700">{option === 'Plate' ? 'Plato (Plate)' : option}</span>
                          </label>
                        ))}
                        {drAlfonsoInputs.hapticDesign.length > 0 && (
                          <button 
                            onClick={() => setDrAlfonsoInputs(prev => ({ ...prev, hapticDesign: [] }))}
                            className="w-full text-center py-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 rounded-lg transition-colors mt-1"
                          >
                            Limpiar Selección
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Material</label>
                    <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={drAlfonsoInputs.lensMaterial} onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, lensMaterial: e.target.value as any})}>
                      <option value="any">Cualquiera</option>
                      <option value="hidrofobico">Hidrofóbico</option>
                      <option value="hidrofilico">Hidrofílico</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Dioptrías IOL</label>
                    <input 
                      type="text"
                      placeholder="Ej: 21.5"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={drAlfonsoInputs.iolDiopters}
                      onChange={e => setDrAlfonsoInputs({...drAlfonsoInputs, iolDiopters: e.target.value})}
                    />
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
          {filteredLenses.length === 0 ? (
            <div className="col-span-full text-center p-10 text-slate-400">
              <p>No se encontraron lentes con los filtros actuales.</p>
            </div>
          ) : (
            filteredLenses.map(lens => (
              <LensCard 
                key={lens.id} 
                lens={lens} 
                isSelected={selectedLensIds.has(lens.id)} 
                onToggleSelect={toggleLensSelection} 
                availableImages={availableImages}
              />
            ))
          )}
        </div>
      </main>

      {selectedLensIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-[90%] md:max-w-2xl p-4 md:rounded-3xl bg-slate-900/95 backdrop-blur-xl text-white shadow-[0_-10px_40px_rgba(0,0,0,0.3)] md:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col md:flex-row justify-between items-center z-50 animate-in slide-in-from-bottom-5 border-t md:border border-white/10 gap-4 md:gap-0">
          <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-900/40">{selectedLensIds.size}</div>
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Comparativa Activa</p>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{selectedLensIds.size === 5 ? 'Límite alcanzado' : 'Selecciona hasta 5'}</p>
              </div>
            </div>
            <button onClick={() => setSelectedLensIds(new Set())} className="md:hidden text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Limpiar</button>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => setSelectedLensIds(new Set())} className="hidden md:block text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest mr-2">Limpiar</button>
            <button onClick={() => setShowGraphsModal(true)} className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white px-4 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-slate-900/40 uppercase tracking-tight flex items-center justify-center gap-2">
              <LineChart className="w-4 h-4" /> <span className="inline">Gráficas</span>
            </button>
            <button onClick={() => setShowComparison(true)} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-900/40 uppercase tracking-tight">
              Comparar
            </button>
          </div>
        </div>
      )}

      {showComparison && <ComparisonView lenses={lenses.filter(l => selectedLensIds.has(l.id))} onClose={() => setShowComparison(false)} onRemove={id => {const n = new Set(selectedLensIds); n.delete(id); setSelectedLensIds(n);}} onFindSimilar={findEquivalent} manufacturers={uniqueManufacturers} />}
      {showGraphsModal && <GraphsModal lenses={lenses.filter(l => selectedLensIds.has(l.id))} availableGraphs={availableGraphs} onClose={() => setShowGraphsModal(false)} />}
      {isRulesManagerOpen && <RulesManager rules={ALL_RULES} onClose={() => setIsRulesManagerOpen(false)} onOpenCreator={() => { setIsRulesManagerOpen(false); setIsRuleCreatorOpen(true); }} />}
      
      {isAtAModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsAtAModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsAtAModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <div className="p-8">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-600" /> Información Angulo-Angulo (AtA)
              </h3>
              <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
                {ataAssetIndex < ataAssets.length ? (
                  ataAssets[ataAssetIndex].toLowerCase().endsWith('.pdf') ? (
                    <iframe 
                      src={ataAssets[ataAssetIndex]} 
                      className="w-full h-full border-none"
                      title="AtA Info PDF"
                    />
                  ) : (
                    <img 
                      src={ataAssets[ataAssetIndex]} 
                      alt="Información AtA" 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={() => setAtaAssetIndex(prev => prev + 1)}
                    />
                  )
                ) : (
                  <div className="text-center p-6">
                    <p className="text-slate-400 text-xs font-bold mb-4">No se encontró el archivo ata_info en /public</p>
                    <img 
                      src="https://picsum.photos/seed/medical/800/450?blur=2" 
                      alt="Información AtA Fallback" 
                      className="max-w-full max-h-full object-contain opacity-50"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
              <div className="mt-6 space-y-4">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  El valor Angulo-Angulo (AtA) es fundamental para determinar el diseño háptico más adecuado para la estabilidad de la lente intraocular.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">≤ 12mm</p>
                    <p className="text-xs font-bold text-teal-700">C-Loop</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">≥ 12mm</p>
                    <p className="text-xs font-bold text-blue-700">Plate</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">11.5 - 12.5mm</p>
                    <p className="text-xs font-bold text-amber-700">Lamina Mod.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isClinicalConceptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsClinicalConceptModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsClinicalConceptModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <div className="p-8">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-600" /> Información Concepto Clínico
              </h3>
              <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
                <img 
                  src="Concepto Clinico.PNG" 
                  alt="Información Concepto Clínico" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://picsum.photos/seed/clinico/1200/800?blur=2";
                  }}
                />
              </div>
              <div className="mt-6">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Referencia visual de los conceptos clínicos utilizados para la clasificación de las lentes intraoculares.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel Lateral Derecho */}
      <AnimatePresence>
        {isSidePanelOpen && (
          <>
            {/* Backdrop con desenfoque */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidePanelOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-black/90 backdrop-blur-xl z-[70] shadow-2xl border-l border-white/10 flex flex-col"
            >
              <div className="p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Settings2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Opciones Avanzadas</h2>
                  </div>
                  <button 
                    onClick={() => setIsSidePanelOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                  {!isAdminAuthenticated ? (
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-black text-white/80 uppercase">Acceso Restringido</h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <input 
                            type="password"
                            value={adminPasswordInput}
                            onChange={(e) => setAdminPasswordInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAdminLogin();
                            }}
                            placeholder="Introduce password..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-4 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                          </div>
                        </div>
                        <button 
                          onClick={handleAdminLogin}
                          className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl text-white font-black uppercase text-xs tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 group"
                        >
                          Autenticar
                          <ArrowRightCircle className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                           <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                             {adminMode === 'H' ? 'Haptic Mapping' : 
                              adminMode === 'M' ? 'Modificaciones' : 
                              adminMode === 'E' ? 'Lentes Excluidas' : 
                              adminMode === 'I' ? 'Lens Images' : 
                              'Lens Graphs'}
                           </h3>
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500"></div>
                             <span className="text-[11px] font-medium text-white/60">Sesión Activa</span>
                           </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleAdminSave}
                            className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-tight transition-all shadow-lg ${
                              saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            {saveStatus === 'success' ? (
                              <><CheckCircle2 className="w-4 h-4" /> Guardado</>
                            ) : (
                              <><Save className="w-4 h-4" /> Guardar</>
                            )}
                          </button>
                          <button 
                            onClick={handleAdminDownload}
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all shadow-sm"
                            title="Descargar JSON"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="relative group">
                        <textarea 
                          value={adminEditorText}
                          onChange={(e) => setAdminEditorText(e.target.value)}
                          spellCheck={false}
                          className="w-full h-[450px] bg-black/60 border border-white/10 rounded-2xl p-6 text-[11px] font-mono text-blue-300 outline-none focus:ring-1 focus:ring-blue-500/50 custom-scrollbar resize-none leading-relaxed"
                        />
                        <div className="absolute top-4 right-4 pointer-events-none opacity-40">
                           <FileJson className="w-5 h-5 text-blue-500" />
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 backdrop-blur-sm">
                        <div className="flex gap-4">
                          <Info className="w-5 h-5 text-amber-500/80 flex-shrink-0" />
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-black text-amber-500/80 uppercase tracking-wider">Aviso de Seguridad</p>
                            <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                              Los cambios realizados aquí son <b>temporales</b> y se almacenan únicamente en este navegador. Para una actualización permanente, descargue el archivo JSON y envíelo al administrador del servidor.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setIsAdminAuthenticated(false);
                          setAdminMode(null);
                          setAdminPasswordInput('');
                          setAdminEditorText('');
                        }}
                        className="w-full p-4 rounded-2xl border border-white/5 text-white/30 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión Pro
                      </button>
                    </div>
                  )}

                  {/* Espacio para futuras opciones */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <Sparkles className="w-8 h-8 text-blue-500/50 mx-auto mb-4" />
                    <p className="text-sm text-white/40 font-medium">Próximamente más opciones de configuración para IOL Explorer Pro.</p>
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-white/5">
                  <div className="flex items-center gap-3 text-white/30 mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Versión 2.0 Enterprise</span>
                  </div>
                  <p className="text-[10px] text-white/20 italic">Desarrollado para alta precisión oftalmológica.</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar del Asistente IA (Izquierda) */}
      <AnimatePresence>
        {isAiSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[380px] bg-slate-50 border-r border-slate-200 shadow-2xl z-[70] flex flex-col"
            >
              {/* Cabecera del IA */}
              <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm">Asistente IA</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">En línea - Contextual</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAiSidebarOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Chat Area */}
              <div 
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
              >
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4 px-8">
                    <Sparkles className="w-12 h-12 text-blue-500" />
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                      Hola, soy tu asistente experto en IOLs. Puedo ayudarte con dudas sobre materiales, constantes A o recomendarte la mejor lente según tus filtros actuales.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[90%] rounded-2xl p-4 text-sm font-medium leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                      }`}>
                        {msg.role === 'model' ? (
                          <div className="markdown-body">
                            <Markdown>{msg.text}</Markdown>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
                  <input 
                    type="text" 
                    placeholder="Pregúntame algo sobre las lentes..." 
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAiChat()}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 font-bold placeholder:text-slate-400"
                  />
                  <button 
                    onClick={handleAiChat}
                    disabled={!aiInput.trim() || isAiLoading}
                    className="p-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-30 disabled:hover:bg-blue-600 active:scale-90"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Sugerencias Rápidas */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar-thin">
                  <button 
                    onClick={() => setChatMessages([])}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 whitespace-nowrap transition-colors"
                  >
                    <Eraser className="w-3 h-3" /> Limpiar Chat
                  </button>
                  <button 
                    onClick={() => {
                      setAiInput("¿Cuáles son las constantes A de las lentes filtradas?");
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-colors"
                  >
                    Consultar Constantes
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
