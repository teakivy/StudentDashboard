// src/pages/Home/Tabs/Assignments/DashboardAssignments.tsx
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getDB, getUserId } from '@/lib/managers/firestoreManager';
import { createId } from '@/lib/snowflake';

import type {
	Assignment,
	Course,
	Semester,
	SnowflakeId,
	ResourceLink,
} from '@/lib/types';

import {
	CheckCircle2,
	Circle,
	Minus,
	Link2,
	PencilLine,
	Trash2,
	Filter,
	Plus,
	Clock,
} from 'lucide-react';

/* ---------------- helpers ---------------- */

const STATUS_LABEL: Record<Assignment['status'], string> = {
	not_started: 'Not Started',
	in_progress: 'In Progress',
	completed: 'Completed',
	overdue: 'Overdue',
};

const CATEGORY_LABEL: Record<Assignment['category'], string> = {
	homework: 'Homework',
	project: 'Project',
	exam: 'Exam',
	quiz: 'Quiz',
	lab: 'Lab',
	essay: 'Essay',
	reading: 'Reading',
	other: 'Other',
};

function formatDue(date: Date) {
	const day = date.toLocaleDateString([], {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
	const time = date
		.toLocaleTimeString([], {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		})
		.replace(/\s?(am|pm)$/i, (_, ap) => ` ${ap.toUpperCase()}`);
	return `${day} at ${time}`;
}

function daysLeft(due: Date) {
	const now = new Date();
	return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function cycleStatus(
	base: Exclude<Assignment['status'], 'overdue'>
): Exclude<Assignment['status'], 'overdue'> {
	if (base === 'not_started') return 'in_progress';
	if (base === 'in_progress') return 'completed';
	return 'not_started';
}

/* -------- add/edit dialog draft -------- */

type Draft = {
	id?: SnowflakeId;
	name: string;
	description: string;
	courseId: SnowflakeId | '';
	semesterId: SnowflakeId | '';
	category: Assignment['category'];
	status: Exclude<Assignment['status'], 'overdue'>; // we never set overdue explicitly
	dueDateLocal: string; // YYYY-MM-DD
	dueTimeLocal: string; // HH:mm
	linkTitle: string;
	linkUrl: string;
};

const EMPTY_DRAFT: Draft = {
	name: '',
	description: '',
	courseId: '',
	semesterId: '',
	category: 'homework',
	status: 'not_started',
	dueDateLocal: '',
	dueTimeLocal: '23:59',
	linkTitle: '',
	linkUrl: '',
};

function localToDate(dateStr: string, timeStr: string) {
	const [yy, mm, dd] = dateStr.split('-').map(Number);
	const [h, m] = timeStr.split(':').map(Number);
	const d = new Date();
	d.setFullYear(yy || d.getFullYear(), (mm || 1) - 1, dd || 1);
	d.setHours(h || 0, m || 0, 0, 0);
	return d;
}

/* ---------------- component ---------------- */

export default function DashboardAssignments() {
	const [semesters, setSemesters] = useState<Semester[]>([]);
	const [courses, setCourses] = useState<Course[]>([]);
	const [assignments, setAssignments] = useState<Assignment[]>([]);

	// filters
	const [selectedSemester, setSelectedSemester] = useState<string>('');
	const [selectedCourse, setSelectedCourse] = useState<string>('all');
	const [hideCompleted, setHideCompleted] = useState(true);
	const [hideOverdue, setHideOverdue] = useState(false);
	const [query, setQuery] = useState('');
	const [filterOpen, setFilterOpen] = useState(false);

	// dialog
	const [dialogOpen, setDialogOpen] = useState(false);
	const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
	const [isEditing, setIsEditing] = useState(false);

	useEffect(() => {
		(async () => {
			const db = getDB();
			const s = await db.getAllSemesters();
			s.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
			setSemesters(s);

			const c = await db.getAllCourses();
			c.sort((a, b) => (a.code < b.code ? -1 : 1));
			setCourses(c);

			const a = await db.getAllAssignments();
			setAssignments(a);

			if (s.length && !selectedSemester) setSelectedSemester(s[0].id);
		})().catch((e) => {
			console.error(e);
			toast.error('Failed to load assignments');
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// apply derived overdue first, then filter
	const now = new Date();
	const derived = useMemo(
		() =>
			assignments.map((a) =>
				a.status !== 'completed' && a.dueDate < now
					? { ...a, status: 'overdue' as const }
					: a
			),
		[assignments]
	);

	const filtered = useMemo(() => {
		let list = derived;

		if (selectedSemester)
			list = list.filter((a) => a.semesterId === selectedSemester);
		if (selectedCourse !== 'all')
			list = list.filter((a) => a.courseId === selectedCourse);
		if (hideCompleted) list = list.filter((a) => a.status !== 'completed');
		if (hideOverdue) list = list.filter((a) => a.status !== 'overdue');
		if (query.trim()) {
			const q = query.toLowerCase();
			list = list.filter(
				(a) =>
					a.name.toLowerCase().includes(q) ||
					(a.description ?? '').toLowerCase().includes(q)
			);
		}

		return (() => {
			const active = list
				.filter((a) => a.status === 'not_started' || a.status === 'in_progress')
				.slice() // don’t mutate `list`
				.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

			const done = list
				.filter((a) => a.status === 'completed' || a.status === 'overdue')
				.slice()
				.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

			return [...active, ...done];
		})();
	}, [
		derived,
		selectedSemester,
		selectedCourse,
		hideCompleted,
		hideOverdue,
		query,
	]);

	/* ---------------- actions ---------------- */

	async function updateStatus(id: SnowflakeId, status: Assignment['status']) {
		try {
			await getDB().updateAssignment(id, { status });
			setAssignments((prev) =>
				prev.map((x) => (x.id === id ? { ...x, status } : x))
			);
		} catch (e) {
			console.error(e);
			toast.error('Failed to update status');
		}
	}

	async function deleteAssignment(id: SnowflakeId) {
		try {
			await getDB().deleteAssignment(id);
			setAssignments((prev) => prev.filter((x) => x.id !== id));
			toast.success('Assignment deleted');
		} catch (e) {
			console.error(e);
			toast.error('Failed to delete');
		}
	}

	function openAdd() {
		setIsEditing(false);
		setDraft({
			...EMPTY_DRAFT,
			semesterId: (selectedSemester as SnowflakeId) || '',
		});
		setDialogOpen(true);
	}

	function openEdit(a: Assignment) {
		const due = a.dueDate;
		const dueDateLocal = `${due.getFullYear()}-${String(
			due.getMonth() + 1
		).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;
		const dueTimeLocal = `${String(due.getHours()).padStart(2, '0')}:${String(
			due.getMinutes()
		).padStart(2, '0')}`;
		const firstRes: ResourceLink | undefined = a.resources?.[0];

		setIsEditing(true);
		setDraft({
			id: a.id,
			name: a.name,
			description: a.description ?? '',
			courseId: a.courseId,
			semesterId: a.semesterId,
			category: a.category,
			status: a.status === 'overdue' ? 'not_started' : a.status, // don't store overdue
			dueDateLocal,
			dueTimeLocal,
			linkTitle: firstRes?.title || (a.assignmentLink ? 'Link' : ''),
			linkUrl: a.assignmentLink || firstRes?.url || '',
		});
		setDialogOpen(true);
	}

	async function saveDraft() {
		// validate
		const required: Array<[string, string]> = [
			['Assignment Name', draft.name],
			['Semester', String(draft.semesterId)],
			['Course', String(draft.courseId)],
			['Due Date', draft.dueDateLocal],
		];
		for (const [label, val] of required) {
			if (!val) {
				toast(`Missing required field: ${label}`);
				return;
			}
		}

		const due = localToDate(draft.dueDateLocal, draft.dueTimeLocal || '23:59');
		const userId = getUserId();
		const baseUpdates: Partial<Assignment> = {
			name: draft.name,
			description: draft.description || null,
			dueDate: due,
			courseId: draft.courseId as SnowflakeId,
			semesterId: draft.semesterId as SnowflakeId,
			assignmentLink: draft.linkUrl || '',
			resources: draft.linkUrl
				? [{ url: draft.linkUrl, title: draft.linkTitle || 'Link' }]
				: [],
			category: draft.category,
			status: draft.status,
			userId,
		};

		try {
			const db = getDB();
			if (isEditing && draft.id) {
				await db.updateAssignment(draft.id, baseUpdates);
				setAssignments((prev) =>
					prev.map((x) =>
						x.id === draft.id ? { ...x, ...(baseUpdates as Assignment) } : x
					)
				);
				toast.success('Assignment updated');
			} else {
				const id = createId();
				const newAssignment: Assignment = {
					id,
					userId,
					name: baseUpdates.name!,
					description: baseUpdates.description ?? null,
					dueDate: baseUpdates.dueDate!,
					courseId: baseUpdates.courseId!,
					semesterId: baseUpdates.semesterId!,
					resources: baseUpdates.resources || [],
					assignmentLink: baseUpdates.assignmentLink || '',
					status: baseUpdates.status || 'not_started',
					category: baseUpdates.category || 'other',
				};
				// Your helper likely has saveAssignment; if named differently, tweak here.
				await db.saveAssignment(newAssignment);
				setAssignments((prev) => [...prev, newAssignment]);
				toast.success('Assignment added');
			}
			setDialogOpen(false);
			setIsEditing(false);
			setDraft(EMPTY_DRAFT);
		} catch (e) {
			console.error(e);
			toast.error('Failed to save assignment');
		}
	}

	async function onCycle(a: Assignment) {
		const base: Exclude<Assignment['status'], 'overdue'> =
			a.status === 'overdue'
				? 'not_started'
				: (a.status as Exclude<Assignment['status'], 'overdue'>);
		const next = cycleStatus(base);
		await updateStatus(a.id, next);
	}

	/* ---------------- UI ---------------- */

	return (
		<div className='space-y-6 px-4 md:px-8 lg:px-12 xl:px-20 max-w-9xl mx-auto'>
			<div className='flex items-center justify-between gap-3 flex-wrap'>
				<div>
					<h2 className='text-3xl font-bold tracking-tight'>Assignments</h2>
					<p className='text-muted-foreground'>
						See what's due, what's done, and what's next.
					</p>
				</div>

				{/* right-controls: Search • Filter • Add */}
				<div className='flex items-center gap-2'>
					{/* Filter */}
					<div className='flex items-center gap-2'>
						{/* Search */}
						<Input
							className='w-64'
							placeholder='Search assignments…'
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>

						{/* Filter (Dialog) */}
						<Dialog open={filterOpen} onOpenChange={setFilterOpen}>
							<DialogTrigger asChild>
								<Button variant='outline' className='cursor-pointer'>
									<Filter className='h-4 w-4 mr-2' />
									Filter
								</Button>
							</DialogTrigger>

							<DialogContent className='sm:max-w-[520px]'>
								<DialogHeader>
									<DialogTitle>Filters</DialogTitle>
									<DialogDescription>Refine the list below.</DialogDescription>
								</DialogHeader>

								<div className='grid gap-4 py-2'>
									<div className='grid gap-2'>
										<Label>Semester</Label>
										<Select
											value={selectedSemester}
											onValueChange={setSelectedSemester}
										>
											<SelectTrigger className='w-full cursor-pointer'>
												<SelectValue placeholder='Select semester' />
											</SelectTrigger>
											<SelectContent className='cursor-pointer'>
												{semesters.map((s) => (
													<SelectItem key={s.id} value={s.id}>
														{s.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className='grid gap-2'>
										<Label>Course</Label>
										<Select
											value={selectedCourse}
											onValueChange={setSelectedCourse}
										>
											<SelectTrigger className='w-full cursor-pointer'>
												<SelectValue placeholder='All courses' />
											</SelectTrigger>
											<SelectContent className='cursor-pointer'>
												<SelectItem value='all'>All Courses</SelectItem>
												{courses
													.filter(
														(c) =>
															!selectedSemester ||
															c.semesterId === selectedSemester
													)
													.map((c) => (
														<SelectItem key={c.id} value={c.id}>
															{c.code} — {c.name}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
									</div>

									<div className='flex items-center justify-between'>
										<label className='flex items-center gap-2 cursor-pointer select-none'>
											<Checkbox
												checked={hideCompleted}
												onCheckedChange={(v) => setHideCompleted(Boolean(v))}
											/>
											<span className='text-sm'>Hide completed</span>
										</label>
										<label className='flex items-center gap-2 cursor-pointer select-none'>
											<Checkbox
												checked={hideOverdue}
												onCheckedChange={(v) => setHideOverdue(Boolean(v))}
											/>
											<span className='text-sm'>Hide overdue</span>
										</label>
									</div>
								</div>

								<DialogFooter className='flex items-center justify-between'>
									<Button
										variant='ghost'
										onClick={() => {
											setSelectedCourse('all');
											setHideCompleted(true);
											setHideOverdue(false);
										}}
										className='cursor-pointer'
									>
										Reset
									</Button>
									<Button
										onClick={() => setFilterOpen(false)}
										className='cursor-pointer'
									>
										Apply
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						{/* Add */}
						<Button
							variant='secondary'
							className='cursor-pointer'
							onClick={openAdd}
						>
							<Plus className='h-4 w-4 mr-2' />
							Add Assignment
						</Button>
					</div>
				</div>
			</div>

			{/* List */}
			<div className='space-y-3'>
				{filtered.length === 0 ? (
					<Card className='p-6 text-center text-muted-foreground'>
						No assignments found.
					</Card>
				) : (
					filtered.map((a) => {
						const course = courses.find((c) => c.id === a.courseId);
						const dueStr = formatDue(a.dueDate);
						const dl = daysLeft(a.dueDate);

						const chip =
							a.status === 'completed'
								? 'bg-emerald-900/30 text-emerald-200'
								: a.status === 'overdue'
								? 'bg-rose-900/30 text-rose-200'
								: a.status === 'in_progress'
								? 'bg-amber-900/30 text-amber-200'
								: 'bg-zinc-800 text-zinc-200';

						return (
							<Card key={a.id} className='p-4 md:p-5'>
								<div className='flex items-start gap-3'>
									{/* status circle (cycles) */}
									<button
										onClick={() => onCycle(a)}
										className='rounded-full p-1 hover:bg-accent transition mt-0.5'
										aria-label='Cycle status'
										title='Click to cycle status'
									>
										{a.status === 'completed' ? (
											<CheckCircle2 className='h-5 w-5 text-emerald-400' />
										) : a.status === 'in_progress' ? (
											<span className='relative inline-flex items-center justify-center w-5 h-5'>
												<Circle className='h-5 w-5 text-amber-400' />
												<Minus className='h-3 w-3 absolute text-amber-400' />
											</span>
										) : (
											<Circle className='h-5 w-5 text-muted-foreground' />
										)}
									</button>

									{/* content */}
									<div className='flex-1 min-w-0'>
										<div className='flex items-center gap-2 text-xs mb-1'>
											{course && (
												<span className='px-2 py-0.5 rounded border border-zinc-700 text-zinc-200'>
													{course.code}
												</span>
											)}
											<span className={`px-2 py-0.5 rounded ${chip}`}>
												{STATUS_LABEL[a.status]}
											</span>
											<span className='text-zinc-400'>
												• {CATEGORY_LABEL[a.category]}
											</span>
										</div>

										<div className='text-base font-semibold truncate'>
											{a.name}
										</div>

										{a.description && (
											<div className='text-sm text-muted-foreground mt-1'>
												{a.description}
											</div>
										)}

										<div className='text-sm text-muted-foreground mt-1 flex items-center gap-2'>
											<Clock className='h-4 w-4' />
											<span>
												<strong>Due:</strong> {dueStr}
												{daysLeft(a.dueDate) >= 0 && (
													<span className='ml-2 text-zinc-400'>
														({dl} day{dl === 1 ? '' : 's'} left)
													</span>
												)}
											</span>
										</div>
									</div>

									{/* actions */}
									<div className='flex items-center gap-1'>
										{(a.assignmentLink || a.resources?.[0]) && (
											<div>
												<Button
													variant='ghost'
													size='sm'
													className='cursor-pointer'
													onClick={() =>
														window.open(
															a.assignmentLink || a.resources![0].url,
															'_blank'
														)
													}
												>
													<Link2 />
													{a.resources?.[0]?.title || 'Open Link'}
												</Button>
											</div>
										)}
										<Button
											variant='ghost'
											size='icon'
											title='Edit'
											className='cursor-pointer'
											onClick={() => openEdit(a)}
										>
											<PencilLine className='h-4 w-4' />
										</Button>
										<Button
											variant='ghost'
											size='icon'
											title='Delete'
											className='cursor-pointer'
											onClick={() => deleteAssignment(a.id)}
										>
											<Trash2 className='h-4 w-4' />
										</Button>
									</div>
								</div>
							</Card>
						);
					})
				)}
			</div>

			{/* Add / Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className='sm:max-w-[520px]'>
					<DialogHeader>
						<DialogTitle>
							{isEditing ? 'Update Assignment' : 'Add Assignment'}
						</DialogTitle>
						<DialogDescription>Fill the fields and save.</DialogDescription>
					</DialogHeader>

					<div className='grid gap-4 py-2'>
						<div className='grid gap-2'>
							<Label>Assignment Name</Label>
							<Input
								value={draft.name}
								onChange={(e) =>
									setDraft((d) => ({ ...d, name: e.target.value }))
								}
								placeholder='e.g. Project Milestone 2'
							/>
						</div>

						<div className='grid gap-2'>
							<Label>Description (optional)</Label>
							<Input
								value={draft.description}
								onChange={(e) =>
									setDraft((d) => ({ ...d, description: e.target.value }))
								}
								placeholder='Brief description…'
							/>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
							<div className='grid gap-2'>
								<Label>Semester</Label>
								<Select
									value={draft.semesterId}
									onValueChange={(v) =>
										setDraft((d) => ({ ...d, semesterId: v as SnowflakeId }))
									}
								>
									<SelectTrigger className='w-full cursor-pointer'>
										<SelectValue placeholder='Select semester' />
									</SelectTrigger>
									<SelectContent className='cursor-pointer'>
										{semesters.map((s) => (
											<SelectItem key={s.id} value={s.id}>
												{s.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className='grid gap-2'>
								<Label>Course</Label>
								<Select
									value={draft.courseId}
									onValueChange={(v) =>
										setDraft((d) => ({ ...d, courseId: v as SnowflakeId }))
									}
								>
									<SelectTrigger className='w-full cursor-pointer'>
										<SelectValue placeholder='Select course' />
									</SelectTrigger>
									<SelectContent className='cursor-pointer'>
										{courses
											.filter(
												(c) =>
													!draft.semesterId || c.semesterId === draft.semesterId
											)
											.map((c) => (
												<SelectItem key={c.id} value={c.id}>
													{c.code} — {c.name}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
							<div className='grid gap-2'>
								<Label>Type</Label>
								<Select
									value={draft.category}
									onValueChange={(v) =>
										setDraft((d) => ({
											...d,
											category: v as Assignment['category'],
										}))
									}
								>
									<SelectTrigger className='w-full cursor-pointer'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent className='cursor-pointer'>
										{(
											Object.keys(CATEGORY_LABEL) as Assignment['category'][]
										).map((c) => (
											<SelectItem key={c} value={c}>
												{CATEGORY_LABEL[c]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className='grid gap-2'>
								<Label>Status</Label>
								<Select
									value={draft.status}
									onValueChange={(v) =>
										setDraft((d) => ({ ...d, status: v as Draft['status'] }))
									}
								>
									<SelectTrigger className='w-full cursor-pointer'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent className='cursor-pointer'>
										{/* Do not allow overdue choice here; it's derived */}
										<SelectItem value='not_started'>Not Started</SelectItem>
										<SelectItem value='in_progress'>In Progress</SelectItem>
										<SelectItem value='completed'>Completed</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
							<div className='grid gap-2'>
								<Label>Due Date</Label>
								<Input
									type='date'
									value={draft.dueDateLocal}
									onChange={(e) =>
										setDraft((d) => ({ ...d, dueDateLocal: e.target.value }))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label>Due Time</Label>
								<Input
									type='time'
									value={draft.dueTimeLocal}
									onChange={(e) =>
										setDraft((d) => ({ ...d, dueTimeLocal: e.target.value }))
									}
								/>
							</div>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
							<div className='grid gap-2'>
								<Label>Link Title</Label>
								<Input
									value={draft.linkTitle}
									onChange={(e) =>
										setDraft((d) => ({ ...d, linkTitle: e.target.value }))
									}
									placeholder='Top Hat, eLC, etc.'
								/>
							</div>
							<div className='grid gap-2'>
								<Label>Link URL</Label>
								<Input
									value={draft.linkUrl}
									onChange={(e) =>
										setDraft((d) => ({ ...d, linkUrl: e.target.value }))
									}
									placeholder='https://…'
								/>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button onClick={saveDraft}>{isEditing ? 'Update' : 'Save'}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
