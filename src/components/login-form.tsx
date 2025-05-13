import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Github } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';

export function LoginForm({
	className,
	...props
}: React.ComponentPropsWithoutRef<'div'>) {
	const navigate = useNavigate();

	const handleGithubLogin = async () => {
		try {
			const result = await signInWithPopup(auth, provider);
			const user = result.user;
			console.log('Signed in as:', user.displayName);
			navigate('/');
		} catch (error) {
			console.error('GitHub login failed:', error);
		}
	};

	return (
		<div className={cn('flex flex-col gap-6', className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle className='text-2xl'>Login</CardTitle>
					<CardDescription>Sign in with GitHub to continue</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={handleGithubLogin}
						className='w-full flex gap-2 cursor-pointer'
					>
						<Github size={18} />
						Login with GitHub
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
