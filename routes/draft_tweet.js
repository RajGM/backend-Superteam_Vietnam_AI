const express = require('express');
const router = express.Router();
const { processTweet } = require('@lib/processTweet.js');

router.post('/', async (req, res) => {
  try {
    const { query, history } = req.body;
    // Validate input
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required.' });
    }

    const answer = await processTweet(history, query);
    return res.status(200).json({ answer });

  } catch (error) {
    console.error(`Error processing query:`, error);
    // Return error details to the client
    return res.status(500).json({
      error: 'An error occurred while processing your request.',
      details: error.message || error
    });
  }
});

module.exports = router;
