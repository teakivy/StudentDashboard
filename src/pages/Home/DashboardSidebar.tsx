import {
	BookOpen,
	Calendar,
	CheckSquare,
	ExternalLink,
	Home,
	LogOut,
} from 'lucide-react';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface DashboardSidebarProps {
	activeView: string;
	setActiveView: (view: string) => void;
}

export function DashboardSidebar({
	activeView,
	setActiveView,
}: DashboardSidebarProps) {
	const navigate = useNavigate();

	const handleLogout = async () => {
		await signOut(auth);
		navigate('/login');
	};
	const menuItems = [
		{ id: 'overview', label: 'Overview', icon: Home },
		{ id: 'courses', label: 'Courses', icon: BookOpen },
		{ id: 'schedule', label: 'Schedule', icon: Calendar },
		{ id: 'assignments', label: 'Assignments', icon: CheckSquare },
		{ id: 'resources', label: 'Resources', icon: ExternalLink },
	];

	return (
		<Sidebar>
			<SidebarHeader className='flex flex-col items-center justify-center py-4'>
				<div className='flex items-center justify-center w-full'>
					<Avatar className='h-12 w-12 border-2 border-red-600'>
						<AvatarImage src='/collin.png' alt='Student' />
						<AvatarFallback className='bg-red-600 text-white'>
							UGA
						</AvatarFallback>
					</Avatar>
				</div>
				<div className='mt-2 text-center'>
					<h3 className='font-medium'>Collin Jones</h3>
					<p className='text-xs text-muted-foreground'>
						Computer Science, B.S.
					</p>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarMenu>
					{menuItems.map((item) => (
						<SidebarMenuItem
							key={item.id}
							style={{ paddingRight: 6, paddingLeft: 6 }}
						>
							<SidebarMenuButton
								isActive={activeView === item.id}
								onClick={() => setActiveView(item.id)}
								className='cursor-pointer'
							>
								<item.icon className='h-5 w-5' />
								<span>{item.label}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarContent>
			<SidebarFooter className='p-4'>
				<div className='flex flex-col gap-2'>
					<Button
						variant='outline'
						size='sm'
						className='justify-start cursor-pointer'
						onClick={handleLogout}
					>
						<LogOut className='mr-2 h-4 w-4' />
						Log Out
					</Button>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
