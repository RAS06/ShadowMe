FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
# Set API URL for build time (Vite embeds env vars at build time)
ARG VITE_API_URL=https://localhost
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build
# Ensure Tailwind's final CSS is available in dist in case PostCSS wasn't applied by Vite
# Use the Tailwind CLI (installed as a devDependency) to process src/index.css into dist/assets
RUN mkdir -p ./dist/assets
# Compile Tailwind via a Node script (using project's postcss + tailwind dependencies)
RUN node ./scripts/build-tailwind.js || true
# Verify the generated file exists and print a short head to aid debugging
RUN ls -la ./dist/assets && sed -n '1,40p' ./dist/assets/tailwind.css || true
# Inject a link to the generated tailwind CSS into index.html (safe no-op if already present)
RUN awk '/<\/head>/ && !found { print "  <link rel=\"stylesheet\" href=\"/assets/tailwind.css\">"; found=1; print; next }1' ./dist/index.html > ./dist/index.html.tmp || true
RUN mv ./dist/index.html.tmp ./dist/index.html || true

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.js ./server.js
COPY package.json package-lock.json ./
# Install only production dependencies in the runtime image; the build stage produced the final CSS
# (so the runtime does not need Tailwind/PostCSS packages).
RUN npm install --legacy-peer-deps --production
RUN npm install -g serve
EXPOSE 3001
CMD ["node", "server.js"]
