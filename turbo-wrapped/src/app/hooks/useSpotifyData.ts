import useSWR from 'swr'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
}

export function useSpotifyData<T>(endpoint: string, timeRange: string) {
  const { data, error, isLoading } = useSWR<T>(
    `/api/${endpoint}?time_range=${timeRange}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
      keepPreviousData: true
    }
  )

  return {
    data,
    isLoading,
    error
  }
}