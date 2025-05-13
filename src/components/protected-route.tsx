import { Navigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { useEffect, useState, type JSX } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

const MY_UID = import.meta.env.VITE_ALLOWED_UID;

function ProtectedRoute({ children }: { children: JSX.Element }) {
	const [uid, setUid] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setUid(user?.uid ?? null);
			setLoading(false);
		});
		return () => unsubscribe();
	}, []);

	if (loading) return <div>Loading...</div>;

	if (!uid) return <Navigate to='/login' />;
	if (uid !== MY_UID) return <Navigate to='/unauthorized' />;

	return children;
}

export default ProtectedRoute;
