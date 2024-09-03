import React, {FormEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {collection, doc, getDoc} from 'firebase/firestore';
import {Movie, TitleMapping} from "../types";
import {db} from "../firebase";
import CategoryBadge from "./CategoryBadge";

const Game: React.FC = () => {
    // Data and loading state
    const [titleMapping, setTitleMapping] = useState<TitleMapping | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Game state
    const [gameOver, setGameOver] = useState(false);
    const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
    const [revealedEntriesCount, setRevealedEntriesCount] = useState(1);
    const [previousGuesses, setPreviousGuesses] = useState<string[]>([]);

    // User input and feedback
    const [guess, setGuess] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [guessesFeedback, setGuessesFeedback] = useState<string | null>(null);
    const [gameFeedback, setGameFeedback] = useState<string | null>(null);

    // UI state
    const [title, setTitle] = useState<string>('In which movie does this happen?');
    const inputRef = useRef<HTMLInputElement>(null);

    const remainingEntries = useMemo(() => {
        return currentMovie?.parentalGuideEntries?.length
            ? currentMovie.parentalGuideEntries.length - revealedEntriesCount
            : 0;
    }, [currentMovie, revealedEntriesCount]);

    const fetchTitleMapping = useCallback(async () => {
        try {
            const titleMappingDocRef = doc(collection(db, 'metadata'), 'titleMapping');
            const titleMappingDoc = await getDoc(titleMappingDocRef);
            setTitleMapping(titleMappingDoc.data() as TitleMapping);
        } catch (err) {
            console.error(`Error fetching title mapping:`, err);
            setError(`Failed to fetch movies: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTitleMapping();
    }, [fetchTitleMapping]);

    const selectMovie = useCallback(async () => {
        if (!titleMapping) return null;

        const keys = Object.keys(titleMapping);
        if (keys.length === 0) return null;

        let fetchedMovie: Movie | null = null;

        // Loop until a movie with at least 2 parental guide entries is found
        while (!fetchedMovie || fetchedMovie.parentalGuideEntries.length < 2) {
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            const movieId = titleMapping[randomKey];

            try {
                const movieDocRef = doc(collection(db, 'movies'), movieId);
                const movieDoc = await getDoc(movieDocRef);
                fetchedMovie = movieDoc.exists() ? (movieDoc.data() as Movie) : null;
            } catch (error) {
                console.error(`Error fetching random movie:`, error);
                return null;
            }
        }

        // Set the fetched movie with shuffled parental guide entries
        if (fetchedMovie) {
            setCurrentMovie({
                ...fetchedMovie,
                parentalGuideEntries: shuffleArray([...fetchedMovie.parentalGuideEntries]),
            });
        }
    }, [titleMapping]);

    // This effect will run:
    // - After the initial render
    // - Whenever `titleMapping` changes, which causes `selectMovie` to be recreated
    useEffect(() => {
        selectMovie();
    }, [selectMovie]);

    useEffect(() => {
        setGuess('');
        setGuessesFeedback(`You have ${remainingEntries} more hints.`);
    }, [revealedEntriesCount, remainingEntries]);

    useEffect(() => {
        resetGameState();
    }, [currentMovie]);

    const resetGameState = () => {
        setGameOver(false);
        setTitle(`In which movie does this happen?`);
        setGuess('');
        setRevealedEntriesCount(1);
        setGuessesFeedback(null);
        setGameFeedback(null);
        setPreviousGuesses([]);
    };

    const startNewGame = () => {
        selectMovie();
    };

    const handleGameOver = () => {
        setGameOver(true);
        setTitle(`Game Over 😵`);
        setGameFeedback(`It was `);
    };

    const getIMDBLink = (movieId: string) => `https://www.imdb.com/title/${movieId}/`;

    const shuffleArray = <T, >(array: T[]): T[] => {
        return array.sort(() => Math.random() - 0.5);
    };

    const handleGuess = (e?: FormEvent) => {
        e?.preventDefault();
        if (!currentMovie || !titleMapping || guess.trim() === '') return;

        const normalizedGuess = guess.trim();

        // Check if the guess is in the list of movie titles
        if (!(normalizedGuess in titleMapping)) {
            setGuessesFeedback(`Please select a movie from the suggestions.`);
            return;
        }

        // Check if the guess has already been made
        if (previousGuesses.includes(normalizedGuess)) {
            setGuessesFeedback(`You have already guessed that. Try something else!`);
            return;
        }

        const normalizedTitle = `${currentMovie.title} (${currentMovie.year})`;

        if (normalizedGuess === normalizedTitle) {
            setGameOver(true);
            setTitle(`Congratulations! 🎉`);
            setGameFeedback(`You guessed correctly! It's `);
        } else {
            handleNextHint();
            setPreviousGuesses(prev => [...prev, normalizedGuess]);
        }
    };

    const handleNextHint = () => {
        if (!currentMovie) return;

        if (revealedEntriesCount < currentMovie.parentalGuideEntries.length) {
            setRevealedEntriesCount(prevEntries => prevEntries + 1);
        } else {
            handleGameOver();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setGuess(value);

        if (value.length > 1 && titleMapping) {
            const filteredSuggestions = Object.keys(titleMapping)
                .filter(key => key.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 5); // Limit to 5 suggestions
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setGuess(suggestion);
        setSuggestions([]);
        inputRef.current?.focus();
    };

    const renderGameFeedbackWithLink = () => {
        if (!currentMovie) return null;

        return (
            <p className="mb-6 text-xl font-semibold">
                {gameFeedback}
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
    if (!currentMovie) return <div className="text-center p-4 text-gray-700">Selecting a movie...</div>;
    if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

    return (
        <div className="max-w-2xl mx-auto mt-4 p-8 bg-white text-gray-800 rounded-lg shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-black text-center">{title}</h2>
            {!gameOver ? (
                <>
                    <div className="mb-6 bg-gray-100 p-6 rounded-lg shadow-inner">
                        <ul className="space-y-3">
                            {currentMovie.parentalGuideEntries.slice(0, revealedEntriesCount).map((entry, index) => (
                                <li key={index} className="text-base leading-relaxed">
                                    <CategoryBadge entry={entry}/>
                                    <span>
                                    {entry.description}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {guessesFeedback && (
                        <p className="mb-4 p-3 bg-yellow-400 text-black rounded-lg font-semibold">
                            {guessesFeedback}
                        </p>
                    )}
                    {previousGuesses.length > 0 && (
                        <div className="mb-6">
                            <h4 className="font-semibold text-gray-700 mb-2">Previous guesses:</h4>
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
                                disabled={guess.trim() === '' || (titleMapping != null && !(guess in titleMapping))}
                            >
                                Submit guess
                            </button>
                            <button
                                type="button"
                                onClick={handleNextHint}
                                disabled={remainingEntries === 0}
                                className="flex-1 p-3 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    {renderGameFeedbackWithLink()}
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
