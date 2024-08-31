export interface ParentalGuideEntry {
    category: string;
    description: string;
}

export interface Movie {
    id: string;
    imdbID: string;
    title: string;
    year: number;
    parentalGuideEntries: ParentalGuideEntry[];
}