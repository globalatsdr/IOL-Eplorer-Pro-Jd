import { Lens, SphereRange } from '../types';

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
        sourceType: 'nominal',
        source: {
          srkt: getF("SRKt", node.getElementsByTagName("Constants")[0]),
          ultrasound: getF("Ultrasound", node.getElementsByTagName("Constants")[0])
        },
        optimized: {}
      }
    });
  });
  return lenses;
};