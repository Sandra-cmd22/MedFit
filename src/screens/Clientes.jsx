import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Clientes.css';
import BottomNav from '../components/BottomNav.jsx';

const Clientes = () => {
	const navigate = useNavigate();
	const [query, setQuery] = useState('');
	const [clientes, setClientes] = useState([]);
	const [loading, setLoading] = useState(false);

	const loadClientes = async () => {
		setLoading(true);
		try {
			const response = await fetch('/api/clientes');
			const data = await response.json();
			setClientes(data);
		} catch (error) {
			console.error('Erro ao carregar clientes:', error);
			setClientes([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadClientes();
	}, []);

	const clients = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return clientes;
		return clientes.filter((c) => `${c.nome} ${c.sobrenome || ''}`.toLowerCase().includes(q));
	}, [query, clientes]);

	const goToHome = (c) => {
		const fullName = `${c.nome}${c.sobrenome ? ' ' + c.sobrenome : ''}`;
		try { localStorage.setItem('medfit_user_name', fullName); } catch {}
		navigate('/home', { state: { name: fullName, newEntry: { peso: c.peso, altura: c.altura } } });
	};

	// Exemplo de cadastro
	const handleCadastrar = async () => {
		const cliente = { nome, sexo, /* outros campos */ };
		await fetch('/api/clientes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(cliente)
		});
		// Redirecione para a tela de clientes ou atualize a lista
	};

	return (
		<div className="clientes-container">
			<div className="clientes-header">
				<button className="icon-btn" onClick={() => navigate(-1)}>
					<span className="material-symbols-rounded" style={{ fontVariationSettings: '"wght" 300' }}>arrow_back</span>
				</button>
				<h1 className="clientes-title">Clientes</h1>
				<button className="icon-btn" onClick={loadClientes} disabled={loading}>
					<span className="material-symbols-rounded" style={{ fontVariationSettings: '"wght" 300' }}>
						{loading ? 'refresh' : 'refresh'}
					</span>
				</button>
			</div>

			<label className="search-label" htmlFor="search">Buscar Cliente por Nome</label>
			<div className="search-box">
				<span className="material-symbols-rounded search-icon" style={{ fontVariationSettings: '"wght" 300' }}>search</span>
				<input id="search" className="search-input" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Digite o nome" />
			</div>

			<div className="table-scroll">
				<table className="table">
					<thead>
						<tr>
							<th>Nome</th>
							<th>Idade</th>
							<th>Sexo</th>
							<th>Altura</th>
							<th>Peso</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
									Carregando clientes...
								</td>
							</tr>
						) : clients.length === 0 ? (
							<tr>
								<td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
									Nenhum cliente encontrado
								</td>
							</tr>
						) : (
							clients.map((c) => (
								<tr key={c.id}>
									<td>
										<button className="name-pill" onClick={() => goToHome(c)}>{`${c.nome}${c.sobrenome ? ' ' + c.sobrenome : ''}`}</button>
									</td>
									<td>{c.idade}</td>
									<td>{c.sexo}</td>
									<td>{c.altura}</td>
									<td>{c.peso}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			<BottomNav />
		</div>
	);
};

export default Clientes;