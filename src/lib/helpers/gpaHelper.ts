import type { Course, LetterGrade } from '../types';

const GRADE_POINTS: Record<Exclude<LetterGrade, 'N/A'>, number> = {
	A: 4.0,
	'A-': 3.7,
	'B+': 3.3,
	B: 3.0,
	'B-': 2.7,
	'C+': 2.3,
	C: 2.0,
	'C-': 1.7,
	'D+': 1.3,
	D: 1.0,
	'D-': 0.7,
	F: 0.0,
};

export function calculateGPA(courses: Course[]): number {
	let totalPoints = 0;
	let totalCredits = 0;

	for (const course of courses) {
		if (course.letterGrade === 'N/A') continue; // skip courses not graded yet

		const points = GRADE_POINTS[course.letterGrade];
		totalPoints += points * course.credits;
		totalCredits += course.credits;
	}

	console.log(totalCredits, totalPoints);

	if (totalCredits === 0) return 0;

	return parseFloat((totalPoints / totalCredits).toFixed(2)); // round to 2 decimals
}
