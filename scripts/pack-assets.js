import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';

// ============================================================================
// CONFIGURATION CONSTANTS (Easily adjustable for debugging with `npm run dev`)
// ============================================================================
// BILLY_FRAME_STEP: frame sampling step from original images/billy.gif (120 frames total)
// Step 5 = 120 / 5 = 24 frames (~7.5 FPS for a calm 3.2s loop, no motion sickness)
export const BILLY_FRAME_STEP = 5;

// Resolution for background Billy frames (fits 360 virtual width)
const BILLY_WIDTH = 360;
const BILLY_HEIGHT = 360;

async function pack() {
  const outputDir = path.resolve('public/assets');
  const scratchDir = path.resolve('scratch/extracted');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  console.log('--- PACKING GACHI-BIRD ASSETS ---');
  console.log(`Billy frame step: ${BILLY_FRAME_STEP}`);

  // 1. Extract frames from images/billy.gif via ffmpeg if not already done
  const billyFramesDir = path.join(scratchDir, 'billy');
  if (!fs.existsSync(billyFramesDir)) {
    fs.mkdirSync(billyFramesDir, { recursive: true });
    console.log('Extracting frames from images/billy.gif...');
    execSync(
      `ffmpeg -y -i images/billy.gif -vf "scale=${BILLY_WIDTH}:${BILLY_HEIGHT}:flags=lanczos" "${billyFramesDir}/frame_%03d.png"`,
      { stdio: 'inherit' }
    );
  }

  // 2. Sample Billy frames based on BILLY_FRAME_STEP
  const allBillyFiles = fs
    .readdirSync(billyFramesDir)
    .filter((f) => f.endsWith('.png'))
    .sort();

  console.log(`Total raw Billy frames found: ${allBillyFiles.length}`);
  const sampledBillyFiles = [];
  for (let i = 0; i < allBillyFiles.length; i += BILLY_FRAME_STEP) {
    sampledBillyFiles.push(path.join(billyFramesDir, allBillyFiles[i]));
  }
  console.log(`Sampled Billy frames packed: ${sampledBillyFiles.length} frames`);

  const items = [];

  // Add Billy animation frames
  const billyAnimNames = [];
  for (let i = 0; i < sampledBillyFiles.length; i++) {
    const file = sampledBillyFiles[i];
    const id = `billy_${i + 1}`;
    billyAnimNames.push(id);
    const meta = await sharp(file).metadata();
    items.push({
      id,
      file,
      width: meta.width || BILLY_WIDTH,
      height: meta.height || BILLY_HEIGHT,
    });
  }

  // 3. Head frames from images/56/*.png (10 frames)
  const headAnimNames = [];
  for (let i = 1; i <= 10; i++) {
    const file = path.resolve(`images/56/${i}.png`);
    const id = `head_${i}`;
    headAnimNames.push(id);
    const meta = await sharp(file).metadata();
    items.push({
      id,
      file,
      width: meta.width || 39,
      height: meta.height || 56,
    });
  }

  // 4. Locker (Single canonical upright locker from pipeNorthLocker1.png)
  const lockerFile = path.resolve('images/pipeNorthLocker1.png');
  const lockerMeta = await sharp(lockerFile).metadata();
  items.push({
    id: 'locker',
    file: lockerFile,
    width: lockerMeta.width || 52,
    height: lockerMeta.height || 242,
  });

  // 5. Seamless Locker Body (smooth metal slice without vents or seams for infinite extension)
  const lockerBodyBuf = await sharp(lockerFile)
    .extract({ left: 0, top: 160, width: 52, height: 70 })
    .toBuffer();
  items.push({
    id: 'locker_body',
    buffer: lockerBodyBuf,
    width: 52,
    height: 70,
  });

  // 6. Ground (fg.png)
  const fgFile = path.resolve('images/fg.png');
  const fgMeta = await sharp(fgFile).metadata();
  items.push({
    id: 'ground',
    file: fgFile,
    width: fgMeta.width || 306,
    height: fgMeta.height || 118,
  });

  // 7. Natural 7-color retro pixel rainbow (Red, Orange, Yellow, Green, Cyan, Blue, Violet)
  const rainbowSvg = `
    <svg width="220" height="36" viewBox="0 0 220 36" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <rect x="0" y="0" width="220" height="36" fill="#000000" />
      <rect x="2" y="2" width="216" height="32" fill="#181824" />

      <rect x="6" y="5" width="208" height="4" fill="#E53935" />
      <rect x="6" y="9" width="208" height="4" fill="#FB8C00" />
      <rect x="6" y="13" width="208" height="4" fill="#FDD835" />
      <rect x="6" y="17" width="208" height="4" fill="#43A047" />
      <rect x="6" y="21" width="208" height="4" fill="#00ACC1" />
      <rect x="6" y="25" width="208" height="4" fill="#1E88E5" />
      <rect x="6" y="29" width="208" height="4" fill="#8E24AA" />

      <g fill="#FFFFFF">
        <rect x="4" y="16" width="16" height="14" />
        <rect x="8" y="10" width="12" height="6" />
        <rect x="18" y="14" width="8" height="16" />
        <rect x="200" y="16" width="16" height="14" />
        <rect x="200" y="10" width="12" height="6" />
        <rect x="194" y="14" width="8" height="16" />
      </g>
    </svg>
  `;
  const rainbowBuf = await sharp(Buffer.from(rainbowSvg)).png().toBuffer();
  items.push({
    id: 'rainbow',
    buffer: rainbowBuf,
    width: 220,
    height: 36,
  });

  // 8. Rectangle packing algorithm
  const padding = 2;
  const atlasWidth = 2048;
  let curX = padding;
  let curY = padding;
  let rowHeight = 0;

  const placements = [];
  const framesObj = {};

  for (const item of items) {
    if (curX + item.width + padding > atlasWidth) {
      curX = padding;
      curY += rowHeight + padding;
      rowHeight = 0;
    }

    placements.push({
      input: item.buffer || item.file,
      left: curX,
      top: curY,
    });

    framesObj[item.id] = {
      frame: { x: curX, y: curY, w: item.width, h: item.height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: item.width, h: item.height },
      sourceSize: { w: item.width, h: item.height },
    };

    rowHeight = Math.max(rowHeight, item.height);
    curX += item.width + padding;
  }

  const atlasHeight = curY + rowHeight + padding;
  console.log(`Generated atlas size: ${atlasWidth} x ${atlasHeight}`);

  await sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(placements)
    .png({ compressionLevel: 9, effort: 7 })
    .toFile(path.join(outputDir, 'atlas.png'));

  const atlasJson = {
    frames: framesObj,
    animations: {
      head: headAnimNames,
      billy: billyAnimNames,
    },
    meta: {
      app: 'gachi-bird-packer',
      version: '2.0',
      image: 'atlas.png',
      format: 'RGBA8888',
      size: { w: atlasWidth, h: atlasHeight },
      scale: '1',
      billyFrameCount: sampledBillyFiles.length,
      billyStep: BILLY_FRAME_STEP,
    },
  };

  fs.writeFileSync(
    path.join(outputDir, 'atlas.json'),
    JSON.stringify(atlasJson, null, 2)
  );

  await sharp('images/Wrestle_in_Peace.jpg')
    .resize(360, null)
    .jpeg({ quality: 85 })
    .toFile(path.join(outputDir, 'memorial.jpg'));

  console.log('✓ All assets packed successfully with seamless locker_body!');
  const stats = fs.statSync(path.join(outputDir, 'atlas.png'));
  console.log(`Atlas PNG file size: ${(stats.size / 1024).toFixed(1)} KB`);
}

pack().catch(console.error);
