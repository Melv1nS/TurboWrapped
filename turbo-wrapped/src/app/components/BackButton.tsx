'use client'
import { useRouter } from 'next/navigation'

export default function BackButton() {
    const router = useRouter()

    return (
        <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-spotify-grey hover:text-white transition-colors mb-6"
        >
            <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7"
                />
            </svg>
            <span>Back to Home</span>
        </button>
    )
}