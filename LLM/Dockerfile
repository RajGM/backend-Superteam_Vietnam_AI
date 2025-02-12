# Use the official Ollama image as the base image.
FROM ollama/ollama

# Switch to root to install curl (if not already available).
USER root

# Install curl if it's not already installed.
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Expose the Ollama API port.
EXPOSE 11434

# Override the default entrypoint so our CMD is executed directly.
ENTRYPOINT []

# Use CMD to:
# 1. Start the Ollama service in the background.
# 2. Wait until the service is available.
# 3. Pull the required models.
# 4. Wait indefinitely.
CMD sh -c "\
  echo 'Starting Ollama service in the background...' && \
  ollama serve & \
  echo 'Waiting for Ollama service to be ready...' && \
  while ! curl -s http://localhost:11434 > /dev/null; do \
    echo 'Waiting for service...'; \
    sleep 2; \
  done && \
  echo 'Ollama service is up!' && \
  echo 'Pulling Mistral model...' && \
  ollama pull mistral && \
  echo 'Pulling BGE-Large model...' && \
  ollama pull bge-large && \
  echo 'Models pulled. Entering wait mode.' && \
  wait"
