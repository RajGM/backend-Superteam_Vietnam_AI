// index.js

// Load environment variables from .env file
require('dotenv').config();

// If using Node.js version < 18, uncomment the following lines:
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const fetch = global.fetch || require('node-fetch'); // Ensure fetch is available

/**
 * Fetches the user ID for a given Twitter username.
 * @param {string} username - The Twitter username (without @).
 * @param {string} bearerToken - Your Twitter API Bearer Token.
 * @returns {Promise<string>} - The user ID.
 */
async function fetchUserId(username, bearerToken) {
    const url = `https://api.x.com/2/users/by/username/${username}`;
    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
        },
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error fetching user ID: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }
        const data = await response.json();
        return data.data.id;
    } catch (error) {
        console.error('Error in fetchUserId:', error.message);
        throw error;
    }
}

/**
 * Fetches tweets for a given user ID.
 * @param {string} userId - The Twitter user ID.
 * @param {string} bearerToken - Your Twitter API Bearer Token.
 * @param {number} maxResults - Number of tweets to fetch (max 100).
 * @returns {Promise<Array>} - Array of tweet objects.
 */
async function getUserTweets(userId, bearerToken, maxTweets = 10) {
    const url = `https://api.x.com/2/users/${userId}/tweets?max_results=${maxTweets}`;
    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${bearerToken}`
        },
    };

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            // Extract error details from the response
            const errorData = await response.json();
            throw new Error(`Twitter API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log("DATA:", data)
        return data; // Contains the tweets and metadata
    } catch (error) {
        console.error(`Error fetching tweets for user ID ${userId}:`, error.message);
        throw error; // Propagate the error to the caller
    }
}

/**
 * Main function to get tweets for a given username.
 * @param {string} username - The Twitter username (without @).
 */
async function getTweetsByUsername(username) {
    const bearerToken = process.env.TWITTER_API_BEARER_TOKEN;
    if (!bearerToken) {
        console.error('Bearer Token not found. Please set BEARER_TOKEN in your environment variables.');
        return;
    }

    try {
        const userId = await fetchUserId(username, bearerToken);
        console.log(`User ID for ${username}: ${userId}`);

        const tweets = await getUserTweets(userId, bearerToken, 5); // Fetch latest 10 tweets
        if (tweets.length === 0) {
            console.log('No tweets found for this user.');
            return;
        }

        console.log(`Fetched ${tweets.length} tweets:`);
        tweets.forEach(tweet => {
            console.log(`- [${tweet.id}] (${tweet.created_at}) ${tweet.text}`);
            console.log(`  Likes: ${tweet.public_metrics.like_count}, Retweets: ${tweet.public_metrics.retweet_count}`);
        });
    } catch (error) {
        console.error('Error in getTweetsByUsername:', error.message);
    }
}

// Example Usage
const username = 'cdhiraj10'; // Replace with the desired Twitter username
//getTweetsByUsername(username);
async function test() {
    //rajgm_hacks -- only error for this
    const userId = await fetchUserId('cdhiraj40', process.env.TWITTER_API_BEARER_TOKEN2);
    console.log(`User ID for ${username}: ${userId}`);

    await getUserTweets(userId, process.env.TWITTER_API_BEARER_TOKEN2, maxResults = 5)
    
};

test();