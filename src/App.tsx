import React from 'react';
import Game from "./Game";

const App: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col">
            <header className="bg-black text-yellow-400 p-4 shadow-md">
                <div className="container mx-auto">
                    <h1 className="text-3xl font-bold">Censordle</h1>
                </div>
            </header>
            <main className="container mx-auto p-4 mt-8 flex-grow">
                <Game />
            </main>
            <footer className="bg-gray-800 text-gray-400 text-sm p-4 mt-12">
                <div className="container mx-auto text-center">
                    © {currentYear} Censordle
                </div>
            </footer>
        </div>
    );
};

export default App;