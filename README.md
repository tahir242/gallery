# Gallery

A MERN stack media gallery application that scans local and network directories to display and search media files.

## Features

- 📂 Scan local paths, UNC network paths (`\\server\share\path`)
- 🖼️ Display images and videos in a responsive grid
- 🔍 Search across all files and child directories by filename
- 🌳 Folder tree sidebar for navigation
- 📱 Responsive Tailwind CSS design (mobile-first)
- 🗃️ MongoDB Atlas for scan session history

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Zustand
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- Access to MongoDB Atlas cluster

### Installation

```bash
# Install all dependencies (root, server, client)
npm run install:all
```

### Environment Setup

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://tahiralichana:Pakistan_11@cluster0.xgsuqnb.mongodb.net/?appName=Cluster0
NODE_ENV=development
```

### Running in Development

```bash
# Runs server (port 5000) + client (port 5173) concurrently
npm run dev
```

### Running Individually

```bash
# Server only
npm run server

# Client only
npm run client
```

## Git Workflow

- `main` — stable production branch
- `develop` — integration branch
- `feature/*` — individual feature branches
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) spec

## Project Structure

```
gallery/
├── server/          # Express API
│   └── src/
│       ├── config/
│       ├── routes/
│       ├── controllers/
│       ├── models/
│       └── utils/
└── client/          # React + Vite SPA
    └── src/
        ├── components/
        ├── pages/
        ├── store/
        └── services/
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/directory/scan` | Scan a directory |
| `GET`  | `/api/directory/history` | Scan session history |
| `GET`  | `/api/media/serve` | Serve a media file |

## License

MIT
