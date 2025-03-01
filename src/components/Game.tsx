import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, getDoc } from "firebase/firestore";
import { Movie, TitleMapping } from "../types";
import { db } from "../firebase";
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
  const [guess, setGuess] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [guessesFeedback, setGuessesFeedback] = useState<string | null>(null);
  const [gameFeedback, setGameFeedback] = useState<string | null>(null);

  // UI state
  const [title, setTitle] = useState<string>("In which movie does this happen?");
  const inputRef = useRef<HTMLInputElement>(null);

  const remainingEntries = useMemo(() => {
    return currentMovie?.parentalGuideEntries?.length
      ? currentMovie.parentalGuideEntries.length - revealedEntriesCount
      : 0;
  }, [currentMovie, revealedEntriesCount]);

  const fetchTitleMapping = useCallback(async () => {
    try {
      const titleMappingDocRef = doc(collection(db, "metadata"), "titleMapping");
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
        const movieDocRef = doc(collection(db, "movies"), movieId);
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
    setGuess("");
    setGuessesFeedback(`You have ${remainingEntries} more hints.`);
  }, [revealedEntriesCount, remainingEntries]);

  useEffect(() => {
    resetGameState();
  }, [currentMovie]);

  const resetGameState = () => {
    setGameOver(false);
    setTitle(`In which movie does this happen?`);
    setGuess("");
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

  const shuffleArray = <T,>(array: T[]): T[] => {
    return array.sort(() => Math.random() - 0.5);
  };

  const handleNextHint = () => {
    if (!currentMovie) return;

    if (revealedEntriesCount < currentMovie.parentalGuideEntries.length) {
      setRevealedEntriesCount((prevEntries) => prevEntries + 1);
    } else {
      handleGameOver();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGuess(value);

    if (value.length > 1 && titleMapping) {
      const filteredSuggestions = Object.keys(titleMapping)
        .filter(
          (key) =>
            key.toLowerCase().includes(value.toLowerCase()) && !previousGuesses.includes(key),
        )
        .slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSuggestions([]);

    if (!currentMovie || !titleMapping || suggestion.trim() === "") return;

    const normalizedGuess = suggestion.trim();

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
      setPreviousGuesses((prev) => [...prev, normalizedGuess]);
    }
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
          className="text-blue-600 underline hover:text-blue-800"
        >
          {currentMovie.title}
        </a>
        .
      </p>
    );
  };

  if (loading) return <div className="p-4 text-center text-gray-700">Loading...</div>;
  if (!currentMovie)
    return <div className="p-4 text-center text-gray-700">Selecting a movie...</div>;
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

  return (
    <div className="mx-auto mt-4 max-w-2xl rounded-lg bg-white p-8 text-gray-800 shadow-2xl">
      <h2 className="mb-6 text-center text-3xl font-bold text-black">{title}</h2>
      {!gameOver ? (
        <>
          <div className="mb-6 rounded-lg bg-gray-100 p-6 shadow-inner">
            <ul className="space-y-3">
              {currentMovie.parentalGuideEntries
                .slice(0, revealedEntriesCount)
                .map((entry, index) => (
                  <li key={index} className="text-base leading-relaxed">
                    <CategoryBadge entry={entry} />
                    <span>{entry.description}</span>
                  </li>
                ))}
            </ul>
          </div>
          {guessesFeedback && (
            <p className="mb-4 rounded-lg bg-yellow-400 p-3 font-semibold text-black">
              {guessesFeedback}
            </p>
          )}
          {previousGuesses.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-2 font-semibold text-gray-700">Previous guesses:</h4>
              <div className="flex flex-wrap gap-2">
                {previousGuesses.map((prevGuess, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700"
                  >
                    {prevGuess}
                  </span>
                ))}
              </div>
            </div>
          )}
          <form className="mt-6">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={handleInputChange}
                placeholder="Enter movie title"
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 -mt-px max-h-60 w-full overflow-auto rounded-b-lg border border-gray-300 bg-white shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="cursor-pointer p-3 transition duration-200 ease-in-out hover:bg-gray-100"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex gap-4">
              <button
                type="button"
                onClick={handleNextHint}
                disabled={remainingEntries === 0}
                className="flex-1 rounded-lg bg-yellow-400 p-3 font-bold text-black transition duration-300 ease-in-out hover:bg-yellow-500 focus:ring-2 focus:ring-yellow-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next hint
              </button>
              <button
                type="button"
                onClick={handleGameOver}
                className="flex-1 rounded-lg bg-gray-300 p-3 font-bold text-gray-700 transition duration-300 ease-in-out hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:outline-none"
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
            className="rounded-lg bg-yellow-400 px-6 py-3 font-bold text-black transition duration-300 ease-in-out hover:bg-yellow-500 focus:ring-2 focus:ring-yellow-600 focus:outline-none"
          >
            Start new game
          </button>
        </div>
      )}
    </div>
  );
};

export default Game;
