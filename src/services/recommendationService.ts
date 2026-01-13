import { DrAlfonsoInputs } from '../types';

/**
 * Genera una recomendación de LIO basada en los parámetros del paciente.
 * @param inputs - Objeto con los datos del paciente del formulario del Dr. Alfonso.
 * @returns Una cadena de texto con la recomendación.
 */
export const getLensRecommendation = (inputs: DrAlfonsoInputs): string => {
  const recommendations: string[] = [];
  
  // Analizar cada parámetro y añadir una línea a la recomendación
  const age = inputs.age ? parseInt(inputs.age, 10) : 0;
  if (age > 55 && inputs.lensStatus === 'catarata') {
    recommendations.push("• Paciente con catarata, candidato estándar para LIO.");
  } else if (age < 45 && inputs.lensStatus === 'transparente') {
    recommendations.push("• Paciente joven con cristalino transparente, considerar opciones como LIO fáquica o LVC en lugar de lensectomía refractiva.");
  } else if (inputs.lensStatus === 'disfuncional') {
    recommendations.push("• Síndrome de cristalino disfuncional, buen candidato para LIOs premium (EDOF, Trifocal).");
  }

  // Refracción
  if (inputs.refraction.includes('miope')) {
    recommendations.push("• Para miopes, considerar lentes con corrección de aberración esférica negativa o neutra para mejorar la calidad visual.");
  } else if (inputs.refraction.includes('hipermetrope')) {
    recommendations.push("• En hipermétropes, asegurar un buen centrado y estabilidad rotacional es crucial. Considerar plataformas de 4 hápticos.");
  }

  // Historial LVC
  if (inputs.lvcType !== 'sin_lvc') {
    recommendations.push("• Ojo post-LVC: ¡Precaución máxima! Utilizar fórmulas de 4ª generación (ej. Barrett True K, Haigis-L) para el cálculo de la LIO.");
    if (inputs.lvcType.includes('miopico')) {
      recommendations.push("  - Tras LVC miópico, las lentes EDOF pueden ser una excelente opción para evitar halos y glare.");
    } else if (inputs.lvcType.includes('hipermetropico')) {
      recommendations.push("  - Tras LVC hipermetrópico, el cálculo es más propenso a errores. Ser conservador con la elección de la potencia.");
    }
  }

  // Longitud Axial
  const axialLength = inputs.axialLength ? parseFloat(inputs.axialLength) : 0;
  if (axialLength > 26) {
    recommendations.push("• Ojo largo (LA > 26mm): Utilizar fórmulas modernas como Barrett Universal II o Hill-RBF para mayor precisión.");
  } else if (axialLength > 0 && axialLength < 22) {
    recommendations.push("• Ojo corto (LA < 22mm): El error en la medida de LA es más impactante. Confirmar con múltiples dispositivos si es posible.");
  }
  
  // Datos Opcionales
  if (inputs.lensMaterial !== 'any') {
    const materialText = inputs.lensMaterial === 'hidrofobico' ? 'Hidrofóbico (menor riesgo de PCO)' : 'Hidrofílico';
    recommendations.push(`• Preferencia de material: ${materialText}.`);
  }

  if (recommendations.length === 0) {
    return "No hay suficientes datos para generar una recomendación específica. Por favor, complete más campos para obtener un análisis.";
  }

  return "Recomendación del Asistente:\n\n" + recommendations.join("\n");
};
