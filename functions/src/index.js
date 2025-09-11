/**
 * Cloud Functions para MedFit
 * Função disparada quando /clientes/{clienteId}/medidas for atualizada
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { processarMedidas } = require('./utils');

// Inicializar Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function que calcula IMC e RCQ quando medidas são atualizadas
 * Trigger: onWrite em /clientes/{clienteId}/medidas
 */
exports.calcularIMCRCQ = functions.database
  .ref('/clientes/{clienteId}/medidas')
  .onWrite(async (change, context) => {
    console.log('🚀 Função iniciada para cliente:', context.params.clienteId);
    
    try {
      // Verificar se há dados após a mudança
      const snapshot = change.after;
      if (!snapshot.exists()) {
        console.log('❌ Nenhum dado encontrado após a mudança');
        return null;
      }
      
      const medidas = snapshot.val();
      console.log('📏 Medidas recebidas:', medidas);
      
      // Validar se todas as medidas necessárias estão presentes
      const medidasNecessarias = ['peso', 'altura', 'cintura', 'quadril'];
      const medidasFaltando = medidasNecessarias.filter(medida => 
        !medidas[medida] || medidas[medida] <= 0
      );
      
      if (medidasFaltando.length > 0) {
        console.log('⚠️ Medidas faltando ou inválidas:', medidasFaltando);
        return null;
      }
      
      // Buscar dados do cliente para obter o sexo
      const clienteSnapshot = await admin.database()
        .ref(`/clientes/${context.params.clienteId}`)
        .once('value');
      
      const cliente = clienteSnapshot.val();
      const sexo = cliente?.sexo || 'Masculino';
      console.log('👤 Sexo do cliente:', sexo);
      
      // Processar medidas e calcular resultados
      const resultados = processarMedidas(medidas, sexo);
      
      // Salvar resultados no banco de dados
      const resultadosRef = admin.database()
        .ref(`/clientes/${context.params.clienteId}/resultados`);
      
      await resultadosRef.set(resultados);
      console.log('💾 Resultados salvos com sucesso!');
      
      // Log de sucesso
      console.log('✅ Processo concluído para cliente:', context.params.clienteId);
      console.log('📊 IMC:', resultados.imc.valor, '-', resultados.imc.categoria);
      console.log('📊 RCQ:', resultados.rcq.valor, '-', resultados.rcq.categoria);
      
      return resultados;
      
    } catch (error) {
      console.error('❌ Erro na função:', error);
      
      // Salvar erro no banco de dados para debugging
      await admin.database()
        .ref(`/clientes/${context.params.clienteId}/erros`)
        .push({
          erro: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          medidas: medidas || null
        });
      
      throw error;
    }
  });

/**
 * Função HTTP para testar cálculos manualmente
 */
exports.testarCalculos = functions.https.onRequest(async (req, res) => {
  console.log('🧪 Teste manual de cálculos iniciado');
  
  try {
    const { peso, altura, cintura, quadril, sexo = 'Masculino' } = req.body;
    
    if (!peso || !altura || !cintura || !quadril) {
      return res.status(400).json({
        erro: 'Dados incompletos. Forneça: peso, altura, cintura, quadril'
      });
    }
    
    const resultados = processarMedidas({
      peso: parseFloat(peso),
      altura: parseFloat(altura),
      cintura: parseFloat(cintura),
      quadril: parseFloat(quadril)
    }, sexo);
    
    res.json({
      sucesso: true,
      resultados
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({
      erro: error.message
    });
  }
});

/**
 * Função para obter estatísticas do banco de dados
 */
exports.estatisticas = functions.https.onRequest(async (req, res) => {
  console.log('📈 Coletando estatísticas');
  
  try {
    const clientesSnapshot = await admin.database().ref('/clientes').once('value');
    const clientes = clientesSnapshot.val() || {};
    
    const totalClientes = Object.keys(clientes).length;
    const clientesComResultados = Object.values(clientes).filter(
      cliente => cliente.resultados
    ).length;
    
    res.json({
      totalClientes,
      clientesComResultados,
      clientesSemResultados: totalClientes - clientesComResultados
    });
    
  } catch (error) {
    console.error('❌ Erro ao coletar estatísticas:', error);
    res.status(500).json({
      erro: error.message
    });
  }
});
