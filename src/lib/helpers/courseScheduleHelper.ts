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
		monday: [],
		tuesday: [],
		wednesday: [],
		thursday: [],
		friday: [],
		saturday: [],
		sunday: [],
	};

	addTimeBlock(
		day: Weekday,
		startTime: string,
		endTime: string,
		location: string
	): CourseScheduleBuilder {
		this.schedule[day].push({ startTime, endTime, location });
		return this;
	}

	removeDay(day: Weekday): CourseScheduleBuilder {
		this.schedule[day] = [];
		return this;
	}

	removeBlock(
		day: Weekday,
		startTime: string,
		endTime: string
	): CourseScheduleBuilder {
		this.schedule[day] = this.schedule[day].filter(
			(block) => block.startTime !== startTime || block.endTime !== endTime
		);
		return this;
	}

	setDay(day: Weekday, blocks: CourseScheduleItem[]): CourseScheduleBuilder {
		this.schedule[day] = blocks;
		return this;
	}

	build(): CourseSchedule {
		return this.schedule;
	}
}
