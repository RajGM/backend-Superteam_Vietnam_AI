# Use the official Ollama image as the base
FROM ollama/ollama

# Expose the Ollama API port
EXPOSE 11434

# Copy the startup script into the image
COPY startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh

# Override the default entrypoint to use our startup script
ENTRYPOINT ["/usr/local/bin/startup.sh"]
