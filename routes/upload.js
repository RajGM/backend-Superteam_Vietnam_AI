// Example Express route for /upload
const express = require('express');
const router = express.Router();
const { processFileToPinecone, deleteVectorsByIds } = require('@lib/query.js');
const { saveFileVectorIdsToFirebase, fetchFileVectorIdsFromFirebase } = require('@lib/firebaseUtil.js');

router.post('/', express.json(), async (req, res) => {
  const { filename, fileUrl } = req.body;

  try {
    const ids = await processFileToPinecone(filename, fileUrl);
    //upload to firebase
    await saveFileVectorIdsToFirebase(filename, ids);
    res.json({ message: 'File processed and upserted successfully', fileUrl });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process the file.' });
  }
});

// New PUT route for updates
router.put('/', express.json(), async (req, res) => {
  const { filename, fileUrl } = req.body;

  try {
    const oldIDs = await fetchFileVectorIdsFromFirebase(filename);
    await deleteVectorsByIds(oldIDs);

    const ids = await processFileToPinecone(filename, fileUrl);
    await saveFileVectorIdsToFirebase(filename, ids);

    res.json({ message: 'Edited file processed and upserted successfully', fileUrl });
  } catch (error) {
    console.error('Error processing edited file:', error);
    res.status(500).json({ error: 'Failed to process the edited file.' });
  }
});

module.exports = router;