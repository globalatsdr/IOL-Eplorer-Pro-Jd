import { DrAlfonsoInputs } from '../types';

// --- Helper functions to categorize inputs ---

const getAgeGroup = (age: number): number | null => {
  if (age >= 35 && age <= 44) return 1;
  if (age >= 45 && age <= 54) return 2;
  if (age >= 55 && age <= 64) return 3;
  if (age >= 65 && age <= 74) return 4;
  if (age >= 75 && age <= 85) return 5;
  return null;
};

const getAxialLengthGroup = (la: number): number | null => {
  if (la >= 14 && la <= 18.5) return 1;
  if (la > 18.5 && la <= 22) return 2;
  if (la > 22 && la <= 24.5) return 3;
  if (la > 24.5 && la <= 29) return 4;
  if (la > 29 && la <= 35) return 5;
  return null;
};

// We define a narrow chamber as an Angle-to-Angle between 11 and 12mm.
const isNarrowAnteriorChamber = (a2a: number): boolean => {
  return a2a >= 11 && a2a <= 12;
}


/**
 * Genera una recomendación de concepto clínico de LIO basada en un conjunto de reglas.
 * @param inputs - Objeto con los datos del paciente del formulario del Dr. Alfonso.
 * @returns Una cadena de texto con el concepto clínico recomendado o un mensaje de aviso.
 */
export const getLensRecommendation = (inputs: DrAlfonsoInputs): string => {
  // --- 1. Parse all inputs from form strings to numbers ---
  const age = inputs.age ? parseInt(inputs.age, 10) : 0;
  const axialLength = inputs.axialLength ? parseFloat(inputs.axialLength) : 0;
  const angleToAngle = inputs.angleToAngle ? parseFloat(inputs.angleToAngle) : 0;
  // Default to a high value if not set, so UDVA < 0.7 condition is false unless specified
  const udva = inputs.udva ? parseFloat(inputs.udva) : 2.0; 
  const lvcDiopters = inputs.lvcDiopters ? parseFloat(inputs.lvcDiopters) : 0;

  // --- 2. Determine groups and specific conditions ---
  const ageGroup = getAgeGroup(age);
  const laGroup = getAxialLengthGroup(axialLength);
  const hasEstafiloma = inputs.lvcType === 'miopico_estafiloma';
  const isCamaraEstrecha = isNarrowAnteriorChamber(angleToAngle);

  // --- 3. Rule Evaluation (Order is critical for overrides) ---

  // Rule 3: Age G2, LA G2, Status (T/P/D), LVC Hiper >=4D -> Narrow
  if (ageGroup === 2 && laGroup === 2 && ['transparente', 'presbicia', 'disfuncional'].includes(inputs.lensStatus) && inputs.lvcType === 'hipermetropico_mayor_4') {
    return "Partial Range of Field - Narrow";
  }

  // Rule 5: Age G2, LA G2, Status (T/P/D), LVC Hiper <4D -> Smooth
  if (ageGroup === 2 && laGroup === 2 && ['transparente', 'presbicia', 'disfuncional'].includes(inputs.lensStatus) && inputs.lvcType === 'hipermetropico_menor_4') {
    return "Full Range of Field - Smooth";
  }
  
  // Rule 4: Age G2, LA G2, Status (T/P/D), Camara Estrecha -> Enhance
  if (ageGroup === 2 && laGroup === 2 && ['transparente', 'presbicia', 'disfuncional'].includes(inputs.lensStatus) && isCamaraEstrecha) {
    return "Partial Range of Field - Enhance";
  }
  
  // Rule 2: Age G2, LA G2, Status (T/P/D) -> Enhance (more general)
  if (ageGroup === 2 && laGroup === 2 && ['transparente', 'presbicia', 'disfuncional'].includes(inputs.lensStatus)) {
    return "Partial Range of Field - Enhance";
  }

  // Rule 1: Age G1, LA G1, Status (T/P) -> Narrow
  if (ageGroup === 1 && laGroup === 1 && ['transparente', 'presbicia'].includes(inputs.lensStatus)) {
    return "Partial Range of Field - Narrow";
  }
  
  // Rule 6: Age G3, LA G3, Status (T/P/D/C), UDVA < 0.7 -> Smooth
  if (ageGroup === 3 && laGroup === 3 && ['transparente', 'presbicia', 'disfuncional', 'catarata'].includes(inputs.lensStatus) && udva < 0.7) {
    return "Full Range of Field - Smooth";
  }
  
  // Rule 7: Age G4, LA G3, Status (D/C), UDVA < 0.7 -> Continuous
  if (ageGroup === 4 && laGroup === 3 && ['disfuncional', 'catarata'].includes(inputs.lensStatus) && udva < 0.7) {
    return "Full Range of Field - Continuous";
  }
  
  // Rule 8: Age G5, LA G3, Status (D/C), UDVA < 0.7 -> Extend
  if (ageGroup === 5 && laGroup === 3 && ['disfuncional', 'catarata'].includes(inputs.lensStatus) && udva < 0.7) {
    return "Partial Range of Field - Extend";
  }

  // Rule 9: Age G2, LA G4, Status (T/P), UDVA < 0.7 -> Enhance
  if (ageGroup === 2 && laGroup === 4 && ['transparente', 'presbicia'].includes(inputs.lensStatus) && udva < 0.7) {
    return "Partial Range of Field - Enhance";
  }

  // LVC Miopico rules (Rules 12, 13, 14)
  const commonConditionsForLVCRules = ageGroup === 3 && laGroup === 4 && ['transparente', 'presbicia', 'disfuncional', 'catarata'].includes(inputs.lensStatus) && inputs.lvcType === 'miopico';

  if (commonConditionsForLVCRules) {
    if (lvcDiopters >= -10 && lvcDiopters <= -8) {
      return "Partial Range of Field - Narrow"; // Rule 14
    }
    if (lvcDiopters >= -7 && lvcDiopters <= -5) {
      return "Full Range of Field - Steep"; // Rule 13
    }
    if (lvcDiopters >= -4 && lvcDiopters <= -2) {
      return "Full Range of Field - Smooth"; // Rule 12
    }
  }

  // Rule 11: Age G3, LA G4, Status (T/P/D/C), Estafiloma -> Steep
  if (ageGroup === 3 && laGroup === 4 && ['transparente', 'presbicia', 'disfuncional', 'catarata'].includes(inputs.lensStatus) && hasEstafiloma) {
    return "Full Range of Field - Steep";
  }
  
  // Rule 10: Age G3, LA G4, Status (T/P/D/C), NO Estafiloma -> Smooth (more general)
  if (ageGroup === 3 && laGroup === 4 && ['transparente', 'presbicia', 'disfuncional', 'catarata'].includes(inputs.lensStatus) && !hasEstafiloma) {
    return "Full Range of Field - Smooth";
  }

  // --- 4. If no rule matches ---
  return "No hay resultado para los parámetros introducidos. Por favor, revise los datos o consulte a un especialista.";
};