import type { CourseSchedule, CourseScheduleItem } from '../types';

type Weekday =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday'
	| 'sunday';

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

	removeDay(day: Weekday): CourseScheduleBuilder {
		this.schedule[day] = null;
		return this;
	}

	setDay(
		day: Weekday,
		block: CourseScheduleItem | null
	): CourseScheduleBuilder {
		this.schedule[day] = block ? block : null;
		return this;
	}

	build(): CourseSchedule {
		return this.schedule;
	}
}
