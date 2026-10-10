import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeBMI,
  computeRCQ,
  formatAltura,
  getBMICategory,
  getRCQCategory,
  MEDIDAS_CAMPOS,
} from "./indices.js";

test("IMC com altura em metros ou em centímetros", () => {
  assert.equal(computeBMI(70, 1.75), 22.9);
  assert.equal(computeBMI(70, 175), 22.9);
  assert.equal(computeBMI(null, 1.75), null);
  assert.equal(computeBMI(70, 0), null);
});

test("categorias de IMC", () => {
  assert.equal(getBMICategory(18.4), "Abaixo do peso");
  assert.equal(getBMICategory(22.9), "Peso normal");
  assert.equal(getBMICategory(27), "Sobrepeso");
  assert.equal(getBMICategory(32), "Obesidade grau I");
  assert.equal(getBMICategory(37), "Obesidade grau II");
  assert.equal(getBMICategory(41), "Obesidade grau III");
  assert.equal(getBMICategory(null), null);
});

test("RCQ e categorias por sexo", () => {
  assert.equal(computeRCQ(80, 100), 0.8);
  assert.equal(computeRCQ(82, 97), 0.85);
  assert.equal(computeRCQ(80, 0), null);

  assert.equal(getRCQCategory(0.84, "Masculino"), "Baixo risco");
  assert.equal(getRCQCategory(0.9, "Masculino"), "Risco moderado");
  assert.equal(getRCQCategory(0.95, "Masculino"), "Alto risco");
  assert.equal(getRCQCategory(0.79, "Feminino"), "Baixo risco");
  assert.equal(getRCQCategory(0.82, "Feminino"), "Risco moderado");
  assert.equal(getRCQCategory(0.85, "Feminino"), "Alto risco");
  assert.equal(getRCQCategory(null, "Feminino"), null);
});

test("formatação da altura e lista de medidas", () => {
  assert.equal(formatAltura(1.66), "1.66 m");
  assert.equal(formatAltura(166), "166 cm");
  assert.equal(formatAltura(""), "-");
  assert.equal(MEDIDAS_CAMPOS.length, 16);
});
