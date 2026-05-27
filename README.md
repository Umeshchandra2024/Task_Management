# ScholarX Task Management Dashboard

A simple task manager with a React + Vite frontend and an Express + MongoDB backend.

## What it does
- Add tasks with title, description, due date, and status
- Edit task details
- Delete tasks
- Filter tasks by status: `pending`, `inprogress`, `completed`
- Search tasks by title or description

## How to run
1. Add your `MONGO_URI` in `server/.env`
2. Run from the project root:
   - `npm run install-all`
   - `npm run dev`

## Local servers
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

The frontend is configured to proxy `/api` to the backend.

## Useful commands
- Start backend only: `npm run server`
- Start frontend only: `npm run client`
- Start both together: `npm run dev`

## Notes
- The status options are: `pending`, `inprogress`, and `completed`
- Make sure the backend is running on port `5000` so the frontend API calls work correctly.