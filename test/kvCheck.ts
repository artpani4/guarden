const kv = await Deno.openKv();

const cur = kv.list({ prefix: [] });
const result = [];

for await (const entry of cur) {
  console.log(entry.key); // ["preferences", "ada"]
  console.log(entry.value); // { ... }
  console.log(entry.versionstamp); // "00000000000000010000"
  result.push(entry);
}
