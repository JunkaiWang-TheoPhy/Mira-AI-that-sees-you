FROM node:20-bookworm-slim

WORKDIR /app

ENV MIRA_DEPLOY_PROFILE=notification-router
ENV HOST=0.0.0.0
ENV PORT=3302

COPY . .

RUN node scripts/notification-router-runtime.mjs bootstrap

EXPOSE 3302

CMD ["npm", "start"]
