import { DrAlfonsoInputs, Rule, LensStatus } from '../types';

export const AGE_RANGES: { [key: number]: string } = { 1: '35-44', 2: '45-54', 3: '55-64', 4: '65-74', 5: '75-85' };
export const LA_RANGES: { [key: number]: string } = { 1: '14-18.5', 2: '>18.5-22', 3: '>22-24.5', 4: '>24.5-29', 5: '>29-35' };
export const LENS_STATUS_OPTIONS: LensStatus[] = ['transparente', 'presbicia', 'disfuncional', 'catarata'];

/**
 * REGLAS CLÍNICAS BASE
 * Nota: Al ser un sistema estricto, si el usuario selecciona LVC, 
 * solo se dispararán las reglas que tengan ese LVC definido.
 */
export const ALL_RULES: Rule[] = [
  // Reglas Básicas (Sin condiciones especiales)
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: [1], laGroup: [1], lensStatus: ['transparente', 'presbicia'] } },
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: [2], laGroup: [2], lensStatus: ['transparente', 'presbicia', 'disfuncional'] } },
  
  // Reglas con LVC (Sustituyen a las básicas cuando se marca LVC)
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: [2], laGroup: [2], lensStatus: ['transparente', 'presbicia', 'disfuncional'], specialConditions: ['lvc_hiper_mayor_4'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: [2], laGroup: [2], lensStatus: ['transparente', 'presbicia', 'disfuncional'], specialConditions: ['lvc_hiper_menor_4'] } },
  
  // Reglas con Cámara Estrecha
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: [2], laGroup: [2], lensStatus: ['transparente', 'presbicia', 'disfuncional'], specialConditions: ['camara_estrecha'] } },
  
  // Otros casos
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: [3], laGroup: [3], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], specialConditions: ['udva_menor_07'] } },
  { result: "Full Range of Field-Continuous", conditions: { ageGroup: [4], laGroup: [3], lensStatus: ['disfuncional', 'catarata'], specialConditions: ['udva_menor_07'] } },
  { result: "Partial Range of Field-Extend", conditions: { ageGroup: [5], laGroup: [3], lensStatus: ['disfuncional', 'catarata'], specialConditions: ['udva_menor_07'] } },
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: [2], laGroup: [4], lensStatus: ['transparente', 'presbicia'], specialConditions: ['udva_menor_07'] } },
  
  // Miopía Alta / Estafiloma
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: [3], laGroup: [4], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], specialConditions: ['lvc_miopico_8_10'] } },
  { result: "Full Range of Field-Steep", conditions: { ageGroup: [3], laGroup: [4], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], specialConditions: ['lvc_miopico_5_7'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: [3], laGroup: [4], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], specialConditions: ['lvc_miopico_2_4'] } },
  { result: "Full Range of Field-Steep", conditions: { ageGroup: [3], laGroup: [4], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], specialConditions: ['estafiloma'] } }
];

export const specialConditionsOptions: { [key: string]: string } = {
  'lvc_hiper_mayor_4': 'LVC Hipermetrópico >= 4D',
  'lvc_hiper_menor_4': 'LVC Hipermetrópico < 4D',
  'lvc_miopico_2_4': 'LVC Miópico (-2 a -4D)',
  'lvc_miopico_5_7': 'LVC Miópico (-5 a -7D)',
  'lvc_miopico_8_10': 'LVC Miópico (-8 a -10D)',
  'kr': 'KR',
  'udva_menor_07': 'UDVA < 0.7',
  'camara_estrecha': 'Cámara Ant. Estrecha',
  'estafiloma': 'Con Estafiloma'
};

export const getLensRecommendations = (inputs: DrAlfonsoInputs): string[] => {
  const age = inputs.age ? parseInt(inputs.age, 10) : 0;
  const la = inputs.axialLength ? parseFloat(inputs.axialLength.replace(',', '.')) : 0;
  
  // Grupos
  const ageG = age >= 35 && age <= 44 ? 1 : age >= 45 && age <= 54 ? 2 : age >= 55 && age <= 64 ? 3 : age >= 65 && age <= 74 ? 4 : age >= 75 && age <= 85 ? 5 : null;
  const laG = la >= 14 && la <= 18.5 ? 1 : la > 18.5 && la <= 22 ? 2 : la > 22 && la <= 24.5 ? 3 : la > 24.5 && la <= 29 ? 4 : la > 29 && la <= 35 ? 5 : null;

  // Recopilar condiciones especiales activas del usuario
  const activeSpecials: string[] = [];
  if (inputs.lvc !== 'any') activeSpecials.push(inputs.lvc);
  if (inputs.udva !== 'any') activeSpecials.push(inputs.udva);
  if (inputs.contactLenses !== 'any') activeSpecials.push(inputs.contactLenses);
  if (inputs.anteriorChamber !== 'any') activeSpecials.push(inputs.anteriorChamber);
  if (inputs.retina === 'con_estafiloma') activeSpecials.push('estafiloma');

  const matches = ALL_RULES.filter(r => {
    const c = r.conditions;
    
    // 1. Validación de Edad
    if (c.ageGroup && (!ageG || !c.ageGroup.includes(ageG))) return false;
    
    // 2. Validación de Longitud Axial
    if (c.laGroup && (!laG || !c.laGroup.includes(laG))) return false;
    
    // 3. Validación de Estado Cristalino (Estricta si se marca)
    if (inputs.lensStatus !== 'any') {
      if (!c.lensStatus || !c.lensStatus.includes(inputs.lensStatus as LensStatus)) return false;
    } else {
      // Si el usuario no marca nada pero la regla requiere un estado, no cumple
      if (c.lensStatus && c.lensStatus.length > 0) return false;
    }

    // 4. VALIDACIÓN ESTRICTA DE CONDICIONES ESPECIALES
    // El conjunto de condiciones de la regla debe ser EXACTAMENTE el mismo que el del usuario
    const ruleSpecials = c.specialConditions || [];
    
    if (ruleSpecials.length !== activeSpecials.length) return false;
    
    // Verificar que todos los elementos coincidan
    const allMatch = ruleSpecials.every(s => activeSpecials.includes(s));
    if (!allMatch) return false;

    return true;
  });

  return Array.from(new Set(matches.map(m => m.result)));
};