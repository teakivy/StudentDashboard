import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent } from '@/components/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { getDB, getUserId } from '@/lib/managers/firestoreManager';
import { createId } from '@/lib/snowflake';
import type { Semester, SnowflakeId } from '@/lib/types';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { PopoverTrigger } from '@radix-ui/react-popover';
import {
	CalendarIcon,
	CircleCheck,
	Plus,
	Star,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	calculateSemesterCredits,
	calculateSemesterGPA,
	cn,
} from '@/lib/utils';
import { format } from 'date-fns';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

function DashboardSemesters() {
	const isMobile = useIsMobile();
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [open, setOpen] = useState(false);
	const [formData, setFormData] = useState({
		term: 'Fall',
		year: '2025',
		startDate: '',
		endDate: '',
	});
	const [startDate, setStartDate] = useState<Date>();
	const [endDate, setEndDate] = useState<Date>();
	const [gpas, setGpas] = useState<Map<SnowflakeId, number>>(new Map());
	const [credits, setCredits] = useState<Map<SnowflakeId, number>>(new Map());

	useEffect(() => {
		const fetchSemesters = async () => {
			let semesters = await getDB().getAllSemesters();
			setSemesters(semesters);
			const gpas = new Map<SnowflakeId, number>();
			for (const semester of semesters) {
				const gpa = await calculateSemesterGPA(semester.id);
				gpas.set(semester.id, gpa);
			}
			setGpas(gpas);

			const credits = new Map<SnowflakeId, number>();
			for (const semester of semesters) {
				const credit = await calculateSemesterCredits(semester.id);
				credits.set(semester.id, credit);
			}
			setCredits(credits);
		};

		fetchSemesters();
	}, []);

	const handleSelectChange = (name: string, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleStartDateChange = (date: Date | undefined) => {
		setStartDate(date);

		if (date) {
			setFormData((prev) => {
				const newState = { ...prev, startDate: format(date, 'yyyy-MM-dd') };

				// If endDate is before new startDate, clear it
				if (prev.endDate && new Date(prev.endDate) <= date) {
					newState.endDate = '';
					setEndDate(undefined);
				}

				return newState;
			});
		}
	};

	const handleEndDateChange = (date: Date | undefined) => {
		if (!date || (startDate && date > startDate)) {
			setEndDate(date);
			if (date) {
				setFormData((prev) => ({
					...prev,
					endDate: format(date, 'yyyy-MM-dd'),
				}));
			}
		} else {
			// Invalid endDate — clear it
			setEndDate(undefined);
			setFormData((prev) => ({ ...prev, endDate: '' }));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!startDate || !endDate) {
			toast.error('Start and end dates are required.');
			return;
		}

		const newSemester: Semester = {
			id: createId(),
			userId: getUserId(),
			year: Number.parseInt(formData.year),
			term: formData.term as 'fall' | 'spring' | 'summer',
			name: `${formData.term} ${formData.year}`,
			startDate,
			endDate,
			courseIds: [],
			status: getSemesterStatus(formData.startDate, formData.endDate),
		};

		setSemesters((prev) => [...prev, newSemester]);
		setOpen(false);
		resetForm();

		toast.success('Semester added', {
			description: `${newSemester.term} ${newSemester.year} has been created.`,
		});

		await getDB().saveSemester(newSemester);
		resetForm();
	};

	const getSemesterStatus = (startDate: string, endDate: string) => {
		const now = new Date();
		const start = new Date(startDate);
		const end = new Date(endDate);
		if (start > now) {
			return 'upcoming';
		} else if (end < now) {
			return 'completed';
		} else {
			return 'current';
		}
	};

	const resetForm = () => {
		setFormData({
			term: 'Fall',
			year: '2025',
			startDate: '',
			endDate: '',
		});
		setStartDate(undefined);
		setEndDate(undefined);
	};

	const formatDate = (date: Date) => {
		if (!date) return '';
		if (date === null) return '';
		return format(date, 'MMM d, yyyy');
	};

	// Calculate days remaining in semester
	const getDaysRemaining = (end: Date) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		end.setHours(0, 0, 0, 0);
		const diffTime = end.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays > 0 ? diffDays : 0;
	};

	// Calculate semester progress
	const getSemesterProgress = (startDate: Date, endDate: Date) => {
		const start = startDate.getTime();
		const end = endDate.getTime();
		const today = new Date().getTime();
		const totalDays = (end - start) / (1000 * 60 * 60 * 24);
		const daysElapsed = (today - start) / (1000 * 60 * 60 * 24);
		const progress = (daysElapsed / totalDays) * 100;
		return Math.min(Math.max(0, Math.round(progress)), 100);
	};

	const currentSemester = semesters.find((s) => s.status === 'current');
	const pastSemesters = semesters
		.filter((s) => s.status === 'completed')
		.sort(
			(a, b) =>
				new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
		);
	const upcomingSemesters = semesters
		.filter((s) => s.status === 'upcoming')
		.sort(
			(a, b) =>
				new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
		);

	return (
		<div className='space-y-6 px-4 md:px-8 lg:px-12 xl:px-20 max-w-9xl mx-auto'>
			<div className='flex items-center justify-between'>
				<div>
					<h2 className='text-3xl font-bold tracking-tight'>Semesters</h2>
					<p className='text-muted-foreground'>Manage your academic terms</p>
				</div>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button variant='secondary'>
							<Plus className='mr-2 h-4 w-4' />
							Add Semester
						</Button>
					</DialogTrigger>
					<DialogContent className='sm:max-w-[425px]'>
						<DialogHeader>
							<DialogTitle>Add New Semester</DialogTitle>
							<DialogDescription>
								Enter the details of your semester. Click save when you're done.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit}>
							<div className='grid gap-4 py-4'>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor='term' className='text-right'>
										Term
									</Label>
									<Select
										value={formData.term}
										onValueChange={(value) => handleSelectChange('term', value)}
									>
										<SelectTrigger className='col-span-3'>
											<SelectValue placeholder='Select term' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='Spring'>Spring</SelectItem>
											<SelectItem value='Summer'>Summer</SelectItem>
											<SelectItem value='Fall'>Fall</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor='year' className='text-right'>
										Year
									</Label>
									<Select
										value={formData.year}
										onValueChange={(value) => handleSelectChange('year', value)}
									>
										<SelectTrigger className='col-span-3'>
											<SelectValue placeholder='Select year' />
										</SelectTrigger>
										<SelectContent>
											{/* generate 2000-2030 */}
											{Array.from({ length: 31 }, (_, i) => (
												<SelectItem key={i} value={`${2000 + i}`}>
													{2000 + i}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor='startDate' className='text-right'>
										Start Date
									</Label>
									<div className='col-span-3'>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant={'outline'}
													className={cn(
														'w-full justify-start text-left font-normal',
														!startDate && 'text-muted-foreground'
													)}
												>
													<CalendarIcon className='mr-2 h-4 w-4' />
													{startDate ? (
														format(startDate, 'PPP')
													) : (
														<span>Pick a date</span>
													)}
												</Button>
											</PopoverTrigger>
											<PopoverContent className='w-auto p-0'>
												<Calendar
													mode='single'
													selected={startDate}
													onSelect={handleStartDateChange}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
									</div>
								</div>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label className='text-right'>End Date</Label>
									<div className='col-span-3'>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant='outline'
													className={cn(
														'w-full justify-start text-left font-normal',
														!endDate && 'text-muted-foreground'
													)}
												>
													<CalendarIcon className='mr-2 h-4 w-4' />
													{endDate ? format(endDate, 'PPP') : 'Pick a date'}
												</Button>
											</PopoverTrigger>
											<PopoverContent className='w-auto p-0'>
												<Calendar
													mode='single'
													selected={endDate}
													onSelect={handleEndDateChange}
													disabled={(date) =>
														startDate ? date <= startDate : false
													}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
									</div>
								</div>
							</div>
							<DialogFooter>
								<Button
									type='button'
									variant='outline'
									onClick={() => {
										setOpen(false);
										resetForm();
									}}
								>
									Cancel
								</Button>
								<Button type='submit'>Save Semester</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Current Semester */}
			{currentSemester && (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Current Semester</h3>

					<Card className=''>
						<CardHeader className='pb-2'>
							<div className='flex justify-between items-start'>
								<div>
									<div className='flex items-center gap-2'>
										<Star className='h-5 w-5 text-red-500 fill-red-500' />
										<CardTitle>{currentSemester.name}</CardTitle>
									</div>
									{!isMobile && (
										<CardDescription className='mt-1'>
											{formatDate(currentSemester.startDate)} -{' '}
											{formatDate(currentSemester.endDate)}
										</CardDescription>
									)}
								</div>
								<Badge className='bg-red-500 text-white font-bold'>
									Current
								</Badge>
							</div>
						</CardHeader>
						<CardContent className='pb-2'>
							<div className='grid grid-cols-3 gap-4 text-sm'>
								<div>
									<div className='text-muted-foreground'>Courses</div>
									<div className='font-medium'>
										{currentSemester.courseIds.length}
									</div>
								</div>
								<div>
									<div className='text-muted-foreground'>Credits</div>
									<div className='font-medium'>
										{credits.get(currentSemester.id) == -1
											? '—'
											: credits.get(currentSemester.id)}
									</div>
								</div>
								<div>
									<div className='text-muted-foreground'>GPA</div>
									<div className='font-medium'>
										{gpas.get(currentSemester.id) == -1
											? '—'
											: gpas.get(currentSemester.id)}
									</div>
								</div>
							</div>
							<div className='mt-4'>
								<div className='flex justify-between text-xs mb-1'>
									<span>Semester Progress</span>
									<span>
										{getSemesterProgress(
											currentSemester.startDate,
											currentSemester.endDate
										)}
										%
									</span>
								</div>
								<Progress
									value={getSemesterProgress(
										currentSemester.startDate,
										currentSemester.endDate
									)}
									className='h-2'
								/>
								<div className='text-xs text-muted-foreground mt-1 text-right'>
									{getDaysRemaining(currentSemester.endDate)} days remaining
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{upcomingSemesters.length > 0 && (
				<div className='space-y-4'>
					<h3 className='text-lg font-semibold mb-2'>
						Upcoming Semester{upcomingSemesters.length > 1 ? 's' : ''}
					</h3>

					<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
						{upcomingSemesters.map((semester) => (
							<Card key={semester.id} className='h-full'>
								<CardHeader className='pb-2'>
									<div className='flex justify-between items-start'>
										<div>
											<div className='flex items-center gap-2'>
												<CalendarIcon className='h-5 w-5 text-red-500 mt-1' />
												<CardTitle className='text-base font-semibold'>
													{semester.name}
												</CardTitle>
											</div>
											{!isMobile && (
												<CardDescription className='text-sm text-muted-foreground mt-0.5'>
													{formatDate(semester.startDate)} –{' '}
													{formatDate(semester.endDate)}
												</CardDescription>
											)}
										</div>
										<Badge
											variant='outline'
											className='text-xs h-6 px-2 py-1 mt-1'
										>
											Upcoming
										</Badge>
									</div>
								</CardHeader>
								<CardContent className='pb-4 pt-1'>
									<div className='grid grid-cols-3 gap-x-4 gap-y-1 text-sm'>
										<div>
											<div className='text-muted-foreground'>Courses</div>
											<div className='font-medium'>
												{semester.courseIds.length}
											</div>
										</div>
										<div>
											<div className='text-muted-foreground'>Credits</div>
											<div className='font-medium'>
												{credits.get(semester.id) == -1
													? '—'
													: credits.get(semester.id)}
											</div>
										</div>
										<div>
											<div className='text-muted-foreground'>GPA</div>
											<div className='font-medium'>
												{gpas.get(semester.id) == -1
													? '—'
													: gpas.get(semester.id)}
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			)}

			{pastSemesters.length > 0 && (
				<div className='space-y-4'>
					<h3 className='text-lg font-semibold mb-2'>
						Past Semester{upcomingSemesters.length > 1 ? 's' : ''}
					</h3>

					<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
						{pastSemesters.map((semester) => (
							<Card key={semester.id} className='h-full'>
								<CardHeader className='pb-2'>
									<div className='flex justify-between items-start'>
										<div>
											<div className='flex items-center gap-2'>
												<CircleCheck className='h-5 w-5 text-red-500 mt-1' />
												<CardTitle className='text-base font-semibold'>
													{semester.name}
												</CardTitle>
											</div>
											{!isMobile && (
												<CardDescription className='text-sm text-muted-foreground mt-0.5'>
													{formatDate(semester.startDate)} –{' '}
													{formatDate(semester.endDate)}
												</CardDescription>
											)}
										</div>
										<Badge
											variant='outline'
											className='text-xs h-6 px-2 py-1 mt-1'
										>
											Completed
										</Badge>
									</div>
								</CardHeader>
								<CardContent className='pb-4 pt-1'>
									<div className='grid grid-cols-3 gap-x-4 gap-y-1 text-sm'>
										<div>
											<div className='text-muted-foreground'>Courses</div>
											<div className='font-medium'>
												{semester.courseIds.length}
											</div>
										</div>
										<div>
											<div className='text-muted-foreground'>Credits</div>
											<div className='font-medium'>
												{credits.get(semester.id) == -1
													? '—'
													: credits.get(semester.id)}
											</div>
										</div>
										<div>
											<div className='text-muted-foreground'>GPA</div>
											<div className='font-medium'>
												{gpas.get(semester.id) == -1
													? '—'
													: gpas.get(semester.id)}
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default DashboardSemesters;
