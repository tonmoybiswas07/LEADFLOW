import clientPromise from "@/lib/mongodb";

export async function getDatabase() {
  const client = await clientPromise;

  return client.db(
    process.env.MONGODB_DB || "LeadFlowDB"
  );
}