FROM mcr.microsoft.com/devcontainers/universal:2

RUN apt-get update \
    && apt-get install -y chromium-browser \
    || apt-get install -y chromium \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*