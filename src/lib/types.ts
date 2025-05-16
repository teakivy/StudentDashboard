export type SnowflakeId = string & { __brand: 'SnowflakeId' };

export interface Semester {
	id: SnowflakeId;
	userId: string;
	startDate: Date;
	endDate: Date;
	term: 'fall' | 'spring' | 'summer';
	year: number;
	name: string;
	courseIds: SnowflakeId[];
	status: 'current' | 'completed' | 'upcoming';
}

export interface Course {
	id: SnowflakeId;
	userId: string;
	semesterId: SnowflakeId;
	name: string;
	code: string;
	credits: number;
	instructor: string;
	schedule: CourseSchedule;
	resources: ResourceLink[];
	courseLink: string;
	syllabusLink: string;
	gradeSpreadsheetId?: string;
	grade: number;
	assignmentIds: SnowflakeId[];
	online: boolean;
}

export interface CourseSchedule {
	monday: CourseScheduleItem | null;
	tuesday: CourseScheduleItem | null;
	wednesday: CourseScheduleItem | null;
	thursday: CourseScheduleItem | null;
	friday: CourseScheduleItem | null;
	saturday: CourseScheduleItem | null;
	sunday: CourseScheduleItem | null;
}

export interface CourseScheduleItem {
	startTime: string;
	endTime: string;
	location: string;
}

export interface ResourceLink {
	url: string;
	title: string;
}

export interface Assignment {
	id: SnowflakeId;
	userId: string;
	name: string;
	dueDate: Date;
	courseId: SnowflakeId;
	semesterId: SnowflakeId;
	resources: ResourceLink[];
	assignmentLink: string;
	status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'not_open';
	category:
		| 'homework'
		| 'project'
		| 'exam'
		| 'quiz'
		| 'lab'
		| 'essay'
		| 'other';
}
