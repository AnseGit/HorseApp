window.HesteVennRecordIndex = function createHesteVennRecordIndex(data) {
  const indexesByType = {};
  const typeById = new Map();

  function rebuildType(type) {
    const records = Array.isArray(data[type]) ? data[type] : [];
    const index = new Map();
    records.forEach((record) => {
      if (!record || !record.id) return;
      index.set(record.id, record);
      typeById.set(record.id, type);
    });
    indexesByType[type] = index;
  }

  function ensureType(type) {
    if (!indexesByType[type]) rebuildType(type);
  }

  function get(type, id) {
    if (!type || !id) return null;
    ensureType(type);
    return indexesByType[type].get(id) || null;
  }

  function getType(id) {
    if (!id) return '';
    if (typeById.has(id)) return typeById.get(id) || '';
    const foundType = Object.keys(data).find((type) => {
      ensureType(type);
      return indexesByType[type].has(id);
    }) || '';
    if (foundType) typeById.set(id, foundType);
    return foundType;
  }

  function upsert(type, record) {
    if (!type || !record || !record.id) return;
    ensureType(type);
    indexesByType[type].set(record.id, record);
    typeById.set(record.id, type);
  }

  function remove(type, id) {
    if (!type || !id) return;
    ensureType(type);
    indexesByType[type].delete(id);
    if (typeById.get(id) === type) typeById.delete(id);
  }

  function rebuildAll() {
    Object.keys(indexesByType).forEach((type) => { delete indexesByType[type]; });
    typeById.clear();
    Object.keys(data).forEach((type) => rebuildType(type));
  }

  Object.keys(data).forEach((type) => rebuildType(type));

  return {
    get,
    getType,
    upsert,
    remove,
    rebuildType,
    rebuildAll
  };
};
