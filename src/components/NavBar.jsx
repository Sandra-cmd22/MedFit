import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.red.svg';
import './NavBar.css';

const links = [
	{ label: 'Painel', path: '/home' },
	{ label: 'Clientes', path: '/clientes' },
	{ label: 'Avaliação', path: '/avaliacao' },
	{ label: 'Histórico', path: '/historico' },
	{ label: 'Cadastrar cliente', path: '/cadastro' },
];

const NavBar = () => {
	const navigate = useNavigate();
	// Re-renderiza a cada navegação para refletir o cliente selecionado
	useLocation();
	const clienteAtual = localStorage.getItem('medfit_user_name');

	return (
		<header className="app-nav">
			<button type="button" className="app-nav-brand" onClick={() => navigate('/home')}>
				<img src={logo} alt="" className="app-nav-logo" />
				<span className="app-nav-title">MedFit</span>
			</button>

			<nav className="app-nav-links">
				{links.map((l) => (
					<NavLink
						key={l.path}
						to={l.path}
						className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
					>
						{l.label}
					</NavLink>
				))}
			</nav>

			<div className="app-nav-right">
				{clienteAtual && (
					<button
						type="button"
						className="app-nav-client"
						onClick={() => navigate('/home')}
						title="Cliente selecionado"
					>
						<span className="material-symbols-rounded">person</span>
						<span className="app-nav-client-name">{clienteAtual}</span>
					</button>
				)}
			</div>
		</header>
	);
};

export default NavBar;
