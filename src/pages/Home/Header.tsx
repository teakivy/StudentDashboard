import { SidebarTrigger } from '@/components/ui/sidebar';

function Header() {
	return (
		<header className='border-b px-4 py-3 flex items-center justify-between w-full'>
			<div className='flex items-center gap-2'>
				<SidebarTrigger className='cursor-pointer' />
				<div className='flex items-center'>
					<img src='/uga.png' alt='UGA Logo' className='h-8 w-8 mr-2' />
					<h1 className='text-xl font-bold text-white'>UGA Student Portal</h1>
				</div>
			</div>
		</header>
	);
}

export default Header;
