#!/bin/sh
set -e

echo "Starting Ollama service in the background..."
# Start the Ollama service in the background.
ollama serve &

# Wait a few seconds to let the service initialize.
#sleep 10

echo "Pulling Mistral model..."
#ollama pull mistral

echo "Pulling BGE-Large model..."
#ollama pull bge-large

echo "Models pulled and Ollama service is running."
# Wait indefinitely (or tail logs) so that the container doesn't exit.
# Using "wait" will wait for background jobs to finish.
wait
