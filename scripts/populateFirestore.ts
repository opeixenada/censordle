import * as admin from 'firebase-admin';
import * as serviceAccount from '../.firebase/serviceAccountKey.json';
import * as fs from 'fs';
import * as path from 'path';

interface ParentalGuideEntry {
    category: string;
    description: string;
}

interface Movie {
    title: string;
    year: number;
    parentalGuideEntries: ParentalGuideEntry[];
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

const db = admin.firestore();

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

const getDocumentId = (movie: Movie): string => {
    return `${movie.title.replace(/[^a-zA-Z0-9]/g, '_')}_${movie.year}`;
};

async function populateFirestore(): Promise<void> {
    const movies = loadMoviesFromFiles();

    for (const movie of movies) {
        try {
            const documentId = getDocumentId(movie);
            const docRef = db.collection('movies').doc(documentId);
            await docRef.set(movie);  // This will overwrite the document if it exists
            console.log(`Updated ${documentId}`);
        } catch (error) {
            console.error(`Error updating ${movie.title}:`, error);
        }
    }
    console.log('Database population completed!');
}

populateFirestore()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error populating database:", error);
        process.exit(1);
    });
