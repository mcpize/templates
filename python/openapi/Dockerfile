FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files first for layer caching
COPY pyproject.toml uv.lock ./

# Install production dependencies only
RUN uv sync --frozen --no-dev --no-install-project

# Copy OpenAPI spec and source code
COPY openapi.json ./
COPY src/ ./src/

# Install the project itself
RUN uv sync --frozen --no-dev

# Run as non-root user
USER nobody

ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV LOG_LEVEL=INFO
EXPOSE 8080

# Direct python call - no uv overhead at runtime
CMD [".venv/bin/python", "-m", "server.main"]
