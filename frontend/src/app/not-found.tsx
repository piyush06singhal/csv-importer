import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center max-w-md mx-auto">
      <div className="text-4xl font-extrabold text-primary">404</div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Page not found</h2>
        <p className="text-zinc-400 text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Go Back Home
      </Link>
    </div>
  );
}
