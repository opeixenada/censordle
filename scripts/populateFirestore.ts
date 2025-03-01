import * as admin from "firebase-admin";
import * as serviceAccount from "../.firebase/serviceAccountKey.json";
import * as fs from "fs";
import * as path from "path";

type AdvisoryEntry = {
  category: string;
  severity: string;
  description: string;
};

type Movie = {
  imdbID: string;
  title: string;
  year: string;
  director: string | null;
  parentalGuideEntries: AdvisoryEntry[];
};

type TitleMapping = {
  [key: string]: string; // key is "title (year)", value is documentId
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

const loadMoviesFromFiles = (): Movie[] => {
  const directoryPath = path.join(__dirname, "scraped_data");
  const files = fs.readdirSync(directoryPath);

  const movies: Movie[] = files.map((file) => {
    const filePath = path.join(directoryPath, file);
    const fileContents = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContents) as Movie;
  });

  return movies;
};

const getDocumentId = (movie: Movie): string => {
  return `${movie.title.replace(/[^a-zA-Z0-9]/g, "_")}_${movie.year}_${movie.imdbID}`;
};

async function populateFirestore(): Promise<void> {
  const movies = loadMoviesFromFiles();
  const movieMapping: TitleMapping = {};

  for (const movie of movies) {
    try {
      const documentId = getDocumentId(movie);
      const docRef = db.collection("movies").doc(documentId);
      await docRef.set(movie); // This will overwrite the document if it exists
      console.log(`Updated ${documentId}`);

      // Add to movieMapping
      const mappingKey = `${movie.title} (${movie.year})`;
      movieMapping[mappingKey] = documentId;
    } catch (error) {
      console.error(`Error updating ${movie.title}:`, error);
    }
  }

  // Create or update the title mapping document
  try {
    const mappingDocRef = db.collection("metadata").doc("titleMapping");
    await mappingDocRef.set(movieMapping);
    console.log("Updated title mapping document");
  } catch (error) {
    console.error("Error updating movie mapping document:", error);
  }

  console.log("Database population completed!");
}

populateFirestore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error populating database:", error);
    process.exit(1);
  });
