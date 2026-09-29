# FRAME — Movie archive

A responsive Next.js website backed by the movies collection in MongoDB's sample_mflix database. Includes title/cast/plot search, genre filtering, pagination, IMDb ratings, and accessible movie detail dialogs. Missing or broken posters have a fallback.

## Run locally

Configure .env.local with MONGODB_URI (your Atlas connection string), MONGODB_DB=sample_mflix, and JWT_SECRET (reserved for a future login feature).

Run npm install, then npm run dev. Open http://localhost:3000.
For production, run npm run build followed by npm start. Run npm run lint to check the source.

Credentials remain on the server; .env.local is excluded from Git. The catalog is public and does not require authentication. Only movie fields are returned; user accounts and sessions are not exposed.

## Database connection

Use an Atlas database user with read access to sample_mflix, allow the server IP in Atlas Network Access, and ensure the sample dataset is loaded. A connection failure displays a retry message; no fabricated movie data is shown. Confirm that your network can resolve the cluster DNS SRV record and reach Atlas.

The read-only endpoint is /api/movies?search=...&genre=Drama&page=1&limit=24. Page size is capped at 30, search input is escaped, and database queries have time limits.
