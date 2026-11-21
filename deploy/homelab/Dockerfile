FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run job:bundle

FROM node:24-slim
COPY --from=build /app/dist/background-job.cjs /app/background-job.cjs
USER node
ENTRYPOINT ["node", "/app/background-job.cjs"]
