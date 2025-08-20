import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
	return (
		<div
			className={cn('animate-pulse rounded-md bg-gray-200', className)}
			{...props}
		/>
	);
}; 