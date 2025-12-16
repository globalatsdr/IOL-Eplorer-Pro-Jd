import { Lens, SphereRange, Availability, Specifications, Constants, ConstantValues } from '../types';

export const parseIOLData = (xmlString: string): Lens[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const lensNodes = xmlDoc.getElementsByTagName("Lens");
  
  const lenses: Lens[] = [];

  Array.from(lensNodes).forEach((lensNode) => {
    try {
      const getVal = (tag: string, parent: Element = lensNode): string => {
        // Handle namespaced tags or case insensitivity issues by checking variations if needed
        // but getElementsByTagName is case sensitive in XML.
        const node = parent.getElementsByTagName(tag)[0];
        return node ? node.textContent?.trim() || "" : "";
      };

      const getFloat = (tag: string, parent: Element = lensNode): number | null => {
        const val = getVal(tag, parent);
        if (!val) return null;
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      };

      // Helper to check multiple tag variations
      const getFloatAny = (tags: string[], parent: Element): number | null => {
        for (const tag of tags) {
            const val = getFloat(tag, parent);
            if (val !== null) return val;
        }
        return null;
      };

      const specNode = lensNode.getElementsByTagName("Specifications")[0];
      const availNode = lensNode.getElementsByTagName("Availability")[0];
      
      // Parse Specifications
      const specifications: Specifications = {
        singlePiece: getVal("SinglePiece", specNode).toLowerCase() === "yes",
        opticMaterial: getVal("OpticMaterial", specNode),
        hapticMaterial: getVal("HapticMaterial", specNode),
        preloaded: getVal("Preloaded", specNode).toLowerCase() === "yes",
        foldable: getVal("Foldable", specNode).toLowerCase() === "yes",
        incisionWidth: getFloat("IncisionWidth", specNode),
        injectorSize: getFloat("InjectorSize", specNode),
        hydro: getVal("Hydro", specNode),
        filter: getVal("Filter", specNode),
        refractiveIndex: getFloat("RefractiveIndex", specNode),
        abbeNumber: getFloat("AbbeNumber", specNode),
        achromatic: getVal("Achromatic", specNode).toLowerCase() === "yes",
        opticDiameter: getFloat("OpticDiameter", specNode),
        hapticDiameter: getFloat("HapticDiameter", specNode),
        opticConcept: getVal("OpticConcept", specNode) || "Unknown",
        hapticDesign: getVal("HapticDesign", specNode),
        intendedLocation: getVal("IntendedLocation", specNode),
        opticDesign: getVal("OpticDesign", specNode),
        aberration: getVal("Aberration", specNode),
        saCorrection: getFloat("saCorrection", specNode),
        toric: getVal("Toric", specNode).toLowerCase() === "yes",
      };

      // Parse Availability
      const sphereRanges: SphereRange[] = [];
      let minSphere = 1000;
      let maxSphere = -1000;
      const additions: number[] = [];

      if (availNode) {
        // Spheres
        const sphereNodes = availNode.getElementsByTagName("Sphere");
        Array.from(sphereNodes).forEach((sNode) => {
          const fromVal = parseFloat(getVal("From", sNode));
          const toVal = parseFloat(getVal("To", sNode));
          const incVal = parseFloat(getVal("Increment", sNode));
          
          if (!isNaN(fromVal) && !isNaN(toVal)) {
            sphereRanges.push({ from: fromVal, to: toVal, increment: incVal });
            if (fromVal < minSphere) minSphere = fromVal;
            if (toVal > maxSphere) maxSphere = toVal;
          }
        });

        // Additions
        const addNodes = availNode.getElementsByTagName("Addition");
        Array.from(addNodes).forEach((aNode) => {
           const val = parseFloat(aNode.textContent || "");
           if(!isNaN(val)) additions.push(val);
        });
      }

      // Handle case where no availability data was found
      if (minSphere === 1000) minSphere = 0;
      if (maxSphere === -1000) maxSphere = 0;

      const totalDiopterRange = (maxSphere - minSphere);

      const availability: Availability = {
        sphereRanges,
        additions,
        minSphere,
        maxSphere,
        totalDiopterRange,
      };

      // Parse Constants (Nominal and Optimized)
      const constants: Constants = {
        nominal: {},
        optimized: {}
      };

      const constNodes = lensNode.getElementsByTagName("Constants");
      Array.from(constNodes).forEach((cNode) => {
         const type = cNode.getAttribute("type")?.toLowerCase();
         // Extended list of possible tags for better compatibility with various XML formats
         const vals: ConstantValues = {
            ultrasound: getFloatAny(["Ultrasound", "A-Constant", "A_Constant", "AConstant"], cNode),
            srkt: getFloatAny(["SRKt", "SRK_T", "A-Constant", "A_Constant", "AConstant"], cNode),
            haigis_a0: getFloatAny(["Haigis_a0", "a0", "A0"], cNode),
            haigis_a1: getFloatAny(["Haigis_a1", "a1", "A1"], cNode),
            haigis_a2: getFloatAny(["Haigis_a2", "a2", "A2"], cNode),
            hoffer_q: getFloatAny(["pACD", "PACD", "Hoffer_Q", "HofferQ", "ACD"], cNode),
            holladay_1: getFloatAny(["sf", "SF", "Holladay_1", "Holladay1", "SurgeonFactor"], cNode),
            barrett: getFloatAny(["Barrett", "BarrettLF", "LF"], cNode)
         };

         if (type === 'nominal') {
            constants.nominal = vals;
         } else if (type === 'optimized') {
            constants.optimized = vals;
         }
      });

      lenses.push({
        id: lensNode.getAttribute("id") || Math.random().toString(),
        manufacturer: getVal("Manufacturer"),
        name: getVal("Name"),
        specifications,
        availability,
        constants
      });

    } catch (e) {
      console.error("Error parsing lens node", e);
    }
  });

  return lenses;
};