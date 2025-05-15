import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import {
	Apple,
	BookOpen,
	BriefcaseBusiness,
	Bus,
	Calendar,
	DollarSign,
	ExternalLink,
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
	const isMobile = useIsMobile();
	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-3xl font-bold tracking-tight'>Resources</h2>
				<p className='text-muted-foreground'>
					Quick access to important UGA resources
				</p>
			</div>

			<Tabs defaultValue='academic' className='w-full'>
				<TabsList className='grid w-full grid-cols-4'>
					<TabsTrigger value='academic' className='cursor-pointer'>
						Academic
					</TabsTrigger>
					<TabsTrigger value='campus' className='cursor-pointer'>
						Campus
					</TabsTrigger>
					<TabsTrigger value='services' className='cursor-pointer'>
						{isMobile ? 'Services' : 'Student Services'}
					</TabsTrigger>
					<TabsTrigger value='tech' className='cursor-pointer'>
						Technology
					</TabsTrigger>
				</TabsList>

				<TabsContent value='academic' className='mt-6'>
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
					</div>
				</TabsContent>

				<TabsContent value='campus' className='mt-6'>
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
				</TabsContent>

				<TabsContent value='services' className='mt-6'>
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
						<ResourceCard
							title='Bulletin'
							description='Official course descriptions and academic policies'
							icon={FileText}
							link='https://bulletin.uga.edu'
						/>
					</div>
				</TabsContent>

				<TabsContent value='tech' className='mt-6'>
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
				</TabsContent>
			</Tabs>
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
		<Card className='overflow-hidden'>
			<CardHeader className='pb-2'>
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
			<CardContent>
				<Button variant='outline' size='sm' className='w-full' asChild>
					<a href={link} target='_blank' rel='noopener noreferrer'>
						<ExternalLink className='mr-2 h-4 w-4' />
						Visit
					</a>
				</Button>
			</CardContent>
		</Card>
	);
}
