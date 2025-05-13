import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export default function Unauthorized() {
	const navigate = useNavigate();

	const handleLogout = async () => {
		await signOut(auth);
		navigate('/login');
	};

	return (
		<div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
			<div className='w-full max-w-sm'>
				<div className={'flex flex-col gap-6'}>
					<Card>
						<CardHeader>
							<CardTitle className='text-2xl'>Unauthorized</CardTitle>
							<CardDescription>
								You do not have permission to access this site.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								onClick={handleLogout}
								className='w-full flex gap-2 cursor-pointer'
							>
								Log Out
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
