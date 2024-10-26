import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';

type ParentalGuideEntry = {
    category: string;
    severity: string;
    description: string;
};

type Movie = {
    imdbID: string;
    title: string;
    year: string;
    director: string | null;
    parentalGuideEntries: ParentalGuideEntry[];
};

const loadMoviesFromFiles = (): Movie[] => {
    const directoryPath = path.join(__dirname, 'scraped_data');
    const files = fs.readdirSync(directoryPath);

    const movies: Movie[] = files.map((file) => {
        const filePath = path.join(directoryPath, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContents) as Movie;
    });

    return movies;
};

const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'],
});

const processMovie = async (movie: Movie): Promise<Movie | null> => {
    const prompt = `I will give you JSON describing a movie, with entries from the IMDB parental guide. Please remove entries that don't have any information (e.g. if they say that there's no alcohol consumption or nudity), fix grammar where required, and rephrase entries to exclude all the proper nouns and names. Here's the movie data:

${JSON.stringify(movie, null, 2)}

Please provide the processed movie data in JSON format. Don't return any other text, only the result JSON.`;

    try {
        const message = await client.messages.create({
            max_tokens: 4096,
            messages: [{role: 'user', content: prompt}],
            model: 'claude-3-opus-20240229',
        });

        const content = message.content;
        if (content[0].type === "text") {
            return JSON.parse(content[0].text);
        } else {
            console.error(`Unexpected content type for movie ${movie.title}: ${content[0].type}`);
            return null;
        }
    } catch (error) {
        console.error(`Error processing movie ${movie.title}:`, error);
        return null;
    }
};

const saveProcessedMovie = (movie: Movie) => {
    const directoryPath = path.join(__dirname, 'processed_data');
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
    }

    const fileName = `${movie.title.replace(/[^a-zA-Z0-9]/g, '_')}_${movie.year}.json`; // Replace non-alphanumeric characters with underscores
    const filePath = path.join(directoryPath, fileName);
    fs.writeFileSync(filePath, JSON.stringify(movie, null, 2));
};

const main = async () => {
    const movies = loadMoviesFromFiles();

    for (const movie of movies) {
        console.log(`Processing movie: ${movie.title}`);
        const processedMovie = await processMovie(movie);
        if (processedMovie) {
            saveProcessedMovie(processedMovie);
            console.log(`Processed and saved movie: ${movie.title}`);
        } else {
            console.log(`Failed to process movie: ${movie.title}`);
        }
    }

    console.log('All movies have been processed.');
};

main();