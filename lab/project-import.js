// Validate the imported envelope before touching the saved project collection.
// Experiment/model migration still belongs to restore(), when the project opens.
export const MAX_PROJECT_BYTES = 8 * 1024 * 1024;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const optionalString = (value, label) => {
  if (value !== undefined && typeof value !== 'string') throw new Error(`invalid project ${label}`);
};

export function parseProjectImport(text) {
  if (typeof text !== 'string') throw new Error('project must be JSON text');
  if (text.length > MAX_PROJECT_BYTES || new TextEncoder().encode(text).length > MAX_PROJECT_BYTES)
    throw new Error('project file exceeds 8 MiB');
  const o = JSON.parse(text);
  if (!object(o) || o.lambdawaves !== 'project' || typeof o.path !== 'string' ||
      !o.path.trim() || !object(o.data)) throw new Error('not a λWAVES project');
  if (o.version !== undefined && o.version !== 1) throw new Error('unsupported project version');
  for (const key of ['folder', 'name', 'saved', 'opened']) optionalString(o[key], key);
  if (o.notebook !== undefined && !object(o.notebook)) throw new Error('invalid project notebook');
  const notebook = o.notebook || {};
  for (const key of ['title', 'subtitle', 'text']) optionalString(notebook[key], `notebook ${key}`);
  return {
    path: o.path, folder: o.folder || '', name: o.name || o.path,
    saved: o.saved || new Date().toISOString(), opened: o.opened || '', data: o.data,
    notebook: { title: notebook.title ?? (o.name || o.path), subtitle: notebook.subtitle ?? '', text: notebook.text ?? '' },
  };
}

export function storeProjectImport(text, read, write) {
  const project = parseProjectImport(text);
  const collection = read();
  if (!object(collection) || !object(collection.items) ||
      (collection.recent !== undefined && !Array.isArray(collection.recent)))
    throw new Error('saved project collection is invalid; export or recover it before importing');
  // Copy rather than mutating the reader's collection before a successful write.
  // A computed property treats "__proto__" as an ordinary project name.
  const next = { ...collection, items: { ...collection.items, [project.path]: project },
    recent: [project.path, ...(collection.recent || []).filter(p => p !== project.path)].slice(0, 8) };
  if (!write(next)) throw new Error('project could not be saved; browser storage may be full or unavailable');
  return project.path;
}
