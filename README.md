# Social Network

A full-stack social networking platform built with Go on the backend and Next.js on the frontend. The app supports user authentication, posts, comments, likes, follows, groups, notifications, and real-time messaging.

## Overview

This project is a modern social web application with:
- user registration, login, password recovery, and profile management
- personal and explore feeds with posts, reposts, likes, and comments
- follow relationships and user discovery
- group creation, memberships, invitations, join requests, and group posts
- notifications and private/group chat messaging
- image uploads for avatars, posts, comments, and messages

## Tech Stack

### Backend
- Go
- Gorilla WebSocket
- SQLite database
- Docker support

### Frontend
- Next.js
- React
- Tailwind CSS
- ESLint

## Project Structure

- back-end/: Go backend server, routes, handlers, services, and database migrations
- front-end/: Next.js frontend application
- APIs docu/: API documentation for the main modules
- docker-compose.yml: container orchestration for backend and frontend

## Getting Started

### Prerequisites
Make sure you have Docker and Docker Compose installed on your machine.

### Run with Docker
From the project root, run:

```bash
docker compose up --build
```

Then open:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8433

To stop the services:

```bash
docker compose down
```

## Development Setup

### Backend
```bash
cd back-end
go run .
```

### Frontend
```bash
cd front-end
npm install
npm run dev
```

## API Documentation

The repository includes API documentation under the APIs docu folder, covering areas such as:
- auth and user management
- posts and comments
- likes, reposts, and views
- follows
- groups and memberships
- notifications
- chat

## Notes

- Uploaded files are stored under the uploads directory.
- The backend uses local database files stored in the back-end/data folder.
- The application is designed as a monorepo with separate frontend and backend services.

