/**
 * Calcula o Índice de Massa Corporal (IMC)
 * @param {number} pesoKg - Peso em quilogramas
 * @param {number} alturaM - Altura em metros
 * @returns {number} IMC com duas casas decimais
 */
export function imc(pesoKg, alturaM) {
  if (!pesoKg || !alturaM || alturaM <= 0) return 0;
  return Number((pesoKg / (alturaM * alturaM)).toFixed(2));
}

/**
 * Classifica o IMC em categorias
 * @param {number} imc - Valor do IMC
 * @returns {string} Classificação do IMC
 */
export function classificaIMC(imc) {
  if (imc < 18.5) return "Abaixo";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidade";
}

/**
 * Calcula a Relação Cintura-Quadril (RCQ)
 * @param {number} cinturaCm - Circunferência da cintura em cm
 * @param {number} quadrilCm - Circunferência do quadril em cm
 * @returns {number} RCQ com duas casas decimais
 */
export function rcq(cinturaCm, quadrilCm) {
  if (!cinturaCm || !quadrilCm || quadrilCm <= 0) return 0;
  return Number((cinturaCm / quadrilCm).toFixed(2));
}

/**
 * Classifica o RCQ baseado no sexo
 * @param {string} sexo - Sexo ("F", "M" ou "O")
 * @param {number} rcq - Valor do RCQ
 * @returns {string} Classificação do RCQ
 */
export function classificaRCQ(sexo, rcq) {
  if (!rcq) return "N/A";
  
  if (sexo === "F") {
    if (rcq < 0.80) return "Saudável";
    if (rcq < 0.85) return "Moderado";
    return "Alto";
  }
  
  if (sexo === "M") {
    if (rcq < 0.90) return "Saudável";
    if (rcq < 0.95) return "Moderado";
    return "Alto";
  }
  
  // Para outros sexos, usar critério masculino como padrão
  if (rcq < 0.90) return "Saudável";
  if (rcq < 0.95) return "Moderado";
  return "Alto";
} 