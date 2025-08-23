import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNav.css';

const tabs = [
	{ key: 'home', label: 'Home', icon: 'home', path: '/home' },
	{ key: 'clientes', label: 'Clientes', icon: 'groups', path: '/clientes' },
	{ key: 'avaliacao', label: 'Avaliação', icon: 'assignment', path: '/avaliacao' },
	{ key: 'cadastro', label: 'Cadastrar', icon: 'person_add', path: '/cadastro' },
];

const BottomNav = () => {
	const location = useLocation();
	const navigate = useNavigate();

	return (
		<nav className="bottom-nav">
			{tabs.map((t) => {
				const active = location.pathname.startsWith(t.path);
				return (
					<button key={t.key} className={`nav-item${active ? ' active' : ''}`} onClick={() => navigate(t.path)}>
						<span className="material-symbols-rounded nav-icon" style={{ fontVariationSettings: '"wght" 300' }}>{t.icon}</span>
						<span className="nav-label">{t.label}</span>
					</button>
				);
			})}
		</nav>
	);
};

export default BottomNav; 