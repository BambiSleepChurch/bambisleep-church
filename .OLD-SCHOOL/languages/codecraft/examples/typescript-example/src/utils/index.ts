export const formatDate = (date: Date, format: string): string => {
    const options: Intl.DateTimeFormatOptions = {};
    
    if (format.includes('YYYY')) options.year = 'numeric';
    if (format.includes('MM')) options.month = '2-digit';
    if (format.includes('DD')) options.day = '2-digit';

    return new Intl.DateTimeFormat('en-US', options).format(date);
};

export const generateRandomNumber = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};