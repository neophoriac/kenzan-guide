(() => {
  // Native E5DC4 counts one copy per >HBB record. The last two bytes
  // are auxiliary data, never a stack quantity. See forge-readiness-20261119.
  function readCrafting(data, catalogue) {
    if (!data || typeof data.getUint16 !== 'function' || typeof data.getUint32 !== 'function'
      || typeof data.getUint8 !== 'function' || !Number.isInteger(data.byteLength)
      || !Number.isInteger(catalogue?.itemCount) || catalogue.itemCount <= 0 || catalogue.itemCount > 0x8000
      || !Array.isArray(catalogue.materials) || !Array.isArray(catalogue.books)
      || catalogue.materials.some(id => !Number.isInteger(id) || id <= 0 || id >= catalogue.itemCount)
      || (catalogue.turtleFoods !== undefined && (!Array.isArray(catalogue.turtleFoods)
        || catalogue.turtleFoods.some(id => !Number.isInteger(id) || id <= 0 || id >= catalogue.itemCount)))
      || catalogue.books.some(book => !Number.isInteger(book?.keyItemIndex) || book.keyItemIndex < 0
        || book.keyItemIndex >= 256 || book.itemId !== (0x8000 | book.keyItemIndex))) return undefined;
    const pools = [[0x4814, 15], [0x4850, 1000], [0x58f0, 500]].map(([offset, size]) => {
      if (data.byteLength < offset + size * 4) return null;
      const counts = new Map();
      for (let index = 0; index < size; index++) {
        const id = data.getUint16(offset + index * 4);
        if (id >= catalogue.itemCount) return null;
        if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      return counts;
    });
    const readStocks = ids => Object.fromEntries(ids.map(id => {
      const counts = pools.map(pool => pool?.get(id) ?? (pool ? 0 : null));
      const onPlayer = counts[0] === null || counts[1] === null ? null : counts[0] + counts[1];
      const storage = counts[2];
      const minimum = counts.reduce((sum, value) => sum + (value ?? 0), 0);
      return [id, { onPlayer, storage, total: counts.includes(null) ? null : minimum, minimum }];
    }));
    const materials = readStocks(catalogue.materials);
    const books = Object.fromEntries((catalogue.books ?? []).map(({ itemId, keyItemIndex: key }) => {
      const offset = 0x70d8 + (key >>> 3);
      return [itemId, Number.isInteger(key) && key >= 0 && key < 256 && offset < data.byteLength
        ? Boolean(data.getUint8(offset) & (1 << (key & 7))) : null];
    }));
    const amount = data.byteLength >= 0x70fc ? data.getUint32(0x70f8) : null;
    return { mon: amount !== null && amount <= 99999999 ? amount : null, materials, books,
      ...(catalogue.turtleFoods === undefined ? {} : { foods: readStocks(catalogue.turtleFoods) }) };
  }

  function assessRecipe(recipe, crafting, weapons, sourceItemId) {
    const count = weapons?.known ? weapons.byItemId?.[sourceItemId]?.count ?? null : null;
    const source = { count, met: count === null ? null : count >= 1 };
    const mon = crafting?.mon ?? null;
    const fee = { mon, met: mon === null ? null : mon >= recipe.cost };
    const materials = recipe.materials.map(item => {
      const stock = crafting?.materials?.[item.itemId];
      const met = stock?.total !== null && stock?.total !== undefined ? stock.total >= item.count
        : stock?.minimum >= item.count ? true : null;
      return { ...item, stock, met };
    });
    const books = recipe.books.map(item => ({ ...item, met: crafting?.books?.[item.itemId] ?? null }));
    const checks = [source.met, fee.met, ...materials.map(item => item.met), ...books.map(item => item.met)];
    return { source, fee, materials, books,
      met: checks.includes(false) ? false : checks.includes(null) ? null : true };
  }

  if (typeof module === 'object' && module.exports) module.exports = { readCrafting, assessRecipe };
  else window.kenzanCrafting = { readCrafting, assessRecipe };
})();
