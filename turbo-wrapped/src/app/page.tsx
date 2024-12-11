'use client'
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react";
import TrackingToggle from './components/TrackingToggle';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
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
            </div>
            
            <div className="mt-8">
              <TrackingToggle />
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
              onClick={() => signIn('spotify')} 
              className="bg-spotify-green text-black font-bold py-4 px-8 rounded-full hover:scale-105 transition-transform"
            >
              Connect with Spotify
            </button>

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