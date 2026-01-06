FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Environment Variables (Note: It is generally safer to pass these via docker-compose or run-time params)
ENV SMTP_HOST=smtp.gmail.com
ENV SMTP_PORT=587
ENV SMTP_USER=dasun.wickr@gmail.com
ENV SMTP_PASS="kwvb bdmg agtw nfvb"
ENV SMTP_SECURE=false

# Expose port
EXPOSE 3001

# Start the service
CMD ["npm", "start"]
