import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { GraduationCap, FileText, Calendar, Clock } from 'lucide-react';

function DashboardOverview() {
	const isMobile = useIsMobile();
	return (
		<div className='space-y-6 px-4 md:px-8 lg:px-12 xl:px-20 max-w-9xl mx-auto'>
			<div>
				<h2 className='text-3xl font-bold tracking-tight'>
					Welcome back, Collin!
				</h2>

				{!isMobile && (
					<p className='text-muted-foreground'>
						Here's what's happening with your courses today.
					</p>
				)}
			</div>

			<div className='grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 md:gap-10'>
				<StatsCard
					title='Current GPA'
					value='3.60'
					subtitle={`+.10 ${isMobile ? '' : 'from last semester'}`}
					icon={
						<GraduationCap className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
					}
				/>
				<StatsCard
					title='Courses'
					value='4'
					subtitle='15 credit hours'
					icon={
						<FileText className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
					}
				/>
				<StatsCard
					title='Assignments'
					value='7'
					subtitle={`3 ${isMobile ? 'this week' : 'due this week'}`}
					icon={
						<Calendar className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
					}
				/>
				<StatsCard
					title='Next Class'
					value='9:30 AM'
					subtitle={`PSYC 1101 ${isMobile ? '' : '- Intro to Psychology'}`}
					icon={
						<Clock className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
					}
				/>
			</div>

			{/* <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
				<Card className='w-full max-w-xs'>
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
				<Card className='w-full max-w-xs'>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Courses</CardTitle>
						<FileText className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>4</div>
						<p className='text-xs text-muted-foreground'>12 credit hours</p>
					</CardContent>
				</Card>
				<Card className='w-full max-w-xs'>
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
				<Card className='w-full max-w-xs'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pb-0 space-y-0'>
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
			</div> */}
		</div>
	);
}

export default DashboardOverview;

interface StatsCardProps {
	title: string;
	value: string;
	subtitle: string;
	icon: React.ReactNode;
}

function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
	return (
		<Card className='overflow-hidden p-0 py-4'>
			<div className='pr-4 pl-4 flex flex-col h-full'>
				<div className='flex items-center justify-between mb-1'>
					<p className='text-sm font-semibold'>{title}</p>
					{icon}
				</div>
				<div className='mt-auto'>
					<div
						className='text-xl font-bold leading-none'
						style={{ marginTop: 7 }}
					>
						{value}
					</div>
					<p className='text-xs text-muted-foreground' style={{ marginTop: 5 }}>
						{subtitle}
					</p>
				</div>
			</div>
		</Card>
	);
}
