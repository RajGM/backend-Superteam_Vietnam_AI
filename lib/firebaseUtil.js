const {db, doc, getDoc} = require('./firebaseConfig');

// Firestore imports
const {
  collection,
  addDoc
} = require('firebase-admin/firestore');

// Define a doc location for your metadata (holding lastProcessedTS)
const metadataDocRef = db.collection('slackMetadata').doc('timestamps');
const vectorIdRef = db.collection('fileVectors');

// A collection where we'll store each new Slack message
// (If you don't need to store messages, you can omit this.)
const messagesColRef = db.collection("slackMessages");

/**
 * Fetch the current lastProcessedTS from Firestore.
 * Returns "0" if not found.
 */
async function getLastProcessedTS() {
  try {
    // 2) Use .get() on the doc ref
    const snapshot = await metadataDocRef.get();
    if (!snapshot.exists) {
      return "0";
    }
    const data = snapshot.data();
    const ts = data.lastProcessedTS || "0";
    return ts;
  } catch (error) {
    console.error("Error fetching lastProcessedTS:", error);
    return "0";
  }
}

/**
 * updateLastProcessedTS
 * Merges { lastProcessedTS: maxTS } into the doc at metadataDocRef.
 * @param {string} maxTS - The new timestamp (string form)
 * @returns {Promise<void>}
 */
async function updateLastProcessedTS(maxTS) {
  try {
    await metadataDocRef.set({ lastProcessedTS: maxTS }, { merge: true });
  } catch (error) {
    console.error("Error updating lastProcessedTS:", error);
  }
}

/**
 * Save Slack messages (array) to Firestore,
 * and update lastProcessedTS to the max ts found.
 */
async function saveSlackMessagesToFirebase(messages) {
  if (!messages || messages.length === 0) {
    return;
  }

  try {
    // 1) Get current lastProcessedTS
    const currentTS = await getLastProcessedTS();
    const currentTsFloat = parseFloat(currentTS);

    // 2) Filter only new messages
    const newMessages = messages.filter(
      (msg) => parseFloat(msg.ts) > currentTsFloat
    );

    if (newMessages.length === 0) {
      return;
    }

    // 3) Add each new message to the "slackMessages" collection
    //    (Remove or adapt this if you don't need to store messages.)
    for (const msg of newMessages) {
      await addDoc(messagesColRef, {
        ...msg,
        savedAt: Date.now() // optional metadata
      });
    }

    // 4) Update lastProcessedTS to the highest ts
    const maxTS = newMessages.reduce((acc, msg) => {
      return parseFloat(msg.ts) > parseFloat(acc) ? msg.ts : acc;
    }, currentTS);

    await setDoc(metadataDocRef, { lastProcessedTS: maxTS }, { merge: true });
   
  } catch (error) {
    console.error("Error saving Slack messages to Firestore:", error);
  }
}

/**
 * Saves an array of vector IDs to a Firestore document under the "fileVectors" collection.
 * The document ID is the filename.
 * 
 * @param {string} fileName - The filename used as the document ID.
 * @param {Array<string>} vectorIds - Array of vector IDs to save.
 * @returns {Promise<void>}
 */
async function saveFileVectorIdsToFirebase(fileName, vectorIds) {
  try {
    // Reference to a document in "fileVectors" collection with ID = fileName
    const fileVectorDocRef = vectorIdRef.doc(fileName);
    
    // Save the array of vector IDs in the document under the field "vectorIds"
    await fileVectorDocRef.set({ vectorIds: vectorIds });
  } catch (error) {
    console.error(`Error saving vector IDs for file "${fileName}":`, error);
    throw error;
  }
}

/**
 * Fetches the vector ID array from a Firestore document in the "fileVectors" collection.
 * The document ID is the filename.
 * 
 * @param {string} fileName - The filename used as the document ID.
 * @returns {Promise<Array<string>>} - The array of vector IDs, or an empty array if not found.
 */
async function fetchFileVectorIdsFromFirebase(fileName) {
  try {
    // Reference to the document in "fileVectors" collection with ID = fileName
    const fileVectorDocRef = vectorIdRef.doc(fileName);

    // Get the document
    const docSnapshot = await fileVectorDocRef.get();

    // Check if the document exists
    if (!docSnapshot.exists) {
      return []; // Return an empty array if the document doesn't exist
    }

    // Extract vectorIds from the document
    const data = docSnapshot.data();
    const vectorIds = data.vectorIds || []; // Default to an empty array if vectorIds is not set

    return vectorIds;
  } catch (error) {
    console.error(`Error fetching vector IDs for file "${fileName}":`, error);
    throw error; // Rethrow the error for the caller to handle
  }
}


module.exports = {
  getLastProcessedTS,
  updateLastProcessedTS,
  saveSlackMessagesToFirebase,
  saveFileVectorIdsToFirebase,
  fetchFileVectorIdsFromFirebase
};