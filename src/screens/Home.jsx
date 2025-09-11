import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Importe useNavigate
import './Home.css';
import BottomNav from '../components/BottomNav.jsx';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// ... (O resto do seu código permanece o mesmo) ...
const quarterlyData = [
    { peso: 82, massa: 28 },
    { peso: 80, massa: 29 },
    { peso: 78, massa: 30 },
    { peso: 77, massa: 31 },
];

function buildChartData(data, medidas) {
    if (!medidas || data.length === 0) {
        // Dados de exemplo se não houver dados reais
        return {
            labels: ['Jan', 'Fev', 'Mar', 'Abr'],
            datasets: [
                {
                    label: 'Desempenho',
                    data: [85, 87, 89, 91],
                    borderColor: '#0C518D',
                    backgroundColor: 'rgba(12, 81, 141, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        };
    }
    
    const labels = [];
    const performanceData = [];
    const bracoBase = medidas.bracoDireito || 30;
    
    for (let i = 0; i < data.length; i += 1) {
        const peso = data[i].peso;
        const altura = medidas.altura || 170;
        const imc = computeBMI(peso, altura);
        const braco = medidas.bracoDireito || bracoBase;
        
        // Fórmula simplificada: melhor IMC + braço maior = melhor desempenho
        const imcScore = imc ? Math.max(0, 22 - Math.abs(imc - 22)) * 2 : 0;
        const bracoScore = (braco / bracoBase) * 20;
        
        const performance = Math.round(imcScore + bracoScore);
        
        labels.push(`Aval ${i + 1}`);
        performanceData.push(performance);
    }
    
    return {
        labels,
        datasets: [
            {
                label: 'Desempenho',
                data: performanceData,
                borderColor: '#0C518D',
                backgroundColor: 'rgba(12, 81, 141, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#0C518D',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }
        ]
    };
}


const STORAGE_KEY = 'medfit_quarterly';

function loadSeries() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : quarterlyData;
    } catch {
        return quarterlyData;
    }
}

function saveSeries(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function computeBMI(peso, altura) {
    if (!peso || !altura || Number.isNaN(peso) || Number.isNaN(altura) || altura <= 0) return null;
    const h = altura > 3 ? altura / 100 : altura;
    const bmi = peso / (h * h);
    return Math.round(bmi * 10) / 10; // Arredonda para 1 casa decimal
}

function computeRCQ(cintura, quadril) {
    if (!cintura || !quadril || Number.isNaN(cintura) || Number.isNaN(quadril) || quadril <= 0) return null;
    const rcq = cintura / quadril;
    return Math.round(rcq * 100) / 100; // Arredonda para 2 casas decimais
}

function getBMICategory(bmi) {
    if (bmi === null) return null;
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    if (bmi < 35) return 'Obesidade grau I';
    if (bmi < 40) return 'Obesidade grau II';
    return 'Obesidade grau III';
}

function getRCQCategory(rcq, sexo) {
    if (rcq === null) return null;
    if (sexo === 'Masculino') {
        if (rcq < 0.85) return 'Baixo risco';
        if (rcq < 0.95) return 'Risco moderado';
        return 'Alto risco';
    } else {
        if (rcq < 0.80) return 'Baixo risco';
        if (rcq < 0.85) return 'Risco moderado';
        return 'Alto risco';
    }
}

function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = (Math.PI / 180) * angleDeg;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

const Home = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [clienteData, setClienteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    
    // Função para buscar dados atualizados do cliente
    const fetchClienteData = async (userName, isUpdate = false) => {
        if (!userName || userName === 'Home') {
            setLoading(false);
            return;
        }
        
        if (isUpdate) {
            setUpdating(true);
        }
        
        try {
            const response = await fetch('/api/clientes');
            const clientes = await response.json();
            const cliente = clientes.find(c => c.nome === userName);
            if (cliente) {
                setClienteData(cliente);
            }
        } catch (error) {
            console.error('Erro ao carregar dados do cliente:', error);
        } finally {
            setLoading(false);
            if (isUpdate) {
                setUpdating(false);
            }
        }
    };
    
    // Buscar dados do cliente
    useEffect(() => {
        const userName = (location?.state?.name) || (typeof window !== 'undefined' ? (localStorage.getItem('medfit_user_name') || 'Home') : 'Home');
        fetchClienteData(userName);
    }, [location?.state?.name, location?.state?.newEntry]);
    
    // Atualizar dados quando a página ganhar foco (volta da avaliação)
    useEffect(() => {
        const handleFocus = () => {
            const userName = (typeof window !== 'undefined' ? (localStorage.getItem('medfit_user_name') || 'Home') : 'Home');
            if (userName && userName !== 'Home') {
                fetchClienteData(userName, true);
            }
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const seriesData = useMemo(() => {
        let data = loadSeries();
        const entry = location?.state?.newEntry;
        if (entry && (typeof entry.peso === 'number' || typeof entry.massa === 'number')) {
            const last = data[data.length - 1] || { peso: entry.peso ?? 0, massa: entry.massa ?? 0 };
            const merged = { peso: entry.peso ?? last.peso, massa: entry.massa ?? last.massa };
            data = [...data, merged];
            saveSeries(data);
        }
        return data;
    }, [location?.state]);

    const chartData = useMemo(() => buildChartData(seriesData, clienteData?.medidas), [seriesData, clienteData?.medidas]);

    const userName = (location?.state?.name) || (typeof window !== 'undefined' ? (localStorage.getItem('medfit_user_name') || 'Home') : 'Home');
    
    // Usar dados do cliente se disponível, senão usar dados da navegação
    const peso = clienteData?.peso || location?.state?.newEntry?.peso;
    const altura = clienteData?.altura || location?.state?.newEntry?.altura;
    const sexo = clienteData?.sexo || location?.state?.newEntry?.sexo;
    const cintura = clienteData?.medidas?.cintura || location?.state?.newEntry?.cintura;
    const quadril = clienteData?.medidas?.quadril || location?.state?.newEntry?.quadril;
    
    const imcAtual = computeBMI(peso, altura);
    const rcqAtual = computeRCQ(cintura, quadril);
    const bmiCategory = getBMICategory(imcAtual);
    const rcqCategory = getRCQCategory(rcqAtual, sexo);
    
    const lastEvalDate = clienteData?.dataCadastro ? new Date(clienteData.dataCadastro).toLocaleDateString() : (location?.state?.date || (typeof window !== 'undefined' ? localStorage.getItem('medfit_last_eval_date') : undefined));


    if (loading) {
        return (
            <div className="home-container">
                <h1 className="home-title">Carregando...</h1>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="home-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h1 className="home-title">{userName}</h1>
                {updating && (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontSize: '12px', 
                        color: '#0C518D' 
                    }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>
                            refresh
                        </span>
                        Atualizando...
                    </div>
                )}
            </div>
            
            {clienteData && (
                <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                    <div>Idade: {clienteData.idade || '-'} anos</div>
                    <div>Altura: {clienteData.altura || '-'} cm</div>
                    <div>Peso: {clienteData.peso || '-'} kg</div>
                    <div>Sexo: {clienteData.sexo || '-'}</div>
                </div>
            )}

            <div className="cards-column">
                <div className="card">
                    <div className="card-header">IMC</div>
                    <div className="card-value" style={{ color: '#0C518D' }}>{imcAtual ?? '-'}</div>
                    {bmiCategory && (
                        <div className="card-category" style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {bmiCategory}
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">RCQ</div>
                    <div className="card-value" style={{ color: '#0C518D' }}>{rcqAtual ?? '-'}</div>
                    {rcqCategory && (
                        <div className="card-category" style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {rcqCategory}
                        </div>
                    )}
                    {cintura && quadril && (
                        <div className="card-relation" style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                            {cintura}cm / {quadril}cm
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">Desempenho</div>
                    <div className="chart-container">
                        <Line 
                            data={chartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false
                                    },
                                    tooltip: {
                                        backgroundColor: '#fff',
                                        titleColor: '#333',
                                        bodyColor: '#666',
                                        borderColor: '#e0e0e0',
                                        borderWidth: 1,
                                        cornerRadius: 8,
                                        displayColors: false,
                                        callbacks: {
                                            label: function(context) {
                                                return `Desempenho: ${context.parsed.y}%`;
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    x: {
                                        grid: {
                                            display: false
                                        },
                                        ticks: {
                                            color: '#666',
                                            font: {
                                                size: 12
                                            }
                                        }
                                    },
                                    y: {
                                        display: false
                                    }
                                },
                                elements: {
                                    point: {
                                        hoverBackgroundColor: '#0C518D'
                                    }
                                }
                            }}
                        />
                    </div>
                    <div className="chart-caption">Última avaliação: {lastEvalDate || '-'}</div>
                </div>
            </div>

            <button className="primary-btn" type="button" onClick={() => {
                navigate('/avaliacao', { state: { name: userName } });
            }}>Adicionar nova Avaliação</button>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button className="secondary-btn" type="button" onClick={() => {
                    navigate('/historico', { state: { clienteData, userName } });
                }} style={{ flex: 1 }}>Ver Histórico completo</button>
                
                <button 
                    className="secondary-btn" 
                    type="button" 
                    onClick={() => {
                        const userName = (typeof window !== 'undefined' ? (localStorage.getItem('medfit_user_name') || 'Home') : 'Home');
                        if (userName && userName !== 'Home') {
                            fetchClienteData(userName, true);
                        }
                    }}
                    disabled={updating}
                    style={{ 
                        flex: '0 0 auto', 
                        width: 'auto', 
                        padding: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    title="Atualizar dados"
                >
                    <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>
                        refresh
                    </span>
                </button>
            </div>
            <BottomNav />
        </div>
    );
};

export default Home;