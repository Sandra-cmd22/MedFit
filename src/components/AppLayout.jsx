import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar.jsx';

const AppLayout = () => {
	return (
		<div className="app-layout">
			<NavBar />
			<main className="app-main">
				<Outlet />
			</main>
		</div>
	);
};

export default AppLayout;
