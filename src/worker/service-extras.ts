/**
 * The extra calls of the analysis service: `depth`, `selectHair` and `tint`. Each
 * decodes the photo, runs one model or the colour transfer, and returns its buffers for transfer; expected
 * failures are `Result`s. service.ts owns loading, `analyse`, op tracking and the shared state.
 */
import { transfer } from 'comlink';
import { measureHair, targetsFromLab, transferColour, type TransferTarget } from '../domain/colour/transfer.ts';
import type { PhotoId } from '../domain/ids.ts';
import { fillHairHoles, hairMeasures, reachableFrom, SEGMENT, type CategoryMask, type Landmarks, type RgbaImage } from '../domain/measure/mask.ts';
import type { HairMeasures } from '../domain/measure/observation.ts';
import { err, ok, type Result } from '../domain/result.ts';
import type { AnalysisError, AnalysisErrorCode, DepthMap, HairSelection, Mask, ModelId, PhotoInput, TapPoint, TintMask, TintSource } from './protocol.ts';
import type { ServiceDeps } from './service.ts';

export const failure = (code: AnalysisErrorCode, detail: string, model?: ModelId): AnalysisError => ({ code, retryable: code !== 'internal' && code !== 'unsupported', detail, ...(model ? { model } : {}) });

/** The code of an error a runtime threw: the messages a WASM or ONNX memory failure gives are `out_of_memory`, the rest a bug. */
export const thrownCode = (message: string): 'out_of_memory' | 'internal' => (/out of memory|memory access out of bounds|allocation failed|\boom\b/i.test(message) ? 'out_of_memory' : 'internal');

/** What the extra calls read: the injected parts, the loaded models, and the last photo's core sensing for refined measures. */
export interface ExtraContext {
  readonly deps: ServiceDeps;
  readonly loaded: ReadonlySet<ModelId>;
  /** The segmenter mask and face points of the photo last tapped, so later taps do not run them again. */
  sensed: { readonly photoId: PhotoId; readonly segments: CategoryMask; readonly landmarks: Landmarks | null } | null;
}

const stopped = (what: string, model?: ModelId): Result<never, AnalysisError> => err(failure('aborted', `${what} stopped`, model));
/** Read through a call, so a check after an `await` is not narrowed away by the one before it. */
const cancelled = (signal: AbortSignal): boolean => signal.aborted;
const notLoaded = (call: string, model: ModelId): Result<never, AnalysisError> => err(failure('internal', `${call} before the ${model} model loaded`, model));

/** Relative depth at a short side of 252 px. */
export async function depthOf(ctx: ExtraContext, signal: AbortSignal, photo: Blob): Promise<Result<DepthMap, AnalysisError>> {
  if (!ctx.loaded.has('depth')) return notLoaded('depth', 'depth');
  const image = await ctx.deps.decode(photo);
  if (!image.ok) return image;
  if (signal.aborted) return stopped('depth', 'depth');
  const map = await ctx.deps.extras.depth(image.value);
  if (!ctx.loaded.has('segmenter')) return transfer(ok(map), [map.data.buffer]);
  const foreground = foregroundAt(await ctx.deps.runStage('segmenter', image.value), map.widthPx, map.heightPx);
  return transfer(ok({ ...map, foreground }), [map.data.buffer, foreground.buffer]);
}

/** The connected part of `foreground` that holds the most of `face`; all of it when there is no face to go by. */
function partWithFace(foreground: Uint8Array, face: readonly number[], widthPx: number, heightPx: number): Uint8Array {
  const claimed = new Uint8Array(foreground.length);
  let [best, most] = [foreground, 0];
  for (const seed of face) {
    if (claimed[seed]) continue;
    const part = reachableFrom([seed], (cell) => (foreground[cell] ?? 0) > 0, widthPx, heightPx);
    part.forEach((inside, cell) => { claimed[cell] ||= inside; });
    const held = face.filter((cell) => part[cell]).length;
    if (held > most) [best, most] = [part.map((inside) => inside * 255), held];
  }
  return best;
}

/** The person for the 3D view's alpha: every class but the background at the depth map's size, without anything in the photo that is not joined to the face. */
export function foregroundAt(segments: CategoryMask, widthPx: number, heightPx: number): Uint8Array {
  const out = new Uint8Array(widthPx * heightPx);
  const face: number[] = [];
  for (let y = 0; y < heightPx; y++) {
    const my = Math.min(segments.heightPx - 1, Math.floor(((y + 0.5) * segments.heightPx) / heightPx));
    for (let x = 0; x < widthPx; x++) {
      const mx = Math.min(segments.widthPx - 1, Math.floor(((x + 0.5) * segments.widthPx) / widthPx));
      const value = segments.data[my * segments.widthPx + mx];
      out[y * widthPx + x] = value === SEGMENT.background ? 0 : 255;
      if (value === SEGMENT.faceSkin) face.push(y * widthPx + x);
    }
  }
  return partWithFace(out, face, widthPx, heightPx);
}

const classOf = (segments: CategoryMask, value: number): Mask => ({ widthPx: segments.widthPx, heightPx: segments.heightPx, data: segments.data.map((c) => (c === value ? 255 : 0)) });
/** The hair class of a segmenter mask as a 0 / 255 mask. */
export const hairOf = (segments: CategoryMask): Mask => classOf(segments, SEGMENT.hair);

/** The segmenter's classes with its hair replaced by the refined hair: hair it missed is added, hair the taps excluded becomes background. */
export function overlayHair(segments: CategoryMask, hair: Mask): CategoryMask {
  const { widthPx: w, heightPx: h } = segments;
  const data = new Uint8Array(segments.data);
  for (let y = 0; y < h; y++) {
    const my = Math.min(hair.heightPx - 1, Math.floor(((y + 0.5) * hair.heightPx) / h));
    for (let x = 0; x < w; x++) {
      const mx = Math.min(hair.widthPx - 1, Math.floor(((x + 0.5) * hair.widthPx) / w));
      const isHair = (hair.data[my * hair.widthPx + mx] ?? 0) > 0;
      if (isHair) data[y * w + x] = SEGMENT.hair;
      else if (data[y * w + x] === SEGMENT.hair) data[y * w + x] = SEGMENT.background;
    }
  }
  return { widthPx: w, heightPx: h, data };
}

/** The core sensing of one photo for refined measures, run once per photo, or null where the segmenter is not in this worker. */
async function sensed(ctx: ExtraContext, photoId: PhotoId, image: RgbaImage): Promise<ExtraContext['sensed']> {
  if (!ctx.loaded.has('segmenter')) return null;
  if (ctx.sensed?.photoId === photoId) return ctx.sensed;
  const segments = await ctx.deps.runStage('segmenter', image);
  const faces = ctx.loaded.has('face') ? await ctx.deps.runStage('face', image) : [];
  ctx.sensed = { photoId, segments, landmarks: faces[0]?.landmarks ?? null };
  return ctx.sensed;
}

/** The mask measures over the refined hair; without the core tools there is no hairline. */
async function refinedMeasures(ctx: ExtraContext, photoId: PhotoId, image: RgbaImage, hair: Mask): Promise<HairMeasures> {
  const core = await sensed(ctx, photoId, image);
  if (!core) return hairMeasures({ widthPx: hair.widthPx, heightPx: hair.heightPx, data: hair.data.map((v) => (v > 0 ? SEGMENT.hair : SEGMENT.background)) }, image, null);
  return hairMeasures(overlayHair(core.segments, hair), image, core.landmarks);
}

/** Tap-to-select: SAM's hair from the taps (the embedding is kept per photo) and its measures. */
export async function selectHairOf(ctx: ExtraContext, signal: AbortSignal, photo: PhotoInput, points: readonly TapPoint[]): Promise<Result<HairSelection, AnalysisError>> {
  if (!ctx.loaded.has('sam')) return notLoaded('selectHair', 'sam');
  if (points.length === 0) return err(failure('internal', 'selectHair needs at least one tap', 'sam'));
  const image = await ctx.deps.decode(photo.blob);
  if (!image.ok) return image;
  if (cancelled(signal)) return stopped('tap-to-select', 'sam');
  const mask = await ctx.deps.extras.selectHair(photo.id, image.value, points);
  if (cancelled(signal)) return stopped('tap-to-select', 'sam');
  const measures = await refinedMeasures(ctx, photo.id, image.value, mask);
  return transfer(ok({ mask, measures }), [mask.data.buffer, measures.hairline.buffer]);
}

/** The segmenter's hair on an AI picture, which needs the core tools in this worker. */
async function autoMask(ctx: ExtraContext, image: RgbaImage): Promise<Result<Mask, AnalysisError>> {
  if (!ctx.loaded.has('segmenter')) return notLoaded('an automatic tint mask', 'segmenter');
  return ok(hairOf(await ctx.deps.runStage('segmenter', image)));
}

/** The look's Lab targets, or an AI picture's own hair statistics (the hair-only version). */
async function targetOf(ctx: ExtraContext, source: TintSource): Promise<Result<TransferTarget, AnalysisError>> {
  if (source.kind === 'targets') return ok(targetsFromLab(source.targets));
  const picture = await ctx.deps.decode(source.blob);
  if (!picture.ok) return picture;
  const mask = await autoMask(ctx, picture.value);
  if (!mask.ok) return mask;
  const target = measureHair(picture.value, mask.value);
  return target ? ok(target) : err(failure('decode_failed', 'no hair found in the AI picture'));
}

/** The colour preview: the colour transfer inside the mask; every pixel outside it is the photo's own. */
export async function tintOf(ctx: ExtraContext, signal: AbortSignal, photo: Blob, source: TintSource, mask: TintMask): Promise<Result<ImageBitmap, AnalysisError>> {
  const image = await ctx.deps.decode(photo);
  if (!image.ok) return image;
  // Without the core tools there is no face to place short hair against; a stored mask still tints.
  const segments = ctx.loaded.has('segmenter') ? await ctx.deps.runStage('segmenter', image.value) : null;
  const hair = mask !== 'auto' ? ok(mask) : segments ? ok(hairOf(fillHairHoles(segments))) : notLoaded('an automatic tint mask', 'segmenter');
  if (!hair.ok) return hair;
  const target = await targetOf(ctx, source);
  if (!target.ok) return target;
  if (signal.aborted) return stopped('tint');
  // Only a look's own targets go flat on short hair: an AI picture's statistics already say where its colours sit.
  const face = source.kind === 'targets' && segments ? classOf(segments, SEGMENT.faceSkin) : null;
  const bitmap = await ctx.deps.toBitmap(transferColour(image.value, hair.value, target.value, face));
  if (cancelled(signal)) {
    bitmap.close();
    return stopped('tint');
  }
  return transfer(ok(bitmap), [bitmap]);
}
