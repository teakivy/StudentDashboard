import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
	'Academic',
	'Campus',
	'Student Services',
	'Technology',
] as const;
type Category = (typeof CATEGORIES)[number];

const RESOURCE_DATA: Record<Category, ResourceCardProps[]> = {
	Academic: [
		{
			title: 'eLC (eLearning Commons)',
			description: 'Access course materials, assignments, and grades',
			icon: BookOpen,
			link: 'https://uga.view.usg.edu',
		},
		{
			title: 'Athena',
			description: 'Registration, class schedules, and student records',
			icon: University,
			link: 'https://athena.uga.edu',
		},
		{
			title: 'UGA Libraries',
			description: 'Access library resources, databases, and research tools',
			icon: Library,
			link: 'https://www.libs.uga.edu',
		},
		{
			title: 'Degree Works',
			description: 'Track your degree progress and requirements',
			icon: GraduationCap,
			link: 'https://degreeworks.uga.edu',
		},
		{
			title: 'Final Exam Schedule',
			description: 'View final exam dates and times',
			icon: NotebookPen,
			link: 'https://reg.uga.edu/general-information/calendars/final-exam-schedule/',
		},
		{
			title: 'Academic Calendar',
			description: 'Important dates, deadlines, and university holidays',
			icon: Calendar,
			link: 'https://reg.uga.edu/general-information/calendars/academic-calendars/',
		},
		{
			title: 'Bulletin',
			description: 'Official course descriptions and academic policies',
			icon: FileText,
			link: 'https://bulletin.uga.edu',
		},
	],
	Campus: [
		{
			title: 'Campus Map',
			description: 'Interactive map of UGA campus',
			icon: Map,
			link: 'https://usg.maps.arcgis.com/apps/webappviewer/index.html?id=10832e7927124404a7119df52872af84',
		},
		{
			title: 'UGA Bus Tracker',
			description: 'Real-time bus locations and routes',
			icon: Bus,
			link: 'https://uga.passiogo.com/',
		},
		{
			title: 'Dining Hall Menus',
			description: 'View menus for UGA dining halls',
			icon: Apple,
			link: 'https://uga.nutrislice.com/menu',
		},
	],
	'Student Services': [
		{
			title: 'Career Center',
			description: 'Career planning, job postings, and resume help',
			icon: BriefcaseBusiness,
			link: 'https://career.uga.edu',
		},
		{
			title: 'Financial Aid',
			description: 'Scholarships, loans, and financial assistance',
			icon: DollarSign,
			link: 'https://osfa.uga.edu',
		},
	],
	Technology: [
		{
			title: 'EITS Help Desk',
			description: 'Technical support and IT services',
			icon: LaptopMinimal,
			link: 'https://eits.uga.edu',
		},
		{
			title: 'UGA Mail',
			description: 'Access your UGA email account',
			icon: Mail,
			link: 'https://outlook.office.com',
		},
		{
			title: 'UGA MyID',
			description: 'Manage your UGA account and password',
			icon: IdCard,
			link: 'https://myid.uga.edu',
		},
		{
			title: 'Software Resources',
			description: 'Free and discounted software for students',
			icon: FileText,
			link: 'https://eits.uga.edu/hardware_and_software',
		},
		{
			title: 'Wireless Networks',
			description: "Connect to UGA's wireless networks",
			icon: Wifi,
			link: 'https://eits.uga.edu/network_and_phones/wireless',
		},
	],
};

function DashboardResources() {
	const [selected, setSelected] = useState<Category | null>(null);

	return (
		<div className='space-y-6'>
			<div className='w-full overflow-hidden'>
				<div className='mx-auto max-w-fit flex flex-wrap justify-center gap-1 sm:justify-start sm:mx-0 sm:gap-2'>
					{CATEGORIES.map((cat) => (
						<Badge
							key={cat}
							variant={selected === cat ? 'default' : 'secondary'}
							onClick={() => setSelected((prev) => (prev === cat ? null : cat))}
							className='cursor-pointer px-3 py-1'
						>
							{cat}
						</Badge>
					))}
				</div>
			</div>

			<AnimatePresence mode='wait'>
				{(selected ? [selected] : CATEGORIES).map((section) => (
					<motion.div
						key={section}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.15 }}
						className='space-y-4'
					>
						<h3 className='text-2xl font-semibold mt-10'>{section}</h3>
						<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
							{RESOURCE_DATA[section].map((props) => (
								<ResourceCard key={props.title} {...props} />
							))}
						</div>
					</motion.div>
				))}
			</AnimatePresence>
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
			</Card>
		</a>
	);
}
