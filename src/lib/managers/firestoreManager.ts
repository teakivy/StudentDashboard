import {
	getFirestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FirestoreHelper } from '../helpers/firestoreHelper';

let instance: FirestoreHelper | null = null;

export function getDB(): FirestoreHelper {
	if (!instance) {
		const db = getFirestore();
		const auth = getAuth();
		const user = auth.currentUser;

		if (!user) {
			throw new Error('No authenticated user found');
		}

		instance = new FirestoreHelper(db, user.uid);
	}
	return instance;
}

export function getUserId(): string {
	const auth = getAuth();
	const user = auth.currentUser;

	if (!user) {
		throw new Error('No authenticated user found');
	}

	return user.uid;
}
