(() => {
  const inventoryOffset = 0x4850;
  const inventoryCount = 1000;
  const recordSize = 4;
  const setsOffset = 0x6890;
  const slotsPerSet = 7;
  const emptyIndex = 1000;
  const referenceLimit = 1064;
  const acquiredOffset = 0x68d8;
  const recipesOffset = 0x73ac;
  const recipeCount = 175;

  const hasBytes = (data, offset, count) => Boolean(data
    && typeof data.getUint32 === 'function' && offset >= 0 && offset + count <= data.byteLength);

  // Both native history bitsets use low-to-high bits within big-endian words.
  function historyBit(data, offset, index) {
    const word = offset + (index >>> 5) * 4;
    return hasBytes(data, word, 4) ? Boolean(data.getUint32(word) & (1 << (index & 31))) : null;
  }

  function readWeapons(data, catalogue) {
    // The catalogue contains completion weapons only. Other equipment may appear in
    // an ordinary record, but neither those records nor built-ins award a weapon.
    if (!Array.isArray(catalogue?.weapons)) return undefined;
    // Equipment renderer 002fe2ac reads this u16, then adds floor(POW / 10)
    // to its individual/pair Attack value. This is distinct from player level.
    const characterPower = hasBytes(data, 0x4808, 2) ? data.getUint16(0x4808) : null;
    const entries = catalogue.weapons.filter(entry => Number.isInteger(entry?.itemId)
      && entry.itemId > 0 && entry.itemId <= 0xffff && typeof entry.key === 'string');
    // The native item.bin row count validates all ordinary equipment, including
    // legitimate equipment outside the completion-weapon catalogue.
    const itemCount = catalogue.itemCount;
    const itemCountKnown = itemCount === undefined || Number.isInteger(itemCount)
      && itemCount > 0 && itemCount <= 0x10000;
    const catalogueKnown = entries.length === catalogue.weapons.length && entries.length > 0
      && new Set(entries.map(({ itemId }) => itemId)).size === entries.length && itemCountKnown;
    const inventoryAvailable = catalogueKnown && hasBytes(data, inventoryOffset, inventoryCount * recordSize);
    const inventoryIds = inventoryAvailable ? Array.from({ length: inventoryCount }, (_, index) =>
      data.getUint16(inventoryOffset + index * recordSize)) : undefined;
    const validItemId = itemId => itemCount === undefined || itemId < itemCount;
    const known = inventoryAvailable && inventoryIds.every(validItemId);
    const byItemId = Object.fromEntries(entries.map(({ itemId, key }) => [itemId, {
      itemId, key, count: known ? 0 : null, instances: [],
      assigned: null, activeSavedSet: null,
      acquired: historyBit(data, acquiredOffset, itemId),
      crafted: false, craftedRecipeCount: 0, recipeCount: 0,
    }]));
    if (inventoryAvailable) {
      // Exactly 1,000 >HBB records. Bytes 2/3 have no established general UI label.
      for (let index = 0; index < inventoryCount; index++) {
        const itemId = inventoryIds[index];
        if (!validItemId(itemId)) continue;
        const weapon = byItemId[itemId];
        if (!weapon) continue;
        if (known) weapon.count++;
        weapon.instances.push({ index, assignments: [] });
      }
    }
    const instances = new Map(Object.values(byItemId).flatMap(weapon =>
      weapon.instances.map(instance => [instance.index, instance])));
    const sets = [1, 2].map(set => {
      const slots = Array.from({ length: slotsPerSet }, (_, slotIndex) => {
        const slot = slotIndex + 1;
        const offset = setsOffset + ((set - 1) * slotsPerSet + slotIndex) * 4;
        if (!hasBytes(data, offset, 4)) return { slot, index: null, kind: 'unknown' };
        const index = data.getUint32(offset);
        if (index === emptyIndex) return { slot, index, kind: 'empty' };
        if (index >= referenceLimit) return { slot, index, kind: 'unknown' };
        if (index > emptyIndex) return { slot, index, kind: 'builtin' };
        if (!inventoryAvailable || !validItemId(inventoryIds[index])) return { slot, index, kind: 'unknown' };
        const itemId = inventoryIds[index];
        instances.get(index)?.assignments.push({ set, slot });
        return { slot, index, kind: 'ordinary', itemId };
      });
      return { set, known: slots.every(slot => slot.kind !== 'unknown'), slots };
    });
    const selector = hasBytes(data, 0x480d, 1) ? data.getUint8(0x480d) : null;
    const activeSet = selector === 0 || selector === 1 ? selector + 1 : null;
    const assignmentKnown = inventoryAvailable && sets.every(set => set.known);
    const activeAssignmentKnown = inventoryAvailable && activeSet !== null && sets[activeSet - 1].known;
    for (const weapon of Object.values(byItemId)) {
      // A verified positive reference survives an unrelated bad slot. A negative
      // result requires the whole relevant saved slice to be understood.
      const assignments = weapon.instances.flatMap(instance => instance.assignments);
      weapon.assigned = assignments.length ? true : assignmentKnown ? false : null;
      weapon.activeSavedSet = activeSet === null ? null
        : assignments.some(assignment => assignment.set === activeSet) ? true : activeAssignmentKnown ? false : null;
    }
    const recipes = (Array.isArray(catalogue.recipes) ? catalogue.recipes : []).map(recipe => {
      const { index, outputItemId, key } = recipe ?? {};
      const complete = Number.isInteger(index) && index >= 0 && index < recipeCount
        ? historyBit(data, recipesOffset, index) : null;
      return { index, outputItemId, key, complete };
    });
    for (const weapon of Object.values(byItemId)) {
      const histories = recipes.filter(recipe => recipe.outputItemId === weapon.itemId);
      weapon.recipeCount = histories.length;
      weapon.craftedRecipeCount = histories.some(recipe => recipe.complete === null) ? null
        : histories.filter(recipe => recipe.complete).length;
      weapon.crafted = histories.some(recipe => recipe.complete) ? true
        : histories.some(recipe => recipe.complete === null) ? null : false;
    }
    // These are saved assignments, not a claim about live equipment: the game can
    // temporarily resolve equipment through a separate runtime override.
    return { known, byItemId, activeSet, sets, assignmentKnown, activeAssignmentKnown, recipes, characterPower };
  }

  function equipmentMenuAttack(baseAttack, characterPower) {
    if (!Number.isInteger(baseAttack) || baseAttack < 0 || baseAttack > 0xff
      || !Number.isInteger(characterPower) || characterPower < 0 || characterPower > 0xffff) return null;
    return baseAttack + Math.floor(characterPower / 10);
  }

  if (typeof module === 'object' && module.exports) module.exports = { readWeapons, equipmentMenuAttack };
  else {
    window.readKenzanWeapons = readWeapons;
    window.getKenzanEquipmentMenuAttack = equipmentMenuAttack;
  }
})();
