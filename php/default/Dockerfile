FROM php:8.3-cli-alpine

# Install composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy composer files first for layer caching
COPY composer.json composer.lock* ./

# Install production dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy source code
COPY . .

# Run as non-root user
RUN adduser -D -u 1000 appuser
USER appuser

ENV PORT=8080
EXPOSE 8080

CMD ["php", "server.php"]
