'use client'
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex justify-center items-center">
      {session ? (
        <div className='max-w-[19rem] h-[22rem] rounded-[2rem] flex justify-around items-center flex-col flex-nowrap p-8'>
          <div className='mt-8 w-full flex flex-col flex-nowrap justify-around items-center'>
            <Image
              src={session?.user?.image ?? 
                'https://spotiy-playlist-retriever-experimental.vercel.app/_next/static/media/user_img.6db01878.svg'}
              width={160}
              height={160}
              alt='Defualt user image'
            />
            <p className='text-white font-normal text-xl mt-5 mb-2'>Sign In as</p>
            <span className='bold-txt'>{session?.user?.name}</span>
          </div>
          
          <div className='flex gap-4 mt-4'>
            <button 
              onClick={() => router.push('/top-artists')}
              className='px-4 py-2 rounded-lg bg-white text-black hover:bg-opacity-90'
            >
              Top Artists
            </button>
            <button 
              onClick={() => router.push('/top-tracks')}
              className='px-4 py-2 rounded-lg bg-white text-black hover:bg-opacity-90'
            >
              Top Tracks
            </button>
          </div>

          <p className='opacity-70 mt-8 mb-5 underline cursor-pointer' onClick={() => signOut()}>Sign Out</p>
        </div>
      ) : (
        <div className='max-w-[19rem] h-80 rounded-[2rem] flex justify-around items-center flex-col flex-nowrap p-6'>
          <Image
            src={'https://spotiy-playlist-retriever-experimental.vercel.app/_next/static/media/sad_emoji.41405e6f.svg'}
            width={160}
            height={150}
            alt='sad emoji'
          />
          <button onClick={() => signIn()} className='shadow-primary w-56 h-16 rounded-xl bg-white border-0 text-black text-3xl active:scale-[0.99]'>Sign In</button>
        </div>
      )}
    </div>
  );
}