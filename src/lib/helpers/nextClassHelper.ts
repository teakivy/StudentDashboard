import type { Course, CourseScheduleItem } from '@/lib/types';

export type NextClassStrings = {
	relative: string; // e.g. "9:30 AM Tomorrow", "12 PM Wednesday"
	timeOnly: string; // e.g. "9:30 AM"
	code: string;
	name: string;
};

type Weekday =
	| 'sunday'
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday';

const DAYS: Weekday[] = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
];

function addDays(d: Date, n: number) {
	const x = new Date(d);
	x.setDate(d.getDate() + n);
	return x;
}

function parseTimeOnDate(date: Date, time: string): Date {
	const [hms, ampmRaw] = time.split(' ');
	const [hStr, mStr = '0'] = hms.split(':');
	let h = parseInt(hStr, 10);
	const m = parseInt(mStr, 10);
	const ampm = (ampmRaw || '').toLowerCase();
	if (ampm === 'pm' && h !== 12) h += 12;
	if (ampm === 'am' && h === 12) h = 0;
	const out = new Date(date);
	out.setHours(h, m, 0, 0);
	return out;
}

function formatTime(date: Date) {
	// Force 12-hour format, uppercase AM/PM
	const parts = date
		.toLocaleTimeString([], {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		})
		.replace(/\s?(am|pm)$/i, (_, ap) => ` ${ap.toUpperCase()}`);
	return parts;
}

function relativeDayString(now: Date, classDate: Date, start: Date): string {
	const today = now.getDay();
	const classDay = classDate.getDay();
	const time = formatTime(start);

	if (today === classDay) {
		return time; // just the time for today
	}

	const tomorrow = (today + 1) % 7;
	if (classDay === tomorrow) {
		return `${time} Tomorrow`;
	}

	const dayName = classDate.toLocaleDateString(undefined, { weekday: 'long' });
	return `${time} ${dayName}`;
}

export function getNextClassStrings(
	courses: Course[],
	from: Date = new Date()
): NextClassStrings | null {
	const now = from;
	let best: { course: Course; start: Date; classDate: Date } | null = null;

	for (let offset = 0; offset < 14; offset++) {
		const date = addDays(now, offset);
		date.setHours(0, 0, 0, 0);
		const weekday = DAYS[date.getDay()];

		for (const course of courses) {
			if (course.online) continue;
			const item = (course.schedule as any)[weekday] as
				| CourseScheduleItem
				| null
				| undefined;
			if (!item) continue;

			const start = parseTimeOnDate(date, item.startTime);
			if (start <= now) continue;

			if (!best || start < best.start) {
				best = { course, start, classDate: date };
			}
		}

		if (best) break;
	}

	if (!best) return null;

	const { course, start, classDate } = best;
	return {
		relative: relativeDayString(now, classDate, start),
		timeOnly: formatTime(start),
		code: course.code,
		name: course.name,
	};
}
