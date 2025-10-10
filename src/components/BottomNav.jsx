import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
		<nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex justify-between items-center px-4 py-3 z-50">
			{tabs.map((t) => {
				const active = location.pathname.startsWith(t.path);
				return (
					<button 
						key={t.key} 
						className={`flex flex-col items-center gap-1 px-2 py-1 min-w-0 text-xs rounded-lg transition-all duration-200 ${
							active ? 'text-blue-700' : 'text-gray-500'
						}`} 
						style={{
							boxShadow: active ? '0 4px 12px rgba(166, 208, 244, 0.6)' : 'none'
						}}
						onClick={() => navigate(t.path)}
					>
						<span className="material-symbols-rounded text-3xl" style={{ fontVariationSettings: '"wght" 300' }}>
							{t.icon}
						</span>
						<span className="text-xs truncate">{t.label}</span>
					</button>
				);
			})}
		</nav>
	);
};

export default BottomNav; 