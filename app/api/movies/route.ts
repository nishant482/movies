import { type Filter } from "mongodb";
import { getMoviesCollection, type MovieDocument } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const requestedPage = Math.min(100000, Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1));
  const limit = Math.min(30, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "24", 10) || 24));
  const search = searchParams.get("search")?.trim();
  const genre = searchParams.get("genre")?.trim();
  const posterFilter: Filter<MovieDocument> = { poster: { $regex: "^https?://\\S+$" } };
  const filter: Filter<MovieDocument> = { ...posterFilter };

  if (search) {
    const safeSearch = new RegExp(escapeRegex(search.slice(0, 80)), "i");
    filter.$or = [{ title: safeSearch }, { plot: safeSearch }, { cast: safeSearch }];
  }

  if (genre) {
    filter.genres = genre;
  }

  try {
    const movies = await getMoviesCollection();
    const [total, collectionTotal, genres] = await Promise.all([
      movies.countDocuments(filter, { maxTimeMS: 10000 }),
      movies.countDocuments(posterFilter, { maxTimeMS: 10000 }),
      movies.distinct("genres", posterFilter, { maxTimeMS: 10000 }),
    ]);
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, pages);
    const items = await
      movies
        .find(filter, {
          projection: {
            title: 1,
            year: 1,
            genres: 1,
            runtime: 1,
            plot: 1,
            poster: 1,
            "imdb.rating": 1,
            cast: 1,
            directors: 1,
          },
        })
        .sort({ year: -1, "imdb.rating": -1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .maxTimeMS(10000)
        .toArray();

    return Response.json({
      items: items.map((movie) => ({ ...movie, _id: movie._id.toString() })),
      total,
      collectionTotal,
      page,
      pages,
      genres: genres.flat().filter((value): value is string => typeof value === "string").sort(),
    });
  } catch (error) {
    console.error("Unable to load the movie catalog:", error instanceof Error ? error.name : "Unknown error");
    return Response.json({ error: "Movie catalog is temporarily unavailable." }, { status: 503 });
  }
}
