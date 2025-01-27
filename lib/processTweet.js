const { openai, pinecone } = require('@lib/helperFunction.js');

async function generateAnswer(openai, context, conversationHistory, latestQuery) {
    // Initialize messages with a system instruction
    const messages = [
        {
            role: "system",
            content: `
            You are an AI-powered Twitter Content Advisor for Superteam Vietnam. Below is the information you need to assist in creating, refining, and finalizing a tweet for our official Twitter account.

**Context:**

- **Brand Name**: Superteam Vietnam
- **Brand Tone**: Professional, Engaging, Friendly, Innovative
- **Objective**: To create engaging, accurate, and brand-aligned tweets that resonate with our audience and promote our initiatives effectively.

**Task Instructions:**

1. **Proposing Tweets**:
   - Generate a tweet draft based on the provided topic or prompt.
   - Ensure the draft aligns with Superteam Vietnam’s brand tone and objectives.

2. **Iterating on Tweet Drafts**:
   - **Suggest Keywords**: Enhance the tweet’s visibility and engagement by suggesting relevant hashtags and keywords.
   - **Correct Twitter Handles**: Ensure that any mentioned Twitter handles are accurate by cross-referencing with the provided list of Superteam VN’s followed accounts.

3. **Finalizing Tweets**:
   - Compile the refined tweet ready for human approval and posting.
   - Ensure the tweet adheres to Twitter’s character limit (280 characters) and best practices.

            `
        }
    ];

    // Add conversation history as separate message objects
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
            // Push each message from history preserving role and content
            messages.push({
                role: msg.role,
                content: msg.content
            });
        });
    }

    // Add the final user message containing context and the latest query
    messages.push({
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${latestQuery}`
    });

    try {
        // Create the chat completion with the assembled message sequence
        const completionResponse = await openai.chat.completions.create({
            model: "gpt-4o",  // Update model name if necessary
            messages: messages,
        });

        // Extract and return the answer text
        const answer = completionResponse.choices?.[0]?.message?.content?.trim();
        return answer;
    } catch (error) {
        console.error("Error generating answer:", error);
        throw error;
    }
}

async function processTweet(history, query) {
    try {

        const queryResponse = await generateEmbeddingAndQueryForConversation(
            openai,
            pineconeIndex,
            query,
            5,
            history
        );

        if (queryResponse.matches && queryResponse.matches.length > 0) {
            const retrievedContext = queryResponse.matches
                .map(match => match.metadata?.text || "")
                .join("\n\n");

            const answer = await generateAnswer(openai, retrievedContext, history, query);
            return answer;
        } else {
            throw new Error('No relevant information found.');
        }

    } catch (error) {
        console.error("Error processing query:", error);
        throw error;  // Propagate error to caller for proper handling
    }
}


module.exports = {
    processTweet
};