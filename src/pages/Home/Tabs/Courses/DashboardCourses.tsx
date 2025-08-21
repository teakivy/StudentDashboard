import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Plus,
	CalendarClock,
	X,
	Edit,
	Calendar,
	BadgeInfo,
	FileText,
	ExternalLink,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
	Course,
	Semester,
	SnowflakeId,
	CourseSchedule,
	CourseScheduleItem,
} from '@/lib/types';
import { getDB, getUserId } from '@/lib/managers/firestoreManager';
import { toast } from 'sonner';
import { createId } from '@/lib/snowflake';

type Day =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday'
	| 'sunday';

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [
	'00',
	'05',
	'10',
	'15',
	'20',
	'25',
	'30',
	'35',
	'40',
	'45',
	'50',
	'55',
];
const AMPM = ['AM', 'PM'];
const DAY_NAMES: Record<Day, string> = {
	monday: 'Mon',
	tuesday: 'Tue',
	wednesday: 'Wed',
	thursday: 'Thu',
	friday: 'Fri',
	saturday: 'Sat',
	sunday: 'Sun',
};

function getGroupedScheduleSummary(
	schedule: CourseSchedule,
	online: boolean
): string {
	if (online) return 'Online';
	// Helper: convert day to single-char
	const dayAbbr: Record<Day, string> = {
		monday: 'M',
		tuesday: 'T',
		wednesday: 'W',
		thursday: 'R',
		friday: 'F',
		saturday: 'S',
		sunday: 'U',
	};

	// Group by time/location
	const groupMap: Record<string, { days: Day[]; item: CourseScheduleItem }> =
		{};
	(Object.entries(schedule) as [Day, CourseScheduleItem | null][]).forEach(
		([day, item]) => {
			if (!item) return;
			// Key by start-end-location (do NOT group different locations)
			const key = `${item.startTime}|${item.endTime}|${item.location}`;
			if (!groupMap[key]) groupMap[key] = { days: [], item };
			groupMap[key].days.push(day);
		}
	);

	// Format: e.g., MWF 9:30 - 11AM @ Location | T 12 - 1PM @ Location2
	return (
		Object.values(groupMap)
			.map(({ days, item }) => {
				// Sort days by week order
				const weekOrder: Day[] = [
					'monday',
					'tuesday',
					'wednesday',
					'thursday',
					'friday',
					'saturday',
					'sunday',
				];
				days.sort((a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b));
				// Day string (e.g., MWF)
				const dayStr = days.map((d) => dayAbbr[d]).join('');
				// Time string, compacted
				const startStr = compactTime(item.startTime);
				const endStr = compactTime(item.endTime);
				// Location
				return `${dayStr} ${startStr} - ${endStr} @ ${item.location}`;
			})
			.join(' | ') || 'Not set'
	);
}

// Helper to compact time strings
function compactTime(time: string) {
	// Accepts '9:00 AM' or '11:45 PM' etc.
	const [hms, ampm] = time.split(' ');
	let [hr, min] = hms.split(':');
	let t = '';
	if (min === '00') t = `${parseInt(hr, 10)}${ampm}`;
	else t = `${parseInt(hr, 10)}:${min}${ampm}`;
	// Remove space for compact display
	return t.replace('AM', 'AM').replace('PM', 'PM');
}
function DashboardCourses() {
	const [courses, setCourses] = useState<Course[]>([]);
	const [selectedSemester, setSelectedSemester] = useState<string>('');

	const [newCourseOpen, setNewCourseOpen] = useState(false);
	const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

	// Main course state
	const [semester, setSemester] = useState('');
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [name, setName] = useState('');
	const [code, setCode] = useState('');
	const [credits, setCredits] = useState('');
	const [online, setOnline] = useState(false);
	const [instructor, setInstructor] = useState('');
	const [courseLink, setCourseLink] = useState('');
	const [syllabusLink, setSyllabusLink] = useState('');
	const [gradeSpreadsheetId, setGradeSpreadsheetId] = useState('');

	useEffect(() => {
		let fetchSemesters = async () => {
			let fetchedSemesters = await getDB().getAllSemesters();

			fetchedSemesters.sort((a, b) => {
				if (a.startDate < b.startDate) return 1;
				if (a.startDate > b.startDate) return -1;
				return 0;
			});
			setSemesters(fetchedSemesters);

			let fetchedCourses = await getDB().getAllCourses();
			fetchedCourses.sort((a, b) => {
				if (a.code < b.code) return -1;
				if (a.code > b.code) return 1;
				return 0;
			});
			setCourses(fetchedCourses);

			const urlSemester = getQueryParam('semester');
			if (urlSemester && fetchedSemesters.some((s) => s.id === urlSemester)) {
				setSelectedSemester(urlSemester);
			} else if (fetchedSemesters.length && !selectedSemester) {
				setSelectedSemester(fetchedSemesters[0].id);
				setQueryParam('semester', fetchedSemesters[0].id);
			}
		};

		fetchSemesters();
	}, []);

	useEffect(() => {
		if (selectedSemester) {
			setQueryParam('semester', selectedSemester);
		}
	}, [selectedSemester]);

	useEffect(() => {
		const onPopState = () => {
			const urlSemester = getQueryParam('semester');
			if (urlSemester && semesters.some((s) => s.id === urlSemester)) {
				setSelectedSemester(urlSemester);
			}
		};
		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	}, [semesters]);

	const emptySchedule: CourseSchedule = {
		monday: null,
		tuesday: null,
		wednesday: null,
		thursday: null,
		friday: null,
		saturday: null,
		sunday: null,
	};
	const [courseSchedule, setCourseSchedule] =
		useState<CourseSchedule>(emptySchedule);

	// "Same for all days" mode
	const [sameForAll, setSameForAll] = useState(true);
	const [selectedDays, setSelectedDays] = useState<Day[]>([
		'monday',
		'wednesday',
		'friday',
	]);
	// Shared time/location for all days
	const [startHour, setStartHour] = useState('10');
	const [startMinute, setStartMinute] = useState('00');
	const [startAMPM, setStartAMPM] = useState('AM');
	const [endHour, setEndHour] = useState('11');
	const [endMinute, setEndMinute] = useState('00');
	const [endAMPM, setEndAMPM] = useState('AM');
	const [location, setLocation] = useState('');

	// Per-day dialog state (only used if sameForAll is false)
	const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
	const [editingDay, setEditingDay] = useState<Day | null>(null);
	const [editingStartHour, setEditingStartHour] = useState('10');
	const [editingStartMinute, setEditingStartMinute] = useState('00');
	const [editingStartAMPM, setEditingStartAMPM] = useState('AM');
	const [editingEndHour, setEditingEndHour] = useState('11');
	const [editingEndMinute, setEditingEndMinute] = useState('00');
	const [editingEndAMPM, setEditingEndAMPM] = useState('AM');
	const [editingLocation, setEditingLocation] = useState('');

	// Helper for toggling day selection
	const toggleDay = (day: Day) => {
		setSelectedDays((prev) =>
			prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
		);
	};

	// Handler for saving the schedule in "same for all" mode
	const saveAllDays = () => {
		const startTime = `${startHour}:${startMinute} ${startAMPM}`;
		const endTime = `${endHour}:${endMinute} ${endAMPM}`;
		const updated: CourseSchedule = { ...courseSchedule };
		(Object.keys(updated) as Day[]).forEach((day) => {
			if (selectedDays.includes(day)) {
				updated[day] = {
					startTime,
					endTime,
					location,
				};
			} else {
				updated[day] = null;
			}
		});
		setCourseSchedule(updated);
		setScheduleDialogOpen(false);
	};

	// Handler for editing individual day (per-day mode)
	const openEditMeeting = (day: Day) => {
		const item = courseSchedule[day];
		setEditingDay(day);
		setEditingStartHour(item?.startTime.split(':')[0] || '10');
		const [sm, sap] = (item?.startTime.split(':')[1] || '00 AM').split(' ');
		setEditingStartMinute(sm);
		setEditingStartAMPM(sap || 'AM');
		setEditingEndHour(item?.endTime.split(':')[0] || '11');
		const [em, eap] = (item?.endTime.split(':')[1] || '00 AM').split(' ');
		setEditingEndMinute(em);
		setEditingEndAMPM(eap || 'AM');
		setEditingLocation(item?.location || '');
		setMeetingDialogOpen(true);
	};
	const openAddMeeting = (day: Day) => {
		setEditingDay(day);
		setEditingStartHour('10');
		setEditingStartMinute('00');
		setEditingStartAMPM('AM');
		setEditingEndHour('11');
		setEditingEndMinute('00');
		setEditingEndAMPM('AM');
		setEditingLocation('');
		setMeetingDialogOpen(true);
	};
	const saveMeeting = () => {
		if (!editingDay) return;
		const startTime = `${editingStartHour}:${editingStartMinute} ${editingStartAMPM}`;
		const endTime = `${editingEndHour}:${editingEndMinute} ${editingEndAMPM}`;
		setCourseSchedule((prev) => ({
			...prev,
			[editingDay]: {
				startTime,
				endTime,
				location: editingLocation,
			},
		}));
		setMeetingDialogOpen(false);
		setEditingDay(null);
	};

	const removeDay = (day: Day) => {
		setCourseSchedule((prev) => ({ ...prev, [day]: null }));
	};

	const resetForm = () => {
		setSemester('');
		setName('');
		setCode('');
		setCredits('');
		setInstructor('');
		setCourseLink('');
		setSyllabusLink('');
		setGradeSpreadsheetId('');
		setCourseSchedule(emptySchedule);
		setSelectedDays(['monday', 'wednesday', 'friday']);
		setSameForAll(true);
		setStartHour('10');
		setStartMinute('00');
		setStartAMPM('AM');
		setEndHour('11');
		setEndMinute('00');
		setEndAMPM('AM');
		setLocation('');
	};

	const saveNewCourse = async () => {
		let requiredOptions = [
			{
				name: 'Semester',
				value: semester,
			},
			{
				name: 'Course Name',
				value: name,
			},
			{
				name: 'Course Code',
				value: code,
			},
			{
				name: 'Credits',
				value: credits,
			},
			{
				name: 'Instructor',
				value: instructor,
			},
			{
				name: 'Course Link',
				value: courseLink,
			},
			{
				name: 'Syllabus Link',
				value: syllabusLink,
			},
		];

		// Check if all required options are filled
		for (let option of requiredOptions) {
			if (!option.value) {
				toast(`Missing required field: ${option.name}`);
				return;
			}
		}

		// Check if course schedule is set (if not online)
		if (
			!online &&
			Object.values(courseSchedule).every((item) => item === null)
		) {
			toast('Please set a course schedule.');
			return;
		}

		// Create new course object
		const newCourse: Course = {
			id: createId(),
			userId: getUserId(),
			semesterId: semester as SnowflakeId,
			name,
			code,
			credits: parseInt(credits, 10),
			instructor,
			schedule: courseSchedule,
			resources: [],
			online,
			courseLink,
			syllabusLink,
			gradeSpreadsheetId: gradeSpreadsheetId || undefined,
			grade: 0,
			assignmentIds: [],
		};

		// Save to database
		await getDB().saveCourse(newCourse);
		toast.success('Course added successfully!');
		setNewCourseOpen(false);
		resetForm();
	};

	function getQueryParam(name: string): string | null {
		const params = new URLSearchParams(window.location.search);
		return params.get(name);
	}

	function setQueryParam(name: string, value: string) {
		const params = new URLSearchParams(window.location.search);
		params.set(name, value);
		const newUrl =
			window.location.pathname + '?' + params.toString() + window.location.hash;
		window.history.replaceState({}, '', newUrl);
	}

	return (
		<div className='space-y-6 px-4 md:px-8 lg:px-12 xl:px-20 max-w-9xl mx-auto'>
			<div className='flex items-center justify-between'>
				<div>
					<h2 className='text-3xl font-bold tracking-tight'>Courses</h2>
					<p className='text-muted-foreground'>
						Manage your courses, view grades, and track assignments.
					</p>
				</div>
				<Dialog
					open={newCourseOpen}
					onOpenChange={(open) => {
						setNewCourseOpen(open);
						if (!open) resetForm();
					}}
				>
					<DialogTrigger asChild>
						<Button variant='secondary'>
							<Plus className='mr-2 h-4 w-4' />
							Add Course
						</Button>
					</DialogTrigger>
					<DialogContent className='sm:max-w-[475px] overflow-y-scroll max-h-screen'>
						<DialogHeader>
							<DialogTitle>Add New Course</DialogTitle>
							<DialogDescription>
								Enter the details of your course. Click save when you're done.
							</DialogDescription>
						</DialogHeader>
						<div className='grid gap-4 py-4'>
							<div className='grid gap-2'>
								<Label>Semester</Label>
								<Select value={semester} onValueChange={setSemester}>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Select semester' />
									</SelectTrigger>
									<SelectContent>
										{semesters.map((s) => (
											<SelectItem key={s.id} value={s.id}>
												{s.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='grid gap-2'>
								<Label>Course Name</Label>
								<Input
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder='e.g. Calculus I'
								/>
							</div>
							<div className='grid gap-2'>
								<Label>Course Code</Label>
								<Input
									value={code}
									onChange={(e) => setCode(e.target.value)}
									placeholder='e.g. MATH 2250'
								/>
							</div>
							<div className='grid gap-2'>
								<Label>Credits</Label>
								<Select value={credits} onValueChange={setCredits}>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Select credits' />
									</SelectTrigger>
									<SelectContent>
										{[1, 2, 3, 4, 5].map((n) => (
											<SelectItem key={n} value={n.toString()}>
												{n}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='grid gap-2'>
								<Label>Instructor</Label>
								<Input
									value={instructor}
									onChange={(e) => setInstructor(e.target.value)}
									placeholder='e.g. Dr. Smith'
								/>
							</div>

							<div className='grid gap-2'>
								<Label>Online</Label>
								<div className='flex items-center gap-2'>
									<Checkbox
										id='online'
										checked={online}
										onCheckedChange={(checked) => setOnline(Boolean(checked))}
									/>
									<Label htmlFor='online' className='cursor-pointer'>
										This course is online
									</Label>
								</div>
							</div>

							{!online && (
								<div className='grid gap-2'>
									<Label>Schedule</Label>
									<div className='flex items-center gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() => setScheduleDialogOpen(true)}
										>
											<CalendarClock className='mr-2 h-4 w-4' />
											Set Schedule
										</Button>
										<span className='text-xs text-muted-foreground line-clamp-2 max-w-[240px]'>
											{getGroupedScheduleSummary(courseSchedule, online)}
										</span>
									</div>
								</div>
							)}
							<div className='grid gap-2'>
								<Label>Course Link</Label>
								<Input
									value={courseLink}
									onChange={(e) => setCourseLink(e.target.value)}
									placeholder='e.g. https://elc.uga.edu'
								/>
							</div>
							<div className='grid gap-2'>
								<Label>Syllabus Link</Label>
								<Input
									value={syllabusLink}
									onChange={(e) => setSyllabusLink(e.target.value)}
									placeholder='e.g. https://syllabus.pdf'
								/>
							</div>
							<div className='grid gap-2'>
								<Label>Grade Spreadsheet ID</Label>
								<Input
									value={gradeSpreadsheetId}
									onChange={(e) => setGradeSpreadsheetId(e.target.value)}
									placeholder='(Optional)'
								/>
							</div>
						</div>
						<DialogFooter>
							<Button type='submit' onClick={saveNewCourse}>
								Save
							</Button>
						</DialogFooter>
						{/* SCHEDULE DIALOG */}
						<Dialog
							open={scheduleDialogOpen}
							onOpenChange={setScheduleDialogOpen}
						>
							<DialogContent className='sm:max-w-[480px] overflow-y-scroll max-h-screen'>
								<DialogHeader>
									<DialogTitle>Set Course Schedule</DialogTitle>
									<DialogDescription>
										Choose the meeting days, times, and location for this
										course.
									</DialogDescription>
								</DialogHeader>
								<div className='flex items-center gap-2 mb-2'>
									<Checkbox
										id='sameforall'
										checked={sameForAll}
										onCheckedChange={(checked) =>
											setSameForAll(Boolean(checked))
										}
									/>
									<Label htmlFor='sameforall' className='cursor-pointer'>
										Use same time/location for all selected days
									</Label>
								</div>
								<div className='grid grid-cols-4 gap-2 mb-2'>
									{sameForAll &&
										(Object.keys(emptySchedule) as Day[]).map((day) => (
											<label
												key={day}
												className='flex items-center gap-1 cursor-pointer select-none'
											>
												<Checkbox
													checked={selectedDays.includes(day)}
													onCheckedChange={() => toggleDay(day)}
													disabled={!sameForAll}
												/>
												<span>{DAY_NAMES[day]}</span>
											</label>
										))}
								</div>
								{sameForAll ? (
									<>
										<div className='flex gap-2 mb-2'>
											<Label className='w-12'>Start</Label>
											<Select value={startHour} onValueChange={setStartHour}>
												<SelectTrigger className='w-19'>
													<SelectValue placeholder='Hr' />
												</SelectTrigger>
												<SelectContent>
													{HOURS.map((h) => (
														<SelectItem key={h} value={h.toString()}>
															{h}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<Select
												value={startMinute}
												onValueChange={setStartMinute}
											>
												<SelectTrigger className='w-19'>
													<SelectValue placeholder='Min' />
												</SelectTrigger>
												<SelectContent>
													{MINUTES.map((m) => (
														<SelectItem key={m} value={m}>
															{m}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<Select value={startAMPM} onValueChange={setStartAMPM}>
												<SelectTrigger className='w-19'>
													<SelectValue placeholder='AM/PM' />
												</SelectTrigger>
												<SelectContent>
													{AMPM.map((a) => (
														<SelectItem key={a} value={a}>
															{a}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className='flex gap-2 mb-2'>
											<Label className='w-12'>End</Label>
											<Select value={endHour} onValueChange={setEndHour}>
												<SelectTrigger className='w-19'>
													<SelectValue placeholder='Hr' />
												</SelectTrigger>
												<SelectContent>
													{HOURS.map((h) => (
														<SelectItem key={h} value={h.toString()}>
															{h}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<Select value={endMinute} onValueChange={setEndMinute}>
												<SelectTrigger className='w-19'>
													<SelectValue placeholder='Min' />
												</SelectTrigger>
												<SelectContent>
													{MINUTES.map((m) => (
														<SelectItem key={m} value={m}>
															{m}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<Select value={endAMPM} onValueChange={setEndAMPM}>
												<SelectTrigger className='w-19'>
													<SelectValue placeholder='AM/PM' />
												</SelectTrigger>
												<SelectContent>
													{AMPM.map((a) => (
														<SelectItem key={a} value={a}>
															{a}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className='grid gap-2'>
											<Label>Location</Label>
											<Input
												value={location}
												onChange={(e) => setLocation(e.target.value)}
												placeholder='Location'
											/>
										</div>
										<DialogFooter>
											<Button
												onClick={saveAllDays}
												disabled={selectedDays.length === 0 || !location}
											>
												Save
											</Button>
										</DialogFooter>
									</>
								) : (
									<div className='grid gap-2'>
										{(Object.keys(emptySchedule) as Day[]).map((day) => (
											<div key={day} className='flex items-center gap-2'>
												<span className='w-16'>{DAY_NAMES[day]}</span>
												{courseSchedule[day] ? (
													<>
														<span className='text-xs'>
															{courseSchedule[day]?.startTime}–
															{courseSchedule[day]?.endTime} @{' '}
															{courseSchedule[day]?.location}
														</span>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => openEditMeeting(day)}
															title='Edit'
														>
															<Edit className='h-4 w-4' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => removeDay(day)}
															title='Remove'
														>
															<X className='h-4 w-4' />
														</Button>
													</>
												) : (
													<Button
														variant='outline'
														size='sm'
														onClick={() => openAddMeeting(day)}
													>
														Add
													</Button>
												)}
											</div>
										))}
										{/* MEETING DIALOG for per-day editing */}
										<Dialog
											open={meetingDialogOpen}
											onOpenChange={setMeetingDialogOpen}
										>
											<DialogContent className='sm:max-w-[350px]'>
												<DialogHeader>
													<DialogTitle>
														{editingDay
															? `Set Meeting: ${DAY_NAMES[editingDay]}`
															: 'Set Meeting'}
													</DialogTitle>
												</DialogHeader>
												<div className='space-y-2'>
													<div className='flex items-center gap-2'>
														<Label className='w-12'>Start</Label>
														<Select
															value={editingStartHour}
															onValueChange={setEditingStartHour}
														>
															<SelectTrigger className='w-19'>
																<SelectValue placeholder='Hr' />
															</SelectTrigger>
															<SelectContent>
																{HOURS.map((h) => (
																	<SelectItem key={h} value={h.toString()}>
																		{h}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<Select
															value={editingStartMinute}
															onValueChange={setEditingStartMinute}
														>
															<SelectTrigger className='w-19'>
																<SelectValue placeholder='Min' />
															</SelectTrigger>
															<SelectContent>
																{MINUTES.map((m) => (
																	<SelectItem key={m} value={m}>
																		{m}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<Select
															value={editingStartAMPM}
															onValueChange={setEditingStartAMPM}
														>
															<SelectTrigger className='w-19'>
																<SelectValue placeholder='AM/PM' />
															</SelectTrigger>
															<SelectContent>
																{AMPM.map((a) => (
																	<SelectItem key={a} value={a}>
																		{a}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
													<div className='flex items-center gap-2'>
														<Label className='w-12'>End</Label>
														<Select
															value={editingEndHour}
															onValueChange={setEditingEndHour}
														>
															<SelectTrigger className='w-19'>
																<SelectValue placeholder='Hr' />
															</SelectTrigger>
															<SelectContent>
																{HOURS.map((h) => (
																	<SelectItem key={h} value={h.toString()}>
																		{h}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<Select
															value={editingEndMinute}
															onValueChange={setEditingEndMinute}
														>
															<SelectTrigger className='w-19'>
																<SelectValue placeholder='Min' />
															</SelectTrigger>
															<SelectContent>
																{MINUTES.map((m) => (
																	<SelectItem key={m} value={m}>
																		{m}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<Select
															value={editingEndAMPM}
															onValueChange={setEditingEndAMPM}
														>
															<SelectTrigger className='w-19'>
																<SelectValue placeholder='AM/PM' />
															</SelectTrigger>
															<SelectContent>
																{AMPM.map((a) => (
																	<SelectItem key={a} value={a}>
																		{a}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
													<div className='grid gap-2'>
														<Label>Location</Label>
														<Input
															value={editingLocation}
															onChange={(e) =>
																setEditingLocation(e.target.value)
															}
															placeholder='Location'
														/>
													</div>
												</div>
												<DialogFooter>
													<Button
														type='button'
														onClick={saveMeeting}
														disabled={!editingLocation}
													>
														Save
													</Button>
												</DialogFooter>
											</DialogContent>
										</Dialog>
									</div>
								)}
							</DialogContent>
						</Dialog>
					</DialogContent>
				</Dialog>
			</div>

			<div className='mt-10'>
				<CoursesView
					semesters={semesters}
					courses={courses}
					selectedSemester={selectedSemester}
					setSelectedSemester={setSelectedSemester}
				/>
			</div>
		</div>
	);
}

export default DashboardCourses;

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function GradeCircle({ grade }: { grade: number }) {
	const pct = Math.max(0, Math.min(grade, 100));
	const radius = 22;
	const stroke = 4;
	const circ = 2 * Math.PI * radius;
	const progress = ((100 - pct) / 100) * circ;

	let color = '#22c55e'; // Default: A (green)

	if (pct < 59.5) color = '#ef4444'; // F: red
	else if (pct < 69.5) color = '#fbbf24'; // D: amber
	else if (pct < 79.5) color = '#eab308'; // C: yellow
	else if (pct < 89.5) color = '#38bdf8'; // B: blue
	else color = '#22c55e'; // A: green

	return (
		<div className='relative w-14 h-14'>
			<svg width={56} height={56} className='rotate-[-90deg]'>
				<circle
					cx={28}
					cy={28}
					r={radius}
					fill='none'
					stroke={color}
					strokeWidth={stroke}
					strokeDasharray={circ}
					strokeDashoffset={progress}
					strokeLinecap='round'
					style={{ transition: 'stroke-dashoffset 0.6s' }}
				/>
			</svg>
			<div className='absolute inset-0 flex flex-col items-center justify-center'>
				<span className='font-bold text-lg'>{Math.round(pct)}</span>
			</div>
		</div>
	);
}

function CoursesView({
	semesters,
	courses,
	selectedSemester,
	setSelectedSemester,
}: {
	semesters: Semester[];
	courses: Course[];
	selectedSemester: string;
	setSelectedSemester: (id: string) => void;
}) {
	const filteredCourses = selectedSemester
		? courses.filter((c) => c.semesterId === selectedSemester)
		: courses;

	return (
		<>
			<div className='flex items-center gap-4 justify-between flex-wrap'>
				<div className='flex items-center gap-2'>
					<Select value={selectedSemester} onValueChange={setSelectedSemester}>
						<SelectTrigger className='w-48'>
							<SelectValue placeholder='Select semester' />
						</SelectTrigger>
						<SelectContent>
							{semesters.map((s) => (
								<SelectItem key={s.id} value={s.id}>
									{s.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			{filteredCourses.length === 0 ? (
				<div className='text-muted-foreground text-center mt-8'>
					No courses found for this semester.
				</div>
			) : (
				<div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4'>
					{filteredCourses.map((course) => (
						<Card className=' h-full shadow-md hover:shadow-lg transition-shadow'>
							<CardHeader className='relative'>
								{/* GRADE CIRCLE: this is a sibling to the card info, NOT inside any flex */}
								<div
									className='absolute right-4 z-10'
									style={{
										top: '-10px',
									}}
								>
									<GradeCircle grade={course.grade} />
								</div>
								<div>
									<div className='flex items-center mb-2'>
										<Badge variant='outline'>{course.code}</Badge>
									</div>
									<CardTitle className='text-lg font-semibold'>
										{course.name}
									</CardTitle>
									<CardDescription className='mt-1.5'>
										{course.instructor}
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className='flex flex-col gap-2'>
								<div className='text-sm text-muted-foreground'>
									<Calendar className='mr-2 h-4 w-4 inline mb-1' />
									{getGroupedScheduleSummary(course.schedule, course.online)}
								</div>
								<div className='text-sm text-muted-foreground'>
									<BadgeInfo className='mr-2 h-4 w-4 inline mb-1' />
									{course.credits} Credits
								</div>
							</CardContent>
							<CardFooter className='flex justify-between items-center'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										window.open(course.syllabusLink, '_blank');
									}}
								>
									<FileText className='mr-2 h-4 w-4' />
									Syllabus
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										window.open(course.courseLink, '_blank');
									}}
								>
									<ExternalLink className='mr-2 h-4 w-4' />
									eLC
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</>
	);
}
