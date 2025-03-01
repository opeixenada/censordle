import React from "react";
import Game from "./components/Game";

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-gray-200">
      <header className="bg-black p-4 text-yellow-400 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">Censordle</h1>
        </div>
      </header>
      <main className="container mx-auto mt-8 flex-grow p-4">
        <Game />
      </main>
      <footer className="mt-12 bg-gray-800 p-4 text-sm text-gray-400">
        <div className="container mx-auto text-center">{currentYear} Censordle</div>
      </footer>
    </div>
  );
};

export default App;
