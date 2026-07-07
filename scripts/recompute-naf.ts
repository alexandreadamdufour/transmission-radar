// One-off: recompute naf_label for already-ingested rows using the new nafFamily()
// taxonomy, from the naf_code already stored. No BODACC/SIRENE calls needed.
import { supabaseAdmin } from "../src/lib/supabase";
import { nafFamily } from "../src/lib/naf";

const PAGE_SIZE = 1000;

async function main() {
  const supabase = supabaseAdmin();
  let updated = 0;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("cessions")
      .select("id, naf_code")
      .not("naf_code", "is", null)
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;

    const byLabel = new Map<string, string[]>();
    for (const row of data) {
      const label = nafFamily(row.naf_code as string);
      if (!byLabel.has(label)) byLabel.set(label, []);
      byLabel.get(label)!.push(row.id as string);
    }

    for (const [label, ids] of byLabel) {
      const { error: updateError } = await supabase.from("cessions").update({ naf_label: label }).in("id", ids);
      if (updateError) throw new Error(`Update failed: ${updateError.message}`);
      updated += ids.length;
    }

    console.log(`  processed ${from + data.length}, updated ${updated}`);
    from += PAGE_SIZE;
  }

  console.log(`Done. Updated naf_label on ${updated} rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
