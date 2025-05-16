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
import { Plus, CalendarClock, X, Edit } from 'lucide-react';
import { useState } from 'react';

type Day =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday'
	| 'sunday';

interface CourseScheduleItem {
	startTime: string; // '10:30 AM'
	endTime: string;
	location: string;
}
type CourseSchedule = Record<Day, CourseScheduleItem | null>;

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

function getGroupedScheduleSummary(schedule: CourseSchedule): string {
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
	const [newCourseOpen, setNewCourseOpen] = useState(false);
	const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

	// Main course state
	const [semester, setSemester] = useState('');
	const [name, setName] = useState('');
	const [code, setCode] = useState('');
	const [credits, setCredits] = useState('');
	const [instructor, setInstructor] = useState('');
	const [courseLink, setCourseLink] = useState('');
	const [syllabusLink, setSyllabusLink] = useState('');
	const [gradeSpreadsheetId, setGradeSpreadsheetId] = useState('');

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
								<Input
									value={semester}
									onChange={(e) => setSemester(e.target.value)}
									placeholder='e.g. Fall 2025'
								/>
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
										{getGroupedScheduleSummary(courseSchedule)}
									</span>
								</div>
							</div>
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
							<Button type='submit'>Save</Button>
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
		</div>
	);
}

export default DashboardCourses;
