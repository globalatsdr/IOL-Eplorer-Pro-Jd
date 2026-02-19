import React, { useState, useMemo } from 'react';
import { Lens } from '../types';
import { X, ArrowDownAZ, ArrowUpAZ, Sparkles, ZoomIn, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- COMPONENTE AUXILIAR PARA IMÁGENES ROBUSTAS ---
const GraphImage = ({ id, name, onPreview }: { id: string, name: string, onPreview: (url: string) => void }) => {
  const extensions = ['jpeg', 'jpg', 'JPG', 'png', 'PNG'];
  const [currentExtIndex, setCurrentExtIndex] = useState(0);
  const [isError, setIsError] = useState(false);

  const handleError = () => {
    if (currentExtIndex < extensions.length - 1) {
      setCurrentExtIndex(prev => prev + 1);
    } else {
      setIsError(true);
    }
  };

  if (isError) {
    return (
      <span className="text-[10px] text-slate-400 italic font-bold text-center block w-full">
        Gráfica no disponible
      </span>
    );
  }

  const currentSrc = `./graphs/${id}.${extensions[currentExtIndex]}`;

  return (
    <div 
      className="relative group cursor-zoom-in w-full h-full flex items-center justify-center"
      onClick={() => onPreview(currentSrc)}
    >
      <img
        src={currentSrc}
        alt={`Gráfica ${name}`}
        className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
        onError={handleError}
      />
      <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/5 transition-colors flex items-center justify-center rounded-lg">
         <ZoomIn className="w-6 h-6 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm" />
      </div>
    </div>
  );
};
// --------------------------------------------------

interface Props {
  lenses: Lens[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onFindSimilar: (lens: Lens) => void;
}

const ComparisonView: React.FC<Props> = ({ lenses, onClose, onRemove, onFindSimilar }) => {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const features = useMemo(() => [
    { 
      label: 'Lens ID', 
      getValue: (l: Lens) => l.id, 
      getSortValue: (l: Lens) => parseInt(l.id, 10) || 0
    },
    { 
      label: 'Manufacturer', 
      getValue: (l: Lens) => l.manufacturer, 
      getSortValue: (l: Lens) => l.manufacturer 
    },
    { 
      label: 'Model Name', 
      getValue: (l: Lens) => l.name, 
      getSortValue: (l: Lens) => l.name 
    },
    {
      label: 'Gráfica MTF',
      getValue: (l: Lens) => (
        <div className="h-40 w-full flex items-center justify-center bg-white rounded-xl border border-slate-100 p-2 shadow-sm overflow-hidden">
          <GraphImage id={l.id} name={l.name} onPreview={setPreviewImage} />
        </div>
      ),
      getSortValue: () => 0 
    },
    {
      label: 'Notas',
      getValue: (l: Lens) => l.note ? <span className="text-yellow-700 font-bold bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100 text-xs">{l.note}</span> : '-',
      getSortValue: (l: Lens) => l.note || ''
    },
    { 
      label: 'Tecnología', 
      getValue: (l: Lens) => l.specifications.technology || '-', 
      getSortValue: (l: Lens) => l.specifications.technology || '' 
    },
    { 
      label: 'Optic Material', 
      getValue: (l: Lens) => l.specifications.opticMaterial, 
      getSortValue: (l: Lens) => l.specifications.opticMaterial 
    },
    { 
      label: 'Haptic Material', 
      getValue: (l: Lens) => l.specifications.hapticMaterial || '-', 
      getSortValue: (l: Lens) => l.specifications.hapticMaterial || '' 
    },
    { 
      label: 'Type', 
      getValue: (l: Lens) => l.specifications.opticConcept, 
      getSortValue: (l: Lens) => l.specifications.opticConcept 
    },
    { 
      label: 'Toric', 
      getValue: (l: Lens) => l.specifications.toric ? 'Yes' : 'No', 
      getSortValue: (l: Lens) => l.specifications.toric ? 1 : 0 
    },
    { 
      label: 'Optic Design', 
      getValue: (l: Lens) => l.specifications.opticDesign, 
      getSortValue: (l: Lens) => l.specifications.opticDesign 
    },
    { 
      label: 'Refractive Index', 
      getValue: (l: Lens) => l.specifications.refractiveIndex || '-', 
      getSortValue: (l: Lens) => l.specifications.refractiveIndex || -1 
    },
    { 
      label: 'Abbe Number', 
      getValue: (l: Lens) => l.specifications.abbeNumber || '-', 
      getSortValue: (l: Lens) => l.specifications.abbeNumber || -1 
    },
    { 
      label: 'Achromatic', 
      getValue: (l: Lens) => l.specifications.achromatic ? 'Yes' : 'No', 
      getSortValue: (l: Lens) => l.specifications.achromatic ? 1 : 0 
    },
    { 
      label: 'Filter', 
      getValue: (l: Lens) => l.specifications.filter, 
      getSortValue: (l: Lens) => l.specifications.filter 
    },
    { 
      label: 'Source A-Constant (Ultra)', 
      getValue: (l: Lens) => l.constants.source.ultrasound || '-', 
      getSortValue: (l: Lens) => l.constants.source.ultrasound || -1 
    },
    { 
      label: 'Source A-Constant (SRK/T)', 
      getValue: (l: Lens) => l.constants.source.srkt || '-', 
      getSortValue: (l: Lens) => l.constants.source.srkt || -1 
    },
    { 
      label: 'Optimized SRK/T', 
      getValue: (l: Lens) => l.constants.optimized.srkt || '-', 
      getSortValue: (l: Lens) => l.constants.optimized.srkt || -1 
    },
     { 
      label: 'Optimized Hoffer Q', 
      getValue: (l: Lens) => l.constants.optimized.hoffer_q || '-', 
      getSortValue: (l: Lens) => l.constants.optimized.hoffer_q || -1 
    },
    { 
      label: 'SA Correction', 
      getValue: (l: Lens) => l.specifications.saCorrection || '-', 
      getSortValue: (l: Lens) => l.specifications.saCorrection || -999 
    },
    { 
      label: 'Incision Width', 
      getValue: (l: Lens) => l.specifications.incisionWidth ? `${l.specifications.incisionWidth}mm` : '-', 
      getSortValue: (l: Lens) => l.specifications.incisionWidth || 999 
    },
    { 
      label: 'Optic Diameter', 
      getValue: (l: Lens) => l.specifications.opticDiameter ? `${l.specifications.opticDiameter}mm` : '-', 
      getSortValue: (l: Lens) => l.specifications.opticDiameter || 0 
    },
    { 
      label: 'Haptic Diameter', 
      getValue: (l: Lens) => l.specifications.hapticDiameter ? `${l.specifications.hapticDiameter}mm` : '-', 
      getSortValue: (l: Lens) => l.specifications.hapticDiameter || 0 
    },
    { 
      label: 'Haptic Design', 
      getValue: (l: Lens) => l.specifications.hapticDesign, 
      getSortValue: (l: Lens) => l.specifications.hapticDesign 
    },
    { 
      label: 'Preloaded', 
      getValue: (l: Lens) => l.specifications.preloaded ? 'Yes' : 'No', 
      getSortValue: (l: Lens) => l.specifications.preloaded ? 1 : 0 
    },
    { 
      label: 'Diopter Range', 
      getValue: (l: Lens) => `${l.availability.totalDiopterRange}D`, 
      getSortValue: (l: Lens) => l.availability.totalDiopterRange 
    },
    { 
      label: 'Additions', 
      getValue: (l: Lens) => l.availability.additions.length > 0 ? l.availability.additions.join(', ') : '-', 
      getSortValue: (l: Lens) => l.availability.additions.length 
    },
  ], []);

  const sortedLenses = useMemo(() => {
    if (!sortKey) return lenses;
    
    const feature = features.find(f => f.label === sortKey);
    if (!feature) return lenses;

    return [...lenses].sort((a, b) => {
      const valA = feature.getSortValue(a);
      const valB = feature.getSortValue(b);
      
      if (valA === valB) return 0;
      
      if (valA === -1 || valA === -999 || valA === '') return 1;
      if (valB === -1 || valB === -999 || valB === '') return -1;

      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return sortDirection === 'asc' ? -1 : 1;
    });
  }, [lenses, sortKey, sortDirection, features]);

  const toggleDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById('comparison-table-container');
    if (!element) return;

    try {
      // Capturamos el elemento tabla
      const canvas = await html2canvas(element, {
        scale: 2, // Mejor calidad
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Apaisado (Landscape)
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10; // Margen superior

      // Uso correcto de imgX para centrar la imagen
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('iol-comparison.pdf');
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Compare Lenses</h2>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Controles de Ordenamiento */}
              <div className="flex items-center gap-2 text-sm bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-gray-500 pl-2 font-medium">Sort by:</span>
                  <select 
                    className="bg-transparent border-none text-gray-700 font-medium focus:ring-0 cursor-pointer text-sm py-1"
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                  >
                    <option value="">Default Order</option>
                    {features.map(f => (
                      <option key={f.label} value={f.label}>{f.label}</option>
                    ))}
                  </select>
                  <div className="h-4 w-px bg-gray-200 mx-1"></div>
                  <button 
                    onClick={toggleDirection}
                    disabled={!sortKey}
                    className={`p-1.5 rounded-md transition-colors ${!sortKey ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 text-blue-600'}`}
                    title={sortDirection === 'asc' ? "Ascending" : "Descending"}
                  >
                    {sortDirection === 'asc' 
                      ? <ArrowDownAZ className="w-4 h-4" /> 
                      : <ArrowUpAZ className="w-4 h-4" />
                    }
                  </button>
              </div>

              <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>
              
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50"
                title="Exportar tabla a PDF"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs font-bold">{isExporting ? 'Generando...' : 'PDF'}</span>
              </button>
              
              <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>

              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          <div id="comparison-table-container" className="overflow-auto flex-1 p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-white">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-4 bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-600 min-w-[200px] sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Feature
                  </th>
                  {sortedLenses.map(lens => (
                    <th key={lens.id} className="p-4 bg-white border-b-2 border-gray-200 min-w-[250px] relative group transition-colors hover:bg-slate-50">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-blue-900 text-lg">{lens.name}</span>
                        {!isExporting && (
                          <button 
                            onClick={() => onRemove(lens.id)}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove from comparison"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-normal mt-1 mb-3">
                        {lens.manufacturer}
                        {lens.constants.sourceType && (
                          <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-200">
                            {lens.constants.sourceType}
                          </span>
                        )}
                      </div>
                      
                      {!isExporting && (
                        <button 
                          onClick={() => onFindSimilar(lens)}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-md border border-slate-200 transition-colors"
                          title={`Find Zeiss lenses similar to ${lens.name}`}
                        >
                          <Sparkles className="w-3 h-3 text-yellow-500" />
                          Find Zeiss Equivalent
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors group/row">
                    <td className="p-4 border-b border-gray-100 font-medium text-gray-500 bg-gray-50 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover/row:bg-gray-100 transition-colors">
                      {feature.label}
                    </td>
                    {sortedLenses.map(lens => (
                      <td key={lens.id} className={`p-4 border-b border-gray-100 text-gray-900 border-l border-dashed border-gray-200 ${sortKey === feature.label ? 'bg-blue-50/30 font-semibold text-blue-900' : ''}`}>
                        {feature.getValue(lens)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
              <button 
                  onClick={onClose}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              >
                  Close Comparison
              </button>
          </div>
        </div>
      </div>

      {/* LIGHTBOX / POPUP DE IMAGEN */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={previewImage} 
              alt="Full size graph" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl bg-white"
            />
            <button 
              className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ComparisonView;