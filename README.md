# Censordle

Censordle is a movie guessing game inspired by the popular word game Wordle, but with a twist. Instead of guessing
words, players try to identify movies based on their parental guide entries from IMDB.

## Getting Started

### Prerequisites

- Node.js (v22 or later recommended)
- npm
- Firebase account and project

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/censordle.git
   cd censordle
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your Firebase configuration:
    - Create a `.env` file in the root directory
    - Add your Firebase configuration:
      ```
      REACT_APP_FIREBASE_API_KEY=your_api_key
      REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
      REACT_APP_FIREBASE_PROJECT_ID=your_project_id
      REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
      REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
      REACT_APP_FIREBASE_APP_ID=your_app_id
      ```

4. Start the development server:
   ```
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## How to Play

1. A parental guide entry for a movie will be displayed.
2. Try to guess the movie title based on the entry.
3. If your guess is incorrect, another entry will be revealed.
4. Continue guessing until you identify the movie or run out of entries.
5. Start a new game to play again!

## Acknowledgments

- Inspired by Wordle and IMDB
- Built with React, TypeScript, and Tailwind CSS
- Firebase used for backend services