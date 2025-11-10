import { db } from "../db/database";
import { logWorkerMessage } from "../db/actions";

export async function runCleanup(now = Date.now()) {
  const cutoff = new Date(now).toISOString();
  const expired = await db.utterances.where("expiresUtc").below(cutoff).toArray();

  if (!expired.length) {
    await logWorkerMessage({
      worker: "cleanup",
      level: "info",
      text: "Cleanup ran: no expired utterances.",
    });
    return { removed: 0 };
  }

  await Promise.all(expired.map((row) => db.utterances.delete(row.id!)));

  await logWorkerMessage({
    worker: "cleanup",
    level: "info",
    text: `Cleanup removed ${expired.length} expired audio files.`,
  });

  return { removed: expired.length };
}
