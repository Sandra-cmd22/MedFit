import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Importe useNavigate
import './Home.css';
import BottomNav from '../components/BottomNav.jsx';

// ... (O resto do seu código permanece o mesmo) ...
const quarterlyData = [
    { peso: 82, massa: 28 },
    { peso: 80, massa: 29 },
    { peso: 78, massa: 30 },
    { peso: 77, massa: 31 },
];

function buildPerformanceSeries(data) {
    const series = [];
    let acc = 0;
    series.push(acc);
    for (let i = 1; i < data.length; i += 1) {
        const deltaPeso = data[i].peso - data[i - 1].peso;
        const deltaMassa = data[i].massa - data[i - 1].massa;
        acc += (deltaMassa) - (deltaPeso);
        series.push(acc);
    }
    return series;
}

function toSvgPath(series, width, height, padding) {
    if (!series || series.length === 0) return '';
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const stepX = (width - padding * 2) / Math.max(1, series.length - 1);
    const mapY = (v) => height - padding - ((v - min) / range) * (height - padding * 2);

    return series.map((v, i) => `${i === 0 ? 'M' : 'L'} ${padding + i * stepX} ${mapY(v)}`).join(' ');
}

function toSvgArea(series, width, height, padding) {
    if (!series || series.length === 0) return '';
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const stepX = (width - padding * 2) / Math.max(1, series.length - 1);
    const mapY = (v) => height - padding - ((v - min) / range) * (height - padding * 2);
    const top = series.map((v, i) => `${i === 0 ? 'M' : 'L'} ${padding + i * stepX} ${mapY(v)}`).join(' ');
    const lastX = padding + (series.length - 1) * stepX;
    return `${top} L ${lastX} ${height - padding} L ${padding} ${height - padding} Z`;
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
    if (!peso || !altura || Number.isNaN(peso) || Number.isNaN(altura) || altura <= 0) return undefined;
    const h = altura > 3 ? altura / 100 : altura;
    return +(peso / (h * h)).toFixed(1);
}

function computeRCQ(cintura, quadril) {
    if (!cintura || !quadril || Number.isNaN(cintura) || Number.isNaN(quadril) || quadril <= 0) return undefined;
    return +(cintura / quadril).toFixed(2);
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
    const navigate = useNavigate(); // Obtenha o hook de navegação
    
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

    const performanceSeries = useMemo(() => buildPerformanceSeries(seriesData), [seriesData]);
    const linePath = useMemo(() => toSvgPath(performanceSeries, 300, 100, 8), [performanceSeries]);
    const areaPath = useMemo(() => toSvgArea(performanceSeries, 300, 100, 8), [performanceSeries]);

    const userName = (location?.state?.name) || (typeof window !== 'undefined' ? (localStorage.getItem('medfit_user_name') || 'Home') : 'Home');
    const { peso, altura, cintura, quadril } = location?.state?.newEntry || {};
    const imcAtual = computeBMI(peso, altura);
    const rcqAtual = computeRCQ(cintura, quadril);
    const lastEvalDate = location?.state?.date || (typeof window !== 'undefined' ? localStorage.getItem('medfit_last_eval_date') : undefined);

    const gaugeMax = 40;
    const clamped = Math.max(0, Math.min(imcAtual ?? 0, gaugeMax));
    const angle = 180 - (clamped / gaugeMax) * 180;

    return (
        <div className="home-container">
            <h1 className="home-title">{userName}</h1>

            <div className="cards-column">
                <div className="card">
                    <div className="card-header">IMC</div>
                    <div className="card-value" style={{ color: '#0C518D' }}>{imcAtual ?? '-'}</div>
                </div>

                <div className="card">
                    <div className="card-header">RCQ</div>
                    <div className="card-value" style={{ color: '#0C518D' }}>{rcqAtual ?? '-'}</div>
                </div>

                <div className="card">
                    <div className="card-header">Desempenho</div>
                    <svg className="chart" viewBox="0 0 300 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0B508D" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#0B508D" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {/* grid */}
                        <g stroke="#d4d4d4" strokeWidth="0.5">
                            <line x1="0" y1="25" x2="300" y2="25" />
                            <line x1="0" y1="50" x2="300" y2="50" />
                            <line x1="0" y1="75" x2="300" y2="75" />
                        </g>
                        <path d={areaPath} fill="url(#perfGradient)" stroke="none" />
                        <path d={linePath} fill="none" stroke="#0B508D" strokeWidth="3" strokeLinecap="round" />
                        {/* pontos */}
                        {performanceSeries.map((v, i) => {
                            const min = Math.min(...performanceSeries);
                            const max = Math.max(...performanceSeries);
                            const range = max - min || 1;
                            const padding = 8;
                            const stepX = (300 - padding * 2) / Math.max(1, performanceSeries.length - 1);
                            const x = padding + i * stepX;
                            const y = 100 - padding - ((v - min) / range) * (100 - padding * 2);
                            return <circle key={i} cx={x} cy={y} r={3} fill="#0B508D" />;
                        })}
                    </svg>
                    <div className="chart-caption">Última avaliação: {lastEvalDate || '-'}</div>
                </div>
            </div>

            <button className="primary-btn" type="button" onClick={() => {
                navigate('/avaliacao', { state: { name: userName } });
            }}>Adicionar nova Avaliação</button>
            <button className="secondary-btn" type="button">Ver Histórico completo</button>
            <BottomNav />
        </div>
    );
};

export default Home;