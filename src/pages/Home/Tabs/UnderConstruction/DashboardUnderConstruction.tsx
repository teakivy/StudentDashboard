import { Button } from '@/components/ui/button';
import { migrateCourseSchedules } from '@/lib/managers/firestoreManager';
import { HardHat } from 'lucide-react';

export default function UnderConstruction() {
	return (
		<div className='min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background text-foreground'>
			<HardHat className='w-12 h-12 text-yellow-500 mb-4' />
			<h1 className='text-3xl font-bold mb-2'>
				This page is under construction
			</h1>
			<p className='text-muted-foreground'>
				We're working hard to finish it. Check back soon!
			</p>

			{/* DELETE */}
			<Button
				onClick={() => {
					migrateCourseSchedules();
				}}
			>
				Migrate
			</Button>
		</div>
	);
}
