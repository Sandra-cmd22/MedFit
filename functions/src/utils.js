/**
 * Utilitários para cálculos do MedFit
 */

/**
 * Calcula o IMC (Índice de Massa Corporal)
 * @param {number} peso - Peso em kg
 * @param {number} altura - Altura em metros
 * @returns {number} IMC calculado
 */
function calcularIMC(peso, altura) {
  if (!peso || !altura || peso <= 0 || altura <= 0) {
    throw new Error('Peso e altura devem ser números positivos');
  }
  
  const imc = peso / (altura * altura);
  return Math.round(imc * 100) / 100; // Arredonda para 2 casas decimais
}

/**
 * Calcula o RCQ (Relação Cintura-Quadril)
 * @param {number} cintura - Medida da cintura em cm
 * @param {number} quadril - Medida do quadril em cm
 * @returns {number} RCQ calculado
 */
function calcularRCQ(cintura, quadril) {
  if (!cintura || !quadril || cintura <= 0 || quadril <= 0) {
    throw new Error('Cintura e quadril devem ser números positivos');
  }
  
  const rcq = cintura / quadril;
  return Math.round(rcq * 1000) / 1000; // Arredonda para 3 casas decimais
}

/**
 * Categoriza o IMC
 * @param {number} imc - Valor do IMC
 * @returns {object} Categoria e descrição
 */
function categorizarIMC(imc) {
  if (imc < 18.5) {
    return { categoria: 'Abaixo do peso', risco: 'Baixo' };
  } else if (imc >= 18.5 && imc < 25) {
    return { categoria: 'Peso normal', risco: 'Baixo' };
  } else if (imc >= 25 && imc < 30) {
    return { categoria: 'Sobrepeso', risco: 'Moderado' };
  } else if (imc >= 30 && imc < 35) {
    return { categoria: 'Obesidade grau I', risco: 'Alto' };
  } else if (imc >= 35 && imc < 40) {
    return { categoria: 'Obesidade grau II', risco: 'Muito alto' };
  } else {
    return { categoria: 'Obesidade grau III', risco: 'Extremamente alto' };
  }
}

/**
 * Categoriza o RCQ
 * @param {number} rcq - Valor do RCQ
 * @param {string} sexo - Sexo da pessoa ('Masculino' ou 'Feminino')
 * @returns {object} Categoria e risco
 */
function categorizarRCQ(rcq, sexo = 'Masculino') {
  const isMasculino = sexo.toLowerCase() === 'masculino';
  
  if (isMasculino) {
    if (rcq < 0.9) {
      return { categoria: 'Baixo risco', risco: 'Baixo' };
    } else if (rcq >= 0.9 && rcq < 1.0) {
      return { categoria: 'Risco moderado', risco: 'Moderado' };
    } else {
      return { categoria: 'Alto risco', risco: 'Alto' };
    }
  } else {
    if (rcq < 0.8) {
      return { categoria: 'Baixo risco', risco: 'Baixo' };
    } else if (rcq >= 0.8 && rcq < 0.85) {
      return { categoria: 'Risco moderado', risco: 'Moderado' };
    } else {
      return { categoria: 'Alto risco', risco: 'Alto' };
    }
  }
}

/**
 * Processa os dados das medidas e calcula todos os resultados
 * @param {object} medidas - Objeto com peso, altura, cintura, quadril
 * @param {string} sexo - Sexo da pessoa
 * @returns {object} Resultados completos
 */
function processarMedidas(medidas, sexo = 'Masculino') {
  console.log('📊 Processando medidas:', medidas);
  
  const { peso, altura, cintura, quadril } = medidas;
  
  // Converter altura de cm para metros se necessário
  const alturaEmMetros = altura > 10 ? altura / 100 : altura;
  
  // Calcular IMC
  const imc = calcularIMC(peso, alturaEmMetros);
  const categoriaIMC = categorizarIMC(imc);
  
  // Calcular RCQ
  const rcq = calcularRCQ(cintura, quadril);
  const categoriaRCQ = categorizarRCQ(rcq, sexo);
  
  const resultados = {
    imc: {
      valor: imc,
      categoria: categoriaIMC.categoria,
      risco: categoriaIMC.risco
    },
    rcq: {
      valor: rcq,
      categoria: categoriaRCQ.categoria,
      risco: categoriaRCQ.risco
    },
    dataCalculo: new Date().toISOString(),
    medidas: {
      peso,
      altura: alturaEmMetros,
      cintura,
      quadril
    }
  };
  
  console.log('✅ Resultados calculados:', resultados);
  return resultados;
}

module.exports = {
  calcularIMC,
  calcularRCQ,
  categorizarIMC,
  categorizarRCQ,
  processarMedidas
};
