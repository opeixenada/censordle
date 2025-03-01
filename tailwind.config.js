/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    "bg-green-300",
    "text-green-800",
    "ring-green-600/20",
    "bg-yellow-300",
    "text-yellow-800",
    "ring-yellow-600/20",
    "bg-orange-300",
    "text-orange-800",
    "ring-orange-600/20",
    "bg-red-300",
    "text-red-800",
    "ring-red-600/20",
    "bg-gray-300",
    "text-gray-800",
    "ring-gray-600/20",
  ],
};
