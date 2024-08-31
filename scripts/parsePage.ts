import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

type AdvisoryEntry = {
    category: string;
    severity: string;
    description: string;
};

type MovieInfo = {
    title: string;
    year: string;
    parentalGuideEntries: AdvisoryEntry[];
};

const getURL = (movieId: string): string => {
    return `https://www.imdb.com/title/${movieId}/parentalguide`
}

const fetchHTML = async (url: string): Promise<string> => {
    try {
        const response = await axios.get(url, {
            headers: {
                'Accept-Language': 'en-US,en;q=0.9'  // Request the page in English
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Could not fetch data from ${url}`, error);
        throw error;
    }
};

const extractInfo = (html: string): MovieInfo => {
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

    $('section[id^="advisory-"]').each((_, section) => {
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

    $('section[id^="advisory-"]').each((_, section) => {
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
        title,
        year,
        parentalGuideEntries
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

const main = async () => {
    const movieID = process.argv[2];  // Get the URL from the command line argument

    if (!movieID) {
        console.error('Please provide a movie ID as the first argument');
        process.exit(1);
    }

    try {
        const html = await fetchHTML(getURL(movieID));
        const movieInfo = extractInfo(html);

        // Save the extracted movie info to a file
        saveMovieInfo(movieInfo);
    } catch (error) {
        console.error('Error occurred:', error);
    }
};

main();
