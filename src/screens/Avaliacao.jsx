import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
registerLocale('pt-BR', ptBR);
import './Avaliacao.css';
import BottomNav from '../components/BottomNav.jsx';

const Avaliacao = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const personName = location?.state?.name || (typeof window !== 'undefined' ? localStorage.getItem('medfit_user_name') : '') || '';

	const [startDate, setStartDate] = useState(new Date());
	const [endDate, setEndDate] = useState(new Date());
	
	// Estado para as medidas
	const [medidas, setMedidas] = useState({
		braco: '',
		antebraco: '',
		torax: '',
		cintura: '',
		quadril: '',
		coxaProximal: '',
		panturrilha: '',
		coxaDistal: ''
	});

	// Função para atualizar medidas
	const handleMedidaChange = (field, value) => {
		setMedidas(prev => ({
			...prev,
			[field]: value
		}));
	};

	// Função para salvar avaliação
	const handleAtualizar = () => {
		try {
			// Salvar as novas medidas no localStorage
			const newEvaluation = {
				personName,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				medidas,
				evaluationDate: new Date().toISOString()
			};

			// Obter avaliações existentes ou criar array vazio
			const existingEvaluations = JSON.parse(localStorage.getItem('medfit_evaluations') || '[]');
			existingEvaluations.push(newEvaluation);
			
			// Salvar no localStorage
			localStorage.setItem('medfit_evaluations', JSON.stringify(existingEvaluations));
			
			// Atualizar última data de avaliação
			localStorage.setItem('medfit_last_evaluation_date', new Date().toLocaleDateString('pt-BR'));
			
			// Navegar para a tela home com os dados atualizados
			navigate('/home', {
				state: {
					name: personName,
					newEntry: {
						...medidas,
						// Incluir dados básicos se disponíveis
						peso: medidas.peso || '',
						altura: medidas.altura || '',
						cintura: medidas.cintura || '',
						quadril: medidas.quadril || ''
					}
				}
			});
		} catch (error) {
			console.error('Erro ao salvar avaliação:', error);
			alert('Erro ao salvar a avaliação. Tente novamente.');
		}
	};

	return (
		<div className="container-av">
			<div className="scroll-view-av">
				<div className="header-av">
					<button className="back-btn-av" onClick={() => navigate(-1)}>
						<span className="material-symbols-rounded" style={{ fontVariationSettings: '"wght" 300' }}>arrow_back</span>
					</button>
					<h1 className="title-av">Avaliação</h1>
				</div>
				{personName && <div className="person-name">{personName}</div>}

				<div className="date-row-av">
					<div className="date-group-av">
						<span className="date-label-av">Data inicial</span>
						<div className="date-field-av">
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
								customInput={<button type="button" className="date-btn-av" aria-label="Selecionar data inicial"><span className="material-symbols-rounded date-icon-av" style={{ color: '#fff' }}>calendar_month</span><span className="date-text-av">{startDate.toLocaleDateString('pt-BR')}</span></button>}
							/>
						</div>
					</div>
					<div className="date-group-av">
						<span className="date-label-av">Data final</span>
						<div className="date-field-av">
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
								customInput={<button type="button" className="date-btn-av" aria-label="Selecionar data final"><span className="material-symbols-rounded date-icon-av" style={{ color: '#fff' }}>calendar_month</span><span className="date-text-av">{endDate.toLocaleDateString('pt-BR')}</span></button>}
							/>
						</div>
					</div>
				</div>

				<div className="section-title-av">Medidas</div>

				<div className="row-av">
					<div className="col-av">
						<label className="label-av" htmlFor="braco">Braço</label>
						<input 
							className="input-av" 
							type="number" 
							id="braco" 
							inputMode="decimal" 
							step="0.01" 
							min="0"
							value={medidas.braco}
							onChange={(e) => handleMedidaChange('braco', e.target.value)}
						/>
					</div>
					<div className="col-av">
						<label className="label-av" htmlFor="antebraco">Antebraço</label>
						<input 
							className="input-av" 
							type="number" 
							id="antebraco" 
							inputMode="decimal" 
							step="0.01" 
							min="0"
							value={medidas.antebraco}
							onChange={(e) => handleMedidaChange('antebraco', e.target.value)}
						/>
					</div>
				</div>

				<div className="row-av">
					<div className="col-av">
						<label className="label-av" htmlFor="torax">Tórax</label>
						<input 
							className="input-av" 
							type="number" 
							id="torax" 
							inputMode="decimal" 
							step="0.01" 
							min="0"
							value={medidas.torax}
							onChange={(e) => handleMedidaChange('torax', e.target.value)}
						/>
					</div>
					<div className="col-av">
						<label className="label-av" htmlFor="cintura">Cintura</label>
						<input 
							className="input-av" 
							type="number" 
							id="cintura" 
							inputMode="decimal" 
							step="0.01" 
							min="0"
							value={medidas.cintura}
							onChange={(e) => handleMedidaChange('cintura', e.target.value)}
						/>
					</div>
				</div>

				<div className="row-av">
					<div className="col-av">
						<label className="label-av" htmlFor="quadril">Quadril</label>
						<input 
							className="input-av" 
							type="number" 
							id="quadril" 
							inputMode="decimal" 
							step="0.01" 
							min="0"
							value={medidas.quadril}
							onChange={(e) => handleMedidaChange('quadril', e.target.value)}
						/>
					</div>
					<div className="col-av">
						<label className="label-av" htmlFor="coxa-proximal">Coxa <small>(proximal)</small></label>
						<input 
							className="input-av" 
							type="number" 
							id="coxa-proximal" 
							inputMode="decimal" 
							step="0.01" 
							min="0"
							value={medidas.coxaProximal}
							onChange={(e) => handleMedidaChange('coxaProximal', e.target.value)}
						/>
					</div>
				</div>

				<div className="row-av">
					<div className="col-av">
						<label className="label-av" htmlFor="panturrilha">Panturrilha</label>
						<input 
							className="input-av" 
							type="number" 
							id="panturrilha" 
							inputMode="decimal" 
							step="0.01" 
							min="0"
							value={medidas.panturrilha}
							onChange={(e) => handleMedidaChange('panturrilha', e.target.value)}
						/>
					</div>
					<div className="col-av">
						<label className="label-av" htmlFor="coxa-distal">Coxa <small>(distal)</small></label>
						<input 
							className="input-av" 
							type="number" 
							id="coxa-distal" 
							inputMode="decimal" 
							step="0.01" 
							min="0"
							value={medidas.coxaDistal}
							onChange={(e) => handleMedidaChange('coxaDistal', e.target.value)}
						/>
					</div>
				</div>

				<button className="primary-btn-av" type="button" onClick={handleAtualizar}>Atualizar</button>
			</div>
			<BottomNav />
		</div>
	);
};

export default Avaliacao; 