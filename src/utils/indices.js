export function computeBMI(peso, altura) {
  if (
    !peso ||
    !altura ||
    Number.isNaN(peso) ||
    Number.isNaN(altura) ||
    altura <= 0
  )
    return null;
  const h = altura > 3 ? altura / 100 : altura;
  const bmi = peso / (h * h);
  return Math.round(bmi * 10) / 10; // Arredonda para 1 casa decimal
}

export function computeRCQ(cintura, quadril) {
  if (
    !cintura ||
    !quadril ||
    Number.isNaN(cintura) ||
    Number.isNaN(quadril) ||
    quadril <= 0
  )
    return null;
  const rcq = cintura / quadril;
  return Math.round(rcq * 100) / 100; // Arredonda para 2 casas decimais
}

// Altura pode estar salva em metros (1.66) ou em centímetros (166), como em computeBMI
export function formatAltura(altura) {
  const valor = parseFloat((altura ?? "").toString().replace(",", "."));
  if (Number.isNaN(valor) || valor <= 0) return "-";
  return valor > 3 ? `${valor} cm` : `${valor} m`;
}

export function getBMICategory(bmi) {
  if (bmi === null) return null;
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso normal";
  if (bmi < 30) return "Sobrepeso";
  if (bmi < 35) return "Obesidade grau I";
  if (bmi < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

export function getRCQCategory(rcq, sexo) {
  if (rcq === null) return null;
  if (sexo === "Masculino") {
    if (rcq < 0.85) return "Baixo risco";
    if (rcq < 0.95) return "Risco moderado";
    return "Alto risco";
  } else {
    if (rcq < 0.8) return "Baixo risco";
    if (rcq < 0.85) return "Risco moderado";
    return "Alto risco";
  }
}

export const MEDIDAS_CAMPOS = [
  { key: "torax", label: "Tórax" },
  { key: "abdomen", label: "Abdômen" },
  { key: "cintura", label: "Cintura" },
  { key: "quadril", label: "Quadril" },
  { key: "bracoDireito", label: "Braço direito" },
  { key: "bracoEsquerdo", label: "Braço esquerdo" },
  { key: "bracoForcaDireito", label: "Braço força direito" },
  { key: "bracoForcaEsquerdo", label: "Braço força esquerdo" },
  { key: "antebracoDireito", label: "Antebraço direito" },
  { key: "antebracoEsquerdo", label: "Antebraço esquerdo" },
  { key: "coxaProximalDireita", label: "Coxa proximal direita" },
  { key: "coxaProximalEsquerda", label: "Coxa proximal esquerda" },
  { key: "coxaDistalDireita", label: "Coxa distal direita" },
  { key: "coxaDistalEsquerda", label: "Coxa distal esquerda" },
  { key: "panturrilhaDireita", label: "Panturrilha direita" },
  { key: "panturrilhaEsquerda", label: "Panturrilha esquerda" },
];
