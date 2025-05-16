import Header from './Home/Header';
import { DashboardSidebar } from './Home/DashboardSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardOverview from './Home/Tabs/Overview/DashboardOverview';
import DashboardSemesters from './Home/Tabs/Semesters/DashboardSemesters';
import DashboardResources from './Home/Tabs/Resources/DashboardResources';
import UnderConstruction from './Home/Tabs/UnderConstruction/DashboardUnderConstruction';
import DashboardCourses from './Home/Tabs/Courses/DashboardCourses';

function Home() {
	const [searchParams, setSearchParams] = useSearchParams();
	const viewFromURL = searchParams.get('view') || 'overview';
	const [activeView, setActiveView] = useState(viewFromURL);

	useEffect(() => {
		if (searchParams.get('view') !== activeView) {
			setSearchParams({ view: activeView });
		}
	}, [activeView, searchParams, setSearchParams]);

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
						{activeView === 'semesters' && <DashboardSemesters />}
						{activeView === 'courses' && <DashboardCourses />}
						{activeView === 'schedule' && <UnderConstruction />}
						{activeView === 'assignments' && <UnderConstruction />}
						{activeView === 'resources' && <DashboardResources />}
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}

export default Home;
