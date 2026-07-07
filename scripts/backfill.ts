import { runIngestion } from "../src/lib/ingest";

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function main() {
  const daysArg = process.argv.find((a) => a.startsWith("--days="));
  const days = daysArg ? Number(daysArg.split("=")[1]) : 90;
  const since = daysAgoISO(days);

  console.log(`Backfilling BODACC "Ventes et cessions" since ${since} (${days} days)...`);

  const result = await runIngestion(since, undefined, (progress) => {
    console.log(
      `  fetched=${progress.fetched} enriched=${progress.enriched} failed=${progress.enrichmentFailed} upserted=${progress.upserted}`
    );
  });

  console.log("Done.", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
