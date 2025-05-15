import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Apple,
	BookOpen,
	BriefcaseBusiness,
	Bus,
	Calendar,
	DollarSign,
	FileText,
	GraduationCap,
	IdCard,
	LaptopMinimal,
	Library,
	Mail,
	Map,
	NotebookPen,
	University,
	Wifi,
} from 'lucide-react';
import React from 'react';

function DashboardResources() {
	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-3xl font-bold tracking-tight'>Resources</h2>
				<p className='text-muted-foreground'>
					Quick access to important UGA resources
				</p>
			</div>

			{/* Academic */}
			<h3 className='text-2xl font-semibold mt-10'>Academic</h3>
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<ResourceCard
					title='eLC (eLearning Commons)'
					description='Access course materials, assignments, and grades'
					icon={BookOpen}
					link='https://uga.view.usg.edu'
				/>
				<ResourceCard
					title='Athena'
					description='Registration, class schedules, and student records'
					icon={University}
					link='https://athena.uga.edu'
				/>
				<ResourceCard
					title='UGA Libraries'
					description='Access library resources, databases, and research tools'
					icon={Library}
					link='https://www.libs.uga.edu'
				/>
				<ResourceCard
					title='Degree Works'
					description='Track your degree progress and requirements'
					icon={GraduationCap}
					link='https://degreeworks.uga.edu'
				/>
				<ResourceCard
					title='Final Exam Schedule'
					description='View final exam dates and times'
					icon={NotebookPen}
					link='https://reg.uga.edu/general-information/calendars/final-exam-schedule/'
				/>
				<ResourceCard
					title='Academic Calendar'
					description='Important dates, deadlines, and university holidays'
					icon={Calendar}
					link='https://reg.uga.edu/general-information/calendars/academic-calendars/'
				/>
				<ResourceCard
					title='Bulletin'
					description='Official course descriptions and academic policies'
					icon={FileText}
					link='https://bulletin.uga.edu'
				/>
			</div>

			{/* Campus */}
			<h3 className='text-2xl font-semibold mt-10'>Campus</h3>
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<ResourceCard
					title='Campus Map'
					description='Interactive map of UGA campus'
					icon={Map}
					link='https://usg.maps.arcgis.com/apps/webappviewer/index.html?id=10832e7927124404a7119df52872af84'
				/>
				<ResourceCard
					title='UGA Bus Tracker'
					description='Real-time bus locations and routes'
					icon={Bus}
					link='https://uga.passiogo.com/'
				/>
				<ResourceCard
					title='Dining Hall Menus'
					description='View menus for UGA dining halls'
					icon={Apple}
					link='https://uga.nutrislice.com/menu'
				/>
			</div>

			{/* Student Services */}
			<h3 className='text-2xl font-semibold mt-10'>Student Services</h3>
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<ResourceCard
					title='Career Center'
					description='Career planning, job postings, and resume help'
					icon={BriefcaseBusiness}
					link='https://career.uga.edu'
				/>
				<ResourceCard
					title='Financial Aid'
					description='Scholarships, loans, and financial assistance'
					icon={DollarSign}
					link='https://osfa.uga.edu'
				/>
			</div>

			{/* Technology */}
			<h3 className='text-2xl font-semibold mt-10'>Technology</h3>
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<ResourceCard
					title='EITS Help Desk'
					description='Technical support and IT services'
					icon={LaptopMinimal}
					link='https://eits.uga.edu'
				/>
				<ResourceCard
					title='UGA Mail'
					description='Access your UGA email account'
					icon={Mail}
					link='https://outlook.office.com'
				/>
				<ResourceCard
					title='UGA MyID'
					description='Manage your UGA account and password'
					icon={IdCard}
					link='https://myid.uga.edu'
				/>
				<ResourceCard
					title='Software Resources'
					description='Free and discounted software for students'
					icon={FileText}
					link='https://eits.uga.edu/hardware_and_software'
				/>
				<ResourceCard
					title='Wireless Networks'
					description="Connect to UGA's wireless networks"
					icon={Wifi}
					link='https://eits.uga.edu/network_and_phones/wireless'
				/>
			</div>
		</div>
	);
}

export default DashboardResources;

interface ResourceCardProps {
	title: string;
	description: string;
	icon: React.ElementType;
	link: string;
	badge?: string;
}

function ResourceCard({
	title,
	description,
	icon: Icon,
	link,
}: ResourceCardProps) {
	return (
		<a href={link} target='_blank' rel='noopener noreferrer' className='block'>
			<Card className='hover:bg-accent transition-colors'>
				<CardHeader className=''>
					<div className='flex items-start justify-between'>
						<div className='flex items-center'>
							<div className='mr-2 rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900 dark:text-red-300'>
								<Icon className='h-4 w-4' />
							</div>
							<CardTitle className='text-base'>{title}</CardTitle>
						</div>
					</div>
					<CardDescription className='mt-2'>{description}</CardDescription>
				</CardHeader>
			</Card>
		</a>
	);
}
