import React, {FormEvent, useCallback, useEffect, useRef, useState} from 'react';
import {collection, doc, getDoc} from 'firebase/firestore';
import {Movie, Movies} from "../types";
import {db} from "../firebase";
import CategoryBadge from "./CategoryBadge";

const Game: React.FC = () => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [movieTitles, setMovieTitles] = useState<string[]>([]);
    const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [guess, setGuess] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [revealedEntries, setRevealedEntries] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [previousGuesses, setPreviousGuesses] = useState<string[]>([]);
    const [title, setTitle] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectRandomMovie = useCallback((movieList: Movie[]) => {
        // Filter movies with more than one parental guide entry
        const eligibleMovies = movieList.filter(movie => movie.parentalGuideEntries.length > 1);

        if (eligibleMovies.length === 0) {
            console.warn("No movies with more than one parental guide entry found.");
            return;
        }

        const randomIndex = Math.floor(Math.random() * eligibleMovies.length);
        const selectedMovie = eligibleMovies[randomIndex];

        // Shuffle the parental guide entries
        selectedMovie.parentalGuideEntries = shuffleArray(selectedMovie.parentalGuideEntries);

        setCurrentMovie(selectedMovie);
        setRevealedEntries(1);
        setGameOver(false);
        setFeedback(null);
        setPreviousGuesses([]);
    }, []);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const moviesCollection = collection(db, 'movies');
                const moviesDocRef = doc(moviesCollection, 'movies');
                const movieSnapshot = await getDoc(moviesDocRef);
                const movieList = (movieSnapshot.data() as Movies).movies
                setMovies(movieList);
                setMovieTitles(movieList.map(movie => `${movie.title} (${movie.year})`));
                setGuess('');
                selectRandomMovie(movieList);
            } catch (err) {
                console.error('Error fetching movies:', err);
                setError(`Failed to fetch movies: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        setTitle(`In which movie does this happen?`);
        fetchMovies();
    }, [selectRandomMovie],);

    const startNewGame = () => {
        setTitle(`In which movie does this happen?`);
        selectRandomMovie(movies);
        setGuess('');
    };

    const handleGameOver = () => {
        setGameOver(true);
        setTitle(`Game Over 😵`);
        setFeedback(`It was `);
    };

    const getIMDBLink = (movieId: string) => {
        return `https://www.imdb.com/title/${movieId}/`;
    };

    const shuffleArray = <T, >(array: T[]): T[] => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const handleGuess = (e?: FormEvent) => {
        e?.preventDefault();
        if (!currentMovie || guess.trim() === '') return;

        const normalizedGuess = guess.trim().toLowerCase();

        // Check if the guess is in the list of movie titles
        if (!movieTitles.map(title => title.toLowerCase()).includes(normalizedGuess)) {
            setFeedback('Please select a movie from the suggestions.');
            return;
        }

        // Check if the guess has already been made
        if (previousGuesses.map(g => g.toLowerCase()).includes(normalizedGuess)) {
            setFeedback('You have already guessed that. Try something else!');
            return;
        }

        const normalizedTitle = `${currentMovie.title.toLowerCase()} (${currentMovie.year})`;

        if (normalizedGuess === normalizedTitle) {
            setGameOver(true);
            setTitle(`Congratulations! 🎉`);
            setFeedback(`You guessed correctly! It's `);
        } else {
            const remainingGuesses = currentMovie.parentalGuideEntries.length - revealedEntries;
            if (revealedEntries < currentMovie.parentalGuideEntries.length) {
                setRevealedEntries(prevEntries => prevEntries + 1);
                setFeedback(`Incorrect guess. You have ${remainingGuesses} more hints.`);
                setPreviousGuesses(prev => [...prev, guess.trim()]);
                setGuess('');
            } else {
                handleGameOver();
            }
        }
    };

    const handleNextHint = () => {
        if (!currentMovie) return;

        const remainingGuesses = currentMovie.parentalGuideEntries.length - revealedEntries;
        if (revealedEntries < currentMovie.parentalGuideEntries.length) {
            setRevealedEntries(prevEntries => prevEntries + 1);
            setFeedback(`You have ${remainingGuesses} more hints.`);
        } else {
            handleGameOver();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setGuess(value);

        if (value.length > 1) {
            const filteredSuggestions = movieTitles.filter(
                title => title.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filteredSuggestions.slice(0, 5)); // Limit to 5 suggestions
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setGuess(suggestion);
        setSuggestions([]);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const renderFeedbackWithLink = () => {
        if (!currentMovie) return null;

        return (
            <p className="mb-6 text-xl font-semibold">
                {feedback}
                <a
                    href={getIMDBLink(currentMovie.imdbID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                >
                    {currentMovie.title}
                </a>
                .
            </p>
        );
    };

    if (loading) return <div className="text-center p-4 text-gray-700">Loading...</div>;
    if (error) return <div className="text-center p-4 text-red-600">{error}</div>;
    if (!currentMovie) return <div className="text-center p-4 text-gray-700">No movie selected</div>;

    return (
        <div className="max-w-2xl mx-auto mt-4 p-8 bg-white text-gray-800 rounded-lg shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-black text-center">{title}</h2>
            {!gameOver ? (
                <>
                    <div className="mb-6 bg-gray-100 p-6 rounded-lg shadow-inner">
                        <ul className="space-y-3">
                            {currentMovie.parentalGuideEntries.slice(0, revealedEntries).map((entry, index) => (
                                <li key={index} className="text-base leading-relaxed">
                                    <CategoryBadge entry={entry}/>
                                    <span>
                                    {entry.description}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {feedback && !gameOver && (
                        <p className="mb-4 p-3 bg-yellow-400 text-black rounded-lg font-semibold">
                            {feedback}
                        </p>
                    )}
                    {previousGuesses.length > 0 && (
                        <div className="mb-6">
                            <h4 className="font-semibold text-gray-700 mb-2">Previous Guesses:</h4>
                            <div className="flex flex-wrap gap-2">
                                {previousGuesses.map((prevGuess, index) => (
                                    <span key={index}
                                          className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
                                        {prevGuess}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleGuess} className="mt-6">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={guess}
                                onChange={handleInputChange}
                                placeholder="Enter movie title"
                                className="w-full p-3 bg-white text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            {suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg mt-[-1px] max-h-60 overflow-auto shadow-lg">
                                    {suggestions.map((suggestion, index) => (
                                        <li
                                            key={index}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="p-3 hover:bg-gray-100 cursor-pointer transition duration-200 ease-in-out"
                                        >
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="flex gap-4 mt-4">
                            <button
                                type="submit"
                                className="flex-1 p-3 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-500 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={guess.trim() === '' || !movieTitles.includes(guess)}
                            >
                                Submit guess
                            </button>
                            <button
                                type="button"
                                onClick={handleNextHint}
                                className="flex-1 p-3 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Next hint
                            </button>
                            <button
                                type="button"
                                onClick={handleGameOver}
                                className="flex-1 p-3 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Give up
                            </button>
                        </div>
                    </form>
                </>
            ) : (
                <div className="text-center">
                    {renderFeedbackWithLink()}
                    <button
                        onClick={startNewGame}
                        className="px-6 py-3 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-500 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-600"
                    >
                        Start new game
                    </button>
                </div>
            )}
        </div>
    );
};

export default Game;
