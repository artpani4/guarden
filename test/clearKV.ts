const kv = await Deno.openKv(Deno.env.get("KV_URL"));

async function deleteAllEntries() {
  // Получаем все записи в базе данных
  const entries = kv.list({ prefix: [] }); // Пустой префикс означает, что мы получим все записи

  for await (const entry of entries) {
    console.log(`Удаляем запись: ${JSON.stringify(entry.key)}`);
    await kv.delete(entry.key); // Удаляем запись по ключу
  }

  console.log("Все записи удалены.");
}

// Запускаем процесс удаления
await deleteAllEntries();
