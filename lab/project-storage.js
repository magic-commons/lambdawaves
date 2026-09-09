const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Invalid stored collections must never become an empty, writable replacement.
export function readProjectCollection(storage, key) {
  const text = storage.getItem(key);
  const collection = text === null ? { items: {}, recent: [] } : JSON.parse(text);
  if (!object(collection) || !object(collection.items) ||
      (collection.recent !== undefined && (!Array.isArray(collection.recent) ||
        collection.recent.some(path => typeof path !== 'string'))))
    throw new Error('invalid saved project collection');
  for (const item of Object.values(collection.items)) {
    if (!object(item) || typeof item.path !== 'string' || !object(item.data) || !object(item.notebook))
      throw new Error('invalid saved project record');
    for (const key of ['folder', 'name', 'saved', 'opened'])
      if (item[key] !== undefined && typeof item[key] !== 'string') throw new Error('invalid saved project metadata');
    for (const key of ['title', 'subtitle', 'text'])
      if (item.notebook[key] !== undefined && typeof item.notebook[key] !== 'string') throw new Error('invalid saved notebook');
  }
  return collection;
}
