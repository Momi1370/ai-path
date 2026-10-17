export const STORAGE_KEY = 'aipath.v1';
export const NEW_PER_DAY = [3, 5, 10, 15];

export function defaultState() {
  return {
    version: 1,
    tasks: {},         // plan item id -> true
    watched: {},       // YouTube id -> true / false (overrides the status in the video index)
    cards: {},         // card id -> FSRS card
    log: {},           // YYYY-MM-DD -> { reviews, fresh }
    read: {},          // chapter or appendix id -> true
    scroll: {},        // chapter or appendix id -> 0..1, how far you read
    last: '',          // the page you read last, e.g. "ch-9"
    settings: { newPerDay: 10, fontScale: 1 },
  };
}

const isObject = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const mapOf = (v, ok) => (isObject(v) ? Object.fromEntries(Object.entries(v).filter(([, x]) => ok(x))) : {});

// Keeps every saved field that has the right shape and resets only the broken ones,
// so a damaged save or an odd backup never stops the app from starting.
export function migrate(raw) {
  const base = defaultState();
  if (!isObject(raw) || raw.version !== 1) return base;
  const s = isObject(raw.settings) ? raw.settings : {};
  return {
    version: 1,
    tasks: mapOf(raw.tasks, (x) => x === true),
    watched: mapOf(raw.watched, (x) => typeof x === 'boolean'),
    cards: mapOf(raw.cards, (x) => isObject(x) && typeof x.due === 'string'),
    log: mapOf(raw.log, (x) => isObject(x) && Number.isInteger(x.reviews) && Number.isInteger(x.fresh)),
    read: mapOf(raw.read, (x) => x === true),
    scroll: mapOf(raw.scroll, (x) => typeof x === 'number' && x >= 0 && x <= 1),
    last: typeof raw.last === 'string' ? raw.last : '',
    settings: {
      newPerDay: NEW_PER_DAY.includes(s.newPerDay) ? s.newPerDay : base.settings.newPerDay,
      fontScale: typeof s.fontScale === 'number' && s.fontScale >= 0.85 && s.fontScale <= 1.6 ? s.fontScale : 1,
    },
  };
}

export function createStore(storage) {
  let available = true;
  try {
    const probe = `${STORAGE_KEY}.probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
  } catch { available = false; }
  return {
    available,
    load() {
      if (!available) return defaultState();
      try { return migrate(JSON.parse(storage.getItem(STORAGE_KEY))); } catch { return defaultState(); }
    },
    save(state) {
      if (!available) return false;
      try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
    },
  };
}

export const buildBackup = (state, now = new Date()) => JSON.stringify({ app: 'ai-path', version: 1, exportedAt: now.toISOString(), state });

export function parseBackup(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('This is not an AI Path backup file.'); }
  if (data?.app !== 'ai-path' || data.version !== 1 || !isObject(data.state)) throw new Error('This is not an AI Path backup file.');
  return migrate(data.state);
}

export const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
