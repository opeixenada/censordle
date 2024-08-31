export interface ParentalGuideEntry {
    category: string;
    description: string;
}

export interface Movie {
    id: string;
    title: string;
    year: number;
    parentalGuideEntries: ParentalGuideEntry[];
}