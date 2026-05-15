import { type QueryResult } from "../engine/QueryResult.js";

export function printTable(result: QueryResult): string {
  const widths = result.columns.map((c, i) =>
    Math.max(
      c.length,
      ...result.rows.map(r => String(r[i]).length)
    )
  );

  const header = result.columns
    .map((c, i) => c.padEnd(widths[i]))
    .join(" | ");

  const divider = widths.map(w => "-".repeat(w)).join("-+-");

  const body = result.rows.map(row =>
    row.map((v, i) => String(v).padEnd(widths[i])).join(" | ")
  );

  return [header, divider, ...body].join("\n");
}