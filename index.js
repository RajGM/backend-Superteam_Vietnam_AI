require('dotenv').config();
require('module-alias/register');
const express = require('express');
const cors = require('cors');
const chatRoute = require('./routes/chat');
const uploadRouter = require('./routes/upload');
const draft_tweet = require('./routes/draft_tweet');
const cron = require('node-cron');  // Import node-cron

const { openai } = require('./lib/helperFunction');
const { getLastProcessedTS, updateLastProcessedTS } = require('@lib/firebaseUtil');
const { processThreads } = require('@lib/query.js');

// Initialize Telegram Bot
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const app = express();
app.use(cors());
app.use(express.json());

// Attach the chat route
app.use('/api/chat', chatRoute);
app.use('/upload', uploadRouter);
app.use('/draft_tweet', draft_tweet);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {

    // Handle /start command (optional)
    // bot.onText(/\/start/, (msg) => {
    //     bot.sendMessage(msg.chat.id, "Welcome! Use /draft to create a new message.");
    // });

    // // Handle /d2 command
    // bot.onText(/^\/d2$/, function (msg) {
    //     const chatId = msg.chat.id;
    //     const message = `Click [here](https://b9e7-49-249-60-246.ngrok-free.app) to open the Web App.`;
    //     bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    //         .catch((error) => {
    //             console.error('Error sending /d2 message:', error.response.body);
    //         });
    // });

    //DM ONLY
    /*
    bot.onText(/^\/d2$/, function (msg) {
        console.log("msg", msg);
        bot.sendMessage(msg.chat.id, "Select channel", {
            "reply_markup": {
                "inline_keyboard": [
                    [
                        {
                            text: "Channel 1",
                            callback_data: "channel1",
                            web_app: {
                                url: "https://b9e7-49-249-60-246.ngrok-free.app",
                            },
                        },
                    ]
                ],

            },

        });

        //bot.sendMessage(msg.chat.id, "I'm a test webapp");
    });
*/

    // Handle /draft command
    // bot.onText(/\/draft/, (msg) => {
    //     const chatId = msg.chat.id;

    //     const options = {
    //         reply_markup: {
    //             inline_keyboard: [
    //                 [
    //                     {
    //                         text: "Create Message",
    //                         web_app: {
    //                             url: "https://b9e7-49-249-60-246.ngrok-free.app",
    //                         },
    //                     },
    //                 ],
    //             ],
    //         },
    //     };

    //     bot.sendMessage(chatId, "Click the button below to create a new message.", options)
    //         .catch((error) => {
    //             console.error('Error sending /draft message:', error.response.body);
    //         });
    // });

    // bot.on('web_app_data', async (msg) => {
    //     const chatId = msg.chat.id;
    //     const data = msg.web_app_data.data; // JSON string

    //     try {
    //         const parsedData = JSON.parse(data);
    //         const { message } = parsedData;

    //         // Validate the message
    //         if (!message || typeof message !== 'string') {
    //             bot.sendMessage(chatId, "Invalid message received.");
    //             return;
    //         }

    //         if (message.length > 4096) { // Telegram's max message length
    //             bot.sendMessage(chatId, "Message exceeds the maximum allowed length of 4096 characters.");
    //             return;
    //         }

    //         // Post the message to the Telegram group/channel
    //         await bot.sendMessage(chatId, message);

    //         // Notify the user
    //         bot.sendMessage(chatId, "Your message has been published successfully!");

    //     } catch (error) {
    //         console.error('Error handling web app data:', error);
    //         bot.sendMessage(chatId, "An error occurred while publishing your message.");
    //     }
    // });

    // Schedule cron job to run every 12 hours
    // cron.schedule('0 */12 * * *', async () => {
    //     console.log('Cron job triggered: Fetching new messages and threads...');
    //     try {
    //         const lastStoredTS = await getLastProcessedTS();
    //         const { lastProcessedTS, threadsData } = await fetchNewMessagesAndThreads(lastStoredTS, CHANNEL_ID);
    //         await processThreads(threadsData, CHANNEL_ID);
    //         await updateLastProcessedTS(lastProcessedTS);

    //         console.log('Successfully fetched new messages and threads.');
    //     } catch (err) {
    //         console.error('Error during cron job execution:', err);
    //     }
    // });

    console.log('Cron job scheduled to run every second.');
});
