/**
 * The 3D view, a lazy Three.js chunk: the photo as a texture on a plane displaced by
 * the percentile-normalised depth map, the background removed with the segmenter's alpha (so no triangles are cut), and
 * the photo's own light. It draws only when something changes (no idle motion) and gives every GPU resource back on dispose.
 */
import { DataTexture, LinearFilter, LinearMipmapLinearFilter, Mesh, MeshBasicMaterial, MirroredRepeatWrapping, PerspectiveCamera, PlaneGeometry, RGBAFormat, SRGBColorSpace, Scene, UnsignedByteType, WebGLRenderer, type BufferAttribute } from 'three';
import { borderCells, reachableFrom, withoutHoles } from '../../domain/measure/mask.ts';

/** The surface: depth cut off at these shares of the person's own depth values, so a few stray points cannot flatten it. */
const LOW_SHARE = 0.02;
const HIGH_SHARE = 0.98;
/** Front-to-back relief as a share of the plane's height. */
const RELIEF = 0.3;
/** Head and hair at least this wide, as a share of the plane's height, get the full relief; the narrowest ordinary portrait measured 0.40. */
const FULL_RELIEF_WIDTH = 0.35;
/** At most this many grid cells on a side: enough for a depth map of 252 px on its short side. */
const MAX_CELLS = 220;
const FOV_DEG = 32;
/** How far the photo's left, right and lower edges carry on past it, as a share of its height: at the limits of the turn no hard edge comes into view. */
const SKIRT = 0.25;
/** Above the top of the hair, and off the bottom of the photo so its hard lower edge is never seen; shares of the height. */
const HEAD_ROOM = 0.05;
const BOTTOM_CROP = 0.15;
/** However wide the hair, at least this much of the person's lower end stays below the view; a share of the height. */
const END_CROP = 0.05;
/** Beside the person, as a share of the plane's height. */
const SIDE_ROOM = 0.05;
/** Passes of a small blur: the depth loses its ripples, and the segmenter's low-resolution mask loses its stair-steps. */
const DEPTH_BLUR = 2;
const MASK_BLUR = 2;
/** How many cells in from the silhouette the person's own depth begins: the depth model smears the backdrop over the last few, and a ramp that steep folds over and tears when turned. */
const EDGE_INSET = 6;
/** How many cells the depth is carried outward from there, over the silhouette and the background next to it, so the edge does not fall back when turned. */
const EDGE_SPREAD = EDGE_INSET + 14;
/** Where the softened mask becomes the person, as shares of 255; above a half pulls the edge in off the photo's backdrop. */
const EDGE_LOW = 0.6;
const EDGE_HIGH = 0.85;
/** The alpha from which a texel is drawn: the material's alpha test of a half, as a byte. */
const SOLID_ALPHA = 128;
/** Passes that mark the band along the silhouette where leftover backdrop can sit, and how near the backdrop's colour counts (RGB distance). */
const EDGE_BAND_BLUR = 7;
const BACKDROP_DISTANCE = 64;
/** Only this top share of the person sets the framing's width, so wide shoulders do not pull the photo's lower edge into view. */
const HEAD_SHARE = 0.55;
/** The eased move of the Turn and Tilt buttons. */
const TURN_MS = 260;

/** A depth map: 0 to 1, row by row, with its size. */
export interface DepthSurface {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly data: Float32Array;
}

/** What the viewer shows. The caller closes `photo` once the viewer is made. */
export interface Viewer3dInput {
  readonly photo: ImageBitmap;
  readonly depth: DepthSurface;
  /** At the depth map's size, above 0 for the person; null keeps the background. */
  readonly foreground: Uint8Array | null;
  /** The browser took the WebGL context away while the view was open, or gave it back and the picture is drawn again. */
  readonly onContext: (state: 'lost' | 'ready') => void;
}

export interface Viewer3d {
  /** Turns the plane to `yaw` degrees (negative to the left) and `tilt` degrees (positive up); `smooth` eases there. */
  turn(yaw: number, tilt: number, smooth: boolean): void;
  /** Frees the geometry, material, texture and renderer, gives the context back and removes the canvas. */
  dispose(): void;
}

/** Depth scaled by the 2nd and 98th percentile of the person's values and clamped to 0-1; flat when there is nothing to scale. */
export function normalisedDepth(data: Float32Array, foreground: Uint8Array | null): Float32Array {
  const values = (foreground ? data.filter((_, i) => (foreground[i] ?? 0) > 0) : data.slice()).sort();
  const last = values.length - 1;
  const low = values[Math.floor(LOW_SHARE * last)] ?? 0;
  const span = (values[Math.ceil(HIGH_SHARE * last)] ?? 0) - low;
  return data.map((v) => (span > 0 ? Math.min(1, Math.max(0, (v - low) / span)) : 0));
}

/** A bilinear sample of a row-by-row grid at `u`, `v` (0 to 1 from the top left). */
export function bilinear(values: ArrayLike<number>, widthPx: number, heightPx: number, u: number, v: number): number {
  const x = u * (widthPx - 1);
  const y = v * (heightPx - 1);
  const [x0, y0] = [Math.floor(x), Math.floor(y)];
  const [x1, y1] = [Math.min(widthPx - 1, x0 + 1), Math.min(heightPx - 1, y0 + 1)];
  const at = (cx: number, cy: number): number => values[cy * widthPx + cx] ?? 0;
  const top = at(x0, y0) * (1 - (x - x0)) + at(x1, y0) * (x - x0);
  const bottom = at(x0, y1) * (1 - (x - x0)) + at(x1, y1) * (x - x0);
  return top * (1 - (y - y0)) + bottom * (y - y0);
}

/** `passes` of a 3 x 3 box blur over a row-by-row grid. */
export function blurred(values: ArrayLike<number>, widthPx: number, heightPx: number, passes: number): Float32Array {
  let current = Float32Array.from(values);
  for (let pass = 0; pass < passes; pass++) {
    const next = new Float32Array(current.length);
    for (let y = 0; y < heightPx; y++) {
      for (let x = 0; x < widthPx; x++) {
        let sum = 0;
        let count = 0;
        for (let cy = Math.max(0, y - 1); cy <= Math.min(heightPx - 1, y + 1); cy++) {
          for (let cx = Math.max(0, x - 1); cx <= Math.min(widthPx - 1, x + 1); cx++) {
            sum += current[cy * widthPx + cx] ?? 0;
            count++;
          }
        }
        next[y * widthPx + x] = sum / count;
      }
    }
    current = next;
  }
  return current;
}

/** The person's depth carried outward, cell by cell, over the background next to them. */
export function spreadOutward(values: Float32Array, foreground: Uint8Array, widthPx: number, heightPx: number, passes: number): Float32Array {
  const out = values.slice();
  const known = Uint8Array.from(foreground, (v) => (v > 0 ? 1 : 0));
  for (let pass = 0; pass < passes; pass++) {
    const filled: number[] = [];
    for (let i = 0; i < known.length; i++) {
      if (known[i]) continue;
      const x = i % widthPx;
      const near = [x > 0 ? i - 1 : -1, x < widthPx - 1 ? i + 1 : -1, i - widthPx, i + widthPx].filter((n) => n >= 0 && n < known.length && known[n]);
      if (near.length === 0) continue;
      out[i] = near.reduce((sum, n) => sum + (out[n] ?? 0), 0) / near.length;
      filled.push(i);
    }
    for (const i of filled) known[i] = 1;
  }
  return out;
}

/** The relief for a person this wide in the photo: a head seen small keeps the proportions of a head, not the depth of the whole plane, which would pull it into a cone. */
export const reliefFor = (widthInPlane: number): number => RELIEF * Math.min(1, widthInPlane / FULL_RELIEF_WIDTH);

/** A plane of height 1 with each vertex moved along z by the smoothed depth at its place. */
function displacedPlane(aspect: number, depth: DepthSurface, foreground: Uint8Array | null): PlaneGeometry {
  const scaled = normalisedDepth(depth.data, foreground);
  const inner = foreground && Uint8Array.from(blurred(foreground, depth.widthPx, depth.heightPx, EDGE_INSET), (v) => (v > 254.5 ? 255 : 0));
  const seated = inner ? spreadOutward(scaled, inner, depth.widthPx, depth.heightPx, EDGE_SPREAD) : scaled;
  const surface = blurred(seated, depth.widthPx, depth.heightPx, DEPTH_BLUR);
  const longSide = Math.max(depth.widthPx, depth.heightPx);
  const cells = (side: number): number => Math.max(1, Math.round((Math.min(longSide, MAX_CELLS) * side) / longSide));
  const [across, down] = [cells(depth.widthPx), cells(depth.heightPx)];
  const geometry = new PlaneGeometry(aspect, 1, across, down);
  const person = personBox(foreground, depth.widthPx, depth.heightPx);
  const relief = reliefFor((person.right - person.left) * aspect);
  const position = geometry.getAttribute('position') as BufferAttribute;
  const uv = geometry.getAttribute('uv') as BufferAttribute;
  for (let row = 0, i = 0; row <= down; row++) {
    for (let column = 0; column <= across; column++, i++) {
      position.setZ(i, (bilinear(surface, depth.widthPx, depth.heightPx, column / across, row / down) - 0.5) * relief);
      if (row === down) {
        position.setY(i, -0.5 - SKIRT);
        uv.setY(i, -SKIRT);
      }
      if (column === 0 || column === across) {
        const side = column === 0 ? -1 : 1;
        position.setX(i, side * (aspect / 2 + SKIRT));
        uv.setX(i, 0.5 + side * (0.5 + SKIRT / aspect));
      }
    }
  }
  return geometry;
}

/** The mean colour of the photo outside the person. */
function backdropColour(data: Uint8ClampedArray, width: number, height: number, depth: DepthSurface, foreground: Uint8Array): readonly [number, number, number] {
  const at = (i: number): number => data[i] ?? 0;
  let [r, g, b, count] = [0, 0, 0, 0];
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      if (bilinear(foreground, depth.widthPx, depth.heightPx, (x + 0.5) / width, (y + 0.5) / height) > 0) continue;
      const i = (y * width + x) * 4;
      r += at(i);
      g += at(i + 1);
      b += at(i + 2);
      count++;
    }
  }
  return count === 0 ? [-999, -999, -999] : [r / count, g / count, b / count];
}

/** Writes the person into the alpha channel: a soft silhouette, minus the backdrop left along its edge. Only backdrop that touches the outside goes, so a strand the colour of the wall cannot become a hole. */
function cutOut(data: Uint8ClampedArray, width: number, height: number, depth: DepthSurface, foreground: Uint8Array): void {
  const soft = blurred(foreground, depth.widthPx, depth.heightPx, MASK_BLUR);
  const band = blurred(foreground, depth.widthPx, depth.heightPx, EDGE_BAND_BLUR);
  const [r, g, b] = backdropColour(data, width, height, depth, foreground);
  const open = new Uint8Array(width * height);
  const core: number[] = [];
  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const i = (y * width + x) * 4;
      const edge = (bilinear(soft, depth.widthPx, depth.heightPx, u, v) / 255 - EDGE_LOW) / (EDGE_HIGH - EDGE_LOW);
      const inBand = bilinear(band, depth.widthPx, depth.heightPx, u, v) < 250;
      data[i + 3] = Math.round(255 * Math.min(1, Math.max(0, edge)));
      if (!inBand && edge >= 1) core.push(y * width + x);
      open[y * width + x] = data[i + 3] === 0 || (inBand && Math.hypot((data[i] ?? 0) - r, (data[i + 1] ?? 0) - g, (data[i + 2] ?? 0) - b) < BACKDROP_DISTANCE) ? 1 : 0;
    }
  }
  reachableFrom(borderCells(width, height), (cell) => open[cell] === 1, width, height).forEach((outside, cell) => {
    if (outside) data[cell * 4 + 3] = 0;
  });
  // The cut can leave specks of hair standing alone in the background, which would drift apart from the person when turned.
  reachableFrom(core, (cell) => (data[cell * 4 + 3] ?? 0) >= SOLID_ALPHA, width, height).forEach((joined, cell) => {
    if (!joined) data[cell * 4 + 3] = 0;
  });
}

/** A texture over `data`, row by row from the top, with mipmaps. */
function gridTexture(data: Uint8ClampedArray, width: number, height: number): DataTexture {
  const texture = new DataTexture(data, width, height, RGBAFormat, UnsignedByteType);
  texture.flipY = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * The photo's colours and, apart, the person's shape. Past the photo's edge the colours mirror, so clothing carries on with
 * no streaks, while the shape only continues what touches the edge: a mirrored shape would put a copy of an arm or of hair in the skirt.
 */
function photoTextures(photo: ImageBitmap, depth: DepthSurface, foreground: Uint8Array | null): { readonly colour: DataTexture; readonly shape: DataTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = photo.width;
  canvas.height = photo.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('no 2D canvas for the 3D texture');
  context.drawImage(photo, 0, 0);
  const { data } = context.getImageData(0, 0, photo.width, photo.height);
  if (foreground) cutOut(data, photo.width, photo.height, depth, foreground);
  const shapeData = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    // An alpha map is read from the green channel.
    shapeData[i + 1] = data[i + 3] ?? 255;
    data[i + 3] = 255;
  }
  const colour = gridTexture(data, photo.width, photo.height);
  colour.colorSpace = SRGBColorSpace;
  colour.wrapS = colour.wrapT = MirroredRepeatWrapping;
  return { colour, shape: gridTexture(shapeData, photo.width, photo.height) };
}

/** The surface, unlit so it keeps the photo's own colours (shading from the depth map's normals drew wrinkle-like lines across the face), in a scene of its own. */
function surfaceScene(input: Viewer3dInput, foreground: Uint8Array | null) {
  const geometry = displacedPlane(input.photo.width / input.photo.height, input.depth, foreground);
  const { colour, shape } = photoTextures(input.photo, input.depth, foreground);
  // Alpha to coverage gives the cut-out's edge the renderer's anti-aliasing, where a plain alpha test would leave it jagged.
  const material = new MeshBasicMaterial({ map: colour, alphaMap: shape, alphaTest: 0.5, alphaToCoverage: true });
  const mesh = new Mesh(geometry, material);
  const scene = new Scene();
  scene.add(mesh);
  return { geometry, textures: [colour, shape], material, mesh, scene };
}

/** Where the person's head and hair are in the photo, as shares of its size; the whole photo when there is no mask or it is empty. */
export function personBox(foreground: Uint8Array | null, widthPx: number, heightPx: number): { readonly top: number; readonly bottom: number; readonly left: number; readonly right: number } {
  let [top, bottom, left, right] = [heightPx, heightPx - 1, widthPx, -1];
  if (foreground) {
    const person = (y: number, x: number): boolean => (foreground[y * widthPx + x] ?? 0) > 0;
    for (let y = 0; y < heightPx && top === heightPx; y++) for (let x = 0; x < widthPx; x++) if (person(y, x)) top = y;
    while (bottom > top && !foreground.subarray(bottom * widthPx, (bottom + 1) * widthPx).some((v) => v > 0)) bottom--;
    const headEnd = Math.min(heightPx, top + Math.ceil((heightPx - top) * HEAD_SHARE));
    for (let y = top; y < headEnd; y++) {
      for (let x = 0; x < widthPx; x++) {
        if (!person(y, x)) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }
  return right < 0 ? { top: 0, bottom: 1, left: 0, right: 1 } : { top: top / heightPx, bottom: (bottom + 1) / heightPx, left: left / widthPx, right: (right + 1) / widthPx };
}

/** The camera, and how it frames the head and shoulders: head room above the hair, the person's lower end out of view, the person's width in. */
function framedCamera(input: Viewer3dInput, foreground: Uint8Array | null) {
  const camera = new PerspectiveCamera(FOV_DEG, 1, 0.1, 10);
  const planeWidth = input.photo.width / input.photo.height;
  const person = personBox(foreground, input.depth.widthPx, input.depth.heightPx);
  const frameFor = (viewAspect: number): void => {
    const lower = person.bottom - person.top + HEAD_ROOM - BOTTOM_CROP;
    const shown = Math.max(lower, ((person.right - person.left) * planeWidth + 2 * SIDE_ROOM) / viewAspect);
    // A view made taller by wide hair spends the spare room above the head, so the person's lower end stays out of it.
    const y = Math.max(0.5 - person.top + HEAD_ROOM - shown / 2, 0.5 - person.bottom + END_CROP + shown / 2);
    camera.position.set(((person.left + person.right) / 2 - 0.5) * planeWidth, y, shown / 2 / Math.tan((FOV_DEG * Math.PI) / 360) + RELIEF / 2);
  };
  return { camera, frameFor };
}

/** How far along an eased move is after `elapsedMs`, 0 to 1. A frame's own time can lie just before the press that began the move, so it is held at 0 there. */
export function easedShare(elapsedMs: number): number {
  return 1 - (1 - Math.min(1, Math.max(0, elapsedMs / TURN_MS))) ** 3;
}

/** Moves the surface to a pose, easing when asked, and draws only while something changes (no idle motion). */
function poseDriver(mesh: Mesh, render: () => void) {
  const shown = { yaw: 0, tilt: 0 };
  let from = { ...shown };
  let to = { ...shown };
  let began = 0;
  let frame = 0;
  const degrees = Math.PI / 180;
  const draw = (now: number): void => {
    const eased = easedShare(now - began);
    shown.yaw = from.yaw + (to.yaw - from.yaw) * eased;
    shown.tilt = from.tilt + (to.tilt - from.tilt) * eased;
    mesh.rotation.y = shown.yaw * degrees;
    mesh.rotation.x = -shown.tilt * degrees;
    render();
    frame = eased < 1 ? requestAnimationFrame(draw) : 0;
  };
  const turn = (yaw: number, tilt: number, smooth: boolean): void => {
    const instant = !smooth || document.documentElement.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    from = instant ? { yaw, tilt } : { ...shown };
    to = { yaw, tilt };
    began = instant ? 0 : performance.now();
    frame ||= requestAnimationFrame(draw);
  };
  return { turn, stop: () => { cancelAnimationFrame(frame); } };
}

/** The renderer on a new canvas in `host`; a browser that refuses WebGL leaves no canvas behind. */
function rendererIn(host: HTMLElement): WebGLRenderer {
  const canvas = document.createElement('canvas');
  host.append(canvas);
  try {
    return new WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (refused) {
    canvas.remove();
    throw refused;
  }
}

/** What changes the canvas from outside until `signal` aborts: its context going and coming back, and the device pixel ratio, which changes with no change of layout when the window moves to another screen, so a ResizeObserver never hears of it. */
function followCanvas(canvas: HTMLCanvasElement, signal: AbortSignal, onRatio: () => void, onContext: (state: 'lost' | 'ready') => void): void {
  const watchRatio = (): void => {
    matchMedia(`(resolution: ${String(window.devicePixelRatio)}dppx)`).addEventListener('change', () => { onRatio(); watchRatio(); }, { once: true, signal });
  };
  watchRatio();
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    onContext('lost');
  }, { signal });
  canvas.addEventListener('webglcontextrestored', () => { onContext('ready'); }, { signal });
}

/** Makes the view inside `host`, which gives it its size; throws when the browser refuses a WebGL context. */
export function createViewer3d(host: HTMLElement, input: Viewer3dInput): Viewer3d {
  const foreground = input.foreground && withoutHoles(input.foreground, input.depth.widthPx, input.depth.heightPx);
  const { geometry, textures, material, mesh, scene } = surfaceScene(input, foreground);
  const { camera, frameFor } = framedCamera(input, foreground);
  const renderer = rendererIn(host);
  const render = (): void => { renderer.render(scene, camera); };
  const pose = poseDriver(mesh, render);
  const resize = (): void => {
    const [w, h] = [host.clientWidth, host.clientHeight];
    if (w === 0 || h === 0) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    frameFor(w / h);
    // In this very frame: setSize has just emptied the canvas, and a draw left to the next frame would flash a bare stage.
    render();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const listening = new AbortController();
  followCanvas(renderer.domElement, listening.signal, resize, (state) => {
    if (state === 'ready') render();
    input.onContext(state);
  });
  resize();
  return {
    turn: pose.turn,
    dispose() {
      pose.stop();
      observer.disconnect();
      listening.abort();
      geometry.dispose();
      material.dispose();
      for (const texture of textures) texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
