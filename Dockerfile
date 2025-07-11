# Base image with Node.js and pnpm setup
FROM node:lts-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Production dependencies stage
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts

# Build stage
FROM base AS build
# Install build dependencies
RUN apk add --no-cache git python3 make g++
# Copy package files first for better caching
COPY package.json pnpm-lock.yaml ./
# Install all dependencies including devDependencies for building
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts=false
# Install express types and ensure all dependencies are available
RUN pnpm add -D @types/express
# Copy source files
COPY . .
# Build the application
RUN pnpm run build
# Install production dependencies for the final image
RUN pnpm install --prod --frozen-lockfile

# Final stage - clean minimal image
FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and install only production dependencies
COPY package.json pnpm-lock.yaml ./
# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built files and node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules

# Docker container to listen on port 8080
EXPOSE 8080

# Command to run the MCP server
ENTRYPOINT ["node", "dist/index.js", "start:sse"]