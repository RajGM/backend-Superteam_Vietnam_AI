require('dotenv').config();
require('module-alias/register');
const express = require('express');
const cors = require('cors');
const chatRoute = require('./routes/chat');
const uploadRouter = require('./routes/upload');
const cron = require('node-cron');  // Import node-cron

const { getLastProcessedTS, updateLastProcessedTS } = require('@lib/firebaseUtil');
const { processThreads } = require('@lib/query.js');

const app = express();
app.use(cors());
app.use(express.json());

// Attach the chat route
app.use('/api/chat', chatRoute);
app.use('/upload', uploadRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {

  try {
    await slackApp.start(process.env.PORT_BOLT || 3003);
    console.log('⚡️ Bolt app is running!');
  } catch (error) {
    console.log(error);
    console.log(error.data.response_metadata);
  }

  console.log(`Express server listening on port ${PORT}`);

  // Schedule cron job to run every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('Cron job triggered: Fetching new messages and threads...');
    try {
      const lastStoredTS = await getLastProcessedTS();
      const { lastProcessedTS, threadsData } = await fetchNewMessagesAndThreads(lastStoredTS, CHANNEL_ID);
      await processThreads(threadsData, CHANNEL_ID);
      await updateLastProcessedTS(lastProcessedTS);

      console.log('Successfully fetched new messages and threads.');
    } catch (err) {
      console.error('Error during cron job execution:', err);
    }
  });


  console.log('Cron job scheduled to run every second.');
});
