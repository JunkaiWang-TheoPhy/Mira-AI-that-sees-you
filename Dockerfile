FROM node:22-bookworm-slim

WORKDIR /app

ARG OPENCLAW_NPM_VERSION=latest

ENV MIRA_DEPLOY_PROFILE=notification-router
ENV HOST=0.0.0.0
ENV PORT=3302

COPY . .

RUN npm install -g "openclaw@${OPENCLAW_NPM_VERSION}" \
  && openclaw --version
RUN node scripts/notification-router-runtime.mjs bootstrap

EXPOSE 3302
EXPOSE 18890

CMD ["npm", "start"]
