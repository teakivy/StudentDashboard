import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getDB } from './managers/firestoreManager';
import type { SnowflakeId } from './types';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function calculateSemesterGPA(semesterId: SnowflakeId): Promise<number> {
	let semester = await getDB().getSemester(semesterId);
	if (!semester || semester === null) {
		return -1;
	}
	let totalCredits = 0;
	let totalGradePoints = 0;
	for (const courseId of semester.courseIds) {
		const course = await getDB().getCourse(courseId);
		if (!course) {
			continue;
		}
		// grade is 0-100, A = 90-100, B = 80-89, C = 70-79, D = 60-69, F = 0-59
		let gradePoints = 0;
		if (course.grade >= 90) {
			gradePoints = 4.0;
		} else if (course.grade >= 80) {
			gradePoints = 3.0;
		} else if (course.grade >= 70) {
			gradePoints = 2.0;
		} else if (course.grade >= 60) {
			gradePoints = 1.0;
		} else {
			gradePoints = 0.0;
		}
		totalCredits += course.credits;
		totalGradePoints += gradePoints * course.credits;
	}
	if (totalCredits === 0) {
		return -1;
	}
	return totalGradePoints / totalCredits;
}

export async function calculateSemesterCredits(
  semesterId: SnowflakeId
): Promise<number> {
  let semester = await getDB().getSemester(semesterId);
  if (!semester || semester === null) {
    return -1;
  }
  let totalCredits = 0;
  for (const courseId of semester.courseIds) {
    const course = await getDB().getCourse(courseId);
    if (!course) {
      continue;
    }
    totalCredits += course.credits;
  }
  return totalCredits;
}