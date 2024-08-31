import * as admin from 'firebase-admin';
import * as serviceAccount from '../.firebase/serviceAccountKey.json';

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

const movies: Movie[] = [
    {
        title: "Antichrist",
        year: 2009,
        parentalGuideEntries: [
            {category: "Sex & Nudity", description: "Real sex between actors."},
            {
                category: "Sex & Nudity",
                description: "Nudity contains both main characters including bare buttocks and breasts. Pubic hair is also shown and the woman walks around without pants, her vulva and pubic hair is shown."
            },
            {
                category: "Sex & Nudity",
                description: "A few graphic sex scenes throughout. Full nudity is shown, both male and female."
            },
            {
                category: "Sex & Nudity",
                description: "A couple have sex in slow-motion black and white but moaning is not audible. Legs and shoulders up are mainly shown, but there is a close-up shot of genital penetration for about 5 seconds. Eventually they climax and this scene is NOT simulated."
            },
            {
                category: "Sex & Nudity",
                description: "A nude woman straddles her husband as they thrust in a scene before he chooses to stop, causing her to run outside. She masturbates, gasping heavily (full-frontal nudity shown in closeup, her hand covers her vulva). Then her husband (or an illusion) crawls on top of her and they continue. We see his thrusting buttocks."
            },
            {
                category: "Sex & Nudity",
                description: "A woman stimulates a man's penis which is clearly visible as is the ejaculation. Please see \"Violence and Gore\" section."
            },
            {
                category: "Sex & Nudity",
                description: "A woman holds scissors to her vulva. Then to her clitoris, both which are depicted clearly. Please see \"Violence and Gore\" section."
            },
            {
                category: "Sex & Nudity",
                description: "Closeup of female genital mutilation."
            }
        ]
    },
    {
        title: "Melancholia",
        year: 2011,
        parentalGuideEntries: [
            {
                category: "Sex & Nudity",
                description: "A man puts his hand up a woman's dress & kisses her breasts."
            },
            {
                category: "Sex & Nudity",
                description: "A one minute scene of full frontal female nudity featuring two extended closeups of her bare breasts explicitly displayed including sexual self fondling while another secretly watches."
            },
            {
                category: "Sex & Nudity",
                description: "A sex scene shows a woman pushing a man down to the sand, mounting him & then graphically thrusting vigorously."
            },
            {
                category: "Sex & Nudity",
                description: "A lengthy two minute bathing scene displays full female breasts, body & buttocks nudity."
            },
            {
                category: "Sex & Nudity",
                description: "A woman & a young boy remove the pants off of a female exposing her in skimpy panties."
            },
        ]
    }
];

async function populateFirestore(): Promise<void> {
    for (const movie of movies) {
        try {
            const docRef = await db.collection('movies').add(movie);
            console.log(`Added movie: ${movie.title} with ID: ${docRef.id}`);
        } catch (error) {
            console.error(`Error adding movie ${movie.title}:`, error);
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