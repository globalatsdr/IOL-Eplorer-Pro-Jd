
import { Lens, SphereRange, ConstantValues } from '../types';

// Función para generar nombres de archivo seguros y robustos
// Ejemplo: "ZEISS" + "AT LISA tri" -> "ZEISS_AT_LISA_tri"
export const getSafeFileName = (manufacturer: string, name: string): string => {
  const clean = (str: string) => {
    if (!str) return '';
    return str
      .trim()
      .replace(/\s+/g, '_') // Reemplazar espacios por guiones bajos
      .replace(/[^a-zA-Z0-9_\-\.]/g, ''); // Eliminar caracteres especiales salvo _ - .
  };
  return `${clean(manufacturer)}_${clean(name)}`;
};

export const parseIOLData = (xmlString: string): Lens[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const lensNodes = xmlDoc.getElementsByTagName("Lens");
  const lenses: Lens[] = [];

  Array.from(lensNodes).forEach((node) => {
    const getV = (tag: string, p: Element = node) => p.getElementsByTagName(tag)[0]?.textContent?.trim() || "";
    const getF = (tag: string, p: Element = node) => {
      const v = parseFloat(getV(tag, p));
      return isNaN(v) ? null : v;
    };

    const parseConstants = (container: Element | null): ConstantValues => {
      if (!container) return {};
      return {
        ultrasound: getF("Ultrasound", container),
        srkt: getF("SRKt", container),
        pacd: getF("pACD", container),
        sf: getF("sf", container),
        haigis_a0: getF("Haigis_a0", container),
        haigis_a1: getF("Haigis_a1", container),
        haigis_a2: getF("Haigis_a2", container),
        hoffer_q: getF("HofferQ", container) || getF("pACD", container), // Fallback common in some XMLs
        holladay_1: getF("Holladay1", container),
        barrett: getF("Barrett", container),
      };
    };

    const sNode = node.getElementsByTagName("Specifications")[0];
    const aNode = node.getElementsByTagName("Availability")[0];
    
    // Parsear rangos de esfera
    const sphereNodes = Array.from(aNode?.getElementsByTagName("Sphere") || []);
    let minS = 100, maxS = -100;
    
    const sphereRanges: SphereRange[] = sphereNodes.map(s => {
      const f = parseFloat(getV("From", s));
      const t = parseFloat(getV("To", s));
      const inc = parseFloat(getV("Increment", s)) || 0.5;
      if (f < minS) minS = f;
      if (t > maxS) maxS = t;
      return { from: f, to: t, increment: inc };
    });

    // Parsear adiciones
    const additionNodes = Array.from(aNode?.getElementsByTagName("Addition") || []);
    const additions = additionNodes.map(add => parseFloat(add.textContent || "0")).filter(n => !isNaN(n));

    // Obtener nodos de constantes
    const constantNodes = Array.from(node.getElementsByTagName("Constants"));
    const nominalNode = constantNodes.find(c => c.getAttribute("type") === "nominal");
    const optimizedNode = constantNodes.find(c => c.getAttribute("type") === "optimized");

    lenses.push({
      id: node.getAttribute("id") || Math.random().toString(),
      manufacturer: getV("Manufacturer"),
      name: getV("Name"),
      specifications: {
        singlePiece: getV("SinglePiece", sNode) === "yes",
        opticMaterial: getV("OpticMaterial", sNode),
        hapticMaterial: getV("HapticMaterial", sNode),
        preloaded: getV("Preloaded", sNode) === "yes",
        foldable: getV("Foldable", sNode) === "yes",
        incisionWidth: getF("IncisionWidth", sNode),
        injectorSize: getF("InjectorSize", sNode),
        hydro: getV("Hydro", sNode),
        filter: getV("Filter", sNode),
        refractiveIndex: getF("RefractiveIndex", sNode),
        abbeNumber: getF("AbbeNumber", sNode),
        achromatic: getV("Achromatic", sNode) === "yes",
        opticDiameter: getF("OpticDiameter", sNode),
        hapticDiameter: getF("HapticDiameter", sNode),
        opticConcept: getV("OpticConcept", sNode) || "monofocal",
        hapticDesign: getV("HapticDesign", sNode),
        intendedLocation: getV("IntendedLocation", sNode),
        opticDesign: getV("OpticDesign", sNode),
        aberration: getV("Aberration", sNode),
        saCorrection: getF("saCorrection", sNode),
        toric: getV("Toric", sNode) === "yes",
        technology: getV("Technology", sNode) || undefined,
      },
      availability: {
        sphereRanges,
        additions,
        minSphere: minS === 100 ? 0 : minS,
        maxSphere: maxS === -100 ? 0 : maxS,
        totalDiopterRange: (maxS !== -100 && minS !== 100) ? (maxS - minS) : 0
      },
      constants: {
        sourceType: (nominalNode?.getAttribute("type") as any) || 'nominal',
        source: parseConstants(nominalNode || constantNodes[0]),
        optimized: parseConstants(optimizedNode || null)
      }
    });
  });
  return lenses;
};
