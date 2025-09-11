import fs from "fs";
import path from "path";

const filePath = path.resolve("src/database/clientes.json");

// Função para listar clientes
export function listarClientes() {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("Erro ao ler clientes:", err);
    return [];
  }
}

// Função para salvar cliente
export function salvarCliente(cliente) {
  try {
    const clientes = listarClientes();

    const novoCliente = {
      id: Date.now(),
      ...cliente,
    };

    clientes.push(novoCliente);
    fs.writeFileSync(filePath, JSON.stringify(clientes, null, 2), "utf-8");

    return novoCliente;
  } catch (err) {
    throw new Error("Erro ao salvar cliente");
  }
}
