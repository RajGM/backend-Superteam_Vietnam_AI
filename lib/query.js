require('dotenv').config();
const axios = require("axios");
const { getEncoding } = require("js-tiktoken");

// Assuming these dependencies are available in the module's scope
// const context = ...;
const { pineconeIndex } = require('@lib/helperFunction.js')
const OLLAMA_API_URL = "http://localhost:11434/api";
// /http://localhost:11434/api/embed

async function generateEmbeddings(text) {
    try {
        const response = await axios.post(`${OLLAMA_API_URL}/embed`, {
            model: "bge-large",
            input: text
        });
        return response.data.embeddings;
    } catch (error) {
        console.error("Error generating embeddings:", error.response?.data || error.message);
        throw error;
    }
}

async function generateAnswer(context, conversationHistory, latestQuery) {
    // Format conversation history
    console.log("CONTEXT:", context);
    const conversationText = conversationHistory.length
        ? `Conversation History:\n${formattedHistory}\n`
        : "";

    const systemPrompt = `You are an AI agent that processes user queries based on stored embeddings.
    - The user inputted the following text: "${context}"
- The embedding vector was generated successfully.
- The user is now asking: "${latestQuery}"
- ${conversationText}
Provide an intelligent and relevant response based on the stored information.

`;

    try {
        const response = await axios.post(`${OLLAMA_API_URL}/generate`, {
            model: "mistral",
            prompt: systemPrompt,
            stream: false
        });

        return response.data.response;
    } catch (error) {
        console.error("Error generating answer:", error.response?.data || error.message);
        throw error;
    }
}

async function processQuery(history, query) {
    try {
        // Generate embedding for query
        const queryEmbedding = await generateEmbeddings(query);

        // Query Pinecone
        const queryResponse = await pineconeIndex.query({
            vector: queryEmbedding,
            topK: 5,
            includeMetadata: true
        });

        if (queryResponse.matches && queryResponse.matches.length > 0) {
            const retrievedContext = queryResponse.matches
                .map(match => {
                    const meta = match.metadata;
                    let projectsFormatted = meta.projects;
                    // Try to parse projects if it's a JSON string
                    try {
                        const projectsArray = JSON.parse(meta.projects);
                        projectsFormatted = projectsArray
                            .map(project => `Project: ${project.name} - ${project.description}`)
                            .join("\n");
                    } catch (e) {
                        // If parsing fails, keep the original string.
                    }

                    return `
    Name: ${meta.name}
    Role: ${meta.role}
    Expertise: ${meta.expertise}
    Skills: ${Array.isArray(meta.skills) ? meta.skills.join(', ') : meta.skills}
    Projects: ${projectsFormatted}
    Contact Email: ${meta.contact_email}
              `;
                })
                .join("\n\n");

            return await generateAnswer(retrievedContext, history, query);
        } else {
            return "I don't have any relevant information to answer your question.";
        }
    } catch (error) {
        console.error("Error processing query:", error);
        throw error;
    }
}

async function generateEmbeddingAndQueryForConversation(latestQuery, topK = 5, conversationHistory) {
    try {
        // Format conversation history into a string
        const formattedHistory = conversationHistory
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');

        // Combine history with latest query
        const combinedInput = formattedHistory
            ? `${formattedHistory}\nUser: ${latestQuery}`
            : `User: ${latestQuery}`;

        // Generate embedding using Ollama's BGE-Large
        const embeddingResponse = await axios.post(`${OLLAMA_API_URL}/embed`, {
            model: "bge-large",
            input: combinedInput
        });

        // Query Pinecone with the generated embedding
        const queryResponse = await pineconeIndex.query({
            vector: embeddingResponse.data.embedding,
            topK: topK,
            includeMetadata: true,
            includeValues: false
        });

        return queryResponse;
    } catch (error) {
        console.error(`Error during embedding/query for conversation + "${latestQuery}":`, error);
        throw error;
    }
}

async function generateEmbeddingAndQuery(query, topK = 5) {
    try {
        // Generate embedding using Ollama's BGE-Large
        const embeddingResponse = await axios.post(`${OLLAMA_API_URL}/embed`, {
            model: "bge-large",
            input: query
        });

        // Query Pinecone with the generated embedding
        const queryResponse = await pineconeIndex.query({
            vector: embeddingResponse.data.embedding,
            topK: topK,
            includeMetadata: true,
            includeValues: false
        });

        return queryResponse;
    } catch (error) {
        console.error(`Error during embedding/query for "${query}":`, error);
        throw error;
    }
}

async function deleteVectorsByIds(ids) {
    try {
        console.log(ids)
        const ns = pineconeIndex.namespace('');

        if (ids.length <= 1) {
            await ns.deleteOne(ids[0])
        } else {
            await ns.deleteMany(ids);
        }
    } catch (error) {
        console.error(`Error deleting vectors with source ${ids}:`, error);
        throw error;
    }
}

function validateMember(member) {
    const requiredFields = ['id', 'name', 'role', 'skills', 'expertise', 'experience_level', 'location', 'projects', 'contact_info'];
    for (const field of requiredFields) {
        if (!member[field]) {
            return false;
        }
    }
    return true;
}

// Combine member information into a single text blob
function combineMemberInfo(member) {
    const skills = member.skills.join(', ');
    const projects = member.projects.map(p => `${p.name}: ${p.description}`).join('; ');
    const combined = `Name: ${member.name}. Role: ${member.role}. Skills: ${skills}. Expertise: ${member.expertise}. Experience Level: ${member.experience_level}. Location: ${member.location}. Projects: ${projects}.`;
    return combined;
}

async function processJSONFile(fileUrl) {
    console.log("Processing JSON file:", fileUrl);
    try {
        // Step 1: Download JSON from Firebase
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }

        let jsonData;
        try {
            jsonData = await response.json();
        } catch (error) {
            throw new Error(`Failed to parse JSON: ${error.message}`);
        }

        // Validate JSON structure
        if (!jsonData.superteam_members || !Array.isArray(jsonData.superteam_members)) {
            throw new Error('Invalid JSON structure: Missing "superteam_members" array');
        }

        // Step 2: Create embeddings and upsert to Pinecone
        const vectors = [];
        const ids = [];  // Array to store generated IDs

        for (const member of jsonData.superteam_members) {
            if (!validateMember(member)) {
                console.log(`Invalid member data: ${JSON.stringify(member)}`);
                continue; // Skip invalid member
            }

            // Combine member info into a single string
            const combinedInfo = combineMemberInfo(member);
            const embeddingResponse = await generateEmbeddings(combinedInfo);
            const embedding = embeddingResponse;
            const id = `${member.id}`;  // Generate unique ID

            vectors.push({
                id,
                values: embedding,
                metadata: {
                    name: member.name,
                    role: member.role,
                    skills: member.skills,
                    expertise: member.expertise,
                    experience_level: member.experience_level,
                    location: member.location,
                    contact_email: member.contact_info.email,
                    telegram: member.contact_info.telegram,
                    //projects: member.projects.map(p => ({ name: p.name, description: p.description })),
                    projects: JSON.stringify(member.projects),
                },
            });
            ids.push(id);
        }

        if (vectors.length > 0) {
            await pineconeIndex.upsert(vectors);
            //return ids;
        }

        for (vector of vectors) {
            console.log(vector)
        }

        return ids;
    } catch (error) {
        console.error('Error processing JSON file:', error.message);
        throw error;
    }
}

module.exports = {
    processQuery, deleteVectorsByIds, generateEmbeddingAndQuery,
    generateAnswer,
    generateEmbeddingAndQueryForConversation, processJSONFile
};