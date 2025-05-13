import Header from './Home/Header';
import { DashboardSidebar } from './Home/DashboardSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import Unauthorized from './Unauthorized';
import { useState } from 'react';
import DashboardOverview from './Home/Tabs/Overview/DashboardOverview';

function Home() {
	const [activeView, setActiveView] = useState('overview');
	return (
		<SidebarProvider>
			<div className='flex min-h-screen   w-full'>
				<DashboardSidebar
					activeView={activeView}
					setActiveView={setActiveView}
				/>
				<div className='flex flex-col flex-1'>
					<Header />
					<main className='flex-1 p-4 md:p-6'>
						{activeView === 'overview' && <DashboardOverview />}
						{activeView === 'courses' && <Unauthorized />}
						{activeView === 'schedule' && <Unauthorized />}
						{activeView === 'assignments' && <Unauthorized />}
						{activeView === 'resources' && <Unauthorized />}
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}

export default Home;
