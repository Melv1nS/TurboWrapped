export function calculateDiversity(items: Record<string, number>): number {
    const total = Object.values(items).reduce((sum, count) => sum + count, 0);
    const diversity = -Object.values(items)
        .map(count => {
            const p = count / total;
            return p * Math.log(p);
        })
        .reduce((sum, value) => sum + value, 0);
    
    return diversity;
}

export function normalizeDiversity(value: number, maxCategories: number): number {
    return value / Math.log(maxCategories);
}