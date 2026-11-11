/**
 * Pure helpers of the My look machine: `canEnter`, the analysis queue (main
 * photo first, then sharpness; the 15 clearest on phones), the shortlist with its 8 cap and the pair check, plus the
 * context changes the setup's actions make. No XState here, so each rule is unit-tested on its own.
 */
import type { IndexEntry } from '../domain/content/output.ts';
import { asPhotoId, type ItemId, type Look, type LookId, type PhotoId, type PictureId, type SlotKey } from '../domain/ids.ts';
import type { LandmarkEdits } from '../domain/measure/measure.ts';
import type { PhotoObservation } from '../domain/measure/observation.ts';
import type { Result } from '../domain/result.ts';
import type { AnalysisError } from '../worker/protocol.ts';
import { MAX_IDEAS, PHONE_ANALYSED_PHOTOS, STEPS } from './consult.types.ts';
import type { AddedPhoto, ColourChoice, ConsultContent, ConsultContext, ConsultGoal, Grid, Pair, PhotoEntry, Prefs, Shortlist, Step } from './consult.types.ts';

export const stepIndex = (step: Step): number => STEPS.indexOf(step);

// ── Photos and the analysis queue ──

/** Analysed with at least one face: its lines and card facts can be read. */
export const isUsable = (p: PhotoEntry): boolean => p.status === 'done' && p.observation.faces.length > 0;
const bySharpness = (a: PhotoEntry, b: PhotoEntry): number => (b.sharpness ?? -1) - (a.sharpness ?? -1);

/** The queued photos that will be analysed, in order: the main photo first, then the clearest; a phone's 15 include the main photo. */
export function analysisQueue(c: Pick<ConsultContext, 'photos' | 'mainPhotoId' | 'device'>): PhotoEntry[] {
  const main = (p: PhotoEntry): number => (p.id === c.mainPhotoId ? 0 : 1);
  const ranked = [...c.photos].sort((a, b) => main(a) - main(b) || bySharpness(a, b));
  return (c.device.class === 'phone' ? ranked.slice(0, PHONE_ANALYSED_PHOTOS) : ranked).filter((p) => p.status === 'queued');
}

/** Queued but not among the 15 clearest on a phone: listed, analysed only once chosen as the main photo. */
export const isListedOnly = (c: ConsultContext, p: PhotoEntry): boolean =>
  p.status === 'queued' && !analysisQueue(c).some((q) => q.id === p.id);


/** `wantsCore`: a photo source (on save-data devices only once a photo exists), or a photo added later. */
export const wantsCore = (c: ConsultContext): boolean =>
  (c.source === 'photo' && !c.device.saveData) || c.photos.some((p) => p.status === 'queued');

/** A photo entry before analysis; a restored photo starts from it too. */
export const NEW_PHOTO = {
  status: 'queued',
  observation: null,
  edits: null,
  refined: null,
  error: null,
  tries: 0,
} as const;
const newPhoto = (f: AddedPhoto): PhotoEntry => ({ ...NEW_PHOTO, id: f.id, sharpness: f.sharpness });

/** The person has given something: a first answer or photo is what starts the saving, so opening the app writes no personal session data. */
export const hasPersonalData = (c: ConsultContext): boolean =>
  c.photos.length > 0 || Object.keys(c.answers).length > 0 || c.prefs.goal !== null || c.prefs.collections.length > 0;

/** "See an example first" opens only at the start of My look or over a session with nothing in it: one that holds work, saved or not, stays as it is. */
export const exampleMayOpen = ({ step, context }: { readonly step: Step | null; readonly context: ConsultContext }): boolean =>
  step === null || (context.source !== 'example' && !context.keptStored && !hasPersonalData(context));

/**
 * The photo id that slots are keyed by: the main photo, or `none` on the no-photo path, where the person attaches
 * their own photo in ChatGPT or Gemini.
 */
export const NO_PHOTO = asPhotoId('none');
export const slotPhotoOf = (c: Pick<ConsultContext, 'mainPhotoId'>): PhotoId => c.mainPhotoId ?? NO_PHOTO;

const slotKeys = (c: Pick<ConsultContext, 'slots'>): SlotKey[] => Object.keys(c.slots) as SlotKey[];

/** Pictures in slots that do not belong to `photoId`: disposed when `photoId` becomes the slot photo. */
export const picturesNotOf = (c: Pick<ConsultContext, 'slots'>, photoId: PhotoId): PictureId[] =>
  slotKeys(c)
    .filter((k) => !k.endsWith(`@${photoId}`))
    .flatMap((k) => c.slots[k]?.pictureId ?? []);

export const slotsOnlyOf = (c: Pick<ConsultContext, 'slots'>, photoId: PhotoId): ConsultContext['slots'] =>
  Object.fromEntries(
    slotKeys(c)
      .filter((k) => k.endsWith(`@${photoId}`))
      .map((k) => [k, c.slots[k]]),
  );

/** Adds photos (ids already present are ignored); the first photo becomes the main one; adding undoes a skip. */
export function withPhotosAdded(c: ConsultContext, files: readonly AddedPhoto[]): Partial<ConsultContext> {
  const known = new Set(c.photos.map((p) => p.id));
  const fresh: PhotoEntry[] = [];
  for (const f of files) {
    if (known.has(f.id)) continue;
    known.add(f.id);
    fresh.push(newPhoto(f));
  }
  const main = c.mainPhotoId ?? fresh[0]?.id ?? null;
  if (fresh.length === 0) return {};
  return {
    photos: [...c.photos, ...fresh],
    mainPhotoId: main,
    skipped: false,
    slots: slotsOnlyOf(c, main ?? NO_PHOTO),
  };
}

/** Removes a photo with its slots; a removed main photo hands over to the next usable (or any) photo. */
export function withPhotoRemoved(
  c: ConsultContext,
  id: PhotoId,
): Pick<ConsultContext, 'photos' | 'mainPhotoId' | 'slots'> {
  const photos = c.photos.filter((p) => p.id !== id);
  const main = c.mainPhotoId === id ? ((photos.find(isUsable) ?? photos[0])?.id ?? null) : c.mainPhotoId;
  return { photos, mainPhotoId: main, slots: slotsOnlyOf(c, main ?? NO_PHOTO) };
}

/** A new main photo: the slots of the old one are dropped (their pictures are disposed by the caller). */
export const withMainPhoto = (c: ConsultContext, id: PhotoId): Pick<ConsultContext, 'mainPhotoId' | 'slots'> => ({
  mainPhotoId: id,
  slots: slotsOnlyOf(c, id),
});

/** `GRID.ADD`: the grid's picture, replacing an earlier one; its tiles get names only on `GRID.CONFIRM`. */
export const withGrid = (grids: readonly Grid[], grid: number, pictureId: PictureId): Grid[] =>
  [...grids.filter((g) => g.grid !== grid), { grid, pictureId, ideas: [], confirmed: false }].sort(
    (a, b) => a.grid - b.grid,
  );
export const withGridConfirmed = (grids: readonly Grid[], grid: number, order: readonly LookId[]): Grid[] =>
  grids.map((g) => (g.grid === grid ? { ...g, ideas: [...order], confirmed: true } : g));

/** `SLOT.ADD` may fill only a slot of the current main photo, or of `none` without one. */
export const isMainPhotoSlot = (c: ConsultContext, key: SlotKey): boolean => key.endsWith(`@${slotPhotoOf(c)}`);

/** Codes after which the in-flight photo is analysed once more (the supervisor restarted the worker). */
const RETRY_CODES: ReadonlySet<string> = new Set(['crashed', 'timeout', 'out_of_memory']);

/** Stores an analysis result on the in-flight photo; a removed photo's result is simply dropped. */
export function withAnalysis(
  c: ConsultContext,
  output: Result<PhotoObservation, AnalysisError>,
): Partial<ConsultContext> {
  const settle = (p: PhotoEntry): PhotoEntry => {
    if (output.ok) return { ...p, status: 'done', observation: output.value, error: null };
    if (RETRY_CODES.has(output.error.code) && p.tries < 1) return { ...p, status: 'queued', observation: null, error: null, tries: p.tries + 1 };
    return { ...p, status: 'failed', observation: null, error: output.error.code };
  };
  return { photos: c.photos.map((p) => (p.id === c.inFlight?.photoId ? settle(p) : p)), inFlight: null };
}

// ── Steps ──

export const hasGoal = (c: ConsultContext): boolean => c.prefs.goal !== null && c.prefs.collections.length > 0;
/** Ideas was reached once: the face card then leads back to it, not on to the goal. */
export const reachedIdeas = (c: Pick<ConsultContext, 'furthest'>): boolean => c.furthest >= stepIndex('ideas');

/** What a step needs before it can show, furthest aside; `hasIdeas` comes from the injected engine. */
export function stepReady(c: ConsultContext, step: Step, hasIdeas: boolean): boolean {
  switch (step) {
    case 'photo':
    case 'goal':
      return true;
    case 'face':
      // Any photo at all, failed ones too: every outcome has a screen there, so Back can always land on it.
      return c.photos.length > 0 && !c.skipped;
    case 'questions':
    case 'ideas':
      return hasGoal(c);
    case 'try-on':
    case 'board':
      return hasIdeas;
  }
}

/** Back, forward and deep links: only steps reached so far, and only when ready. */
export const canEnter = (c: ConsultContext, step: Step, hasIdeas: boolean): boolean =>
  stepIndex(step) <= c.furthest && stepReady(c, step, hasIdeas);

// ── Preferences and Move the lines ──

/** Applies `PREFS.SET`: the count stays within the policy (at least 2 under Both, at most 8). */
export function withPrefs(c: ConsultContext, e: Partial<Prefs>): Prefs {
  const goal = e.goal === undefined ? c.prefs.goal : e.goal;
  const policy = c.content.consult.policy.count;
  const min = goal === 'both' ? Math.max(2, policy.min) : policy.min;
  const count = Math.min(Math.max(Math.round(e.count ?? c.prefs.count), min), Math.min(policy.max, MAX_IDEAS));
  return {
    ...c.prefs,
    ...(e.colour && { colour: e.colour }),
    ...(e.tab && { tab: e.tab }),
    ...(e.perPicture !== undefined && { perPicture: e.perPicture }),
    goal,
    collections: e.collections ? [...new Set(e.collections)] : c.prefs.collections,
    count,
  };
}

/** "Colour in your results" as it applies now; null under the Colour goal, which has no haircuts to colour. */
export function colourChoiceOf(prefs: Pick<Prefs, 'goal' | 'colour'>): ColourChoice | null {
  if (prefs.goal !== 'cut' && prefs.goal !== 'both') return null;
  return prefs.colour ?? { mode: prefs.goal === 'both' ? 'pick' : 'keep', shade: null };
}
/** The goal the results follow: under Both, Keep and One colour show cuts only, so the count stays the person's count. */
export const resultGoalOf = (prefs: Pick<Prefs, 'goal' | 'colour'>): ConsultGoal | null =>
  prefs.goal === 'both' && colourChoiceOf(prefs)?.mode !== 'pick' ? 'cut' : prefs.goal;

/** The list with each cut paired by rank with a colour from `colours`, repeating when they run short; without colours, cuts stand alone. */
export function pairedLooks(ids: readonly ItemId[], cuts: readonly ItemId[], colours: readonly ItemId[]): Look[] {
  let n = 0;
  return ids.map((id) => {
    const colour = cuts.includes(id) ? colours[n++ % Math.max(1, colours.length)] : undefined;
    return colour === undefined ? id : ([id, colour] as const);
  });
}

export const EMPTY_EDITS: LandmarkEdits = { points: {}, hairline: null };

/** Line edits apply to the main photo once it is usable; one sent for another photo (switched or removed since) is stale. */
export const isMainPhotoEdit = (c: ConsultContext, photoId: PhotoId): boolean =>
  photoId === c.mainPhotoId && c.photos.some((p) => p.id === photoId && isUsable(p));

/** The photo's edits changed by `change`, applied at once (there is no draft); null edits are the lines as measured. */
export const withEdits = (c: ConsultContext, photoId: PhotoId, change: (e: LandmarkEdits) => LandmarkEdits | null): Pick<ConsultContext, 'photos'> => ({
  photos: c.photos.map((p) => (p.id === photoId ? { ...p, edits: change(p.edits ?? EMPTY_EDITS) } : p)),
});

/** The edits without one part's change: that part goes back to where it was measured. */
export const withoutPart = (e: LandmarkEdits, part: number | 'hairline'): LandmarkEdits =>
  part === 'hairline' ? { ...e, hairline: null } : { ...e, points: Object.fromEntries(Object.entries(e.points).filter(([index]) => Number(index) !== part)) };

// ── Shortlist and the pair ──

export const canAddToShortlist = (s: Shortlist, id: ItemId): boolean =>
  s.added.includes(id) || s.added.length < MAX_IDEAS;
export const withAdded = (s: Shortlist, id: ItemId): Shortlist => ({
  added: s.added.includes(id) ? s.added : [...s.added, id],
  removed: s.removed.filter((x) => x !== id),
  order: s.order,
});
export const withRemoved = (s: Shortlist, id: ItemId): Shortlist => ({
  added: s.added.filter((x) => x !== id),
  removed: s.removed.includes(id) ? s.removed : [...s.removed, id],
  order: s.order.filter((x) => x !== id),
});

/** Moves `id` to index `to` of the list as shown; the whole shown order becomes the person's order. */
export function withMoved(s: Shortlist, shown: readonly ItemId[], id: ItemId, to: number): Shortlist {
  const rest = shown.filter((x) => x !== id);
  if (rest.length === shown.length) return s;
  const at = Math.min(Math.max(Math.trunc(to), 0), rest.length);
  return { ...s, order: [...rest.slice(0, at), id, ...rest.slice(at)] };
}

/** The engine's picks for the count; under Both half (rounded up) are cuts and the rest colour looks. */
export function picksForCount(
  picks: readonly { readonly id: ItemId; readonly kind: 'cut' | 'colour' }[],
  goal: ConsultGoal,
  count: number,
): ItemId[] {
  const of = (kind: 'cut' | 'colour', n: number): ItemId[] =>
    picks
      .filter((p) => p.kind === kind)
      .slice(0, n)
      .map((p) => p.id);
  if (goal !== 'both') return of(goal, count);
  const cuts = Math.ceil(count / 2);
  return [...of('cut', cuts), ...of('colour', count - cuts)];
}

/**
 * The list: the engine picks minus removals, the person's additions appended, engine picks dropped from the
 * end of the engine order to stay within 8, then the ids in `order` first and the rest as they came.
 */
export function applyShortlist(picks: readonly ItemId[], s: Shortlist, max = MAX_IDEAS): ItemId[] {
  const removed = new Set(s.removed);
  const own = new Set(s.added);
  const engine = [...new Set(picks)].filter((id) => !removed.has(id));
  const extra = s.added.filter((id) => !engine.includes(id));
  const droppable = engine.filter((id) => !own.has(id));
  const dropped = new Set(droppable.slice(droppable.length - Math.max(0, engine.length + extra.length - max)));
  const list = [...engine.filter((id) => !dropped.has(id)), ...extra];
  const ordered = s.order.filter((id) => list.includes(id));
  return [...ordered, ...list.filter((id) => !ordered.includes(id))].slice(0, max);
}

const kinds = new WeakMap<ConsultContent['library'], ReadonlyMap<string, IndexEntry['kind']>>();
/** The kind of a library item, or null for an unknown id. */
export function kindOf(content: ConsultContent, id: ItemId): IndexEntry['kind'] | null {
  let map = kinds.get(content.library);
  if (!map) kinds.set(content.library, (map = new Map(content.library.entries.map((e) => [e.id, e.kind]))));
  return map.get(id) ?? null;
}

/** `PAIR.SET` names one cut and one colour look. */
export const isPairOfKinds = (content: ConsultContent, p: Pair): boolean =>
  kindOf(content, p.cut) === 'cut' && kindOf(content, p.colour) === 'colour';
/** The pair while both of its ideas are in the list, else null. */
export const pairIn = (content: ConsultContent, pair: Pair | null, ideas: readonly ItemId[]): Pair | null =>
  pair && isPairOfKinds(content, pair) && ideas.includes(pair.cut) && ideas.includes(pair.colour) ? pair : null;
