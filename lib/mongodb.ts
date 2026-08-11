import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | undefined;

export async function getMongoClient() {
    if (!uri) {
        throw new Error("MONGODB_URI is not configured");
    }

    if (!clientPromise) {
        if (process.env.NODE_ENV === "development") {
            const globalWithMongo = global as typeof globalThis & {
                _mongoClientPromise?: Promise<MongoClient>;
            };

            if (!globalWithMongo._mongoClientPromise) {
                client = new MongoClient(uri, options);
                globalWithMongo._mongoClientPromise = client.connect();
            }

            clientPromise = globalWithMongo._mongoClientPromise;
        } else {
            client = new MongoClient(uri, options);
            clientPromise = client.connect();
        }
    }

    return clientPromise;
}

export function getDatabaseName() {
    return process.env.MONGODB_DB || "blog";
}
