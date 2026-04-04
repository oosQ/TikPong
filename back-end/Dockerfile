# syntax=docker/dockerfile:1

FROM golang:1.24-bookworm AS builder
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o backend-app .

FROM debian:bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tzdata libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/backend-app ./backend-app
COPY --from=builder /app/src/db/migrations ./src/db/migrations

RUN mkdir -p /app/uploads /app/data

ENV DB_PATH=/app/data/database.db
EXPOSE 8433

CMD ["./backend-app"]
