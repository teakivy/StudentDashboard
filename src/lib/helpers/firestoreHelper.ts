// Updated DashboardSemesters with end date limited to after start date and Firestore date deserialization

import {
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	where,
	setDoc,
	updateDoc,
	deleteDoc,
	Firestore,
} from 'firebase/firestore';
import type { Assignment, Course, Semester, SnowflakeId } from '../types';

function convertToDate(input: any): Date {
	if (input instanceof Date) return input;
	if (input?.toDate) return input.toDate();
	return new Date(input);
}

export class FirestoreHelper {
	constructor(private db: Firestore, private userId: string) {}

	// ---------- SEMESTERS ----------

	async getAllSemesters(): Promise<Semester[]> {
		const q = query(
			collection(this.db, 'semesters'),
			where('userId', '==', this.userId)
		);
		const snap = await getDocs(q);
		return snap.docs.map((doc) => {
			const data = doc.data();
			return {
				...data,
				id: doc.id as SnowflakeId,
				startDate: convertToDate(data.startDate),
				endDate: convertToDate(data.endDate),
				courseIds: (data.courseIds ?? []).map(
					(id: string) => id as SnowflakeId
				),
			} as Semester;
		});
	}

	async getSemester(id: SnowflakeId): Promise<Semester | null> {
		const snap = await getDoc(doc(this.db, 'semesters', id));
		if (!snap.exists()) return null;
		const data = snap.data();
		if (data.userId !== this.userId) return null;
		return {
			...data,
			id: snap.id as SnowflakeId,
			startDate: convertToDate(data.startDate),
			endDate: convertToDate(data.endDate),
			courseIds: (data.courseIds ?? []).map((id: string) => id as SnowflakeId),
		} as Semester;
	}

	async saveSemester(semester: Semester): Promise<void> {
		await setDoc(doc(this.db, 'semesters', semester.id), {
			...semester,
			userId: this.userId,
		});
	}

	async updateSemester(
		id: SnowflakeId,
		updates: Partial<Semester>
	): Promise<void> {
		await updateDoc(doc(this.db, 'semesters', id), updates);
	}

	async deleteSemester(id: SnowflakeId): Promise<void> {
		await deleteDoc(doc(this.db, 'semesters', id));
	}

	// ---------- COURSES ----------

	async getAllCourses(): Promise<Course[]> {
		const q = query(
			collection(this.db, 'courses'),
			where('userId', '==', this.userId)
		);
		const snap = await getDocs(q);
		return snap.docs.map((doc) => {
			const data = doc.data();
			return {
				...data,
				id: doc.id as SnowflakeId,
				semesterId: data.semesterId as SnowflakeId,
				assignmentIds: (data.assignmentIds ?? []).map(
					(id: string) => id as SnowflakeId
				),
			} as Course;
		});
	}

	async getCourse(id: SnowflakeId): Promise<Course | null> {
		const snap = await getDoc(doc(this.db, 'courses', id));
		if (!snap.exists()) return null;
		const data = snap.data();
		if (data.userId !== this.userId) return null;
		return {
			...data,
			id: snap.id as SnowflakeId,
			semesterId: data.semesterId as SnowflakeId,
			assignmentIds: (data.assignmentIds ?? []).map(
				(id: string) => id as SnowflakeId
			),
		} as Course;
	}

	async getCoursesBySemester(semesterId: SnowflakeId): Promise<Course[]> {
		const q = query(
			collection(this.db, 'courses'),
			where('semesterId', '==', semesterId),
			where('userId', '==', this.userId)
		);
		const snap = await getDocs(q);
		return snap.docs.map((doc) => {
			const data = doc.data();
			return {
				...data,
				id: doc.id as SnowflakeId,
				semesterId: data.semesterId as SnowflakeId,
				assignmentIds: (data.assignmentIds ?? []).map(
					(id: string) => id as SnowflakeId
				),
			} as Course;
		});
	}

	async saveCourse(course: Course): Promise<void> {
		await setDoc(doc(this.db, 'courses', course.id), {
			...course,
			userId: this.userId,
		});
	}

	async updateCourse(id: SnowflakeId, updates: Partial<Course>): Promise<void> {
		await updateDoc(doc(this.db, 'courses', id), updates);
	}

	async deleteCourse(id: SnowflakeId): Promise<void> {
		await deleteDoc(doc(this.db, 'courses', id));
	}

	// ---------- ASSIGNMENTS ----------

	async getAllAssignments(): Promise<Assignment[]> {
		const q = query(
			collection(this.db, 'assignments'),
			where('userId', '==', this.userId)
		);
		const snap = await getDocs(q);
		return snap.docs.map((doc) => {
			const data = doc.data();
			return {
				...data,
				id: doc.id as SnowflakeId,
				dueDate: convertToDate(data.dueDate),
				courseId: data.courseId as SnowflakeId,
				semesterId: data.semesterId as SnowflakeId,
			} as Assignment;
		});
	}

	async getAssignment(id: SnowflakeId): Promise<Assignment | null> {
		const snap = await getDoc(doc(this.db, 'assignments', id));
		if (!snap.exists()) return null;
		const data = snap.data();
		if (data.userId !== this.userId) return null;
		return {
			...data,
			id: snap.id as SnowflakeId,
			dueDate: convertToDate(data.dueDate),
			courseId: data.courseId as SnowflakeId,
			semesterId: data.semesterId as SnowflakeId,
		} as Assignment;
	}

	async getAssignmentsByCourse(courseId: SnowflakeId): Promise<Assignment[]> {
		const q = query(
			collection(this.db, 'assignments'),
			where('courseId', '==', courseId),
			where('userId', '==', this.userId)
		);
		const snap = await getDocs(q);
		return snap.docs.map((doc) => {
			const data = doc.data();
			return {
				...data,
				id: doc.id as SnowflakeId,
				dueDate: convertToDate(data.dueDate),
				courseId: data.courseId as SnowflakeId,
				semesterId: data.semesterId as SnowflakeId,
			} as Assignment;
		});
	}

	async getAssignmentsBySemester(
		semesterId: SnowflakeId
	): Promise<Assignment[]> {
		const q = query(
			collection(this.db, 'assignments'),
			where('semesterId', '==', semesterId),
			where('userId', '==', this.userId)
		);
		const snap = await getDocs(q);
		return snap.docs.map((doc) => {
			const data = doc.data();
			return {
				...data,
				id: doc.id as SnowflakeId,
				dueDate: convertToDate(data.dueDate),
				courseId: data.courseId as SnowflakeId,
				semesterId: data.semesterId as SnowflakeId,
			} as Assignment;
		});
	}

	async saveAssignment(assignment: Assignment): Promise<void> {
		await setDoc(doc(this.db, 'assignments', assignment.id), {
			...assignment,
			userId: this.userId,
		});
	}

	async updateAssignment(
		id: SnowflakeId,
		updates: Partial<Assignment>
	): Promise<void> {
		await updateDoc(doc(this.db, 'assignments', id), updates);
	}

	async deleteAssignment(id: SnowflakeId): Promise<void> {
		await deleteDoc(doc(this.db, 'assignments', id));
	}
}
