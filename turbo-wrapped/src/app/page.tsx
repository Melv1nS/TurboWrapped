'use client'
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TrackingToggle from './components/TrackingToggle';
import { useTrackingState } from './hooks/useTrackingState';
import DeleteDataButton from './components/DeleteDataButton';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isEnabled } = useTrackingState();

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-spotify-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-spotify-dark to-black">
      {/* Navigation */}
      <nav className="w-full p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-white text-xl font-bold">Turbo Wrapped</span>
        </div>
        {session && (
          <div className="flex items-center gap-4">
            <Image
              src={session.user?.image ?? '/default-user.png'}
              width={32}
              height={32}
              alt="Profile"
              className="rounded-full"
            />
            <button 
              onClick={() => signOut()}
              className="text-white hover:text-spotify-green transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {session ? (
          <div className="flex flex-col items-center gap-8">
            <h1 className="text-5xl font-bold text-white text-center mb-4">
              Welcome back, <span className="text-spotify-green">{session.user?.name}</span>
            </h1>
            
            {/* Move tracking toggle and info blurb to top */}
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl items-start">
              <div className="md:w-1/3">
                <div className="bg-spotify-dark-elevated/50 p-4 rounded-lg">
                  <TrackingToggle />
                </div>
              </div>
              <div className="flex-1 text-gray-400 text-sm bg-spotify-dark-elevated/50 p-4 rounded-lg">
                <p className="leading-relaxed">
                  When tracking is enabled, your listening history will be stored every hour. 
                  This allows us to build a detailed picture of your music journey and generate 
                  more personalized insights over time. The more data we collect, the more 
                  interesting patterns and trends we can reveal about your listening habits.
                </p>
                <p className="mt-2 text-xs">
                  Your data is stored securely and is never shared with third parties.
                </p>
              </div>
            </div>
            
            {/* All cards in one grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              {/* Spotify API Section */}
              <div className="md:col-span-3 text-gray-400 text-sm bg-spotify-dark-elevated/50 p-4 rounded-lg mb-6">
                <p className="leading-relaxed">
                  The following sections show your top artists, tracks, and genres based on data directly from Spotify's API.
                  These reflect your all-time listening patterns on Spotify across all devices. However, Spotify's API only
                  provides limited snapshots of your top items and doesn't reveal detailed listening history or exact play counts.
                  This means we can show your favorites, but can't provide deeper insights like when you discovered an artist
                  or how your taste has evolved over specific time periods.
                </p>
              </div>

              {/* Top Artists Card */}
              <div 
                className="group bg-spotify-dark-elevated p-6 rounded-xl hover:bg-spotify-dark-highlight 
                           transition-all duration-300 cursor-pointer transform hover:-translate-y-2 
                           hover:shadow-xl hover:shadow-spotify-green/20"
                onClick={() => router.push('/top-artists')}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <svg 
                      className="w-8 h-8 text-spotify-green group-hover:scale-110 transition-transform" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.62c0-1.17.68-2.25 1.76-2.73 1.17-.51 2.61-.9 4.24-.9zM12 4a4 4 0 110 8 4 4 0 010-8z"/>
                    </svg>
                    <h2 className="text-2xl font-bold text-white">Top Artists</h2>
                  </div>
                  <p className="text-gray-300 group-hover:text-white transition-colors">
                    Discover your most played artists
                  </p>
                  <div className="mt-4 flex items-center text-spotify-green opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore now</span>
                    <svg 
                      className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Top Tracks Card */}
              <div 
                className="group bg-spotify-dark-elevated p-6 rounded-xl hover:bg-spotify-dark-highlight 
                           transition-all duration-300 cursor-pointer transform hover:-translate-y-2 
                           hover:shadow-xl hover:shadow-spotify-green/20"
                onClick={() => router.push('/top-tracks')}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <svg 
                      className="w-8 h-8 text-spotify-green group-hover:scale-110 transition-transform" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                    <h2 className="text-2xl font-bold text-white">Top Tracks</h2>
                  </div>
                  <p className="text-gray-300 group-hover:text-white transition-colors">
                    See your favorite songs
                  </p>
                  <div className="mt-4 flex items-center text-spotify-green opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Listen now</span>
                    <svg 
                      className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Top Genres Card */}
              <div 
                className="group bg-spotify-dark-elevated p-6 rounded-xl hover:bg-spotify-dark-highlight 
                           transition-all duration-300 cursor-pointer transform hover:-translate-y-2 
                           hover:shadow-xl hover:shadow-spotify-green/20"
                onClick={() => router.push('/top-genres')}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <svg 
                      className="w-8 h-8 text-spotify-green group-hover:scale-110 transition-transform" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.62c0-1.17.68-2.25 1.76-2.73 1.17-.51 2.61-.9 4.24-.9zM12 4a4 4 0 110 8 4 4 0 010-8z"/>
                    </svg>
                    <h2 className="text-2xl font-bold text-white">Top Genres</h2>
                  </div>
                  <p className="text-gray-300 group-hover:text-white transition-colors">
                    Explore your music taste
                  </p>
                  <div className="mt-4 flex items-center text-spotify-green opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore now</span>
                    <svg 
                      className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Tracking-based features section */}
              <div className="md:col-span-3 text-gray-400 text-sm bg-spotify-dark-elevated/50 p-4 rounded-lg mb-6">
                <p className="leading-relaxed">
                  The following features are built using your listening history, which begins collecting data from the moment you enable tracking.
                  Unlike the sections above, these insights are based on your listening activity specifically tracked by Turbo Wrapped.
                  As you continue to listen, these features will become more detailed and provide increasingly meaningful insights into your listening patterns over time.
                </p>
              </div>

              {/* History Card */}
              <div 
                className={`group bg-spotify-dark-elevated p-6 rounded-xl transition-all duration-300
                          ${isEnabled 
                            ? 'hover:bg-spotify-dark-highlight cursor-pointer transform hover:-translate-y-2 hover:shadow-xl hover:shadow-spotify-green/20' 
                            : 'opacity-50 cursor-not-allowed'
                          }`}
                onClick={() => isEnabled && router.push('/listening-history')}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <svg 
                      className={`w-8 h-8 text-spotify-green transition-transform
                                ${isEnabled ? 'group-hover:scale-110' : ''}`}
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14v7l6 3.5-1 1.5-7-4V6h2z"/>
                    </svg>
                    <h2 className="text-2xl font-bold text-white">History</h2>
                  </div>
                  <p className="text-gray-300 group-hover:text-white transition-colors">
                    {isEnabled 
                      ? "View your listening timeline" 
                      : "Enable tracking to view history"}
                  </p>
                  <div className={`mt-4 flex items-center text-spotify-green transition-opacity
                                ${isEnabled ? 'opacity-0 group-hover:opacity-100' : 'opacity-50'}`}>
                    <span>View history</span>
                    <svg 
                      className={`w-4 h-4 ml-2 transition-transform
                                ${isEnabled ? 'group-hover:translate-x-2' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Insights Card */}
              <div 
                className={`group bg-spotify-dark-elevated p-6 rounded-xl transition-all duration-300
                          ${isEnabled 
                            ? 'hover:bg-spotify-dark-highlight cursor-pointer transform hover:-translate-y-2 hover:shadow-xl hover:shadow-spotify-green/20' 
                            : 'opacity-50 cursor-not-allowed'
                          }`}
                onClick={() => isEnabled && router.push('/insights')}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <svg 
                      className={`w-8 h-8 text-spotify-green transition-transform
                                ${isEnabled ? 'group-hover:scale-110' : ''}`}
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 17c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm8.5-3.5l3.5 3.5-3.5 3.5v-7z M21.71 11.29l-9-9a.996.996 0 00-1.41 0l-9 9a.996.996 0 000 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a.996.996 0 000-1.41z"/>
                    </svg>
                    <h2 className="text-2xl font-bold text-white">Insights</h2>
                  </div>
                  <p className="text-gray-300 group-hover:text-white transition-colors">
                    {isEnabled 
                      ? "Discover your listening patterns" 
                      : "Enable tracking to view insights"}
                  </p>
                  <div className={`mt-4 flex items-center text-spotify-green transition-opacity
                                ${isEnabled ? 'opacity-0 group-hover:opacity-100' : 'opacity-50'}`}>
                    <span>View insights</span>
                    <svg 
                      className={`w-4 h-4 ml-2 transition-transform
                                ${isEnabled ? 'group-hover:translate-x-2' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Download History Card */}
              <div 
                className={`group bg-spotify-dark-elevated p-6 rounded-xl transition-all duration-300
                          ${isEnabled 
                            ? 'hover:bg-spotify-dark-highlight cursor-pointer transform hover:-translate-y-2 hover:shadow-xl hover:shadow-spotify-green/20' 
                            : 'opacity-50 cursor-not-allowed'
                          }`}
                onClick={async () => {
                  if (!isEnabled) return;
                  try {
                    const response = await fetch('/api/download-history');
                    if (!response.ok) throw new Error('Download failed');
                    
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `listening-history-${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                  } catch (error) {
                    console.error('Error downloading history:', error);
                    // You might want to add a toast notification here
                  }
                }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <svg 
                      className={`w-8 h-8 text-spotify-green transition-transform
                                ${isEnabled ? 'group-hover:scale-110' : ''}`}
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    <h2 className="text-2xl font-bold text-white">Download Data</h2>
                  </div>
                  <p className="text-gray-300 group-hover:text-white transition-colors">
                    {isEnabled 
                      ? "Export your listening history" 
                      : "Enable tracking to download data"}
                  </p>
                  <div className={`mt-4 flex items-center text-spotify-green transition-opacity
                                ${isEnabled ? 'opacity-0 group-hover:opacity-100' : 'opacity-50'}`}>
                    <span>Download CSV</span>
                    <svg 
                      className={`w-4 h-4 ml-2 transition-transform
                                ${isEnabled ? 'group-hover:translate-x-2' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>

            {/* Add Delete Data section at the bottom */}
            <div className="w-full max-w-4xl mt-12 border-t border-gray-700 pt-8">
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Data Management</h2>
                <p className="text-gray-400 text-sm text-center max-w-2xl mb-4">
                  You can delete all your stored listening history at any time. 
                  This action is permanent and cannot be undone, but it won't affect your 
                  tracking preferences. If tracking is enabled, new data will continue to 
                  be collected after deletion.
                </p>
                <div className="w-full max-w-md">
                  <DeleteDataButton />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-12 text-center">
            <h1 className="text-6xl font-bold text-white max-w-3xl">
              Your Spotify Stats, <span className="text-spotify-green">Supercharged</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl">
              Get real-time insights into your listening habits. Track your favorite artists, 
              songs, and discover how your music taste evolves over time.
            </p>

            <button 
              onClick={() => {
                signIn('spotify').catch(error => console.error("Sign-in error:", error));
              }} 
              className="bg-spotify-green text-black font-bold py-4 px-8 rounded-full hover:scale-105 transition-transform"
            >
              Connect with Spotify
            </button>

            {/* Add privacy notice */}
            <p className="text-sm text-gray-400">
              By connecting, you agree to our{' '}
              <Link 
                href="/privacy-policy" 
                className="text-spotify-green hover:underline"
              >
                Privacy Policy
              </Link>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Real-time Tracking</h3>
                <p className="text-gray-300">Watch your stats update as you listen</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Detailed Analytics</h3>
                <p className="text-gray-300">Deep dive into your music preferences</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Time Machine</h3>
                <p className="text-gray-300">See how your taste changes over time</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}