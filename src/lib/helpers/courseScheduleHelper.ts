import type { CourseSchedule } from '../types';

export class CourseScheduleBuilder {
	private schedule: CourseSchedule = {
		monday: null,
		tuesday: null,
		wednesday: null,
		thursday: null,
		friday: null,
		saturday: null,
		sunday: null,
	};

	setDay(
		day:
			| 'monday'
			| 'tuesday'
			| 'wednesday'
			| 'thursday'
			| 'friday'
			| 'saturday'
			| 'sunday',
		startTime: Date,
		endTime: Date,
		location: string
	): CourseScheduleBuilder {
		this.schedule[day] = {
			startTime,
			endTime,
			location,
		};
		return this;
	}

	removeDay(
		day:
			| 'monday'
			| 'tuesday'
			| 'wednesday'
			| 'thursday'
			| 'friday'
			| 'saturday'
			| 'sunday'
	): CourseScheduleBuilder {
		this.schedule[day] = null;
		return this;
	}

	build(): CourseSchedule {
		return this.schedule;
	}
}
