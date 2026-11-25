(() => {
  const registryVersion = 1;
  const defaultRegistry = typeof module === 'object' && module.exports
    ? require('../../data/quests/quest-milestones-data.json') : undefined;
  const hasBytes = (data, offset, length) => Boolean(data
    && typeof data.getUint8 === 'function' && typeof data.getUint16 === 'function'
    && typeof data.getUint32 === 'function' && typeof data.getInt16 === 'function' && Number.isInteger(data.byteLength)
    && Number.isInteger(offset) && offset >= 0 && offset + length <= data.byteLength);
  const any = values => values.includes(true) ? true : values.includes(null) ? null : false;
  const all = values => values.includes(false) ? false : values.includes(null) ? null : true;

  // This reader never stores guide checks or combines facts from different saves.
  // Missing bytes, unverified native mappings and invalid stock stay unknown.
  function readQuestMilestones(data, registry = defaultRegistry, options = {}) {
    if (registry?.version !== registryVersion || !Array.isArray(registry.quests)
      || !registry.storage || !Number.isInteger(registry.storage.itemCount)) return undefined;
    const layout = registry.storage;
    const pools = (layout.ordinaryPools ?? []).map(pool => {
      if (!Number.isInteger(pool.count) || !hasBytes(data, pool.offset, pool.count * 4)) return null;
      const counts = new Map();
      for (let index = 0; index < pool.count; index++) {
        const id = data.getUint16(pool.offset + index * 4);
        if (id >= layout.itemCount) return null;
        if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      return counts;
    });
    const flag = (group, bit) => {
      if (!Number.isInteger(group) || group < 0 || group >= 520
        || !Number.isInteger(bit) || bit < 0 || bit >= 256) return null;
      const offset = layout.scenarioOffset + group * layout.scenarioGroupBytes + (bit >>> 5) * 4;
      return hasBytes(data, offset, 4) ? Boolean(data.getUint32(offset) & (1 << (bit & 31))) : null;
    };
    const history = id => {
      if (!Number.isInteger(id) || id <= 0 || id >= layout.itemCount) return null;
      const offset = layout.itemHistoryOffset + (id >>> 5) * 4;
      return hasBytes(data, offset, 4) ? Boolean(data.getUint32(offset) & (1 << (id & 31))) : null;
    };
    function stock(item) {
      if (item?.kind === 'key') {
        if (!Number.isInteger(item.id) || item.id < 0 || item.id >= 256) return null;
        const offset = layout.keyItemsOffset + (item.id >>> 3);
        const held = hasBytes(data, offset, 1) ? Boolean(data.getUint8(offset) & (1 << (item.id & 7))) : null;
        return { kind: 'key', held, onPlayer: held === null ? null : Number(held), storage: 0,
          total: held === null ? null : Number(held), minimum: held ? 1 : 0 };
      }
      if (item?.kind !== 'ordinary' || !Number.isInteger(item.id) || item.id <= 0
        || item.id >= layout.itemCount || pools.length !== 3) return null;
      const values = pools.map(pool => pool ? pool.get(item.id) ?? 0 : null);
      const onPlayer = values[0] === null || values[1] === null ? null : values[0] + values[1];
      return { kind: 'ordinary', onPlayer, storage: values[2],
        total: values.includes(null) ? null : values.reduce((sum, n) => sum + n, 0),
        minimum: values.reduce((sum, n) => sum + (n ?? 0), 0) };
    }
    function owned(item) {
      const value = stock(item);
      return !value ? null : value.minimum > 0 ? true : value.total === null ? null : false;
    }
    const progressGroups = Array.isArray(options.existingProgress) ? options.existingProgress : [];
    function existingCount(spec) {
      const group = progressGroups.find(entry => entry?.label === spec.group && Array.isArray(entry.keys));
      if (!group || !Array.isArray(spec.keys)) return null;
      // Reuse the existing fighter checkmarks, but do not trust negative/corrupt
      // native win records that the older summary reader cannot distinguish.
      if (spec.group === 'Coliseum fighters defeated') {
        if (!hasBytes(data, 0x7d14, 50 * 24)) return null;
        for (let index = 0; index < 50 * 12; index++) {
          if (data.getInt16(0x7d14 + 2 * index) < 0) return null;
        }
      }
      const keys = new Set(group.keys);
      return spec.keys.filter(key => keys.has(key)).length;
    }
    const quests = {};
    for (const definition of registry.quests) {
      const counters = {};
      function evaluate(expression) {
        if (!expression || typeof expression !== 'object') return null;
        if (Array.isArray(expression.flag)) return flag(...expression.flag);
        if (Array.isArray(expression.any)) return any(expression.any.map(evaluate));
        if (Array.isArray(expression.all)) return all(expression.all.map(evaluate));
        if (expression.unknown) return null;
        if (expression.history !== undefined) return history(expression.history);
        if (expression.owned) return owned(expression.owned);
        if (typeof expression.counter === 'string') {
          const counter = counters[expression.counter];
          if (!counter) return null;
          return counter.value !== null ? counter.value >= expression.atLeast
            : counter.minimum >= expression.atLeast ? true : null;
        }
        return null;
      }
      const complete = evaluate(definition.completeState);
      for (const [id, spec] of Object.entries(definition.counters ?? {})) {
        let value = null;
        let minimum = 0;
        if (spec.type === 'highestFlag') {
          const states = spec.flags.map(([group, bit, amount]) => ({ set: flag(group, bit), amount }));
          minimum = Math.max(0, ...states.filter(state => state.set === true).map(state => state.amount));
          value = states.every(state => state.set !== null) || minimum >= spec.target ? minimum : null;
        } else if (spec.type === 'flagCount') {
          const states = spec.flags.map(([group, bit]) => flag(group, bit));
          minimum = states.filter(state => state === true).length;
          value = states.includes(null) ? null : minimum;
        } else if (spec.type === 'existingProgress') {
          value = existingCount(spec);
          minimum = value ?? 0;
        } else if (spec.type === 'scalar' && spec.serializationVerified === true
          && Number.isInteger(spec.offset) && hasBytes(data, spec.offset, 2)) {
          const number = data.getInt16(spec.offset);
          if (number >= spec.min && number <= spec.max) value = minimum = number;
        }
        const completedByEvent = evaluate(spec.completeState);
        counters[id] = { ...spec, value, minimum, completedByEvent: completedByEvent === true,
          complete: completedByEvent === true ? true : value !== null ? value >= spec.target
            : minimum >= spec.target ? true : null,
          source: value === null ? 'unknown' : 'save' };
      }
      const milestones = definition.milestones.map(row => {
        const result = { ...row, complete: evaluate(row.state) };
        if (row.item) result.owned = stock(row.item);
        for (const field of ['acquired', 'delivered', 'used']) {
          if (row[field + 'State']) result[field] = evaluate(row[field + 'State']);
        }
        if (row.counterId) result.counter = counters[row.counterId];
        result.source = result.complete === null ? 'unknown' : 'save';
        return result;
      });
      const prerequisites = (definition.prerequisites ?? []).map(row => ({ ...row, complete: evaluate(row.state) }));
      quests[definition.id] = { ...definition, complete, milestones, counters, prerequisites };
    }
    const observedAt = typeof options.observedAt === 'string' && Number.isFinite(Date.parse(options.observedAt))
      ? options.observedAt : null;
    const result = { version: registryVersion, observedAt, quests };
    result.assessment = assessQuestMilestones(result);
    return result;
  }

  // This is a checklist summary, never a substitute for native quest completion.
  // Optional deliveries and source-route acquisitions do not alter a quest's result.
  function assessQuestMilestones(snapshot) {
    return Object.fromEntries(Object.entries(snapshot?.quests ?? {}).map(([id, quest]) => {
      const rows = quest.milestones.filter(row => !row.optional);
      const states = rows.map(row => row.complete);
      return [id, { questComplete: quest.complete, checked: states.filter(value => value === true).length,
        total: rows.length, unknown: states.filter(value => value === null).length,
        allMilestones: all(states) }];
    }));
  }

  const api = { readQuestMilestones, assessQuestMilestones, registryVersion };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else window.kenzanQuestMilestones = api;
})();
