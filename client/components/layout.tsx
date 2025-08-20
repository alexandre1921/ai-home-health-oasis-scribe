import Link from 'next/link';
import * as React from 'react';

export const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
	return (
		<div className="min-h-screen">
			<header className="relative z-30 w-full border-b border-gray-200">
				<div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600">
					<nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 text-white">
						<Link href="/">
							<span className="text-base font-semibold tracking-tight gradient-text">AI Scribe</span>
						</Link>
						<div className="flex items-center gap-6 text-sm">
							<Link href="/" className="hover:opacity-90">New note</Link>
							<Link href="/notes" className="hover:opacity-90">Notes</Link>
						</div>
					</nav>
				</div>
				<div className="border-t border-white/10 bg-white/70 backdrop-blur">
					<div className="mx-auto max-w-5xl px-4 py-2 text-xs text-gray-600">
						Clinical-grade voice-to-note for Home Health OASIS assessments
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-5xl px-4 py-8">
				{children}
			</main>
			<footer className="border-t border-gray-200 py-6">
				<div className="mx-auto max-w-5xl px-4 text-xs text-gray-500">© {new Date().getFullYear()} AI Scribe</div>
			</footer>
		</div>
	);
}; 