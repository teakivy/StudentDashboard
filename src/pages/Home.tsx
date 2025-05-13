import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';

function Home() {
	const navigate = useNavigate();

	const handleLogout = async () => {
		await signOut(auth);
		navigate('/login');
	};
	return (
		<div>
			Home
			<Button onClick={handleLogout} className='cursor-pointer'>
				Log Out
			</Button>
		</div>
	);
}

export default Home;
