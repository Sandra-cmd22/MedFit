/**
 * Script para criar avaliações iniciais retroativas para clientes antigos
 * 
 * REGRAS DE MIGRAÇÃO:
 * - Clientes com 0 avaliações → Cria avaliação inicial do cadastro
 * - Clientes com 1 avaliação → Cria avaliação inicial retroativa (cadastro)
 * - Clientes com 2+ avaliações → Não faz nada (histórico completo)
 * 
 * GARANTIAS:
 * - Não altera nem sobrescreve avaliações existentes
 * - Cria no máximo 1 avaliação nova por cliente
 * - Usa dataCadastro como evaluationDate
 * - Pula clientes sem medidas válidas
 * - Idempotente e seguro para executar
 * 
 * IMPORTANTE: Execute este script apenas UMA VEZ para migrar dados antigos
 */

import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "../firebase.js";

/**
 * Cria avaliações iniciais retroativas para clientes antigos
 * 
 * Para clientes com 0 ou 1 avaliação, cria uma avaliação inicial usando
 * os dados do cadastro (medidas, idade, peso) com dataCadastro como data.
 * 
 * @returns {Promise<{sucesso: number, erros: number, total: number, detalhes: Array}>}
 */
export async function migrarAvaliacoesIniciais() {
  console.log("=".repeat(60));
  console.log("🔄 INICIANDO MIGRAÇÃO DE AVALIAÇÕES INICIAIS");
  console.log("=".repeat(60));

  let sucesso = 0;
  let erros = 0;
  const detalhes = [];

  try {
    // 1. Buscar todos os clientes
    const clientesRef = collection(db, "clientes");
    const clientesSnapshot = await getDocs(clientesRef);
    
    console.log(`📋 Total de clientes encontrados: ${clientesSnapshot.docs.length}`);

    // 2. Para cada cliente, verificar se tem avaliações
    for (const clienteDoc of clientesSnapshot.docs) {
      const clienteData = clienteDoc.data();
      const clienteId = clienteDoc.id;
      const clienteNome = clienteData.nome;

      try {
        // Verificar se o cliente já tem avaliações
        const avaliacoesRef = collection(db, "avaliacoes");
        
        // Buscar por clienteId
        const qAvaliacoesPorId = query(
          avaliacoesRef,
          where("clienteId", "==", clienteId)
        );
        const avaliacoesSnapshotPorId = await getDocs(qAvaliacoesPorId);
        
        // Buscar por clienteNome (fallback)
        let avaliacoesSnapshot = avaliacoesSnapshotPorId;
        if (avaliacoesSnapshotPorId.empty) {
          try {
            const qAvaliacoesPorNome = query(
              avaliacoesRef,
              where("clienteNome", "==", clienteNome)
            );
            avaliacoesSnapshot = await getDocs(qAvaliacoesPorNome);
          } catch (error) {
            console.warn(`⚠️ Erro ao buscar por nome para "${clienteNome}":`, error);
          }
        }
        
        const quantidadeAvaliacoes = avaliacoesSnapshot.docs.length;

        // REGRA: Criar avaliação inicial apenas se:
        // - Tem 0 avaliações (cliente novo sem avaliação)
        // - Tem EXATAMENTE 1 avaliação (precisa criar a inicial do cadastro)
        // - Se tem 2 ou mais, não fazer nada (já tem histórico completo)
        
        if (quantidadeAvaliacoes >= 2) {
          console.log(`⏭️  Cliente "${clienteNome}" já tem ${quantidadeAvaliacoes} avaliações (histórico completo). Pulando...`);
          detalhes.push({
            cliente: clienteNome,
            status: "histórico_completo",
            quantidade: quantidadeAvaliacoes
          });
          continue;
        }
        
        // Verificar se tem medidas válidas antes de continuar
        if (!clienteData.medidas || Object.keys(clienteData.medidas).length === 0) {
          console.log(`⚠️  Cliente "${clienteNome}" não tem medidas. Pulando...`);
          detalhes.push({
            cliente: clienteNome,
            status: "sem_medidas",
            quantidade: quantidadeAvaliacoes
          });
          continue;
        }

        // Criar avaliação inicial usando dados do cadastro
        // IMPORTANTE: Usar dataCadastro para garantir que seja retroativa
        const dataCadastro = clienteData.dataCadastro 
          ? new Date(clienteData.dataCadastro)
          : new Date();

        // Garantir que a data seja anterior à avaliação existente (se houver)
        let dataAvaliacao = dataCadastro;
        if (quantidadeAvaliacoes === 1) {
          // Se tem 1 avaliação, garantir que a inicial seja anterior
          const avaliacaoExistente = avaliacoesSnapshot.docs[0].data();
          const dataExistente = avaliacaoExistente.evaluationDate 
            ? new Date(avaliacaoExistente.evaluationDate)
            : null;
          
          if (dataExistente && dataCadastro >= dataExistente) {
            // Se dataCadastro é igual ou posterior, usar 1 dia antes da avaliação existente
            dataAvaliacao = new Date(dataExistente);
            dataAvaliacao.setDate(dataAvaliacao.getDate() - 1);
            console.log(`📅 Ajustando data da avaliação inicial para ser anterior à avaliação existente`);
          }
        }

        const avaliacaoInicial = {
          clienteId: clienteId,
          clienteNome: clienteNome,
          startDate: dataAvaliacao.toISOString(),
          endDate: dataAvaliacao.toISOString(),
          medidas: { ...clienteData.medidas }, // Copiar medidas para não alterar o original
          evaluationDate: dataAvaliacao.toISOString(),
          idade: clienteData.idade || null,
          peso: clienteData.peso || null,
        };

        // IMPORTANTE: addDoc cria um novo documento, nunca sobrescreve
        await addDoc(avaliacoesRef, avaliacaoInicial);
        
        if (quantidadeAvaliacoes === 0) {
          console.log(`✅ Avaliação inicial criada para "${clienteNome}" (0 → 1 avaliação)`);
        } else if (quantidadeAvaliacoes === 1) {
          console.log(`✅ Avaliação inicial retroativa criada para "${clienteNome}" (1 → 2 avaliações)`);
        }
        
        sucesso++;
        detalhes.push({
          cliente: clienteNome,
          status: quantidadeAvaliacoes === 0 ? "criada_inicial" : "criada_retroativa",
          quantidadeAntes: quantidadeAvaliacoes,
          quantidadeDepois: quantidadeAvaliacoes + 1
        });

      } catch (error) {
        console.error(`❌ Erro ao processar cliente "${clienteNome}":`, error);
        erros++;
        detalhes.push({
          cliente: clienteNome,
          status: "erro",
          erro: error.message
        });
      }
    }

    console.log("=".repeat(60));
    console.log("📊 RESUMO DA MIGRAÇÃO");
    console.log("=".repeat(60));
    console.log(`✅ Sucesso: ${sucesso} avaliações criadas`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📋 Total processado: ${clientesSnapshot.docs.length} clientes`);
    console.log("=".repeat(60));

    return {
      sucesso,
      erros,
      total: clientesSnapshot.docs.length,
      detalhes
    };

  } catch (error) {
    console.error("❌ ERRO GERAL na migração:", error);
    throw error;
  }
}

