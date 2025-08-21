import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { getDB } from '@/lib/managers/firestoreManager';
import type { Semester, Course, CourseScheduleItem } from '@/lib/types';

const WEEKDAYS = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
] as const;
type Weekday = (typeof WEEKDAYS)[number];

const DAY_LABELS = [
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
] as const;
const TIME_START = 7; // 7 AM
const TIME_END = 20; // 8 PM (non-inclusive, so shows 7:00-8:00PM)
const HOUR_HEIGHT = 78; // px per hour

const COURSE_COLORS = [
	'bg-[#dc2626] text-white border border-[#7f1d1d]', // red-600, border red-800
];

function getCourseStyle(courseId: string) {
	const rawStyle = getCourseColor(courseId);
	const borderMatch = rawStyle.match(/border-\[#([0-9a-fA-F]{6})\]/);
	const bgMatch = rawStyle.match(/bg-\[#([0-9a-fA-F]{6})\]/);

	const borderHex = borderMatch ? `#${borderMatch[1]}` : '#000000';
	const bgHex = bgMatch ? `#${bgMatch[1]}` : '#000000';

	return {
		borderHex,
		bgHex,
		rgbaBg: hexToRgba(borderHex, 0.4),
	};
}

function hexToRgba(hex: string, alpha: number): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hashStringDJB2(str: string) {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) + hash + str.charCodeAt(i); // hash * 33 + c
	}
	return Math.abs(hash);
}

function getCourseColor(courseId: string) {
	const idx = hashStringDJB2(courseId) % COURSE_COLORS.length;
	return COURSE_COLORS[idx];
}

function timeStringToDecimal(time: string) {
	const [t, ampm] = time.split(' ');
	let [hour, min] = t.split(':').map(Number);
	if (ampm?.toLowerCase() === 'pm' && hour !== 12) hour += 12;
	if (ampm?.toLowerCase() === 'am' && hour === 12) hour = 0;
	return hour + (min || 0) / 60;
}
function formatDateRange(start: Date, end: Date) {
	const options: Intl.DateTimeFormatOptions = {
		month: 'short',
		day: 'numeric',
	};
	const startStr = start.toLocaleDateString(undefined, options);
	const endStr = end.toLocaleDateString(undefined, {
		...options,
		year: 'numeric',
	});
	return `${startStr} - ${endStr}`;
}
function getMonday(date: Date) {
	const d = new Date(date);
	const day = d.getDay();
	const diff = (day === 0 ? -6 : 1) - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}
function addDays(date: Date, days: number) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

type DayBlock = {
	course: Course;
	item: CourseScheduleItem;
	semester: Semester;
	start: number;
	end: number;
};

export default function DashboardSchedule() {
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [courses, setCourses] = useState<Course[]>([]);
	const [weekOffset, setWeekOffset] = useState(0);

	const gridRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		async function fetchData() {
			const semesters = await getDB().getAllSemesters();
			setSemesters(semesters);
			const courses = await getDB().getAllCourses();
			setCourses(courses);
		}
		fetchData();
	}, []);

	// Compute week (Monday-Friday)
	const today = new Date();
	let monday = getMonday(today);
	monday = addDays(monday, 7 * weekOffset);
	const weekDates: Date[] = Array.from({ length: 5 }, (_, i) =>
		addDays(monday, i)
	);
	const weekStart = weekDates[0];
	const weekEnd = weekDates[weekDates.length - 1];

	// Find all semesters active during this week
	const activeSemesters = semesters.filter(
		(sem) => !(sem.endDate < weekStart || sem.startDate > weekEnd)
	);

	// For each day, gather valid course blocks (with absolute start/end)
	const dayBlocks: Record<Weekday, DayBlock[]> = {
		monday: [],
		tuesday: [],
		wednesday: [],
		thursday: [],
		friday: [],
	};

	for (const sem of activeSemesters) {
		const semesterCourses = courses.filter((c) => c.semesterId === sem.id);

		WEEKDAYS.forEach((day, idx) => {
			const courseDayDate = weekDates[idx];
			if (!courseDayDate) return;
			if (courseDayDate < sem.startDate || courseDayDate > sem.endDate) return;

			semesterCourses.forEach((course) => {
				// EXPECT A SINGLE ITEM (or undefined/null) PER DAY:
				const item = (course.schedule as any)[day] as
					| CourseScheduleItem
					| null
					| undefined;
				if (!item) return;

				const start = timeStringToDecimal(item.startTime);
				const end = timeStringToDecimal(item.endTime);
				if (end > start) {
					dayBlocks[day].push({ course, item, semester: sem, start, end });
				}
			});
		});
	}

	// Find first class start hour for scroll
	let firstHour = TIME_START;
	let foundFirst = false;
	for (const day of WEEKDAYS) {
		for (const block of dayBlocks[day]) {
			const h = Math.floor(block.start);
			if (!foundFirst || h < firstHour) {
				firstHour = h;
				foundFirst = true;
			}
		}
	}
	if (!foundFirst) firstHour = TIME_START;

	// Scroll to first class on mount/update
	useEffect(() => {
		if (gridRef.current) {
			const scroll = Math.max(0, (firstHour - TIME_START) * HOUR_HEIGHT);
			gridRef.current.scrollTo({ top: scroll, behavior: 'smooth' });
		}
	}, [firstHour, weekOffset, semesters.length, courses.length]);

	// Overlap logic: still works (0–1 block per day results in totalLanes = 1)
	function getBlockPositions(blocks: DayBlock[]) {
		const sorted = blocks
			.slice()
			.sort((a, b) => a.start - b.start || a.end - b.end);
		const lanes: { end: number }[] = [];
		const positions: { lane: number; totalLanes: number }[] = [];
		sorted.forEach((blk, idx) => {
			let placed = false;
			for (let i = 0; i < lanes.length; ++i) {
				if (blk.start >= lanes[i].end - 0.01) {
					lanes[i].end = blk.end;
					positions[idx] = { lane: i, totalLanes: 0 };
					placed = true;
					break;
				}
			}
			if (!placed) {
				positions[idx] = { lane: lanes.length, totalLanes: 0 };
				lanes.push({ end: blk.end });
			}
		});
		positions.forEach((pos) => (pos.totalLanes = lanes.length));
		// Map positions back to original order of `blocks`
		return blocks.map((blk) => {
			const idx = sorted.indexOf(blk);
			return positions[idx];
		});
	}

	return (
		<div className='w-full max-w-6xl mx-auto px-4 py-8'>
			<div className='flex items-center justify-between mb-1'>
				<h1 className='text-3xl font-bold'>Class Schedule</h1>
				<div
					className='flex items-center gap-2 text-base font-semibold bg-muted dark:bg-zinc-800 px-3 py-1 rounded-xl'
					style={{ minWidth: 300, maxWidth: 340, justifyContent: 'center' }}
				>
					<button
						aria-label='Previous Week'
						className='hover:bg-accent rounded-full p-1 transition'
						onClick={() => setWeekOffset((w) => w - 1)}
						tabIndex={0}
						type='button'
					>
						<ChevronLeft className='w-5 h-5' />
					</button>
					<span
						className='flex-1 text-center whitespace-nowrap'
						style={{ minWidth: 165 }}
					>
						{formatDateRange(weekStart, weekEnd)}
					</span>
					<button
						aria-label='Next Week'
						className='hover:bg-accent rounded-full p-1 transition'
						onClick={() => setWeekOffset((w) => w + 1)}
						tabIndex={0}
						type='button'
					>
						<ChevronRight className='w-5 h-5' />
					</button>
				</div>
			</div>

			<div
				className='overflow-x-auto rounded-xl shadow-lg border bg-card dark:bg-[#18181B] mt-5'
				style={{ maxHeight: 1200, minHeight: 600 }}
			>
				<div
					className='sticky top-0 z-30 bg-card dark:bg-[#18181B] border-b border-muted-foreground/30 flex'
					style={{ height: 38 }}
				>
					<div className='w-19 min-w-[64px] max-w-[72px] dark:bg-white/5 items-center justify-center font-bold text-sm flex'>
						<div>Time</div>
					</div>
					<div className='grid grid-cols-5 gap-0 border-r w-full'>
						{DAY_LABELS.map((day) => (
							<div
								key={day}
								className='text-sm font-bold flex items-center justify-center select-none border-l'
							>
								{day}
							</div>
						))}
					</div>
				</div>

				<div className='min-w-[900px] flex' ref={gridRef}>
					{/* Time column */}
					<div className='flex flex-col border-r w-20 min-w-[64px] max-w-[72px] bg-black/5 dark:bg-white/5'>
						{Array.from({ length: TIME_END - TIME_START }, (_, i) => (
							<div
								key={i}
								className='text-xs text-muted-foreground select-none border-b flex justify-center'
								style={{ height: HOUR_HEIGHT }}
							>
								{(TIME_START + i) % 12 || 12}:00{' '}
								{TIME_START + i < 12 ? 'AM' : 'PM'}
							</div>
						))}
					</div>

					{/* Calendar grid */}
					{WEEKDAYS.map((day) => {
						const blocks = dayBlocks[day];
						const positions = getBlockPositions(blocks);
						return (
							<div
								key={day}
								className='relative flex-1 border-r last:border-r-0'
								style={{
									minWidth: 0,
									background: 'inherit',
									height: (TIME_END - TIME_START) * HOUR_HEIGHT,
								}}
							>
								{/* Gray hour lines */}
								{Array.from({ length: TIME_END - TIME_START }, (_, i) => (
									<div
										key={i}
										className='absolute left-0 right-0 border-b border-muted-foreground/30'
										style={{
											top: i * HOUR_HEIGHT,
											height: HOUR_HEIGHT,
											zIndex: 1,
										}}
									/>
								))}

								{/* Course blocks */}
								{blocks.map((blk, i) => {
									const { start, end, course, item, semester } = blk;
									const top = (start - TIME_START) * HOUR_HEIGHT;
									const blockHeight = Math.max(
										26,
										(end - start) * HOUR_HEIGHT - 6
									);
									const { lane, totalLanes } = positions[i];
									const widthPercent = 100 / totalLanes;
									const leftPercent = lane * widthPercent;

									const { borderHex, rgbaBg } = getCourseStyle(course.id);
									return (
										<div
											key={course.id + item.startTime + semester.id}
											className='absolute z-10  rounded-md px-3 py-2 border-2 shadow-lg border cursor-pointer flex flex-col transition-all backdrop-blur'
											style={{
												top,
												left: `calc(${leftPercent}% + 6px)`,
												width: `calc(${widthPercent}% - 12px)`,
												height: blockHeight,
												minHeight: 22,
												maxWidth:
													totalLanes > 1
														? `calc(${widthPercent}% - 6px)`
														: undefined,
												zIndex: 5 + lane,
												borderColor: borderHex,
												backgroundColor: rgbaBg,
											}}
											title={`${course.name} • ${item.location}`}
										>
											<div className='flex items-center gap-2 mb-0.5'>
												<span className='font-bold text-xs leading-5 truncate'>
													{course.code}
												</span>
											</div>
											<div className='text-xs flex items-center gap-1 opacity-80'>
												<Clock className='inline-block w-3 h-3 mr-0.5' />{' '}
												{item.startTime} – {item.endTime}
											</div>
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
