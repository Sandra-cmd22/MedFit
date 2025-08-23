import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
registerLocale('pt-BR', ptBR);
import './Cadastro.css';
import BottomNav from '../components/BottomNav.jsx';

const Cadastro = () => {
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [sexo, setSexo] = useState('');
    const [clientes, setClientes] = useState([]);

    useEffect(() => {
      fetch('/api/clientes')
        .then(res => res.json())
        .then(data => setClientes(data));
    }, []);

    // Exemplo de cadastro
    const handleCadastrar = async () => {
      const cliente = { nome, sexo, /* outros campos */ };
      await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cliente)
      });
      // Redirecione ou atualize a lista de clientes
    };

    return (
        <div className="container">
            <div className="scroll-view">
                <div className="header">
                    <a href="#" className="back-button" onClick={() => navigate(-1)}>
                        <span className="material-symbols-rounded" style={{ fontVariationSettings: '"wght" 300' }}>arrow_back</span>
                    </a>
                    <h1 className="header-text">Cadastro</h1>
                    <div className="placeholder" />
                </div>

                <div className="form-content">
                    <div className="date-container">
                        <div className="date-field-group">
                            <span className="date-label">Data inicial</span>
                            <div className="date-field">
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    locale="pt-BR"
                                    dateFormat="dd/MM/yyyy"
                                    showYearDropdown
                                    scrollableYearDropdown
                                    yearDropdownItemNumber={15}
                                    popperPlacement="bottom-start"
                                    popperModifiers={[
                                        { name: 'offset', options: { offset: [0, 8] } },
                                        { name: 'preventOverflow', options: { rootBoundary: 'viewport', padding: 8 } },
                                        { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom-end'] } }
                                    ]}
                                    calendarClassName="custom-datepicker"
                                    customInput={<button type="button" className="date-btn" aria-label="Selecionar data inicial"><span className="material-symbols-rounded date-icon" style={{ fontVariationSettings: '"wght" 300', color: '#fff' }}>calendar_month</span><span className="date-text">{startDate.toLocaleDateString('pt-BR')}</span></button>}
                                />
                            </div>
                        </div>
                        <div className="date-field-group">
                            <span className="date-label">Data inicial</span>
                            <div className="date-field">
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    locale="pt-BR"
                                    dateFormat="dd/MM/yyyy"
                                    showYearDropdown
                                    scrollableYearDropdown
                                    yearDropdownItemNumber={15}
                                    popperPlacement="bottom-start"
                                    popperModifiers={[
                                        { name: 'offset', options: { offset: [0, 8] } },
                                        { name: 'preventOverflow', options: { rootBoundary: 'viewport', padding: 8 } },
                                        { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom-end'] } }
                                    ]}
                                    calendarClassName="custom-datepicker"
                                    customInput={<button type="button" className="date-btn" aria-label="Selecionar data final"><span className="material-symbols-rounded date-icon" style={{ fontVariationSettings: '"wght" 300', color: '#fff' }}>calendar_month</span><span className="date-text">{endDate.toLocaleDateString('pt-BR')}</span></button>}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col full-width">
                        <label className="label" htmlFor="nome">Nome</label>
                        <input className="input" type="text" id="nome" />
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="label" htmlFor="idade">Idade</label>
                            <input className="input" type="text" id="idade" />
                        </div>
                        <div className="col">
                            <label className="label" htmlFor="altura">Altura</label>
                            <input className="input" type="text" id="altura" />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="label" htmlFor="sexo">Sexo</label>
                            <select
                                id="sexo"
                                name="sexo"
                                className="input"
                                value={sexo}
                                onChange={e => setSexo(e.target.value)}
                            >
                                <option value="">Selecione</option>
                                <option value="Feminino">Feminino</option>
                                <option value="Masculino">Masculino</option>
                            </select>
                        </div>
                        <div className="col">
                            <label className="label" htmlFor="peso">Peso</label>
                            <input className="input" type="text" id="peso" />
                        </div>
                    </div>

					<span className="section-title medidas-title">Medidas</span>

                    <div className="row">
                        <div className="col">
                            <label className="label" htmlFor="braco">Braço</label>
                            <input className="input" type="number" id="braco" inputMode="decimal" step="0.01" min="0" />
                        </div>
                        <div className="col">
                            <label className="label" htmlFor="antebraco">Antebraço</label>
                            <input className="input" type="number" id="antebraco" inputMode="decimal" step="0.01" min="0" />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col">
                            <label className="label" htmlFor="torax">Busto</label>
                            <input className="input" type="number" id="torax" inputMode="decimal" step="0.01" min="0" />
                        </div>
                        <div className="col">
                            <label className="label" htmlFor="cintura">Cintura</label>
                            <input className="input" type="number" id="cintura" inputMode="decimal" step="0.01" min="0" />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col">
                            <label className="label" htmlFor="quadril">Quadril</label>
                            <input className="input" type="number" id="quadril" inputMode="decimal" step="0.01" min="0" />
                        </div>
                        <div className="col">
                            <label className="label" htmlFor="coxa-proximal">Coxa (proximal)</label>
                            <input className="input" type="number" id="coxa-proximal" inputMode="decimal" step="0.01" min="0" />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col">
                            <label className="label" htmlFor="panturrilha">Panturrilha</label>
                            <input className="input" type="number" id="panturrilha" inputMode="decimal" step="0.01" min="0" />
                        </div>
                        <div className="col">
                            <label className="label" htmlFor="coxa-distal">Coxa (distal)</label>
                            <input className="input" type="number" id="coxa-distal" inputMode="decimal" step="0.01" min="0" />
                        </div>
                    </div>

                                        <button type="button" className="button" onClick={() => {
                        try {
                            const getEl = (id) => document.getElementById(id);
                            const getNumber = (id) => {
                                const el = getEl(id);
                                if (!el) return NaN;
                                const v = parseFloat((el.value || '').toString().replace(',', '.'));
                                return Number.isNaN(v) ? NaN : v;
                            };
                            const nome = (getEl('nome')?.value || '').toString().trim();
                            if (nome) {
                                try { localStorage.setItem('medfit_user_name', nome); } catch {}
                            }
                            const peso = getNumber('peso');
                            const altura = getNumber('altura');
                            const massaProxy = [
                                getNumber('torax'),
                                getNumber('coxa-proximal'),
                                getNumber('coxa-distal'),
                                getNumber('panturrilha'),
                                getNumber('braco'),
                                getNumber('antebraco'),
                                getNumber('quadril'),
                                getNumber('cintura'),
                            ].filter((x) => !Number.isNaN(x)).reduce((a, b) => a + b, 0);
                            const massa = Number.isNaN(massaProxy) || massaProxy === 0 ? undefined : massaProxy;
                            const cintura = getNumber('cintura');
                            const quadril = getNumber('quadril');
                            const lastDate = (typeof window !== 'undefined' && typeof endDate?.toLocaleDateString === 'function') ? endDate.toLocaleDateString() : undefined;
                            try { if (lastDate) localStorage.setItem('medfit_last_eval_date', lastDate); } catch {}
                            navigate('/home', { state: { newEntry: { peso, massa, altura, cintura, quadril }, name: nome, date: lastDate } });
                        } catch (e) {
                            navigate('/home');
                        }
                    }}>
                        <span className="button-text">Cadastrar</span>
                    </button>
                </div>
            </div>

            <div className="footer">
                <BottomNav />
            </div>
        </div>
    );
};

export default Cadastro;