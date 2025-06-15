// Define response types for the getDays and getTimes methods
export type DateResponse = { date: any; business_day: boolean; }[] | { error: string; };
