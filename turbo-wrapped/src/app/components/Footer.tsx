import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="w-full bg-spotify-dark-elevated/50 mt-auto">
            <div className="container mx-auto px-4 py-6">
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                        © {new Date().getFullYear()} Turbo Wrapped
                    </div>
                    <nav className="space-x-6">
                        <Link 
                            href="/privacy-policy" 
                            className="text-sm text-gray-400 hover:text-spotify-green transition-colors"
                        >
                            Privacy Policy
                        </Link>
                    </nav>
                </div>
            </div>
        </footer>
    );
}