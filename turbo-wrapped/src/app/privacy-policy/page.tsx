'use client'
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
    const router = useRouter();

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-spotify-dark to-black">
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="mb-8 text-gray-400 hover:text-spotify-green transition-colors flex items-center gap-2"
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back
                    </button>

                    <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
                    
                    <div className="space-y-8 text-gray-300">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Data Collection and Usage</h2>
                            <p className="mb-4">
                                Turbo Wrapped collects and processes your Spotify listening data to provide 
                                personalized insights about your music preferences. Here's what we collect:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Your Spotify email address (for account identification)</li>
                                <li>Your listening history (track names, artists, and when you listened)</li>
                                <li>Your top artists and tracks from Spotify</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Data Storage and Control</h2>
                            <p className="mb-4">
                                You have full control over your data:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Enable or disable tracking at any time</li>
                                <li>Delete all your stored data with one click</li>
                                <li>Data is stored securely and never shared with third parties</li>
                                <li>You can disconnect your Spotify account at any time</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">OAuth Permissions</h2>
                            <p className="mb-4">
                                We request the following permissions from Spotify:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>user-read-email: To identify your account</li>
                                <li>user-top-read: To access your top artists and tracks</li>
                                <li>user-read-recently-played: To track your listening history</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
                            <p>
                                If you have any questions about your data or this privacy policy, 
                                please contact us at{' '}
                                <a 
                                    href="mailto:turbowrapped@gmail.com"
                                    className="text-spotify-green hover:underline"
                                >
                                    turbowrapped@gmail.com
                                </a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}