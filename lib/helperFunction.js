require('dotenv').config();
const { OpenAI } = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');
const { getEncoding } = require("js-tiktoken");

const indexName = process.env.indexName;
const indexHost = process.env.indexHost;
const namespace = 'default_crunchdata_test';
const dimensions = 1536;
const enc = getEncoding('cl100k_base');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
});

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

(async() => {
    // Check for existing indexes and create if necessary
    const indexesResponse = await pinecone.listIndexes();
    const existingIndexNames = indexesResponse.indexes.map(idx => idx.name);

    if(!existingIndexNames.includes(indexName)) {
    await pinecone.createIndex({
        name: indexName,
        dimension: dimensions,
        metric: 'cosine',
        spec: {
            serverless: {
                cloud: 'aws',
                region: 'us-east-1'
            }
        }
    });    
}
})();

const pineconeIndex = pinecone.index(indexName, indexHost);

module.exports = {
    openai, pinecone, indexHost, indexName, pineconeIndex
}