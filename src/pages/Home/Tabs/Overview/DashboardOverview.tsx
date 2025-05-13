import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GraduationCap, FileText, Calendar, Clock } from 'lucide-react';

function DashboardOverview() {
	return (
		<div className='space-y-6 pr-50'>
			<div>
				<h2 className='text-3xl font-bold tracking-tight'>
					Welcome back, Collin!
				</h2>
				<p className='text-muted-foreground'>
					Here's what's happening with your courses today.
				</p>
			</div>

			<div className='grid gap-10 md:grid-cols-2 lg:grid-cols-4 h-auto'>
				<Card className=''>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-bold'>Current GPA</CardTitle>
						<GraduationCap className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>3.60</div>
						<p className='text-xs text-muted-foreground'>
							+0.10 from last semester
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Courses</CardTitle>
						<FileText className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>4</div>
						<p className='text-xs text-muted-foreground'>12 credit hours</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Assignments Due
						</CardTitle>
						<Calendar className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>7</div>
						<p className='text-xs text-muted-foreground'>3 due this week</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Next Class</CardTitle>
						<Clock className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>9:30 AM</div>
						<p className='text-xs text-muted-foreground'>
							PSYC 1101 - Intro to Psychology
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default DashboardOverview;
