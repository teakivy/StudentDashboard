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
		// Save course document
		await setDoc(doc(this.db, 'courses', course.id), {
			...course,
			userId: this.userId,
		});

		// Add this course.id to the semester's courseIds (if not present)
		const semesterRef = doc(this.db, 'semesters', course.semesterId);
		const semesterSnap = await getDoc(semesterRef);
		if (semesterSnap.exists()) {
			const data = semesterSnap.data();
			let courseIds: string[] = Array.isArray(data.courseIds)
				? [...data.courseIds]
				: [];
			if (!courseIds.includes(course.id)) {
				courseIds.push(course.id);
				await updateDoc(semesterRef, { courseIds });
			}
		}
	}

	async updateCourse(id: SnowflakeId, updates: Partial<Course>): Promise<void> {
		await updateDoc(doc(this.db, 'courses', id), updates);
	}

	async deleteCourse(id: SnowflakeId): Promise<void> {
		// Find course to get semesterId
		const courseSnap = await getDoc(doc(this.db, 'courses', id));
		if (courseSnap.exists()) {
			const data = courseSnap.data();
			const semesterId = data.semesterId;
			const semesterRef = doc(this.db, 'semesters', semesterId);
			const semesterSnap = await getDoc(semesterRef);
			if (semesterSnap.exists()) {
				const courseIds: string[] = Array.isArray(semesterSnap.data().courseIds)
					? [...semesterSnap.data().courseIds]
					: [];
				const idx = courseIds.indexOf(id);
				if (idx !== -1) {
					courseIds.splice(idx, 1);
					await updateDoc(semesterRef, { courseIds });
				}
			}
		}
		// Delete course document
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

		// Add to course.assignmentIds
		const courseRef = doc(this.db, 'courses', assignment.courseId);
		const courseSnap = await getDoc(courseRef);
		if (courseSnap.exists()) {
			const data = courseSnap.data();
			let assignmentIds: string[] = Array.isArray(data.assignmentIds)
				? [...data.assignmentIds]
				: [];
			if (!assignmentIds.includes(assignment.id)) {
				assignmentIds.push(assignment.id);
				await updateDoc(courseRef, { assignmentIds });
			}
		}
	}

	async updateAssignment(
		id: SnowflakeId,
		updates: Partial<Assignment>
	): Promise<void> {
		await updateDoc(doc(this.db, 'assignments', id), updates);
	}

	async deleteAssignment(id: SnowflakeId): Promise<void> {
		// Find assignment to get courseId
		const assignmentSnap = await getDoc(doc(this.db, 'assignments', id));
		if (assignmentSnap.exists()) {
			const data = assignmentSnap.data();
			const courseId = data.courseId;
			const courseRef = doc(this.db, 'courses', courseId);
			const courseSnap = await getDoc(courseRef);
			if (courseSnap.exists()) {
				const assignmentIds: string[] = Array.isArray(
					courseSnap.data().assignmentIds
				)
					? [...courseSnap.data().assignmentIds]
					: [];
				const idx = assignmentIds.indexOf(id);
				if (idx !== -1) {
					assignmentIds.splice(idx, 1);
					await updateDoc(courseRef, { assignmentIds });
				}
			}
		}
		// Delete assignment document
		await deleteDoc(doc(this.db, 'assignments', id));
	}

	async getDB(): Promise<Firestore> {
		return this.db;
	}
}
