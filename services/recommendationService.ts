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
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: ['1'], laGroup: ['1'], lensStatus: ['transparente', 'presbicia'] } },
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['2'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia', 'disfuncional'] } },
  
  // Reglas con LVC (Sustituyen a las básicas cuando se marca LVC)
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: ['2'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia', 'disfuncional'], lvc: ['lvc_hiper_mayor_4'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['2'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia', 'disfuncional'], lvc: ['lvc_hiper_menor_4'] } },
  
  // Reglas con Cámara Estrecha
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['2'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia', 'disfuncional'], anteriorChamber: ['camara_estrecha'] } },
  
  // Otros casos
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['3'], laGroup: ['3'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], udva: ['udva_menor_07'] } },
  { result: "Full Range of Field-Continuous", conditions: { ageGroup: ['4'], laGroup: ['3'], lensStatus: ['disfuncional', 'catarata'], udva: ['udva_menor_07'] } },
  { result: "Partial Range of Field-Extend", conditions: { ageGroup: ['5'], laGroup: ['3'], lensStatus: ['disfuncional', 'catarata'], udva: ['udva_menor_07'] } },
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['2'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia'], udva: ['udva_menor_07'] } },
  
  // Miopía Alta / Estafiloma
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: ['3'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], lvc: ['lvc_miopico_8_10'] } },
  { result: "Full Range of Field-Steep", conditions: { ageGroup: ['3'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], lvc: ['lvc_miopico_5_7'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['3'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], lvc: ['lvc_miopico_2_4'] } },
  { result: "Full Range of Field-Steep", conditions: { ageGroup: ['3'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], retina: ['con_estafiloma'] } }
];



export const getLensRecommendations = (inputs: DrAlfonsoInputs): string[] => {
  const age = inputs.age ? parseInt(inputs.age, 10) : 0;
  const la = inputs.axialLength ? parseFloat(inputs.axialLength.replace(',', '.')) : 0;
  
  // Convertir a IDs de grupo (string)
  const ageG = age >= 35 && age <= 44 ? '1' : age >= 45 && age <= 54 ? '2' : age >= 55 && age <= 64 ? '3' : age >= 65 && age <= 74 ? '4' : age >= 75 && age <= 85 ? '5' : null;
  const laG = la >= 14 && la <= 18.5 ? '1' : la > 18.5 && la <= 22 ? '2' : la > 22 && la <= 24.5 ? '3' : la > 24.5 && la <= 29 ? '4' : la > 29 && la <= 35 ? '5' : null;

  const matches = ALL_RULES.filter(r => {
    const c = r.conditions;
    
    // Función para comprobar si una condición de la regla se cumple con la entrada del usuario
    const checkCondition = (ruleCondition: string[] | undefined, userValue: string | null) => {
        // Si la regla no especifica esta condición, siempre es un match
        if (!ruleCondition || ruleCondition.length === 0) return true;
        // Si la regla SÍ la especifica, el usuario DEBE tener un valor que coincida
        if (!userValue) return false;
        return ruleCondition.includes(userValue);
    };

    // Comprobación de todas las condiciones
    if (!checkCondition(c.ageGroup, ageG)) return false;
    if (!checkCondition(c.laGroup, laG)) return false;
    if (inputs.lensStatus !== 'any' && !checkCondition(c.lensStatus, inputs.lensStatus)) return false;
    if (inputs.lvc !== 'any' && !checkCondition(c.lvc, inputs.lvc)) return false;
    if (inputs.udva !== 'any' && !checkCondition(c.udva, inputs.udva)) return false;
    if (inputs.contactLenses !== 'any' && !checkCondition(c.contactLenses, inputs.contactLenses)) return false;
    if (inputs.anteriorChamber !== 'any' && !checkCondition(c.anteriorChamber, inputs.anteriorChamber)) return false;
    if (inputs.retina !== 'any' && !checkCondition(c.retina, inputs.retina)) return false;

    return true;
  });

  return Array.from(new Set(matches.map(m => m.result)));
};