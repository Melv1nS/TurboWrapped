export const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
};

export const formatTotalDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
};

export const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
};

export const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
};