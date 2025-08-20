import * as React from 'react';
import { cn } from '../../lib/utils';

type Variant = 'info' | 'success' | 'error';

const variantToClass: Record<Variant, string> = {
	info: 'bg-blue-50 text-blue-800 border-blue-200',
	success: 'bg-green-50 text-green-800 border-green-200',
	error: 'bg-red-50 text-red-800 border-red-200',
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: Variant;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
	({ className, variant = 'info', ...props }, ref) => {
		return (
			<div
				ref={ref}
				role="status"
				className={cn('rounded-md border px-4 py-3 text-sm', variantToClass[variant], className)}
				{...props}
			/>
		);
	}
);
Alert.displayName = 'Alert'; 