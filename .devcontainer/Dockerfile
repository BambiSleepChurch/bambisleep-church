# BambiSleep™ Church MCP Control Tower Development Container
# Organization: BambiSleepChurch
# Repository: https://github.com/BambiSleepChurch/bambisleep-church

FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Organization and Trademark Labels
LABEL org.opencontainers.image.vendor="BambiSleepChurch"
LABEL org.opencontainers.image.source="https://github.com/BambiSleepChurch/bambisleep-church"
LABEL org.opencontainers.image.documentation="https://github.com/BambiSleepChurch/bambisleep-church#readme"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.title="BambiSleep™ Church MCP Control Tower"
LABEL org.opencontainers.image.description="Model Context Protocol server management and orchestration for BambiSleep Church"
LABEL org.opencontainers.image.url="https://github.com/BambiSleepChurch/bambisleep-church"
LABEL org.bambi.trademark="BambiSleep™ is a trademark of BambiSleepChurch"
LABEL org.bambi.organization="BambiSleepChurch"
LABEL org.bambi.project="BambiSleep Church MCP Control Tower"

# Development tools and environment setup
RUN npm install -g @modelcontextprotocol/sdk

# Create organization info file in container
RUN mkdir -p /usr/local/share/bambisleep-church
COPY docs/CONTAINER_ORGANIZATION.md /usr/local/share/bambisleep-church/

# Set proper working directory
WORKDIR /home/node/app

# Add organization banner to shell profile
RUN echo 'echo "🌸 BambiSleep™ Church MCP Control Tower Development Environment"' >> /home/node/.bashrc
RUN echo 'echo "Organization: BambiSleepChurch | Repository: bambisleep-church"' >> /home/node/.bashrc
RUN echo 'echo "BambiSleep™ is a trademark of BambiSleepChurch"' >> /home/node/.bashrc
RUN echo 'echo "---"' >> /home/node/.bashrc