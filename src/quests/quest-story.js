const questProgressPrefix = 'kenzan-guide:done:';
const storyWindowKey = 'kenzan-guide:story-window';

function questStoryAvailability(story, id, checkpoint) {
  if (!checkpoint) return '';
  const { order, clock } = checkpoint;
  const rule = story.quests[id];
  if (!clock || order < rule.first) return null;
  const phase = rule.continuations.find(item => order >= item.first
    && (item.last === null || order <= item.last) && item.clocks.includes(clock));
  if (phase) return phase.note;
  if ((rule.last !== null && order > rule.last) || (rule.gion && order >= story.gionCloses)
    || (rule.clocks && !rule.clocks.includes(clock))) return null;
  return '';
}

function questPrerequisiteWarning(story, id, completed) {
  const { all, any } = story.quests[id];
  return all.some(required => !completed.has(required)) || (any.length > 0 && !any.some(required => completed.has(required)));
}

function questMapFilter(story, ids, completed, objective, hideCompleted, missableOnly) {
  const checkpoint = story.checkpoints[objective];
  const eligible = new Set();
  const notes = {};
  const unfinishedOnly = hideCompleted || missableOnly;
  for (const id of ids) {
    const done = completed.has(id);
    const timing = questStoryAvailability(story, id, checkpoint);
    if ((!unfinishedOnly || !done) && (!missableOnly || story.quests[id].missable) && timing !== null) eligible.add(id);
    const prerequisiteWarning = !done && questPrerequisiteWarning(story, id, completed);
    const text = [timing, prerequisiteWarning && 'Prerequisite completion is unconfirmed. See Requires.'].filter(Boolean).join(' ');
    if (text) notes[id] = { text, prerequisiteWarning };
  }
  return { eligible, completed, notes, objective, checkpoint, hideCompleted, missableOnly, locked: Boolean(checkpoint && !checkpoint.clock) };
}
