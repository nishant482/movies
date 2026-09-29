import { MongoClient, type ObjectId } from "mongodb";

const databaseName = process.env.MONGODB_DB ?? "sample_mflix";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getMoviesCollection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Please define MONGODB_URI in .env.local");
  if (!global.mongoClientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    global.mongoClientPromise = client.connect().catch(async (error) => {
      global.mongoClientPromise = undefined;
      await client.close();
      throw error;
    });
  }
  const connectedClient = await global.mongoClientPromise;
  return connectedClient.db(databaseName).collection<MovieDocument>("movies");
}

export interface MovieDocument {
  _id: ObjectId;
  title?: string;
  year?: number | string;
  genres?: string[];
  runtime?: number;
  plot?: string;
  poster?: string;
  imdb?: { rating?: number };
  cast?: string[];
  directors?: string[];
}
