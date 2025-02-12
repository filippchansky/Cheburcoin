export const calculatePriceChangePercentage = (
    previousClose: number,
    currentClose: number
): number => {
    return ((currentClose - previousClose) / previousClose) * 100;
};
