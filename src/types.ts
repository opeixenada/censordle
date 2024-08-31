export interface ParentalGuideEntry {
    category: string;
    description: string;
}

export interface Movie {
    imdbID: string;
    title: string;
    year: number;
    parentalGuideEntries: ParentalGuideEntry[];
}

export interface Movies {
    movies: Movie[];
}