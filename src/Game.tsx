import React, {useState, useEffect, FormEvent} from 'react';
import {collection, getDocs} from 'firebase/firestore';
import {Movie} from "./types";
import {db} from "./firebase";

const Game: React.FC = () => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [guess, setGuess] = useState('');
    const [revealedEntries, setRevealedEntries] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [previousGuesses, setPreviousGuesses] = useState<string[]>([]);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const moviesCollection = collection(db, 'movies');
                const movieSnapshot = await getDocs(moviesCollection);
                const movieList = movieSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Movie));
                setMovies(movieList);
                selectRandomMovie(movieList);
            } catch (err) {
                console.error('Error fetching movies:', err);
                setError(`Failed to fetch movies: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    const selectRandomMovie = (movieList: Movie[]) => {
        const randomIndex = Math.floor(Math.random() * movieList.length);
        setCurrentMovie(movieList[randomIndex]);
        setRevealedEntries(1);
        setGameOver(false);
        setFeedback(null);
        setPreviousGuesses([]);
    };

    const handleGuess = (e?: FormEvent) => {
        e?.preventDefault(); // Prevent form submission
        if (!currentMovie || guess.trim() === '') return; // Prevent empty submissions

        const normalizedGuess = guess.trim().toLowerCase();
        const normalizedTitle = currentMovie.title.toLowerCase();

        if (normalizedGuess === normalizedTitle) {
            setGameOver(true);
            setFeedback("Congratulations! You guessed correctly!");
        } else {
            const remainingGuesses = currentMovie.parentalGuideEntries.length - revealedEntries;
            if (revealedEntries < currentMovie.parentalGuideEntries.length) {
                setRevealedEntries(prevEntries => prevEntries + 1);
                setFeedback(`Incorrect guess. You have ${remainingGuesses} more guesses.`);
                setPreviousGuesses(prev => [...prev, guess.trim()]);
            } else {
                setGameOver(true);
                setFeedback(`Game Over. The correct movie was: ${currentMovie.title}`);
            }
        }
        setGuess('');
    };

    const startNewGame = () => {
        selectRandomMovie(movies);
    };

    if (loading) return <div className="text-center p-4 text-gray-700">Loading...</div>;
    if (error) return <div className="text-center p-4 text-red-600">{error}</div>;
    if (!currentMovie) return <div className="text-center p-4 text-gray-700">No movie selected</div>;

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white text-gray-800 rounded-lg shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-black text-center">In which movie does this happen?</h2>
            {!gameOver ? (
                <>
                    <div className="mb-6 bg-gray-100 p-6 rounded-lg shadow-inner">
                        <ul className="space-y-3">
                            {currentMovie.parentalGuideEntries.slice(0, revealedEntries).map((entry, index) => (
                                <li key={index} className="text-base leading-relaxed">
                                    • {entry.description}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {feedback && (
                        <p className="mb-4 p-3 bg-yellow-400 text-black rounded-lg font-semibold">
                            {feedback}
                        </p>
                    )}
                    {previousGuesses.length > 0 && (
                        <div className="mb-6">
                            <h4 className="font-semibold text-gray-700 mb-2">Previous Guesses:</h4>
                            <div className="flex flex-wrap gap-2">
                                {previousGuesses.map((prevGuess, index) => (
                                    <span key={index} className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
                                        {prevGuess}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleGuess} className="mt-6">
                        <input
                            type="text"
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            placeholder="Enter movie title"
                            className="w-full p-3 mb-4 bg-white text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <button
                            type="submit"
                            className="w-full p-3 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-500 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={guess.trim() === ''}
                        >
                            Submit Guess
                        </button>
                    </form>
                </>
            ) : (
                <div className="text-center">
                    <p className="mb-6 text-xl font-semibold">{feedback}</p>
                    <button
                        onClick={startNewGame}
                        className="px-6 py-3 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-500 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-600"
                    >
                        Start New Game
                    </button>
                </div>
            )}
        </div>
    );
};

export default Game;