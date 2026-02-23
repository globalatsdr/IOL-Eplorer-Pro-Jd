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
  // Restauradas
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: ['1'], laGroup: ['1'], lensStatus: ['transparente', 'presbicia'] } },
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['2'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia', 'disfuncional'] } },
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: ['2'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia', 'disfuncional'], lvc: ['lvc_hiper_mayor_4'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['2'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia', 'disfuncional'], lvc: ['lvc_hiper_menor_4'] } },
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['2'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia', 'disfuncional'], anteriorChamber: ['camara_estrecha'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['3'], laGroup: ['3'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], udva: ['udva_menor_07'] } },
  { result: "Full Range of Field-Continuous", conditions: { ageGroup: ['4'], laGroup: ['3'], lensStatus: ['disfuncional', 'catarata'] } },
  { result: "Partial Range of Field-Extend", conditions: { ageGroup: ['5'], laGroup: ['3'], lensStatus: ['disfuncional', 'catarata'] } },
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['2'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia'] } },
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: ['3'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], lvc: ['lvc_miopico_8_10'] } },
  { result: "Full Range of Field-Steep", conditions: { ageGroup: ['3'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], lvc: ['lvc_miopico_5_7'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['3'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], lvc: ['lvc_miopico_2_4'] } },
  { result: "Full Range of Field-Steep", conditions: { ageGroup: ['3'], laGroup: ['4'], lensStatus: ['transparente', 'presbicia', 'disfuncional', 'catarata'], retina: ['con_estafiloma'] } },
  // Añadidas de nuevo
  { result: "Partial Range of Field-Narrow", conditions: { ageGroup: ['1'], laGroup: ['2'], lensStatus: ['transparente', 'presbicia'] } },
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['2'], laGroup: ['1'], lensStatus: ['transparente', 'presbicia', 'disfuncional'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['3'], laGroup: ['2'], lensStatus: ['catarata'], udva: ['udva_menor_07'] } },
  { result: "Full Range of Field-Continuous", conditions: { ageGroup: ['4'], laGroup: ['4'], lensStatus: ['catarata'] } },
  { result: "Partial Range of Field-Extend", conditions: { ageGroup: ['5'], laGroup: ['4'], lensStatus: ['catarata'] } },
  { result: "Partial Range of Field-Enhance", conditions: { ageGroup: ['3'], laGroup: ['1'], lensStatus: ['disfuncional'] } },
  { result: "Full Range of Field-Steep", conditions: { ageGroup: ['4'], laGroup: ['2'], retina: ['vitrectomia'] } },
  { result: "Full Range of Field-Smooth", conditions: { ageGroup: ['5'], laGroup: ['1'], contactLenses: ['no_usa_lc'] } }
];



export const getLensRecommendations = (inputs: DrAlfonsoInputs): string[] => {
  const age = inputs.age ? parseInt(inputs.age, 10) : 0;
  const la = inputs.axialLength ? parseFloat(inputs.axialLength.replace(',', '.')) : 0;

  const ageG = age >= 35 && age <= 44 ? '1' : age >= 45 && age <= 54 ? '2' : age >= 55 && age <= 64 ? '3' : age >= 65 && age <= 74 ? '4' : age >= 75 && age <= 85 ? '5' : null;
  const laG = la >= 14 && la <= 18.5 ? '1' : la > 18.5 && la <= 22 ? '2' : la > 22 && la <= 24.5 ? '3' : la > 24.5 && la <= 29 ? '4' : la > 29 && la <= 35 ? '5' : null;

  const matches = ALL_RULES.filter(rule => {
    const rc = rule.conditions;

    // 1. Comprobación de Grupos (Edad y LA)
    if (rc.ageGroup && !rc.ageGroup.includes(ageG || '')) return false;
    if (rc.laGroup && !rc.laGroup.includes(laG || '')) return false;

    // 2. Comprobación de Estado del Cristalino (siempre tiene valor)
    if (rc.lensStatus && inputs.lensStatus !== 'any' && !rc.lensStatus.includes(inputs.lensStatus)) return false;
    if (rc.lensStatus && inputs.lensStatus === 'any') return false; // Si la regla lo necesita, el usuario debe elegir


    // 3. Comprobación de Condiciones Opcionales
    const checkOptional = (ruleValues: string[] | undefined, userValue: string) => {
      if (!ruleValues && userValue === 'any') return true; // Ni la regla ni el usuario especifican
      if (ruleValues && userValue === 'any') return false; // La regla requiere, pero el usuario no especifica
      if (!ruleValues && userValue !== 'any') return false; // El usuario especifica, pero la regla no
      if (ruleValues && userValue !== 'any') return ruleValues.includes(userValue); // Ambos especifican, deben coincidir
      return true;
    };

    if (!checkOptional(rc.lvc, inputs.lvc)) return false;
    if (!checkOptional(rc.udva, inputs.udva)) return false;
    if (!checkOptional(rc.contactLenses, inputs.contactLenses)) return false;
    if (!checkOptional(rc.anteriorChamber, inputs.anteriorChamber)) return false;
    if (!checkOptional(rc.retina, inputs.retina)) return false;
    
    return true;
  });

  return Array.from(new Set(matches.map(m => m.result)));
};