import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

type AdvisoryEntry = {
    category: string;
    severity: string;
    description: string;
};

type MovieInfo = {
    imdbID: string;
    title: string;
    year: string;
    parentalGuideEntries: AdvisoryEntry[];
};

const requestHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
}

const getURL = (movieId: string): string => {
    return `https://www.imdb.com/title/${movieId}/parentalguide`
}

const fetchHTML = async (url: string): Promise<string> => {
    try {
        const response = await axios.get(url, {
            headers: requestHeaders
        });
        return response.data;
    } catch (error) {
        console.error(`Could not fetch data from ${url}`, error);
        throw error;
    }
};

const extractInfo = (movieId: string, html: string): MovieInfo => {
    if (!html) {
        throw new Error('Received empty HTML content');
    }

    const $ = cheerio.load(html);  // Load the HTML content into Cheerio

    // Extract the movie title and year from the specified structure
    const titleElement = $('div.subpage_title_block__right-column h3[itemprop="name"] a').first();
    const title = titleElement.text().trim();
    const year = titleElement.next('span.nobr').text().trim().replace(/[()]/g, '');

    // Step 1: Extract all categories and severities
    const categorySeverities: { [key: string]: string } = {};

    $('section[id^="advisory-"]').not('#advisory-spoilers').each((_, section) => {
        const category = $(section).find('h4.ipl-list-title').first().text().trim();
        const severity = $(section)
            .find('.advisory-severity-vote__container .ipl-status-pill')
            .first()
            .text()
            .trim();

        if (category) {
            categorySeverities[category] = categorySeverities[category] || severity;
        }
    });

    // Step 2: Parse all entries and assign severities based on their categories
    const parentalGuideEntries: AdvisoryEntry[] = [];

    $('section[id^="advisory-"]').not('#advisory-spoilers').each((_, section) => {
        const category = $(section).find('h4.ipl-list-title').first().text().trim();
        const severity = categorySeverities[category] || 'Unknown';  // Default to 'Unknown' if severity isn't found

        $(section).find('li').each((_, item) => {
            // Extract the main text of the <li> while ignoring nested elements like <div>
            const entryText = $(item)
                .clone() // Clone the element
                .children() // Get all child elements (like the div)
                .remove() // Remove the child elements
                .end() // Return to the original element
                .text() // Get the text content
                .trim(); // Trim the text

            if (entryText) { // Only add if there's relevant text
                parentalGuideEntries.push({category, severity, description: entryText});
            }
        });
    });

    // Return the movie info in the specified format
    return {
        imdbID: movieId,
        title: title,
        year: year,
        parentalGuideEntries: parentalGuideEntries
    };
};

const saveMovieInfo = (movieInfo: MovieInfo) => {
    const directory = path.join(__dirname, 'scraped_data');
    const fileName = `${movieInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}_${movieInfo.year}.json`; // Replace non-alphanumeric characters with underscores
    const filePath = path.join(directory, fileName);

    // Ensure the directory exists
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, {recursive: true});
    }

    // Save the JSON data to a file
    fs.writeFileSync(filePath, JSON.stringify(movieInfo, null, 2));
    console.log(`Data saved to ${filePath}`);
};

async function getIMDBIdByTitle(movieTitle: string): Promise<string | null> {
    try {
        const encodedTitle = encodeURIComponent(movieTitle);
        const searchUrl = `https://www.imdb.com/find/?q=${encodedTitle}&s=tt&ttype=ft&exact=true&ref_=fn_tt_ex`;

        const response = await axios.get(searchUrl, {
            headers: requestHeaders
        });

        const $ = cheerio.load(response.data);
        const scriptContent = $('#__NEXT_DATA__').html();

        if (scriptContent) {
            const jsonData = JSON.parse(scriptContent);
            const results = jsonData.props.pageProps.titleResults.results;

            if (results && results.length > 0) {
                const firstResult = results[0];
                return firstResult.id;
            }
        }

        console.log(`No results found for "${movieTitle}"`);
        return null;
    } catch (error) {
        console.error(`Error searching for "${movieTitle}":`, error);
        return null;
    }
}

async function readMovieTitlesFromFile(filePath: string): Promise<string[]> {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const movieTitles: string[] = [];

    for await (const line of rl) {
        if (line.trim() !== '') {
            movieTitles.push(line.trim());
        }
    }

    return movieTitles;
}

const processMovie = async (movieTitle: string) => {
    try {
        const movieId = await getIMDBIdByTitle(movieTitle);
        if (!movieId) {
            console.error(`Could not find IMDB ID for "${movieTitle}"`);
            return;
        }

        console.log(`Found IMDB ID: ${movieId} for "${movieTitle}"`);

        const html = await fetchHTML(getURL(movieId));
        const movieInfo = extractInfo(movieId, html);

        // Save the extracted movie info to a file
        saveMovieInfo(movieInfo);
    } catch (error) {
        console.error(`Error processing "${movieTitle}":`, error);
    }
};

async function readMovieTitlesFromDirectory(dirPath: string): Promise<string[]> {
    const files = fs.readdirSync(dirPath);
    const movieTitles: string[] = [];

    for (const file of files) {
        if (path.extname(file).toLowerCase() === '.txt') {
            const filePath = path.join(dirPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const titles = content.split('\n').map(line => line.trim()).filter(line => line !== '');
            movieTitles.push(...titles);
        }
    }

    return movieTitles;
}

const main = async () => {
    const inputDirPath = process.argv[2];  // Get the input directory path from the command line argument

    if (!inputDirPath) {
        console.error('Please provide a path to the input directory as the first argument');
        process.exit(1);
    }

    try {
        const movieTitles = await readMovieTitlesFromDirectory(inputDirPath);

        if (movieTitles.length === 0) {
            console.error('No movie titles found in the input directory');
            process.exit(1);
        }

        console.log(`Found ${movieTitles.length} movie titles in the input directory`);

        for (const title of movieTitles) {
            await processMovie(title);
        }

        console.log('Finished processing all movies');
    } catch (error) {
        console.error('Error occurred:', error);
    }
};

main();