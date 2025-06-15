import {
	collection,
	doc,
	getDocs,
	getFirestore,
	writeBatch,
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

// DELETE
export async function migrateCourseSchedules() {
	let db = await getDB().getDB();
	const courseRef = collection(db, 'courses');
	const snapshot = await getDocs(courseRef);

	const batch = writeBatch(db);

	snapshot.forEach((docSnap) => {
		const data = docSnap.data();
		const schedule = data.schedule;

		if (!schedule) return;

		let modified = false;
		const newSchedule: any = {};

		for (const day of [
			'monday',
			'tuesday',
			'wednesday',
			'thursday',
			'friday',
			'saturday',
			'sunday',
		]) {
			const value = schedule[day];

			if (value === null || value === undefined) {
				newSchedule[day] = [];
			} else if (Array.isArray(value)) {
				newSchedule[day] = value; // already correct
			} else {
				newSchedule[day] = [value]; // wrap in array
				modified = true;
			}
		}

		if (modified) {
			const docRef = doc(db, 'courses', docSnap.id);
			batch.update(docRef, { schedule: newSchedule });
		}
	});

	await batch.commit();
	console.log('✅ Firestore migration complete');
}
