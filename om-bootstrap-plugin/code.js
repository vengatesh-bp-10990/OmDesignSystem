// OM Design System — Bootstrap Plugin
// Phase 0 + Phase 1.1: pages, collections, seed tokens, text styles, test frame.
//
// Safe to re-run: skips entities that already exist (matched by name).

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length === 6) h += 'FF';
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const a = parseInt(h.substring(6, 8), 16) / 255;
  return { r, g, b, a };
}

function rgbColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  return { r, g, b };
}

async function getOrCreateCollection(name, modeNames) {
  const all = await figma.variables.getLocalVariableCollectionsAsync();
  const existing = all.find(c => c.name === name);
  if (existing) {
    // Ensure all requested modes exist (rename first mode if needed, add any missing)
    if (modeNames && modeNames.length > 0) {
      const existingNames = existing.modes.map(m => m.name);
      // Rename first mode if it's still "Mode 1" or doesn't match expected first
      if (existing.modes.length === 1 && !existingNames.includes(modeNames[0])) {
        existing.renameMode(existing.modes[0].modeId, modeNames[0]);
      }
      for (const mn of modeNames) {
        if (!existing.modes.find(m => m.name === mn)) {
          try { existing.addMode(mn); } catch (e) { console.warn(`addMode(${mn}):`, e.message); }
        }
      }
    }
    return existing;
  }
  const col = figma.variables.createVariableCollection(name);
  // Rename default mode to first requested name
  if (modeNames && modeNames.length > 0) {
    col.renameMode(col.modes[0].modeId, modeNames[0]);
    for (let i = 1; i < modeNames.length; i++) {
      col.addMode(modeNames[i]);
    }
  }
  return col;
}

function getModeId(collection, modeName) {
  const m = collection.modes.find(x => x.name === modeName);
  return m ? m.modeId : collection.modes[0].modeId;
}

async function getOrCreateVariable(name, collection, type) {
  const all = await figma.variables.getLocalVariablesAsync();
  const existing = all.find(v => v.name === name && v.variableCollectionId === collection.id);
  if (existing) return existing;
  return figma.variables.createVariable(name, collection, type);
}

function setColorByMode(varObj, collection, modeName, hex) {
  varObj.setValueForMode(getModeId(collection, modeName), rgbColor(hex));
}

function aliasByMode(varObj, collection, modeName, sourceVar) {
  varObj.setValueForMode(
    getModeId(collection, modeName),
    figma.variables.createVariableAlias(sourceVar)
  );
}

function setNumberSingleMode(varObj, collection, value) {
  varObj.setValueForMode(collection.modes[0].modeId, value);
}

function setStringSingleMode(varObj, collection, value) {
  varObj.setValueForMode(collection.modes[0].modeId, value);
}

// ------------------------------------------------------------------
// PAGES
// ------------------------------------------------------------------

const PAGE_NAMES = [
  '🏠 Cover',
  '📐 Foundations / Tokens',
  '🔤 Typography',
  '🎨 Colors',
  '📏 Spacing & Layout',
  '✨ Effects',
  '🎯 Icons',
  '🧱 Atoms',
  '🧬 Molecules',
  '🏛️ Organisms',
  '📄 Patterns',
  '📝 Documentation',
];

async function createPages() {
  // Ensure first page is renamed to Cover
  await figma.loadAllPagesAsync();
  const existingNames = figma.root.children.map(p => p.name);

  for (let i = 0; i < PAGE_NAMES.length; i++) {
    const name = PAGE_NAMES[i];
    if (existingNames.includes(name)) continue;
    if (i === 0 && figma.root.children.length === 1 && figma.root.children[0].name === 'Page 1') {
      figma.root.children[0].name = name;
    } else {
      figma.createPage().name = name;
    }
  }
}

// ------------------------------------------------------------------
// COVER PAGE
// ------------------------------------------------------------------

async function buildCover(typography) {
  const cover = figma.root.children.find(p => p.name.includes('Cover'));
  if (!cover) return;
  await figma.setCurrentPageAsync(cover);

  if (cover.children.find(n => n.name === 'Cover')) return;

  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  const sansVar = typography ? typography.sans : null;
  const bindSans = (node) => {
    if (!sansVar) return;
    try { node.setBoundVariable('fontFamily', sansVar); } catch (e) { /* ignore */ }
  };

  const frame = figma.createFrame();
  frame.name = 'Cover';
  frame.resize(1440, 900);
  frame.fills = [{ type: 'SOLID', color: rgbColor('#0A0D14') }];
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisAlignItems = 'CENTER';
  frame.counterAxisAlignItems = 'CENTER';
  frame.itemSpacing = 16;
  frame.paddingLeft = frame.paddingRight = 80;
  frame.paddingTop = frame.paddingBottom = 80;

  const title = figma.createText();
  title.fontName = { family: 'Inter', style: 'Bold' };
  title.fontSize = 80;
  title.characters = 'OM Design System';
  title.fills = [{ type: 'SOLID', color: rgbColor('#FFFFFF') }];
  bindSans(title);

  const subtitle = figma.createText();
  subtitle.fontName = { family: 'Inter', style: 'Regular' };
  subtitle.fontSize = 24;
  subtitle.characters = 'v0.1.0 — Foundations';
  subtitle.fills = [{ type: 'SOLID', color: rgbColor('#9AA4B5') }];
  bindSans(subtitle);

  const date = figma.createText();
  date.fontName = { family: 'Inter', style: 'Regular' };
  date.fontSize = 18;
  date.characters = 'April 2026';
  date.fills = [{ type: 'SOLID', color: rgbColor('#6B7689') }];
  bindSans(date);

  frame.appendChild(title);
  frame.appendChild(subtitle);
  frame.appendChild(date);
}

// ------------------------------------------------------------------
// VARIABLE COLLECTIONS + SEED TOKENS
// ------------------------------------------------------------------

const NEUTRALS = {
  '0':    '#FFFFFF',
  '50':   '#F8F9FB',
  '100':  '#EFF1F5',
  '200':  '#E1E5EC',
  '300':  '#C9D0DA',
  '400':  '#9AA4B5',
  '500':  '#6B7689',
  '600':  '#4B5466',
  '700':  '#353C4B',
  '800':  '#1F2530',
  '900':  '#131720',
  '950':  '#0A0D14',
  '1000': '#000000',
};

// Orange scale (primary brand for ZCatalyst look)
const ORANGE = {
  '50':  '#FFF4ED',
  '100': '#FFE2CC',
  '200': '#FFC299',
  '300': '#FF9D5C',
  '400': '#FE7E2A',
  '500': '#FD6303',
  '600': '#D44E00',
  '700': '#A93D00',
  '800': '#7E2D00',
  '900': '#451900',
};

// Blue scale (alternate brand)
const BLUE = {
  '50':  '#EBF1FF',
  '100': '#D1DEFF',
  '200': '#A3BEFF',
  '300': '#6B95FF',
  '400': '#4778F5',
  '500': '#2A65F0',
  '600': '#1E51D6',
  '700': '#173FAB',
  '800': '#0F2D7C',
  '900': '#0A1F57',
};

// Red scale — danger / destructive
const RED = {
  '50':  '#FEF2F2',
  '100': '#FEE2E2',
  '200': '#FECACA',
  '300': '#FCA5A5',
  '400': '#F87171',
  '500': '#EF4444',
  '600': '#DC2626',
  '700': '#B91C1C',
  '800': '#7F1D1D',
  '900': '#450A0A',
};

// Green scale — success / positive
const GREEN = {
  '50':  '#F0FDF4',
  '100': '#DCFCE7',
  '200': '#BBF7D0',
  '300': '#86EFAC',
  '400': '#4ADE80',
  '500': '#22C55E',
  '600': '#16A34A',
  '700': '#15803D',
  '800': '#166534',
  '900': '#14532D',
};

// Amber scale — warning
const AMBER = {
  '50':  '#FFFBEB',
  '100': '#FEF3C7',
  '200': '#FDE68A',
  '300': '#FCD34D',
  '400': '#FBBF24',
  '500': '#F59E0B',
  '600': '#D97706',
  '700': '#B45309',
  '800': '#78350F',
  '900': '#451A03',
};

// Sky scale — info / informational
const SKY = {
  '50':  '#F0F9FF',
  '100': '#E0F2FE',
  '200': '#BAE6FD',
  '300': '#7DD3FC',
  '400': '#38BDF8',
  '500': '#0EA5E9',
  '600': '#0284C7',
  '700': '#0369A1',
  '800': '#075985',
  '900': '#0C4A6E',
};

const SPACING = {
  '0':   0,
  '2':   2,
  '4':   4,
  '6':   6,
  '8':   8,
  '10':  10,
  '12':  12,
  '14':  14,
  '16':  16,
  '20':  20,
  '24':  24,
  '28':  28,
  '32':  32,
  '40':  40,
  '48':  48,
  '56':  56,
  '64':  64,
  '80':  80,
  '96':  96,
  '128': 128,
  '160': 160,
};

const RADIUS = {
  none: 0,
  xs:   2,
  sm:   4,
  md:   6,
  lg:   8,
  xl:   12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

async function buildPrimitives() {
  const col = await getOrCreateCollection('_Primitives', ['Default']);

  function hidePrimitive(v) {
    try { v.hiddenFromPublishing = true; } catch (e) { /* ignore */ }
    try { v.scopes = []; } catch (e) { /* ignore */ }
  }

  // Neutral scale
  const neutralVars = {};
  for (const k of Object.keys(NEUTRALS)) {
    const v = await getOrCreateVariable('neutral/' + k, col, 'COLOR');
    setColorByMode(v, col, 'Default', NEUTRALS[k]);
    hidePrimitive(v);
    neutralVars[k] = v;
  }

  // Orange scale
  const orangeVars = {};
  for (const k of Object.keys(ORANGE)) {
    const v = await getOrCreateVariable('orange/' + k, col, 'COLOR');
    setColorByMode(v, col, 'Default', ORANGE[k]);
    hidePrimitive(v);
    orangeVars[k] = v;
  }

  // Blue scale
  const blueVars = {};
  for (const k of Object.keys(BLUE)) {
    const v = await getOrCreateVariable('blue/' + k, col, 'COLOR');
    setColorByMode(v, col, 'Default', BLUE[k]);
    hidePrimitive(v);
    blueVars[k] = v;
  }

  // Red scale (danger)
  const redVars = {};
  for (const k of Object.keys(RED)) {
    const v = await getOrCreateVariable('red/' + k, col, 'COLOR');
    setColorByMode(v, col, 'Default', RED[k]);
    hidePrimitive(v);
    redVars[k] = v;
  }

  // Green scale (success)
  const greenVars = {};
  for (const k of Object.keys(GREEN)) {
    const v = await getOrCreateVariable('green/' + k, col, 'COLOR');
    setColorByMode(v, col, 'Default', GREEN[k]);
    hidePrimitive(v);
    greenVars[k] = v;
  }

  // Amber scale (warning)
  const amberVars = {};
  for (const k of Object.keys(AMBER)) {
    const v = await getOrCreateVariable('amber/' + k, col, 'COLOR');
    setColorByMode(v, col, 'Default', AMBER[k]);
    hidePrimitive(v);
    amberVars[k] = v;
  }

  // Sky scale (info)
  const skyVars = {};
  for (const k of Object.keys(SKY)) {
    const v = await getOrCreateVariable('sky/' + k, col, 'COLOR');
    setColorByMode(v, col, 'Default', SKY[k]);
    hidePrimitive(v);
    skyVars[k] = v;
  }

  // Transparent — true rgba(0,0,0,0). Allowed in fill scopes so it can be used directly.
  const t = await getOrCreateVariable('transparent', col, 'COLOR');
  t.setValueForMode(getModeId(col, 'Default'), { r: 0, g: 0, b: 0, a: 0 });
  try { t.hiddenFromPublishing = true; } catch (e) { /* ignore */ }
  try { t.scopes = ['FRAME_FILL', 'SHAPE_FILL']; } catch (e) { /* ignore */ }

  return { col, neutralVars, orangeVars, blueVars, redVars, greenVars, amberVars, skyVars };
}

async function buildAppearance(primitives) {
  const col = await getOrCreateCollection('_Appearance', ['Light', 'Dark']);
  const { neutralVars, redVars, greenVars, amberVars, skyVars, blueVars } = primitives;

  async function alias(name, lightSrc, darkSrc, scopes) {
    const v = await getOrCreateVariable(name, col, 'COLOR');
    aliasByMode(v, col, 'Light', lightSrc);
    aliasByMode(v, col, 'Dark', darkSrc);
    if (scopes) {
      try { v.scopes = scopes; } catch (e) { /* ignore */ }
    }
    return v;
  }

  // Scope groups
  const SURFACE_SCOPES = ['FRAME_FILL', 'SHAPE_FILL'];          // Generic backgrounds
  const TEXT_SCOPES    = ['TEXT_FILL'];                          // Text fills only
  const BORDER_SCOPES  = ['STROKE_COLOR'];                       // Strokes only
  const ICON_SCOPES    = ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR']; // Vectors (icons) — fills OR strokes

  const tokens = {
    'surface/base':    await alias('surface/base',    neutralVars['0'],   neutralVars['950'], SURFACE_SCOPES),
    'surface/card':    await alias('surface/card',    neutralVars['0'],   neutralVars['900'], SURFACE_SCOPES),
    'text/primary':    await alias('text/primary',    neutralVars['900'], neutralVars['50'],  TEXT_SCOPES),
    'text/secondary':  await alias('text/secondary',  neutralVars['600'], neutralVars['400'], TEXT_SCOPES),
    'border/default':  await alias('border/default',  neutralVars['200'], neutralVars['800'], BORDER_SCOPES),
    // Stronger border for inputs / form controls (checkbox, radio, text-box). More visible than card borders.
    'border/strong':   await alias('border/strong',   neutralVars['400'], neutralVars['500'], BORDER_SCOPES),
    // Icon tokens
    'icon/default':    await alias('icon/default',    neutralVars['700'], neutralVars['300'], ICON_SCOPES),
    'icon/subtle':     await alias('icon/subtle',     neutralVars['500'], neutralVars['500'], ICON_SCOPES),
    'icon/strong':     await alias('icon/strong',     neutralVars['900'], neutralVars['0'],   ICON_SCOPES),
    'icon/disabled':   await alias('icon/disabled',   neutralVars['300'], neutralVars['700'], ICON_SCOPES),
    'icon/inverse':    await alias('icon/inverse',    neutralVars['0'],   neutralVars['900'], ICON_SCOPES),
    // Inverse / Tooltip surface — dark in light mode, ELEVATED dark in dark mode
    // (so it doesn't blend with the page background which is N950/N900).
    'surface/inverse':       await alias('surface/inverse',       neutralVars['900'], neutralVars['700'], SURFACE_SCOPES),
    'border/inverse':        await alias('border/inverse',        neutralVars['800'], neutralVars['600'], BORDER_SCOPES),
    'text/inverse-primary':  await alias('text/inverse-primary',  neutralVars['0'],   neutralVars['0'],   TEXT_SCOPES),
    'text/inverse-secondary':await alias('text/inverse-secondary',neutralVars['300'], neutralVars['300'], TEXT_SCOPES),
    'icon/inverse-strong':   await alias('icon/inverse-strong',   neutralVars['0'],   neutralVars['0'],   ICON_SCOPES),
    'text/inverse-link':     await alias('text/inverse-link',     blueVars['400'],    blueVars['400'],    TEXT_SCOPES),
    // Disabled state tokens (neutral, used by all components)
    // Disabled state tokens (neutral, used by all components)
    'state/disabled-bg':   await alias('state/disabled-bg',   neutralVars['100'], neutralVars['800'], SURFACE_SCOPES),
    // Disabled text/icon: light = mid grey; dark = lighter "whitish" grey for readability on dark surfaces
    'state/disabled-text': await alias('state/disabled-text', neutralVars['400'], neutralVars['500'], TEXT_SCOPES),
    'state/disabled-border': await alias('state/disabled-border', neutralVars['200'], neutralVars['700'], BORDER_SCOPES),
    // Neutral button active bg — mid grey (lighter than text/secondary so it doesn't read as black)
    'state/neutral-active': await alias('state/neutral-active', neutralVars['400'], neutralVars['600'], SURFACE_SCOPES),
    // Divider on brand-colored buttons (split button center line). Whitish on light, greyish on dark.
    'state/divider-on-brand': await alias('state/divider-on-brand', neutralVars['0'], neutralVars['500'], BORDER_SCOPES),
    // ---- Status: Danger (red) — full button-state set ----
    'status/danger':         await alias('status/danger',         redVars['500'], redVars['400'], SURFACE_SCOPES),
    'status/danger-hover':   await alias('status/danger-hover',   redVars['600'], redVars['300'], SURFACE_SCOPES),
    'status/danger-active':  await alias('status/danger-active',  redVars['700'], redVars['500'], SURFACE_SCOPES),
    'status/danger-subtle':  await alias('status/danger-subtle',  redVars['50'],  redVars['900'], SURFACE_SCOPES),
    'status/danger-muted':   await alias('status/danger-muted',   redVars['200'], redVars['800'], SURFACE_SCOPES),
    'status/danger-text':    await alias('status/danger-text',    redVars['600'], redVars['400'], TEXT_SCOPES),
    'status/danger-border':  await alias('status/danger-border',  redVars['500'], redVars['400'], BORDER_SCOPES),
    'status/on-danger':      await alias('status/on-danger',      neutralVars['0'], neutralVars['0'], TEXT_SCOPES),
    // ---- Status: Success (green) ----
    'status/success':        await alias('status/success',        greenVars['600'], greenVars['400'], SURFACE_SCOPES),
    'status/success-hover':  await alias('status/success-hover',  greenVars['700'], greenVars['300'], SURFACE_SCOPES),
    'status/success-active': await alias('status/success-active', greenVars['800'], greenVars['500'], SURFACE_SCOPES),
    'status/success-subtle': await alias('status/success-subtle', greenVars['50'],  greenVars['900'], SURFACE_SCOPES),
    'status/success-muted':  await alias('status/success-muted',  greenVars['300'], greenVars['800'], SURFACE_SCOPES),
    'status/success-text':   await alias('status/success-text',   greenVars['700'], greenVars['400'], TEXT_SCOPES),
    'status/success-border': await alias('status/success-border', greenVars['600'], greenVars['400'], BORDER_SCOPES),
    'status/on-success':     await alias('status/on-success',     neutralVars['0'], neutralVars['0'], TEXT_SCOPES),
    // ---- Status: Warning (amber) ----
    'status/warning':        await alias('status/warning',        amberVars['500'], amberVars['400'], SURFACE_SCOPES),
    'status/warning-hover':  await alias('status/warning-hover',  amberVars['600'], amberVars['300'], SURFACE_SCOPES),
    'status/warning-active': await alias('status/warning-active', amberVars['700'], amberVars['500'], SURFACE_SCOPES),
    'status/warning-subtle': await alias('status/warning-subtle', amberVars['50'],  amberVars['900'], SURFACE_SCOPES),
    'status/warning-muted':  await alias('status/warning-muted',  amberVars['200'], amberVars['800'], SURFACE_SCOPES),
    'status/warning-text':   await alias('status/warning-text',   amberVars['700'], amberVars['400'], TEXT_SCOPES),
    'status/warning-border': await alias('status/warning-border', amberVars['500'], amberVars['400'], BORDER_SCOPES),
    'status/on-warning':     await alias('status/on-warning',     neutralVars['900'], neutralVars['900'], TEXT_SCOPES),
    // ---- Status: Info (sky) ----
    'status/info':           await alias('status/info',           skyVars['500'],  skyVars['400'], SURFACE_SCOPES),
    'status/info-hover':     await alias('status/info-hover',     skyVars['600'],  skyVars['300'], SURFACE_SCOPES),
    'status/info-active':    await alias('status/info-active',    skyVars['700'],  skyVars['500'], SURFACE_SCOPES),
    'status/info-subtle':    await alias('status/info-subtle',    skyVars['50'],   skyVars['900'], SURFACE_SCOPES),
    'status/info-muted':     await alias('status/info-muted',     skyVars['200'],  skyVars['800'], SURFACE_SCOPES),
    'status/info-text':      await alias('status/info-text',      skyVars['600'],  skyVars['400'], TEXT_SCOPES),
    'status/info-border':    await alias('status/info-border',    skyVars['500'],  skyVars['400'], BORDER_SCOPES),
    'status/on-info':        await alias('status/on-info',        neutralVars['0'], neutralVars['0'], TEXT_SCOPES),
  };

  return { col, tokens };
}

async function buildTheme(primitives) {
  // 4 modes: Brand × Appearance. Pro plan cap = 4. Lets brand colors adapt
  // to dark mode (lighter shades) for proper contrast.
  const col = await getOrCreateCollection('_Theme', ['Orange-Light', 'Orange-Dark', 'Blue-Light', 'Blue-Dark']);
  const { orangeVars, blueVars, neutralVars } = primitives;

  async function alias4(name, sources, scopes) {
    // sources: { ol, od, bl, bd } — Orange-Light, Orange-Dark, Blue-Light, Blue-Dark
    const v = await getOrCreateVariable(name, col, 'COLOR');
    aliasByMode(v, col, 'Orange-Light', sources.ol);
    aliasByMode(v, col, 'Orange-Dark',  sources.od);
    aliasByMode(v, col, 'Blue-Light',   sources.bl);
    aliasByMode(v, col, 'Blue-Dark',    sources.bd);
    if (scopes) {
      try { v.scopes = scopes; } catch (e) { /* ignore */ }
    }
    return v;
  }

  const FILL_SCOPES   = ['FRAME_FILL', 'SHAPE_FILL'];
  const TEXT_SCOPES   = ['TEXT_FILL'];
  const STROKE_SCOPES = ['STROKE_COLOR'];
  const ANY_PAINT     = ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR'];

  const O = orangeVars, B = blueVars;

  const tokens = {
    // Default brand bg: dark mode uses one shade lighter for vibrancy on dark surfaces
    'brand/primary':         await alias4('brand/primary',
      { ol: O['500'], od: O['400'], bl: B['500'], bd: B['400'] }, FILL_SCOPES),
    // Hover: light=darker, dark=lighter (inverse direction)
    'brand/primary-hover':   await alias4('brand/primary-hover',
      { ol: O['600'], od: O['300'], bl: B['600'], bd: B['300'] }, FILL_SCOPES),
    // Active: light=darkest, dark=between hover and primary
    'brand/primary-active':  await alias4('brand/primary-active',
      { ol: O['700'], od: O['500'], bl: B['700'], bd: B['500'] }, FILL_SCOPES),
    // Subtle bg (faded brand): light=very pale, dark=very dark brand for tint on dark surfaces
    'brand/primary-subtle':  await alias4('brand/primary-subtle',
      { ol: O['50'],  od: O['900'], bl: B['50'],  bd: B['900'] }, FILL_SCOPES),
    // Muted bg (slightly stronger faded brand) — light bumped to /200 so disabled
    // buttons read as a real lighter brand tone (e.g. FED0B3 for orange) and not pale.
    'brand/primary-muted':   await alias4('brand/primary-muted',
      { ol: O['200'], od: O['800'], bl: B['200'], bd: B['800'] }, FILL_SCOPES),
    // Disabled TEXT for outlined/ghost colored buttons — very faded brand tint
    // (so disabled Secondary/Ghost orange button reads as a hint of orange, not full color)
    'brand/primary-disabled-text': await alias4('brand/primary-disabled-text',
      { ol: O['200'], od: O['600'], bl: B['200'], bd: B['600'] }, ANY_PAINT),
    // White text on brand bg in both light and dark — brand bg is always saturated
    'brand/on-primary':      await alias4('brand/on-primary',
      { ol: neutralVars['0'], od: neutralVars['0'], bl: neutralVars['0'], bd: neutralVars['0'] }, ANY_PAINT),
    'state/focus-ring':      await alias4('state/focus-ring',
      { ol: O['300'], od: O['400'], bl: B['300'], bd: B['400'] }, STROKE_SCOPES),
  };

  return { col, tokens };
}

async function buildTypographyVars() {
  // 2 modes: Inter (default) | Puvi — flipping the mode swaps the entire system's font
  const col = await getOrCreateCollection('Typography', ['Inter', 'Puvi']);
  const sans = await getOrCreateVariable('font/sans', col, 'STRING');
  const mono = await getOrCreateVariable('font/mono', col, 'STRING');
  sans.setValueForMode(getModeId(col, 'Inter'), 'Inter');
  sans.setValueForMode(getModeId(col, 'Puvi'),  'Zoho Puvi');
  mono.setValueForMode(getModeId(col, 'Inter'), 'Roboto Mono');
  mono.setValueForMode(getModeId(col, 'Puvi'),  'Roboto Mono');
  // Restrict to font family picker only
  try { sans.scopes = ['FONT_FAMILY']; } catch (e) { /* ignore */ }
  try { mono.scopes = ['FONT_FAMILY']; } catch (e) { /* ignore */ }
  return { col, sans, mono };
}

async function buildSpacing() {
  const col = await getOrCreateCollection('Spacing', ['Default']);
  for (const k of Object.keys(SPACING)) {
    const v = await getOrCreateVariable('space/' + k, col, 'FLOAT');
    setNumberSingleMode(v, col, SPACING[k]);
  }
  return col;
}

async function buildRadius() {
  const col = await getOrCreateCollection('Radius', ['Default']);
  for (const k of Object.keys(RADIUS)) {
    const v = await getOrCreateVariable('radius/' + k, col, 'FLOAT');
    setNumberSingleMode(v, col, RADIUS[k]);
  }
  return col;
}

async function buildShadowsShell() {
  // Empty Shadows collection with Light/Dark modes
  return await getOrCreateCollection('Shadows', ['Light', 'Dark']);
}

// ------------------------------------------------------------------
// TEXT STYLES
// ------------------------------------------------------------------

// Final clean catalog — all sizes even, min 12px (no 10/11/13).
// `bind` indicates which Typography variable to bind fontFamily to:
//   'sans' → font/sans (swaps Inter ↔ Puvi via Typography mode)
//   'mono' → font/mono (always Roboto Mono)
//   null   → no binding (literal font, e.g. Brand styles always use Puvi)
const TEXT_STYLES = [
  // Display (hero / marketing) — Inter Bold
  { name: 'Display/2XL',    family: 'Inter',       style: 'Bold',      size: 60, lh: 72, bind: 'sans' },
  { name: 'Display/XL',     family: 'Inter',       style: 'Bold',      size: 48, lh: 56, bind: 'sans' },
  { name: 'Display/L',      family: 'Inter',       style: 'Bold',      size: 40, lh: 48, bind: 'sans' },
  // Headings — Inter Semi Bold
  { name: 'Heading/H1',     family: 'Inter',       style: 'Semi Bold', size: 32, lh: 40, bind: 'sans' },
  { name: 'Heading/H2',     family: 'Inter',       style: 'Semi Bold', size: 28, lh: 36, bind: 'sans' },
  { name: 'Heading/H3',     family: 'Inter',       style: 'Semi Bold', size: 24, lh: 32, bind: 'sans' },
  { name: 'Heading/H4',     family: 'Inter',       style: 'Semi Bold', size: 20, lh: 28, bind: 'sans' },
  { name: 'Heading/H5',     family: 'Inter',       style: 'Semi Bold', size: 18, lh: 28, bind: 'sans' },
  // Body — Inter Regular
  { name: 'Body/Large',     family: 'Inter',       style: 'Regular',   size: 16, lh: 24, bind: 'sans' },
  { name: 'Body/Default',   family: 'Inter',       style: 'Regular',   size: 14, lh: 20, bind: 'sans' },
  { name: 'Body/Small',     family: 'Inter',       style: 'Regular',   size: 12, lh: 16, bind: 'sans' },
  // Label — Inter Medium (smallest UI text; floor 12px)
  { name: 'Label/Default',  family: 'Inter',       style: 'Medium',    size: 12, lh: 16, bind: 'sans' },
  // Button — Inter Medium (heavier than body for click affordance)
  { name: 'Button/Small',   family: 'Inter',       style: 'Medium',    size: 12, lh: 16, bind: 'sans' },
  { name: 'Button/Default', family: 'Inter',       style: 'Medium',    size: 14, lh: 20, bind: 'sans' },
  { name: 'Button/Large',   family: 'Inter',       style: 'Medium',    size: 16, lh: 24, bind: 'sans' },
  // Code — Roboto Mono
  { name: 'Code/Default',   family: 'Roboto Mono', style: 'Regular',   size: 14, lh: 20, bind: 'mono' },
  { name: 'Code/Small',     family: 'Roboto Mono', style: 'Regular',   size: 12, lh: 16, bind: 'mono' },
  // Brand — Zoho Puvi (always Puvi regardless of Typography mode)
  { name: 'Brand/Display',  family: 'Zoho Puvi',   style: 'Bold',      size: 48, lh: 56, bind: null },
  { name: 'Brand/Heading',  family: 'Zoho Puvi',   style: 'Semi Bold', size: 32, lh: 40, bind: null },
];

// Old style names that should be removed when resetting (deprecated odd sizes)
const DEPRECATED_TEXT_STYLES = ['Label/Small', 'Caption'];

async function buildTextStyles(typography) {
  const existingStyles = await figma.getLocalTextStylesAsync();
  const sansVar = typography ? typography.sans : null;
  const monoVar = typography ? typography.mono : null;
  const styleMap = {};

  for (const t of TEXT_STYLES) {
    let style = existingStyles.find(s => s.name === t.name);
    let fam = t.family;
    let sty = t.style;

    if (!style) {
      try {
        await figma.loadFontAsync({ family: fam, style: sty });
      } catch (e) {
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
        fam = 'Inter';
        sty = 'Regular';
      }
      style = figma.createTextStyle();
      style.name = t.name;
      style.fontName = { family: fam, style: sty };
      style.fontSize = t.size;
      style.lineHeight = { value: t.lh, unit: 'PIXELS' };
    }

    styleMap[t.name] = style;

    // Bind fontFamily to the right Typography variable (idempotent — safe to re-run)
    try {
      if (t.bind === 'sans' && sansVar) {
        style.setBoundVariable('fontFamily', sansVar);
      } else if (t.bind === 'mono' && monoVar) {
        style.setBoundVariable('fontFamily', monoVar);
      }
    } catch (e) {
      console.warn(`Could not bind fontFamily on ${t.name}:`, e.message);
    }
  }

  return styleMap;
}

// ------------------------------------------------------------------
// APPLY TEXT STYLES TO COVER (after styles exist)
// ------------------------------------------------------------------

async function applyCoverTextStyles(styleMap) {
  const cover = figma.root.children.find(p => p.name.includes('Cover'));
  if (!cover) return;
  await figma.setCurrentPageAsync(cover);

  const frame = cover.children.find(n => n.name === 'Cover');
  if (!frame) return;

  const mapping = {
    'OM Design System':  styleMap['Display/XL'],
    'v0.1.0 — Foundations': styleMap['Heading/H4'],
    'April 2026':        styleMap['Body/Default'],
  };

  for (const child of frame.children) {
    if (child.type !== 'TEXT') continue;
    const style = mapping[child.characters];
    if (style) {
      try { await child.setTextStyleIdAsync(style.id); } catch (e) { console.warn(e); }
    }
  }
}

// ------------------------------------------------------------------
// TEST FRAME (Light + Dark side by side on Foundations page)
// ------------------------------------------------------------------

async function buildTestFrame(appearance, typography, styleMap) {
  const page = figma.root.children.find(p => p.name.includes('Foundations'));
  if (!page) return;
  await figma.setCurrentPageAsync(page);

  if (page.children.find(n => n.name === 'Theme Test')) return;

  // Make sure all fonts used by referenced styles are loaded so we can set characters.
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });

  async function makeStyledText(styleName, text, colorVar) {
    const node = figma.createText();
    const style = styleMap[styleName];
    if (style) {
      // Load the style's font first so we can edit characters.
      try { await figma.loadFontAsync(style.fontName); } catch (e) { /* ignore */ }
    }
    node.characters = text;
    if (style) {
      await node.setTextStyleIdAsync(style.id);
    }
    node.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
      'color',
      colorVar
    )];
    return node;
  }

  const wrapper = figma.createFrame();
  wrapper.name = 'Theme Test';
  wrapper.layoutMode = 'HORIZONTAL';
  wrapper.itemSpacing = 32;
  wrapper.paddingLeft = wrapper.paddingRight = 32;
  wrapper.paddingTop = wrapper.paddingBottom = 32;
  wrapper.fills = [];
  wrapper.primaryAxisSizingMode = 'AUTO';
  wrapper.counterAxisSizingMode = 'AUTO';

  const surfaceBase = appearance.tokens['surface/base'];
  const surfaceCard = appearance.tokens['surface/card'];
  const textPrimary = appearance.tokens['text/primary'];
  const textSecondary = appearance.tokens['text/secondary'];
  const borderDefault = appearance.tokens['border/default'];

  async function makeTestFrame(modeName) {
    const f = figma.createFrame();
    f.name = `Test — ${modeName}`;
    f.resize(600, 400);
    f.layoutMode = 'VERTICAL';
    f.primaryAxisSizingMode = 'FIXED';
    f.counterAxisSizingMode = 'FIXED';
    f.itemSpacing = 16;
    f.paddingLeft = f.paddingRight = 32;
    f.paddingTop = f.paddingBottom = 32;
    f.setExplicitVariableModeForCollection(appearance.col, getModeId(appearance.col, modeName));
    f.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 1, g: 1, b: 1 } },
      'color',
      surfaceBase
    )];

    const h1 = await makeStyledText('Heading/H1', `${modeName} Mode`, textPrimary);
    f.appendChild(h1);

    const body = await makeStyledText(
      'Body/Default',
      'Body text uses text/primary which switches between modes automatically via _Appearance.',
      textPrimary
    );
    body.layoutAlign = 'STRETCH';
    body.textAutoResize = 'HEIGHT';
    body.resize(536, 20);
    f.appendChild(body);

    const sec = await makeStyledText(
      'Body/Default',
      'Secondary text uses text/secondary.',
      textSecondary
    );
    f.appendChild(sec);

    // Card on surface
    const card = figma.createFrame();
    card.name = 'Card';
    card.layoutMode = 'VERTICAL';
    card.itemSpacing = 8;
    card.paddingLeft = card.paddingRight = 20;
    card.paddingTop = card.paddingBottom = 20;
    card.cornerRadius = 8;
    card.layoutAlign = 'STRETCH';
    card.primaryAxisSizingMode = 'AUTO';
    card.counterAxisSizingMode = 'FIXED';
    card.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 1, g: 1, b: 1 } },
      'color',
      surfaceCard
    )];
    card.strokes = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } },
      'color',
      borderDefault
    )];
    card.strokeWeight = 1;

    const cardLabel = await makeStyledText('Label/Default', 'CARD ON SURFACE', textSecondary);
    card.appendChild(cardLabel);

    const cardBody = await makeStyledText(
      'Body/Default',
      'surface/card + border/default + text/primary all bound to variables.',
      textPrimary
    );
    card.appendChild(cardBody);

    f.appendChild(card);
    return f;
  }

  wrapper.appendChild(await makeTestFrame('Light'));
  wrapper.appendChild(await makeTestFrame('Dark'));
  page.appendChild(wrapper);
}

// ------------------------------------------------------------------
// MAIN
// ------------------------------------------------------------------

async function bootstrap() {
  try {
    await createPages();

    const primitives = await buildPrimitives();
    const appearance = await buildAppearance(primitives);
    const theme = await buildTheme(primitives);
    const typography = await buildTypographyVars();
    await buildSpacing();
    await buildRadius();
    await buildShadowsShell();

    await buildCover(typography);
    const styleMap = await buildTextStyles(typography);
    await applyCoverTextStyles(styleMap);
    await buildTestFrame(appearance, typography, styleMap);

    figma.notify('✅ OM DS bootstrapped: pages, collections, tokens, text styles (font-bound), test frame.');
  } catch (e) {
    figma.notify('❌ Bootstrap failed: ' + e.message, { error: true });
    console.error(e);
  }
}

async function reset() {
  const names = ['_Primitives', '_Appearance', '_Theme', 'Typography', 'Spacing', 'Radius', 'Shadows'];
  let removed = 0;
  const all = await figma.variables.getLocalVariableCollectionsAsync();
  for (const c of all) {
    if (names.includes(c.name)) {
      c.remove();
      removed++;
    }
  }
  figma.notify(`🗑 Removed ${removed} collection(s). Pages, styles, frames left intact.`);
}

async function resetTextStyles() {
  // Removes ALL OM text styles (current + deprecated) so a re-bootstrap creates a clean set.
  const allStyles = await figma.getLocalTextStylesAsync();
  const omNames = new Set([...TEXT_STYLES.map(t => t.name), ...DEPRECATED_TEXT_STYLES]);
  let removed = 0;
  for (const s of allStyles) {
    if (omNames.has(s.name)) {
      s.remove();
      removed++;
    }
  }
  figma.notify(`🗑 Removed ${removed} text style(s). Run Bootstrap to recreate.`);
}

// ------------------------------------------------------------------
// BUILD BUTTON
// Creates per-component Button color tokens (Component/Button collection)
// and a full Button component set:
//   Variant: Primary | Secondary | Ghost | Danger
//   Size:    Small | Default | Large
//   State:   Default | Hover | Active | Disabled
// = 48 variants. Sized with auto-layout. Bound to per-component vars.
// ------------------------------------------------------------------

const BUTTON_VARIANTS = ['Primary', 'Secondary', 'Ghost', 'Neutral', 'Danger', 'Success'];
const BUTTON_SIZES    = ['XS', 'Small', 'Medium', 'Default', 'Large'];
const BUTTON_STATES   = ['Default', 'Hover', 'Pressed', 'Disabled'];
// Split type has per-side hover/active because it has two interactive zones.
const SPLIT_STATES    = ['Default', 'Hover', 'Split Hover', 'Pressed', 'Split Pressed', 'Disabled'];
function statesFor(type) { return (type === 'Split' || type === 'Split Icon') ? SPLIT_STATES : BUTTON_STATES; }
const BUTTON_TYPES    = ['Default', 'Split', 'Split Icon', 'Icon', 'Navigation']; // unified Button types

// Heights: 24 / 28 / 32 / 36 / 40. Width = hug content (auto). Default = 36.
const BUTTON_SIZE_SPECS = {
  XS:      { h: 24, padX: 6,  padY: 4,  gap: 4,  fontStyle: 'Button/Small',   radius: 4 },
  Small:   { h: 28, padX: 8,  padY: 6,  gap: 6,  fontStyle: 'Button/Small',   radius: 6 },
  Medium:  { h: 32, padX: 10, padY: 8,  gap: 8,  fontStyle: 'Button/Default', radius: 6 },
  Default: { h: 36, padX: 12, padY: 10, gap: 8,  fontStyle: 'Button/Default', radius: 8 },
  Large:   { h: 40, padX: 14, padY: 12, gap: 10, fontStyle: 'Button/Large',   radius: 8 },
};

// ----------------------------------------------------------------------------
// decorateComponentSet — Blade/MUI-style inline labels + dashed separators
// around a manually-positioned 2D component set.
//
// opts:
//   page             — Figma PageNode (for appendChild)
//   compSet          — ComponentSetNode already resized + positioned
//   colGroups        — [{ name, x, width, sizes: [{ name, x, width }] }]
//                      x is RELATIVE to compSet (not page); width = total group width
//   rowGroups        — [{ name, y, states: [{ name, y, height }] }]
//                      y is RELATIVE to compSet
//   padTop, padLeft  — header padding (where labels go)
//   labelStyle       — text style for size/state labels (Label/Default)
//   sectionStyle     — text style for group headers (Heading/H4)
//   labelPrimaryVar  — variable for group header text color (text/primary)
//   labelSecondaryVar— variable for sub-label text color (text/secondary)
// ----------------------------------------------------------------------------
async function decorateComponentSet(opts) {
  const {
    page, compSet, colGroups, rowGroups,
    padTop, padLeft,
    labelStyle, sectionStyle,
    labelPrimaryVar, labelSecondaryVar,
    componentName,           // e.g. 'Button', 'Checkbox' — used as wrapper title
    surfaceVar,              // bg color of the wrapper frame (variable)
    borderVar,               // optional subtle border color (variable)
  } = opts;

  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  function paintVar(varRef) {
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef
    );
  }

  async function makeText(text, styleObj, colorVar, align) {
    const t = figma.createText();
    if (styleObj) {
      try { await figma.loadFontAsync(styleObj.fontName); } catch (e) { /* ignore */ }
      await t.setTextStyleIdAsync(styleObj.id);
    }
    t.characters = text;
    if (colorVar) t.fills = [paintVar(colorVar)];
    if (align) t.textAlignHorizontal = align;
    return t;
  }

  function makeHeading(text, colorVar, align, size) {
    const t = figma.createText();
    t.fontName = { family: 'Inter', style: 'Semi Bold' };
    t.characters = text;
    t.fontSize = size || 20;
    if (colorVar) t.fills = [paintVar(colorVar)];
    if (align) t.textAlignHorizontal = align;
    return t;
  }

  // ---- Labels ----
  const labels = [];
  for (const cg of colGroups) {
    const hdr = makeHeading(cg.name, labelPrimaryVar, 'CENTER');
    hdr.x = compSet.x + cg.x + (cg.width / 2) - 40;
    hdr.y = compSet.y + 16;
    labels.push(hdr);
    for (const sz of cg.sizes) {
      const sub = await makeText(sz.name, labelStyle, labelSecondaryVar, 'CENTER');
      sub.x = compSet.x + sz.x + (sz.width / 2) - 24;
      sub.y = compSet.y + 60;
      labels.push(sub);
    }
  }
  for (const rg of rowGroups) {
    const hdr = makeHeading(rg.name, labelPrimaryVar);
    hdr.x = compSet.x + 24;
    hdr.y = compSet.y + rg.y - 40;
    labels.push(hdr);
    for (const st of rg.states) {
      const lbl = await makeText(st.name, labelStyle, labelSecondaryVar);
      lbl.x = compSet.x + 24;
      lbl.y = compSet.y + st.y + (st.height / 2) - 8;
      labels.push(lbl);
    }
  }
  for (const l of labels) page.appendChild(l);

  // ---- Dashed purple separators ----
  const SEP_COLOR = { r: 0.55, g: 0.45, b: 0.95 };
  const SEP_DASH = [4, 4];
  function makeLine(x1, y1, x2, y2) {
    const ln = figma.createLine();
    ln.x = x1; ln.y = y1;
    const dx = x2 - x1, dy = y2 - y1;
    ln.resize(Math.sqrt(dx * dx + dy * dy), 0);
    if (dx === 0) ln.rotation = -90;
    ln.strokes = [{ type: 'SOLID', color: SEP_COLOR, opacity: 1 }];
    ln.strokeWeight = 1;
    ln.dashPattern = SEP_DASH;
    return ln;
  }

  const gridTop = compSet.y + padTop - 8;
  const lastRow = rowGroups[rowGroups.length - 1];
  const lastState = lastRow.states[lastRow.states.length - 1];
  const gridBot = compSet.y + lastState.y + lastState.height + 16;
  const gridLeft = compSet.x + padLeft - 16;
  const gridRight = compSet.x + compSet.width - 32;

  const lines = [];
  for (let i = 0; i < colGroups.length - 1; i++) {
    const cg = colGroups[i];
    const next = colGroups[i + 1];
    const x = compSet.x + (cg.x + cg.width + next.x) / 2;
    lines.push(makeLine(x, gridTop, x, gridBot));
  }
  for (let i = 0; i < rowGroups.length - 1; i++) {
    const rg = rowGroups[i];
    const lastSt = rg.states[rg.states.length - 1];
    const next = rowGroups[i + 1];
    const y = compSet.y + (lastSt.y + lastSt.height + next.y) / 2;
    lines.push(makeLine(gridLeft, y, gridRight, y));
  }
  for (const rg of rowGroups) {
    for (let i = 1; i < rg.states.length; i++) {
      const y = compSet.y + rg.states[i].y;
      lines.push(makeLine(gridLeft + 16, y, gridRight - 16, y));
    }
  }
  lines.push(makeLine(gridLeft, compSet.y + padTop - 12, gridRight, compSet.y + padTop - 12));
  lines.push(makeLine(compSet.x + padLeft - 16, compSet.y + 24, compSet.x + padLeft - 16, gridBot));
  for (const ln of lines) page.appendChild(ln);

  // ---- Wrap everything in a parent frame with title + locked Showcase group ----
  const PAD = 40;
  const HEAD_H = 96;

  // Bounding box of compSet + labels + lines
  let bx = compSet.x, by = compSet.y;
  let bex = compSet.x + compSet.width, bey = compSet.y + compSet.height;
  for (const n of [...labels, ...lines]) {
    if (n.x < bx) bx = n.x;
    if (n.y < by) by = n.y;
    if (n.x + n.width > bex) bex = n.x + n.width;
    if (n.y + n.height > bey) bey = n.y + n.height;
  }

  const wrapper = figma.createFrame();
  wrapper.name = componentName || 'Component';
  wrapper.layoutMode = 'NONE';
  wrapper.cornerRadius = 16;
  if (surfaceVar) wrapper.fills = [paintVar(surfaceVar)];
  if (borderVar) {
    wrapper.strokes = [paintVar(borderVar)];
    wrapper.strokeWeight = 1;
  }
  wrapper.x = bx - PAD;
  wrapper.y = by - PAD - HEAD_H;
  wrapper.resize(bex - bx + PAD * 2, bey - by + PAD * 2 + HEAD_H);
  page.appendChild(wrapper);
  const wx = wrapper.x, wy = wrapper.y;

  // Heading at top of wrapper
  const heading = makeHeading(componentName || 'Component', labelPrimaryVar, undefined, 32);
  page.appendChild(heading);
  wrapper.appendChild(heading);
  heading.x = PAD;
  heading.y = PAD;

  // Subtitle: short tagline
  const sub = await makeText('Component documentation · Variants × States', labelStyle, labelSecondaryVar);
  page.appendChild(sub);
  wrapper.appendChild(sub);
  sub.x = PAD;
  sub.y = PAD + 44;

  // Move compSet into wrapper, preserving visual position
  const csOX = compSet.x, csOY = compSet.y;
  wrapper.appendChild(compSet);
  compSet.x = csOX - wx;
  compSet.y = csOY - wy;

  // Move labels + lines into wrapper, preserving visual position
  const showcaseNodes = [];
  for (const l of labels) {
    const ox = l.x, oy = l.y;
    wrapper.appendChild(l);
    l.x = ox - wx;
    l.y = oy - wy;
    showcaseNodes.push(l);
  }
  for (const ln of lines) {
    const ox = ln.x, oy = ln.y;
    wrapper.appendChild(ln);
    ln.x = ox - wx;
    ln.y = oy - wy;
    showcaseNodes.push(ln);
  }

  // Group all decoration nodes into a single locked "Showcase" group
  if (showcaseNodes.length > 0) {
    const showcase = figma.group(showcaseNodes, wrapper);
    showcase.name = 'Showcase (decoration)';
    showcase.locked = true;
    showcase.expanded = false;
  }
}

async function buildButton() {
  console.log('[OM DS] buildButton started');
  try { await figma.loadAllPagesAsync(); } catch (e) { /* ignore */ }

  // ---- Verify deps ----
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const appearanceCol = collections.find(c => c.name === '_Appearance');
  const themeCol = collections.find(c => c.name === '_Theme');
  if (!appearanceCol || !themeCol) {
    figma.notify('❌ Missing _Appearance or _Theme. Run Bootstrap first.', { error: true });
    return;
  }
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const findVar = (collectionId, name) => allColorVars.find(v => v.variableCollectionId === collectionId && v.name === name);

  const appBy = (n) => findVar(appearanceCol.id, n);
  const thBy  = (n) => findVar(themeCol.id, n);

  const required = {
    'brand/primary':         thBy('brand/primary'),
    'brand/primary-hover':   thBy('brand/primary-hover'),
    'brand/primary-active':  thBy('brand/primary-active'),
    'brand/primary-subtle':  thBy('brand/primary-subtle'),
    'brand/primary-muted':   thBy('brand/primary-muted'),
    'brand/primary-disabled-text': thBy('brand/primary-disabled-text'),
    'state/divider-on-brand':      appBy('state/divider-on-brand'),
    'brand/on-primary':      thBy('brand/on-primary'),
    'state/focus-ring':      thBy('state/focus-ring'),
    'surface/card':          appBy('surface/card'),
    'surface/base':          appBy('surface/base'),
    'text/primary':          appBy('text/primary'),
    'text/secondary':        appBy('text/secondary'),
    'border/default':        appBy('border/default'),
    'icon/default':          appBy('icon/default'),
    'icon/disabled':         appBy('icon/disabled'),
    'state/disabled-bg':     appBy('state/disabled-bg'),
    'state/disabled-text':   appBy('state/disabled-text'),
    'state/disabled-border': appBy('state/disabled-border'),
    'state/neutral-active':  appBy('state/neutral-active'),
    // Status (Danger/Success)
    'status/danger':         appBy('status/danger'),
    'status/danger-hover':   appBy('status/danger-hover'),
    'status/danger-active':  appBy('status/danger-active'),
    'status/danger-subtle':  appBy('status/danger-subtle'),
    'status/danger-muted':   appBy('status/danger-muted'),
    'status/danger-text':    appBy('status/danger-text'),
    'status/danger-border':  appBy('status/danger-border'),
    'status/on-danger':      appBy('status/on-danger'),
    'status/success':        appBy('status/success'),
    'status/success-hover':  appBy('status/success-hover'),
    'status/success-active': appBy('status/success-active'),
    'status/success-subtle': appBy('status/success-subtle'),
    'status/success-muted':  appBy('status/success-muted'),
    'status/success-text':   appBy('status/success-text'),
    'status/success-border': appBy('status/success-border'),
    'status/on-success':     appBy('status/on-success'),
  };
  for (const k of Object.keys(required)) {
    if (!required[k]) {
      figma.notify(`❌ Missing variable: ${k}. Re-run Bootstrap.`, { error: true });
      console.error(`[OM DS] Missing required variable: ${k}`);
      return;
    }
  }
  console.log('[OM DS] All required variables present.');

  // ---- Per-component Button color tokens (Component/Button collection) ----
  const buttonCol = await getOrCreateCollection('Component/Button', ['Default']);

  async function btnAlias(name, src, scopes) {
    if (!src) {
      console.error(`[OM DS] btnAlias("${name}") got undefined source!`);
      throw new Error(`btnAlias source undefined for ${name}`);
    }
    const v = await getOrCreateVariable(name, buttonCol, 'COLOR');
    aliasByMode(v, buttonCol, 'Default', src);
    if (scopes) {
      try { v.scopes = scopes; } catch (e) { /* ignore */ }
    }
    return v;
  }

  const FILL = ['FRAME_FILL', 'SHAPE_FILL'];
  const TEXT = ['TEXT_FILL'];
  const STRK = ['STROKE_COLOR'];

  // Need a transparent variable for fills — create one in Component/Button if missing
  const primitivesCol = collections.find(c => c.name === '_Primitives');
  let transparentVar = null;
  if (primitivesCol) {
    transparentVar = allColorVars.find(v => v.variableCollectionId === primitivesCol.id && v.name === 'transparent');
  }
  if (!transparentVar) {
    figma.notify('❌ transparent primitive missing. Re-run Bootstrap.', { error: true });
    console.error('[OM DS] primitivesCol:', primitivesCol, 'transparent var lookup failed');
    return;
  }
  console.log('[OM DS] transparent var found:', transparentVar.name, transparentVar.id);

  const btn = {
    // Primary (filled brand) — disabled = faded brand
    'Primary/bg/default':   await btnAlias('Primary/bg/default',   required['brand/primary'],         FILL),
    'Primary/bg/hover':     await btnAlias('Primary/bg/hover',     required['brand/primary-hover'],   FILL),
    'Primary/bg/active':    await btnAlias('Primary/bg/active',    required['brand/primary-active'],  FILL),
    'Primary/bg/disabled':  await btnAlias('Primary/bg/disabled',  required['brand/primary-muted'],   FILL),
    'Primary/text':         await btnAlias('Primary/text',         required['brand/on-primary'],      TEXT),
    'Primary/text/disabled':await btnAlias('Primary/text/disabled',required['brand/on-primary'], TEXT),

    // Secondary (Line/Outline) — default + disabled have NO bg fill (handled in pickTokens)
    'Secondary/bg/hover':   await btnAlias('Secondary/bg/hover',   required['brand/primary-subtle'],  FILL),
    'Secondary/bg/active':  await btnAlias('Secondary/bg/active',  required['brand/primary-muted'],   FILL),
    'Secondary/border':     await btnAlias('Secondary/border',     required['brand/primary'],         STRK),
    'Secondary/border/disabled': await btnAlias('Secondary/border/disabled', required['brand/primary-muted'], STRK),
    'Secondary/text':       await btnAlias('Secondary/text',       required['brand/primary'],         TEXT),
    'Secondary/text/disabled':await btnAlias('Secondary/text/disabled', required['brand/primary-disabled-text'], TEXT),

    // Ghost (text-only) — default + disabled have NO bg fill
    'Ghost/bg/hover':       await btnAlias('Ghost/bg/hover',       required['brand/primary-subtle'],  FILL),
    'Ghost/bg/active':      await btnAlias('Ghost/bg/active',      required['brand/primary-muted'],   FILL),
    'Ghost/text':           await btnAlias('Ghost/text',           required['brand/primary'],         TEXT),
    'Ghost/text/disabled':  await btnAlias('Ghost/text/disabled',  required['brand/primary-disabled-text'], TEXT),

    // Neutral — solid grey for close/menu/three-dot. Darker bg + border for visibility.
    'Neutral/bg/default':   await btnAlias('Neutral/bg/default',   required['border/default'],        FILL),
    'Neutral/bg/hover':     await btnAlias('Neutral/bg/hover',     required['icon/disabled'],         FILL),
    'Neutral/bg/active':    await btnAlias('Neutral/bg/active',    required['state/neutral-active'],  FILL),
    'Neutral/bg/disabled':  await btnAlias('Neutral/bg/disabled',  required['state/disabled-bg'],     FILL),
    'Neutral/border':       await btnAlias('Neutral/border',       required['icon/disabled'],         STRK),
    'Neutral/border/disabled': await btnAlias('Neutral/border/disabled', required['state/disabled-border'], STRK),
    'Neutral/text':         await btnAlias('Neutral/text',         required['text/primary'],          TEXT),
    'Neutral/text/disabled':await btnAlias('Neutral/text/disabled',required['state/disabled-text'],   TEXT),

    // Danger — RED. Disabled bg = faded red, text = neutral disabled.
    'Danger/bg/default':    await btnAlias('Danger/bg/default',    required['status/danger'],         FILL),
    'Danger/bg/hover':      await btnAlias('Danger/bg/hover',      required['status/danger-hover'],   FILL),
    'Danger/bg/active':     await btnAlias('Danger/bg/active',     required['status/danger-active'],  FILL),
    'Danger/bg/disabled':   await btnAlias('Danger/bg/disabled',   required['status/danger-muted'],   FILL),
    'Danger/text':          await btnAlias('Danger/text',          required['status/on-danger'],      TEXT),
    'Danger/text/disabled': await btnAlias('Danger/text/disabled', required['status/on-danger'],     TEXT),

    // Success — GREEN. Same shape as Danger.
    'Success/bg/default':   await btnAlias('Success/bg/default',   required['status/success'],        FILL),
    'Success/bg/hover':     await btnAlias('Success/bg/hover',     required['status/success-hover'],  FILL),
    'Success/bg/active':    await btnAlias('Success/bg/active',    required['status/success-active'], FILL),
    'Success/bg/disabled':  await btnAlias('Success/bg/disabled',  required['status/success-muted'],  FILL),
    'Success/text':         await btnAlias('Success/text',         required['status/on-success'],     TEXT),
    'Success/text/disabled':await btnAlias('Success/text/disabled',required['status/on-success'],    TEXT),
  };

  // ---- Build the component set on Atoms page ----
  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms'));
  if (!atomsPage) {
    figma.notify('❌ Atoms page not found.', { error: true });
    return;
  }
  await figma.setCurrentPageAsync(atomsPage);

  // Idempotency: remove existing Button set + showcase + decoration wrapper
  const existing = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Button');
  if (existing) existing.remove();
  const existingBtnShow = atomsPage.findOne(n => n.name === 'Button — Showcase');
  if (existingBtnShow) existingBtnShow.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Button')) n.remove();
  // Sweep orphan Button variants left over from a previously cancelled/failed build.
  // Variant names always start with "Type=" — match COMPONENT nodes (not yet combined).
  let orphanCount = 0;
  for (const n of atomsPage.children) {
    if (n.type === 'COMPONENT' && typeof n.name === 'string' && /^Type=(Default|Split|Split Icon|Icon|Navigation),/.test(n.name)) {
      try { n.remove(); orphanCount++; } catch (e) {}
    }
  }
  if (orphanCount > 0) console.log('[OM DS] swept', orphanCount, 'orphan Button variants');

  // Get text styles
  const textStyles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of textStyles) styleByName[s.name] = s;

  // Preload all button label fonts (default + style fonts)
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });

  function paintFor(varRef) {
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
      'color',
      varRef
    );
  }

  function pickTokens(variant, state) {
    const stateKey = state.toLowerCase() === 'pressed' ? 'active' : state.toLowerCase(); // default | hover | active | disabled
    let bg = btn[`${variant}/bg/${stateKey}`];
    // Transparent variants: Secondary (outline) + Ghost in Default/Disabled have
    // no real bg. Skip the fill entirely so dev-mode emits no `background` rule.
    const isTransparentByDesign =
      (variant === 'Secondary' && (state === 'Default' || state === 'Disabled')) ||
      (variant === 'Ghost'     && (state === 'Default' || state === 'Disabled'));
    if (isTransparentByDesign) bg = null;
    const text = state === 'Disabled'
      ? (btn[`${variant}/text/disabled`] || btn[`${variant}/text`])
      : btn[`${variant}/text`];
    let border = null;
    if (variant === 'Secondary' || variant === 'Neutral') {
      border = state === 'Disabled'
        ? (btn[`${variant}/border/disabled`] || btn[`${variant}/border`])
        : btn[`${variant}/border`];
    }
    return { bg, text, border };
  }

  // Load default icon for Icon Left / Icon Right and chevron for Split type
  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  const iconComp = await findOrCreateIconComponent('plus', iconsPage, required['icon/default']);
  const chevronComp = await findOrCreateIconComponent('chevron-down', iconsPage, required['icon/default']);
  const arrowLeftComp = await findOrCreateIconComponent('arrow-left', iconsPage, required['icon/default']);

  function bindIconColor(node, colorVar) {
    if ('fills' in node && Array.isArray(node.fills) && node.fills.length) {
      node.fills = node.fills.map(p => p.type === 'SOLID' && p.visible !== false
        ? figma.variables.setBoundVariableForPaint(p, 'color', colorVar) : p);
    }
    if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length) {
      node.strokes = node.strokes.map(p => p.type === 'SOLID' && p.visible !== false
        ? figma.variables.setBoundVariableForPaint(p, 'color', colorVar) : p);
    }
    if ('children' in node) for (const c of node.children) bindIconColor(c, colorVar);
  }

  function iconSizeFor(size) {
    return size === 'XS' ? 12 : size === 'Small' ? 14 : size === 'Large' ? 18 : 16;
  }

  // For Split, derive per-side state. e.g. 'Split Hover' → main:Default, chev:Hover.
  // 'Hover' → main:Hover, chev:Default. Disabled affects both.
  function splitSidesFor(state) {
    if (state === 'Disabled')      return { main: 'Disabled', chev: 'Disabled' };
    if (state === 'Hover')         return { main: 'Hover',    chev: 'Default'  };
    if (state === 'Split Hover')   return { main: 'Default',  chev: 'Hover'    };
    if (state === 'Pressed')        return { main: 'Pressed', chev: 'Default' };
    if (state === 'Split Pressed')  return { main: 'Default', chev: 'Pressed' };
    return { main: 'Default', chev: 'Default' };
  }

  // Build a single variant of a given Type. Returns { component, leftIcon, rightIcon }
  // so we can wire boolean visibility properties after combineAsVariants.
  async function makeOneVariant(type, variant, size, state, content) {
    // content: 'Label' | 'Icon' (only meaningful for Split; ignored otherwise)
    const spec = BUTTON_SIZE_SPECS[size];
    const { bg, text, border } = pickTokens(variant, state);

    const comp = figma.createComponent();
    comp.name = `Type=${type}, Color=${variant}, Size=${size}, State=${state}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.counterAxisSizingMode = 'FIXED';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';
    comp.cornerRadius = spec.radius;
    comp.fills = bg ? [paintFor(bg)] : [];
    if (border) {
      comp.strokes = [paintFor(border)];
      comp.strokeWeight = 1;
      comp.strokeAlign = 'INSIDE';
    } else {
      comp.strokes = [];
    }

    const isize = iconSizeFor(size);
    let leftIcon = null;
    let rightIcon = null;
    let labelNode = null;

    if (type === 'Icon') {
      // Square icon-only button: w = h = spec.h
      comp.primaryAxisSizingMode = 'FIXED';
      comp.resize(spec.h, spec.h);
      comp.itemSpacing = 0;
      comp.paddingLeft = comp.paddingRight = comp.paddingTop = comp.paddingBottom = 0;
      const ic = iconComp.createInstance();
      ic.resize(isize, isize);
      ic.name = 'Icon';
      bindIconColor(ic, text);
      comp.appendChild(ic);
      try { ic.layoutSizingHorizontal = 'FIXED'; } catch (e) {}
      try { ic.layoutSizingVertical = 'FIXED'; } catch (e) {}
      return { component: comp, leftIcon: null, rightIcon: null };
    }

    if (type === 'Split' || type === 'Split Icon') {
      const isIconOnly = type === 'Split Icon';
      const sides = splitSidesFor(state);
      const mainTokens = pickTokens(variant, sides.main);
      const chevTokens = pickTokens(variant, sides.chev);
      comp.fills = [];
      comp.strokes = [];
      comp.itemSpacing = 0;
      comp.paddingLeft = comp.paddingRight = comp.paddingTop = comp.paddingBottom = 0;
      comp.clipsContent = true;
      comp.primaryAxisSizingMode = 'AUTO';
      comp.counterAxisSizingMode = 'FIXED';
      comp.resize(120, spec.h);

      const main = figma.createFrame();
      main.name = 'Main';
      main.layoutMode = 'HORIZONTAL';
      main.counterAxisSizingMode = 'FIXED';
      main.primaryAxisAlignItems = 'CENTER';
      main.counterAxisAlignItems = 'CENTER';
      if (isIconOnly) {
        // Square icon-only main: fixed h × h, no padding, icon centers via autolayout
        main.primaryAxisSizingMode = 'FIXED';
        main.resize(spec.h, spec.h);
        main.paddingLeft = main.paddingRight = 0;
      } else {
        // Labeled: hug width with design padX both sides
        main.primaryAxisSizingMode = 'AUTO';
        main.resize(80, spec.h);
        main.paddingLeft = spec.padX;
        main.paddingRight = spec.padX;
      }
      main.itemSpacing = spec.gap;
      main.fills = mainTokens.bg ? [paintFor(mainTokens.bg)] : [];
      if (mainTokens.border) {
        main.strokes = [paintFor(mainTokens.border)];
        main.strokeWeight = 1;
        main.strokeAlign = 'INSIDE';
        main.strokeRightWeight = 0;
      } else {
        main.strokes = [];
      }
      main.topLeftRadius = main.bottomLeftRadius = spec.radius;
      main.topRightRadius = main.bottomRightRadius = 0;

      // Optional left icon
      const li = iconComp.createInstance();
      li.resize(isize, isize);
      li.name = 'Icon Left';
      // Split (label): hidden by default (toggleable). Split Icon: always visible.
      li.visible = isIconOnly ? true : false;
      bindIconColor(li, mainTokens.text);
      main.appendChild(li);
      try { li.layoutSizingHorizontal = 'FIXED'; } catch (e) {}
      try { li.layoutSizingVertical = 'FIXED'; } catch (e) {}
      leftIcon = li;

      if (!isIconOnly) {
        const label = figma.createText();
        const styleObj = styleByName[spec.fontStyle];
        if (styleObj) { try { await figma.loadFontAsync(styleObj.fontName); } catch (e) { /* ignore */ } }
        label.characters = 'Button';
        if (styleObj) await label.setTextStyleIdAsync(styleObj.id);
        label.fills = [paintFor(mainTokens.text)];
        label.name = 'Label';
        main.appendChild(label);
        labelNode = label;
      }
      comp.appendChild(main);

      // Divider
      let dividerVar;
      if (state === 'Disabled') {
        dividerVar = variant === 'Secondary'
          ? required['brand/primary-muted']
          : required['state/disabled-border'];
      } else if (variant === 'Secondary') {
        dividerVar = required['brand/primary'];
      } else if (variant === 'Neutral') {
        dividerVar = required['icon/disabled'];
      } else {
        dividerVar = required['state/divider-on-brand'];
      }
      const divider = figma.createFrame();
      divider.name = 'Divider';
      divider.resize(1, spec.h);
      divider.layoutMode = 'NONE';
      divider.fills = [paintFor(dividerVar)];
      comp.appendChild(divider);

      // Chevron — always square h × h
      const chev = figma.createFrame();
      chev.name = 'Chevron';
      chev.layoutMode = 'HORIZONTAL';
      chev.primaryAxisSizingMode = 'FIXED';
      chev.counterAxisSizingMode = 'FIXED';
      chev.resize(spec.h, spec.h);
      chev.paddingLeft = chev.paddingRight = 0;
      chev.primaryAxisAlignItems = 'CENTER';
      chev.counterAxisAlignItems = 'CENTER';
      chev.fills = chevTokens.bg ? [paintFor(chevTokens.bg)] : [];
      if (chevTokens.border) {
        chev.strokes = [paintFor(chevTokens.border)];
        chev.strokeWeight = 1;
        chev.strokeAlign = 'INSIDE';
        chev.strokeLeftWeight = 0;
      } else {
        chev.strokes = [];
      }
      chev.topRightRadius = chev.bottomRightRadius = spec.radius;
      chev.topLeftRadius = chev.bottomLeftRadius = 0;

      const cinst = chevronComp.createInstance();
      cinst.resize(isize, isize);
      bindIconColor(cinst, chevTokens.text);
      chev.appendChild(cinst);
      try { cinst.layoutSizingHorizontal = 'FIXED'; } catch (e) {}
      try { cinst.layoutSizingVertical = 'FIXED'; } catch (e) {}
      comp.appendChild(chev);

      try { comp.layoutSizingHorizontal = 'HUG'; } catch (e) {}
      if (!isIconOnly) { try { main.layoutSizingHorizontal = 'HUG'; } catch (e) {} }

      return { component: comp, leftIcon, rightIcon: null, label: labelNode };
    }

    // Type === 'Navigation' — icon-only (arrow-left). Transparent default bg.
    // On hover/active, a subtle bg appears. Only Primary (brand-tinted) and Neutral (grey).
    if (type === 'Navigation') {
      // Override bg: Nav default is always transparent. Hover/active use a subtle tint.
      let navBg = transparentVar;
      let navIconColor = text;
      if (state === 'Hover') {
        navBg = variant === 'Neutral'
          ? required['state/disabled-bg']        // light grey hover
          : required['brand/primary-subtle'];    // brand-tinted hover
      } else if (state === 'Pressed') {
        navBg = variant === 'Neutral'
          ? required['state/neutral-active']     // mid grey active
          : required['brand/primary-muted'];     // stronger brand tint
      } else if (state === 'Disabled') {
        navBg = transparentVar;
        navIconColor = required['state/disabled-text'];
      }
      // Re-apply fills with overridden bg
      comp.fills = [paintFor(navBg)];
      comp.strokes = [];

      // Square icon-only frame (matches Icon type sizing)
      comp.primaryAxisSizingMode = 'FIXED';
      comp.resize(spec.h, spec.h);
      comp.itemSpacing = 0;
      comp.paddingLeft = comp.paddingRight = comp.paddingTop = comp.paddingBottom = 0;

      const ai = arrowLeftComp.createInstance();
      ai.resize(isize, isize);
      ai.name = 'Arrow';
      // Icon color: Primary uses brand orange; Neutral uses neutral text; disabled uses disabled-text
      const navIconBound = state === 'Disabled'
        ? required['state/disabled-text']
        : (variant === 'Neutral' ? required['text/primary'] : required['brand/primary']);
      bindIconColor(ai, navIconBound);
      comp.appendChild(ai);
      try { ai.layoutSizingHorizontal = 'FIXED'; } catch (e) {}
      try { ai.layoutSizingVertical = 'FIXED'; } catch (e) {}

      return { component: comp, leftIcon: null, rightIcon: null };
    }

    // Type === 'Default'
    comp.primaryAxisSizingMode = 'AUTO';
    comp.resize(100, spec.h);
    comp.paddingLeft = spec.padX;
    comp.paddingRight = spec.padX;
    comp.paddingTop = spec.padY;
    comp.paddingBottom = spec.padY;
    comp.itemSpacing = spec.gap;

    const li = iconComp.createInstance();
    li.resize(isize, isize);
    li.name = 'Icon Left';
    li.visible = false;
    bindIconColor(li, text);
    comp.appendChild(li);
    try { li.layoutSizingHorizontal = 'FIXED'; } catch (e) {}
    try { li.layoutSizingVertical = 'FIXED'; } catch (e) {}
    leftIcon = li;

    const label = figma.createText();
    const styleObj = styleByName[spec.fontStyle];
    if (styleObj) { try { await figma.loadFontAsync(styleObj.fontName); } catch (e) { /* ignore */ } }
    label.characters = 'Button';
    if (styleObj) await label.setTextStyleIdAsync(styleObj.id);
    label.fills = [paintFor(text)];
    label.name = 'Label';
    comp.appendChild(label);
    labelNode = label;

    const ri = iconComp.createInstance();
    ri.resize(isize, isize);
    ri.name = 'Icon Right';
    ri.visible = false;
    bindIconColor(ri, text);
    comp.appendChild(ri);
    try { ri.layoutSizingHorizontal = 'FIXED'; } catch (e) {}
    try { ri.layoutSizingVertical = 'FIXED'; } catch (e) {}
    rightIcon = ri;

    return { component: comp, leftIcon, rightIcon, label: labelNode };
  }

  // Build all variants. Skip illegal combos:
  //  - Type=Split: skip Color=Ghost (no hairline), skip Size=XS (too cramped)
  //  - Type=Icon: square, label hidden anyway
  //  - Type=Default: all combos
  const allVariants = [];
  const variantMeta = []; // parallel array: { type, variant, size, state }
  const leftIconsByVariant = []; // collect refs to wire boolean property after combine
  const rightIconsByVariant = [];
  const labelsByVariant = [];

  for (const type of BUTTON_TYPES) {
    for (const variant of BUTTON_VARIANTS) {
      if ((type === 'Split' || type === 'Split Icon') && variant === 'Ghost') continue;
      // Skip status colors for Split — semantic colors don't pair well with split actions
      if ((type === 'Split' || type === 'Split Icon') && (variant === 'Danger' || variant === 'Success')) continue;
      // Navigation only makes sense for Primary (brand) + Neutral (grey) — skip the rest
      if (type === 'Navigation' && variant !== 'Primary' && variant !== 'Neutral') continue;
      for (const size of BUTTON_SIZES) {
        if ((type === 'Split' || type === 'Split Icon') && size === 'XS') continue;
        for (const state of statesFor(type)) {
          const { component, leftIcon, rightIcon, label } = await makeOneVariant(type, variant, size, state);
          allVariants.push(component);
          variantMeta.push({ type, variant, size, state });
          // Bind Split (labeled) icon to Icon Left boolean prop. Split Icon icon is always shown.
          if (type === 'Split' && leftIcon) leftIconsByVariant.push(leftIcon);
          if (type !== 'Split' && type !== 'Split Icon' && leftIcon) leftIconsByVariant.push(leftIcon);
          if (rightIcon) rightIconsByVariant.push(rightIcon);
          if (label) labelsByVariant.push(label);
        }
      }
    }
  }

  // Combine into a component set
  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Button';
  // ---- Manual 2D grid positioning (Blade/MUI style) ----
  // Cols: Color groups, each with sub-cols per Size.
  // Rows: State within each Type section.
  // Sections: Type stacked vertically with section gap.
  // Removing autolayout lets Figma auto-render axis labels (Type/Color/Size/State).
  compSet.layoutMode = 'NONE';

  const COL_W = { XS: 100, Small: 120, Medium: 140, Default: 160, Large: 180 };
  const ROW_H = 72;
  const COLOR_GAP = 56;
  const TYPE_GAP = 120;
  const PAD_LEFT = 180;  // space for state/type labels on the left
  const PAD_TOP = 100;   // space for color/size labels on the top
  const PAD_RIGHT = 48;
  const PAD_BOT = 48;

  // Column X positions (cumulative across colors and sizes within each color)
  const colorX = {}; // colorX[colorName] = startX of that color group
  let cursorX = PAD_LEFT;
  for (const c of BUTTON_VARIANTS) {
    colorX[c] = cursorX;
    for (const s of BUTTON_SIZES) cursorX += COL_W[s];
    cursorX += COLOR_GAP;
  }
  function xFor(variant, size) {
    const sizeIdx = BUTTON_SIZES.indexOf(size);
    let off = 0;
    for (let i = 0; i < sizeIdx; i++) off += COL_W[BUTTON_SIZES[i]];
    // Center the button in its size column
    return colorX[variant] + off + (COL_W[size] / 2);
  }

  // Row Y positions: each type gets a vertical block sized to its state count
  const typeY = {};
  let cursorY = PAD_TOP;
  for (const t of BUTTON_TYPES) {
    typeY[t] = cursorY;
    cursorY += statesFor(t).length * ROW_H + TYPE_GAP;
  }
  function yFor(type, state) {
    const stateIdx = statesFor(type).indexOf(state);
    return typeY[type] + stateIdx * ROW_H + (ROW_H / 2);
  }

  // Apply positions
  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    const cx = xFor(m.variant, m.size);
    const cy = yFor(m.type, m.state);
    v.x = Math.round(cx - v.width / 2);
    v.y = Math.round(cy - v.height / 2);
  }

  // Resize the component set to fit
  const totalW = cursorX + PAD_RIGHT;
  const totalH = cursorY + PAD_BOT;
  compSet.resize(totalW, totalH);
  compSet.fills = [];

  // Wire boolean component properties for icon visibility
  let leftPropId = null;
  let rightPropId = null;
  try {
    leftPropId  = compSet.addComponentProperty('Icon Left',  'BOOLEAN', false);
    rightPropId = compSet.addComponentProperty('Icon Right', 'BOOLEAN', false);
  } catch (e) {
    console.warn('[OM DS] addComponentProperty failed:', e.message);
  }
  if (leftPropId) {
    for (const li of leftIconsByVariant) {
      try { li.componentPropertyReferences = { visible: leftPropId }; } catch (e) { /* ignore */ }
    }
  }
  if (rightPropId) {
    for (const ri of rightIconsByVariant) {
      try { ri.componentPropertyReferences = { visible: rightPropId }; } catch (e) { /* ignore */ }
    }
  }

  // ---- Inline labels + separators (Blade/MUI style) ----
  // Build colGroups + rowGroups from the positioning data we computed earlier.
  const colGroupsForDecor = BUTTON_VARIANTS.map(c => {
    let groupW = 0;
    const sizes = [];
    let sx = colorX[c];
    for (const s of BUTTON_SIZES) {
      sizes.push({ name: s, x: sx, width: COL_W[s] });
      sx += COL_W[s];
      groupW += COL_W[s];
    }
    return { name: c, x: colorX[c], width: groupW, sizes };
  });
  const rowGroupsForDecor = BUTTON_TYPES.map(t => {
    const states = statesFor(t).map((st, i) => ({
      name: st, y: typeY[t] + i * ROW_H, height: ROW_H,
    }));
    return { name: t, y: typeY[t], states };
  });
  await decorateComponentSet({
    page: atomsPage,
    compSet,
    colGroups: colGroupsForDecor,
    rowGroups: rowGroupsForDecor,
    padTop: PAD_TOP,
    padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Button',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Button built: ${allVariants.length} variants. Component/Button collection has ${Object.keys(btn).length} tokens.`);
}

// ---- Button documentation showcase (grid with row/column labels) ----
async function buildButtonShowcase(page, compSet, styleByName, required) {
  // Remove old showcase if present
  const old = page.findOne(n => n.name === 'Button — Showcase');
  if (old) old.remove();

  // Preload fonts used by labels
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });

  function paintFor(varRef) {
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef
    );
  }

  async function makeLabel(text, styleName, colorVar) {
    const t = figma.createText();
    const s = styleByName[styleName];
    if (s) {
      try { await figma.loadFontAsync(s.fontName); } catch (e) { /* ignore */ }
      await t.setTextStyleIdAsync(s.id);
    }
    t.characters = text;
    if (colorVar) t.fills = [paintFor(colorVar)];
    return t;
  }

  // Find a variant by props (defaultVariant if exact match not found)
  function findVariant(variant, size, state) {
    return compSet.children.find(c => c.name === `Type=Default, Color=${variant}, Size=${size}, State=${state}`);
  }

  const showcase = figma.createFrame();
  showcase.name = 'Button — Showcase';
  showcase.layoutMode = 'VERTICAL';
  showcase.itemSpacing = 32;
  showcase.paddingLeft = showcase.paddingRight = 48;
  showcase.paddingTop = showcase.paddingBottom = 48;
  showcase.primaryAxisSizingMode = 'AUTO';
  showcase.counterAxisSizingMode = 'AUTO';
  showcase.fills = [paintFor(required['surface/base'] || required['surface/card'])];
  page.appendChild(showcase);
  showcase.x = compSet.x + compSet.width + 100;
  showcase.y = compSet.y;

  // Title
  const title = await makeLabel('Button', 'Heading/H1', required['text/primary']);
  showcase.appendChild(title);
  const subtitle = await makeLabel(
    'All variants × sizes × states. Toggle _Theme (Orange/Blue) or _Appearance (Light/Dark) on this frame to see theming.',
    'Body/Default', required['text/secondary']
  );
  subtitle.layoutAlign = 'STRETCH';
  subtitle.textAutoResize = 'HEIGHT';
  showcase.appendChild(subtitle);

  // For each variant, build a section with grid: rows = State, cols = Size
  for (const variant of BUTTON_VARIANTS) {
    const section = figma.createFrame();
    section.name = `Section — ${variant}`;
    section.layoutMode = 'VERTICAL';
    section.itemSpacing = 16;
    section.paddingLeft = section.paddingRight = 24;
    section.paddingTop = section.paddingBottom = 24;
    section.cornerRadius = 12;
    section.primaryAxisSizingMode = 'AUTO';
    section.counterAxisSizingMode = 'AUTO';
    section.fills = [paintFor(required['surface/card'])];
    section.strokes = [paintFor(required['border/default'])];
    section.strokeWeight = 1;

    const sectionTitle = await makeLabel(variant, 'Heading/H4', required['text/primary']);
    section.appendChild(sectionTitle);

    // Grid wrapper
    const grid = figma.createFrame();
    grid.name = 'Grid';
    grid.layoutMode = 'VERTICAL';
    grid.itemSpacing = 12;
    grid.fills = [];
    grid.primaryAxisSizingMode = 'AUTO';
    grid.counterAxisSizingMode = 'AUTO';

    // Header row: empty cell + size names
    const header = figma.createFrame();
    header.name = 'Header';
    header.layoutMode = 'HORIZONTAL';
    header.itemSpacing = 24;
    header.fills = [];
    header.primaryAxisSizingMode = 'AUTO';
    header.counterAxisSizingMode = 'AUTO';
    header.counterAxisAlignItems = 'CENTER';

    const cornerCell = figma.createFrame();
    cornerCell.resize(80, 20);
    cornerCell.fills = [];
    header.appendChild(cornerCell);

    // Estimated min cell widths so all sizes fit comfortably and align
    const CELL_W = { XS: 80, Small: 90, Medium: 100, Default: 110, Large: 120 };

    for (const size of BUTTON_SIZES) {
      const cell = figma.createFrame();
      cell.resize(CELL_W[size], 20);
      cell.fills = [];
      cell.layoutMode = 'HORIZONTAL';
      cell.primaryAxisAlignItems = 'CENTER';
      cell.counterAxisAlignItems = 'CENTER';
      const lbl = await makeLabel(size, 'Label/Default', required['text/secondary']);
      cell.appendChild(lbl);
      header.appendChild(cell);
    }
    grid.appendChild(header);

    // One row per state
    for (const state of BUTTON_STATES) {
      const row = figma.createFrame();
      row.name = `Row — ${state}`;
      row.layoutMode = 'HORIZONTAL';
      row.itemSpacing = 24;
      row.fills = [];
      row.primaryAxisSizingMode = 'AUTO';
      row.counterAxisSizingMode = 'AUTO';
      row.counterAxisAlignItems = 'CENTER';

      const stateCell = figma.createFrame();
      stateCell.resize(80, 40);
      stateCell.fills = [];
      stateCell.layoutMode = 'HORIZONTAL';
      stateCell.primaryAxisAlignItems = 'MIN';
      stateCell.counterAxisAlignItems = 'CENTER';
      const stateLbl = await makeLabel(state, 'Label/Default', required['text/secondary']);
      stateCell.appendChild(stateLbl);
      row.appendChild(stateCell);

      for (const size of BUTTON_SIZES) {
        const v = findVariant(variant, size, state);
        const cell = figma.createFrame();
        cell.resize(CELL_W[size], 48);
        cell.fills = [];
        cell.layoutMode = 'HORIZONTAL';
        cell.primaryAxisAlignItems = 'CENTER';
        cell.counterAxisAlignItems = 'CENTER';
        if (v) {
          const inst = v.createInstance();
          cell.appendChild(inst);
        }
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }

    section.appendChild(grid);
    showcase.appendChild(section);
  }
}


// ------------------------------------------------------------------
// BUILD ICON COMPONENTS
// Reads children of a frame named "Icon Selected" on the Icons page,
// converts each into a Component named "Icon/{name}",
// and binds all vector fills/strokes to the icon/default variable.
// ------------------------------------------------------------------

async function buildIconComponents() {
  console.log('[OM DS] buildIconComponents started');

  // Required for dynamic-page documentAccess to use findOne/findAll
  try { await figma.loadAllPagesAsync(); } catch (e) { console.warn('loadAllPagesAsync:', e); }

  const page = figma.root.children.find(p => p.name.includes('Icons'));
  if (!page) {
    figma.notify('❌ Icons page not found. Run Bootstrap first.', { error: true });
    console.error('[OM DS] Icons page not found. Pages:', figma.root.children.map(p => p.name));
    return;
  }
  await figma.setCurrentPageAsync(page);
  console.log('[OM DS] On Icons page. Children count:', page.children.length);

  const sourceFrame = page.findOne(n => n.name === 'Icon Selected');
  if (!sourceFrame || !('children' in sourceFrame)) {
    figma.notify('❌ Could not find frame "Icon Selected" on Icons page.', { error: true });
    console.error('[OM DS] Page children:', page.children.map(c => `${c.type}:${c.name}`));
    return;
  }
  console.log('[OM DS] Found source frame. Icons inside:', sourceFrame.children.length);

  // Get icon/default variable
  const appearanceCol = (await figma.variables.getLocalVariableCollectionsAsync())
    .find(c => c.name === '_Appearance');
  if (!appearanceCol) {
    figma.notify('❌ _Appearance collection missing. Run Bootstrap first.', { error: true });
    return;
  }
  const allVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const iconDefault = allVars.find(v =>
    v.name === 'icon/default' && v.variableCollectionId === appearanceCol.id
  );
  if (!iconDefault) {
    figma.notify('❌ icon/default variable missing. Re-run Bootstrap to add icon tokens.', { error: true });
    return;
  }

  // Existing components by name (idempotent)
  const existing = page.findAll(n => n.type === 'COMPONENT' && n.name.startsWith('Icon/'));
  const existingNames = new Set(existing.map(n => n.name));

  // Recursively bind every visible solid fill on a node tree to icon/default
  function bindFillsRecursive(node) {
    if ('fills' in node && Array.isArray(node.fills)) {
      const newFills = node.fills.map(p => {
        if (p.type !== 'SOLID' || p.visible === false) return p;
        return figma.variables.setBoundVariableForPaint(p, 'color', iconDefault);
      });
      node.fills = newFills;
    }
    if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length) {
      const newStrokes = node.strokes.map(p => {
        if (p.type !== 'SOLID' || p.visible === false) return p;
        return figma.variables.setBoundVariableForPaint(p, 'color', iconDefault);
      });
      node.strokes = newStrokes;
    }
    if ('children' in node) {
      for (const c of node.children) bindFillsRecursive(c);
    }
  }

  // Build a holder frame for the new components if not present
  let holder = page.findOne(n => n.name === 'Icon Components' && n.type === 'FRAME');
  if (!holder) {
    holder = figma.createFrame();
    holder.name = 'Icon Components';
    holder.layoutMode = 'HORIZONTAL';
    holder.layoutWrap = 'WRAP';
    holder.itemSpacing = 16;
    holder.counterAxisSpacing = 16;
    holder.paddingLeft = holder.paddingRight = 32;
    holder.paddingTop = holder.paddingBottom = 32;
    holder.primaryAxisSizingMode = 'FIXED';
    holder.counterAxisSizingMode = 'AUTO';
    holder.resize(1200, 100);
    holder.fills = [];
    holder.x = sourceFrame.x + sourceFrame.width + 100;
    holder.y = sourceFrame.y;
    page.appendChild(holder);
  }

  let created = 0;
  let skipped = 0;
  const sourceChildren = sourceFrame.children.slice(); // snapshot

  for (const src of sourceChildren) {
    const compName = `Icon/${src.name}`;
    if (existingNames.has(compName)) { skipped++; continue; }

    // Detect source size (icons are typically 16x16 or 24x24)
    const srcW = src.width || 16;
    const srcH = src.height || 16;
    const size = Math.max(srcW, srcH);

    // Wrap in a clean component frame matching source size
    const comp = figma.createComponent();
    comp.name = compName;
    comp.resize(size, size);
    comp.fills = []; // transparent background
    comp.clipsContent = false;

    // Clone the source artwork into the component
    const clone = src.clone();
    comp.appendChild(clone);

    // Center clone within the component
    clone.x = (size - clone.width) / 2;
    clone.y = (size - clone.height) / 2;

    // Set constraints so contents scale with the component
    if ('constraints' in clone) {
      clone.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
    }

    // Bind all solid fills/strokes to icon/default
    bindFillsRecursive(clone);

    holder.appendChild(comp);
    created++;
  }

  // ---- Wrap holder in a documentation parent frame (matching Button/Checkbox style) ----
  const existingWrapper = page.findOne(n => n.type === 'FRAME' && n.name === 'Icons');
  if (!existingWrapper) {
    await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

    // Look up surface/card and border/default from _Appearance for wrapper styling
    const surfaceCard = allVars.find(v =>
      v.name === 'surface/card' && v.variableCollectionId === appearanceCol.id);
    const borderDefault = allVars.find(v =>
      v.name === 'border/default' && v.variableCollectionId === appearanceCol.id);
    const textPrimary = allVars.find(v =>
      v.name === 'text/primary' && v.variableCollectionId === appearanceCol.id);
    const textSecondary = allVars.find(v =>
      v.name === 'text/secondary' && v.variableCollectionId === appearanceCol.id);

    function paintVar(varRef) {
      return figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef);
    }

    const PAD = 40;
    const HEAD_H = 96;

    const wrapper = figma.createFrame();
    wrapper.name = 'Icons';
    wrapper.layoutMode = 'NONE';
    wrapper.cornerRadius = 16;
    if (surfaceCard) wrapper.fills = [paintVar(surfaceCard)];
    if (borderDefault) {
      wrapper.strokes = [paintVar(borderDefault)];
      wrapper.strokeWeight = 1;
    }
    wrapper.x = holder.x - PAD;
    wrapper.y = holder.y - PAD - HEAD_H;
    wrapper.resize(holder.width + PAD * 2, holder.height + PAD * 2 + HEAD_H);
    page.appendChild(wrapper);

    const heading = figma.createText();
    heading.fontName = { family: 'Inter', style: 'Semi Bold' };
    heading.characters = 'Icons';
    heading.fontSize = 32;
    if (textPrimary) heading.fills = [paintVar(textPrimary)];
    wrapper.appendChild(heading);
    heading.x = PAD;
    heading.y = PAD;

    const sub = figma.createText();
    sub.fontName = { family: 'Inter', style: 'Regular' };
    sub.characters = `Icon library · ${created} components · bound to icon/default`;
    sub.fontSize = 14;
    if (textSecondary) sub.fills = [paintVar(textSecondary)];
    wrapper.appendChild(sub);
    sub.x = PAD;
    sub.y = PAD + 44;

    // Move holder into wrapper preserving visual position
    const hx = holder.x, hy = holder.y;
    wrapper.appendChild(holder);
    holder.x = hx - wrapper.x;
    holder.y = hy - wrapper.y;
  }

  figma.notify(`✅ Icons: ${created} created, ${skipped} skipped (already exist).`);
}

// ------------------------------------------------------------------
// SHARED: Find an Icon component by friendly name with SVG fallback.
// Looks for `Icon/<name>` first; if missing, creates a fallback glyph
// component on the Icons page from inline SVG (matches ZCat 16x16 style).
// ------------------------------------------------------------------
const FALLBACK_GLYPHS = {
  'plus':         '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3.333v9.334M3.333 8h9.334" stroke="#101F3E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'chevron-down': '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6l4 4 4-4" stroke="#101F3E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'arrow-left':   '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3.333L5.333 8 10 12.667M5.333 8h7.334" stroke="#101F3E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'check':        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.333 8.333L6.667 11.667 12.667 5" stroke="#101F3E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'minus':        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.333 8h9.334" stroke="#101F3E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

async function findOrCreateIconComponent(name, iconsPage, iconDefaultVar) {
  // Search across the document for an exact match first
  const exact = figma.root.findOne(n =>
    n.type === 'COMPONENT' && (n.name === `Icon/${name}` || n.name === name)
  );
  if (exact) return exact;

  // Try common synonyms
  const synonyms = {
    'plus':         ['add', 'plus-circle'],
    'chevron-down': ['chevron-bottom', 'arrow-down', 'caret-down', 'down'],
    'arrow-left':   ['chevron-left', 'back', 'left'],
  };
  for (const alt of (synonyms[name] || [])) {
    const found = figma.root.findOne(n =>
      n.type === 'COMPONENT' && (n.name === `Icon/${alt}` || n.name === alt)
    );
    if (found) return found;
  }

  // Build fallback from inline SVG
  const svg = FALLBACK_GLYPHS[name];
  if (!svg || !iconsPage) return null;

  const fallbackName = `Icon/_glyph-${name}`;
  const already = iconsPage.findOne(n => n.type === 'COMPONENT' && n.name === fallbackName);
  if (already) return already;

  const node = figma.createNodeFromSvg(svg);
  node.name = fallbackName;
  node.resize(16, 16);
  // Bind any fills/strokes to icon/default so it picks up text colors when re-bound
  function bind(n) {
    if ('fills' in n && Array.isArray(n.fills)) {
      n.fills = n.fills.map(p => p.type === 'SOLID' && p.visible !== false
        ? figma.variables.setBoundVariableForPaint(p, 'color', iconDefaultVar) : p);
    }
    if ('strokes' in n && Array.isArray(n.strokes)) {
      n.strokes = n.strokes.map(p => p.type === 'SOLID' && p.visible !== false
        ? figma.variables.setBoundVariableForPaint(p, 'color', iconDefaultVar) : p);
    }
    if ('children' in n) for (const c of n.children) bind(c);
  }
  if (iconDefaultVar) bind(node);

  // Wrap in a Component
  const comp = figma.createComponent();
  comp.name = fallbackName;
  comp.resize(16, 16);
  comp.layoutMode = 'NONE';
  comp.fills = [];
  comp.appendChild(node);
  // Position node at 0,0 inside component
  if ('x' in node) { node.x = 0; node.y = 0; }
  iconsPage.appendChild(comp);
  return comp;
}

// ------------------------------------------------------------------
// BUILD ICON BUTTON — square w=h=size, 5 variants × 5 sizes × 4 states
// Reuses Component/Button color tokens (no new tokens needed).
// ------------------------------------------------------------------
const ICONBTN_SIZES = {
  XS:      { box: 24, icon: 14, radius: 4 },
  Small:   { box: 28, icon: 16, radius: 6 },
  Medium:  { box: 32, icon: 16, radius: 6 },
  Default: { box: 36, icon: 18, radius: 8 },
  Large:   { box: 40, icon: 20, radius: 8 },
};

async function buildIconButton() {
  console.log('[OM DS] buildIconButton started');
  try { await figma.loadAllPagesAsync(); } catch (e) { /* ignore */ }

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const buttonCol = collections.find(c => c.name === 'Component/Button');
  const appearanceCol = collections.find(c => c.name === '_Appearance');
  if (!buttonCol || !appearanceCol) {
    figma.notify('❌ Build Button first (needs Component/Button tokens).', { error: true });
    return;
  }
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const btnVar = (n) => allColorVars.find(v => v.variableCollectionId === buttonCol.id && v.name === n);
  const appVar = (n) => allColorVars.find(v => v.variableCollectionId === appearanceCol.id && v.name === n);

  const iconDefault = appVar('icon/default');
  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms'));
  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  if (!atomsPage) { figma.notify('❌ Atoms page missing.', { error: true }); return; }

  await figma.setCurrentPageAsync(atomsPage);

  // Remove existing
  const existingSet = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'IconButton');
  if (existingSet) existingSet.remove();
  const existingShow = atomsPage.findOne(n => n.name === 'IconButton — Showcase');
  if (existingShow) existingShow.remove();

  const iconComp = await findOrCreateIconComponent('plus', iconsPage, iconDefault);
  if (!iconComp) { figma.notify('❌ Could not find or create plus icon.', { error: true }); return; }

  function paintFor(varRef) {
    return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef);
  }
  function bindIconColor(node, colorVar) {
    if ('fills' in node && Array.isArray(node.fills) && node.fills.length) {
      node.fills = node.fills.map(p => p.type === 'SOLID' && p.visible !== false
        ? figma.variables.setBoundVariableForPaint(p, 'color', colorVar) : p);
    }
    if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length) {
      node.strokes = node.strokes.map(p => p.type === 'SOLID' && p.visible !== false
        ? figma.variables.setBoundVariableForPaint(p, 'color', colorVar) : p);
    }
    if ('children' in node) for (const c of node.children) bindIconColor(c, colorVar);
  }

  function pickIconBtnTokens(variant, state) {
    const stateKey = state.toLowerCase() === 'pressed' ? 'active' : state.toLowerCase();
    const bg = btnVar(`${variant}/bg/${stateKey}`);
    const text = state === 'Disabled' ? btnVar(`${variant}/text/disabled`) : btnVar(`${variant}/text`);
    let border = null;
    if (variant === 'Secondary' || variant === 'Neutral') {
      border = state === 'Disabled' ? btnVar(`${variant}/border/disabled`) : btnVar(`${variant}/border`);
    }
    return { bg, text, border };
  }

  async function makeOneIconBtn(variant, size, state) {
    const spec = ICONBTN_SIZES[size];
    const { bg, text, border } = pickIconBtnTokens(variant, state);
    const comp = figma.createComponent();
    comp.name = `Variant=${variant}, Size=${size}, State=${state}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.resize(spec.box, spec.box);
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';
    comp.cornerRadius = spec.radius;
    comp.fills = bg ? [paintFor(bg)] : [];
    if (border) {
      comp.strokes = [paintFor(border)];
      comp.strokeWeight = 1;
      comp.strokeAlign = 'INSIDE';
    } else {
      comp.strokes = [];
    }
    const inst = iconComp.createInstance();
    inst.resize(spec.icon, spec.icon);
    inst.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
    if (text) bindIconColor(inst, text);
    comp.appendChild(inst);
    return comp;
  }

  const allVariants = [];
  for (const variant of BUTTON_VARIANTS) {
    for (const size of BUTTON_SIZES) {
      for (const state of BUTTON_STATES) {
        allVariants.push(await makeOneIconBtn(variant, size, state));
      }
    }
  }
  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'IconButton';
  compSet.layoutMode = 'VERTICAL';
  compSet.itemSpacing = 24;
  compSet.counterAxisSpacing = 24;
  compSet.paddingLeft = compSet.paddingRight = 32;
  compSet.paddingTop = compSet.paddingBottom = 32;
  compSet.primaryAxisSizingMode = 'AUTO';
  compSet.counterAxisSizingMode = 'AUTO';

  // Position to the right of Button comp set if present
  const buttonSet = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Button');
  if (buttonSet) {
    compSet.x = buttonSet.x;
    compSet.y = buttonSet.y + buttonSet.height + 80;
  }

  await buildIconButtonShowcase(atomsPage, compSet);
  figma.notify(`✅ IconButton: ${allVariants.length} variants built.`);
}

async function buildIconButtonShowcase(page, compSet) {
  const old = page.findOne(n => n.name === 'IconButton — Showcase');
  if (old) old.remove();

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const appearanceCol = collections.find(c => c.name === '_Appearance');
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const appVar = (n) => allColorVars.find(v => v.variableCollectionId === appearanceCol.id && v.name === n);
  const surfaceBase = appVar('surface/base') || appVar('surface/card');
  const surfaceCard = appVar('surface/card');
  const borderDef = appVar('border/default');
  const textPri = appVar('text/primary');
  const textSec = appVar('text/secondary');

  // Get text styles
  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  function paintFor(varRef) {
    return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef);
  }
  async function makeLabel(text, styleName, colorVar) {
    const t = figma.createText();
    const s = styleByName[styleName];
    if (s) {
      try { await figma.loadFontAsync(s.fontName); } catch (e) { /* ignore */ }
      await t.setTextStyleIdAsync(s.id);
    }
    t.characters = text;
    if (colorVar) t.fills = [paintFor(colorVar)];
    return t;
  }
  const findVariant = (variant, size, state) =>
    compSet.children.find(c => c.name === `Variant=${variant}, Size=${size}, State=${state}`);

  const showcase = figma.createFrame();
  showcase.name = 'IconButton — Showcase';
  showcase.layoutMode = 'VERTICAL';
  showcase.itemSpacing = 32;
  showcase.paddingLeft = showcase.paddingRight = 48;
  showcase.paddingTop = showcase.paddingBottom = 48;
  showcase.primaryAxisSizingMode = 'AUTO';
  showcase.counterAxisSizingMode = 'AUTO';
  showcase.fills = [paintFor(surfaceBase)];
  page.appendChild(showcase);
  showcase.x = compSet.x + compSet.width + 100;
  showcase.y = compSet.y;

  showcase.appendChild(await makeLabel('IconButton', 'Heading/H1', textPri));
  const sub = await makeLabel('Square icon-only buttons. Sizes match Button heights so they align in toolbars.', 'Body/Default', textSec);
  sub.layoutAlign = 'STRETCH'; sub.textAutoResize = 'HEIGHT';
  showcase.appendChild(sub);

  const CELL_W = { XS: 56, Small: 56, Medium: 56, Default: 60, Large: 64 };

  for (const variant of BUTTON_VARIANTS) {
    const section = figma.createFrame();
    section.name = `Section — ${variant}`;
    section.layoutMode = 'VERTICAL';
    section.itemSpacing = 16;
    section.paddingLeft = section.paddingRight = 24;
    section.paddingTop = section.paddingBottom = 24;
    section.cornerRadius = 12;
    section.primaryAxisSizingMode = 'AUTO';
    section.counterAxisSizingMode = 'AUTO';
    section.fills = [paintFor(surfaceCard)];
    section.strokes = [paintFor(borderDef)];
    section.strokeWeight = 1;
    section.appendChild(makeLabel(variant, 'Heading/H4', textPri));

    const grid = figma.createFrame();
    grid.layoutMode = 'VERTICAL';
    grid.itemSpacing = 12;
    grid.fills = [];
    grid.primaryAxisSizingMode = 'AUTO';
    grid.counterAxisSizingMode = 'AUTO';

    const header = figma.createFrame();
    header.layoutMode = 'HORIZONTAL';
    header.itemSpacing = 16;
    header.fills = [];
    header.counterAxisAlignItems = 'CENTER';
    header.primaryAxisSizingMode = 'AUTO';
    header.counterAxisSizingMode = 'AUTO';
    const corner = figma.createFrame(); corner.resize(80, 20); corner.fills = [];
    header.appendChild(corner);
    for (const size of BUTTON_SIZES) {
      const cell = figma.createFrame();
      cell.resize(CELL_W[size], 20);
      cell.fills = [];
      cell.layoutMode = 'HORIZONTAL';
      cell.primaryAxisAlignItems = 'CENTER';
      cell.counterAxisAlignItems = 'CENTER';
      cell.appendChild(makeLabel(size, 'Label/Default', textSec));
      header.appendChild(cell);
    }
    grid.appendChild(header);

    for (const state of BUTTON_STATES) {
      const row = figma.createFrame();
      row.layoutMode = 'HORIZONTAL';
      row.itemSpacing = 16;
      row.fills = [];
      row.counterAxisAlignItems = 'CENTER';
      row.primaryAxisSizingMode = 'AUTO';
      row.counterAxisSizingMode = 'AUTO';
      const stateCell = figma.createFrame();
      stateCell.resize(80, 48); stateCell.fills = [];
      stateCell.layoutMode = 'HORIZONTAL';
      stateCell.counterAxisAlignItems = 'CENTER';
      stateCell.appendChild(makeLabel(state, 'Label/Default', textSec));
      row.appendChild(stateCell);
      for (const size of BUTTON_SIZES) {
        const v = findVariant(variant, size, state);
        const cell = figma.createFrame();
        cell.resize(CELL_W[size], 48);
        cell.fills = [];
        cell.layoutMode = 'HORIZONTAL';
        cell.primaryAxisAlignItems = 'CENTER';
        cell.counterAxisAlignItems = 'CENTER';
        if (v) cell.appendChild(v.createInstance());
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }
    section.appendChild(grid);
    showcase.appendChild(section);
  }
}

// ------------------------------------------------------------------
// BUILD SPLIT BUTTON — main action + 1px divider + chevron-down segment
// 4 variants × 4 sizes (skip XS) × 4 states = 64 variants. Ghost dropped.
// ------------------------------------------------------------------
const SPLITBTN_SIZES    = ['Small', 'Medium', 'Default', 'Large'];
const SPLITBTN_VARIANTS = ['Primary', 'Secondary', 'Neutral', 'Danger', 'Success'];

async function buildSplitButton() {
  console.log('[OM DS] buildSplitButton started');
  try { await figma.loadAllPagesAsync(); } catch (e) { /* ignore */ }

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const buttonCol = collections.find(c => c.name === 'Component/Button');
  const appearanceCol = collections.find(c => c.name === '_Appearance');
  if (!buttonCol || !appearanceCol) {
    figma.notify('❌ Build Button first.', { error: true });
    return;
  }
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const btnVar = (n) => allColorVars.find(v => v.variableCollectionId === buttonCol.id && v.name === n);
  const appVar = (n) => allColorVars.find(v => v.variableCollectionId === appearanceCol.id && v.name === n);

  const iconDefault = appVar('icon/default');
  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms'));
  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  if (!atomsPage) { figma.notify('❌ Atoms page missing.', { error: true }); return; }
  await figma.setCurrentPageAsync(atomsPage);

  const existingSet = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'SplitButton');
  if (existingSet) existingSet.remove();
  const existingShow = atomsPage.findOne(n => n.name === 'SplitButton — Showcase');
  if (existingShow) existingShow.remove();

  const chevronComp = await findOrCreateIconComponent('chevron-down', iconsPage, iconDefault);
  if (!chevronComp) { figma.notify('❌ chevron-down icon missing.', { error: true }); return; }

  // Text styles
  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  function paintFor(varRef) {
    return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef);
  }
  function bindIconColor(node, colorVar) {
    if ('fills' in node && Array.isArray(node.fills) && node.fills.length) {
      node.fills = node.fills.map(p => p.type === 'SOLID' && p.visible !== false
        ? figma.variables.setBoundVariableForPaint(p, 'color', colorVar) : p);
    }
    if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length) {
      node.strokes = node.strokes.map(p => p.type === 'SOLID' && p.visible !== false
        ? figma.variables.setBoundVariableForPaint(p, 'color', colorVar) : p);
    }
    if ('children' in node) for (const c of node.children) bindIconColor(c, colorVar);
  }

  function pickTokens(variant, state) {
    const stateKey = state.toLowerCase() === 'pressed' ? 'active' : state.toLowerCase();
    const bg = btnVar(`${variant}/bg/${stateKey}`);
    const text = state === 'Disabled' ? btnVar(`${variant}/text/disabled`) : btnVar(`${variant}/text`);
    let border = null;
    if (variant === 'Secondary' || variant === 'Neutral') {
      border = state === 'Disabled' ? btnVar(`${variant}/border/disabled`) : btnVar(`${variant}/border`);
    }
    // Divider: appearance-aware neutral. Whitish in light, greyish in dark.
    // For disabled state, fade to disabled-border so it doesn't shout.
    const divider = state === 'Disabled'
      ? appVar('state/disabled-border')
      : appVar('state/divider-on-brand');
    return { bg, text, border, divider };
  }

  async function makeOneSplit(variant, size, state) {
    const spec = BUTTON_SIZE_SPECS[size];
    const { bg, text, border, divider } = pickTokens(variant, state);

    const comp = figma.createComponent();
    comp.name = `Variant=${variant}, Size=${size}, State=${state}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.resize(120, spec.h);
    comp.itemSpacing = 0;
    comp.cornerRadius = spec.radius;
    comp.clipsContent = true;
    comp.fills = bg ? [paintFor(bg)] : [];
    if (border) {
      comp.strokes = [paintFor(border)];
      comp.strokeWeight = 1;
      comp.strokeAlign = 'INSIDE';
    } else {
      comp.strokes = [];
    }

    // Main segment — text label
    const main = figma.createFrame();
    main.name = 'Main';
    main.layoutMode = 'HORIZONTAL';
    main.primaryAxisSizingMode = 'AUTO';
    main.counterAxisSizingMode = 'FIXED';
    main.resize(80, spec.h);
    main.primaryAxisAlignItems = 'CENTER';
    main.counterAxisAlignItems = 'CENTER';
    main.paddingLeft = spec.padX;
    main.paddingRight = spec.padX;
    main.itemSpacing = spec.gap;
    main.fills = [];

    const label = figma.createText();
    const styleObj = styleByName[spec.fontStyle];
    if (styleObj) {
      try { await figma.loadFontAsync(styleObj.fontName); } catch (e) { /* ignore */ }
    }
    label.characters = 'Button';
    if (styleObj) await label.setTextStyleIdAsync(styleObj.id);
    if (text) label.fills = [paintFor(text)];
    main.appendChild(label);
    comp.appendChild(main);

    // Divider
    const div = figma.createFrame();
    div.name = 'Divider';
    div.resize(1, spec.h);
    div.layoutMode = 'NONE';
    div.fills = divider ? [paintFor(divider)] : [];
    comp.appendChild(div);

    // Chevron segment — square w=h
    const chev = figma.createFrame();
    chev.name = 'Chevron';
    chev.layoutMode = 'HORIZONTAL';
    chev.primaryAxisSizingMode = 'FIXED';
    chev.counterAxisSizingMode = 'FIXED';
    chev.resize(spec.h, spec.h);
    chev.primaryAxisAlignItems = 'CENTER';
    chev.counterAxisAlignItems = 'CENTER';
    chev.fills = [];
    const chevSize = size === 'Small' ? 14 : size === 'Large' ? 18 : 16;
    const chevInst = chevronComp.createInstance();
    chevInst.resize(chevSize, chevSize);
    chevInst.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
    if (text) bindIconColor(chevInst, text);
    chev.appendChild(chevInst);
    comp.appendChild(chev);

    return comp;
  }

  const allVariants = [];
  for (const variant of SPLITBTN_VARIANTS) {
    for (const size of SPLITBTN_SIZES) {
      for (const state of BUTTON_STATES) {
        allVariants.push(await makeOneSplit(variant, size, state));
      }
    }
  }
  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'SplitButton';
  compSet.layoutMode = 'VERTICAL';
  compSet.itemSpacing = 24;
  compSet.counterAxisSpacing = 24;
  compSet.paddingLeft = compSet.paddingRight = 32;
  compSet.paddingTop = compSet.paddingBottom = 32;
  compSet.primaryAxisSizingMode = 'AUTO';
  compSet.counterAxisSizingMode = 'AUTO';

  const iconBtnSet = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'IconButton');
  if (iconBtnSet) {
    compSet.x = iconBtnSet.x;
    compSet.y = iconBtnSet.y + iconBtnSet.height + 80;
  }

  await buildSplitButtonShowcase(atomsPage, compSet, styleByName);
  figma.notify(`✅ SplitButton: ${allVariants.length} variants built.`);
}

async function buildSplitButtonShowcase(page, compSet, styleByName) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const appearanceCol = collections.find(c => c.name === '_Appearance');
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const appVar = (n) => allColorVars.find(v => v.variableCollectionId === appearanceCol.id && v.name === n);
  const surfaceBase = appVar('surface/base') || appVar('surface/card');
  const surfaceCard = appVar('surface/card');
  const borderDef = appVar('border/default');
  const textPri = appVar('text/primary');
  const textSec = appVar('text/secondary');

  function paintFor(varRef) {
    return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef);
  }
  async function makeLabel(text, styleName, colorVar) {
    const t = figma.createText();
    const s = styleByName[styleName];
    if (s) {
      try { await figma.loadFontAsync(s.fontName); } catch (e) { /* ignore */ }
      await t.setTextStyleIdAsync(s.id);
    }
    t.characters = text;
    if (colorVar) t.fills = [paintFor(colorVar)];
    return t;
  }
  const findVariant = (variant, size, state) =>
    compSet.children.find(c => c.name === `Variant=${variant}, Size=${size}, State=${state}`);

  const showcase = figma.createFrame();
  showcase.name = 'SplitButton — Showcase';
  showcase.layoutMode = 'VERTICAL';
  showcase.itemSpacing = 32;
  showcase.paddingLeft = showcase.paddingRight = 48;
  showcase.paddingTop = showcase.paddingBottom = 48;
  showcase.primaryAxisSizingMode = 'AUTO';
  showcase.counterAxisSizingMode = 'AUTO';
  showcase.fills = [paintFor(surfaceBase)];
  page.appendChild(showcase);
  showcase.x = compSet.x + compSet.width + 100;
  showcase.y = compSet.y;

  showcase.appendChild(await makeLabel('SplitButton', 'Heading/H1', textPri));
  const sub = await makeLabel('Main action + dropdown chevron. Whole-button states (segments highlight together).', 'Body/Default', textSec);
  sub.layoutAlign = 'STRETCH'; sub.textAutoResize = 'HEIGHT';
  showcase.appendChild(sub);

  const CELL_W = { Small: 130, Medium: 140, Default: 150, Large: 160 };

  for (const variant of SPLITBTN_VARIANTS) {
    const section = figma.createFrame();
    section.layoutMode = 'VERTICAL';
    section.itemSpacing = 16;
    section.paddingLeft = section.paddingRight = 24;
    section.paddingTop = section.paddingBottom = 24;
    section.cornerRadius = 12;
    section.primaryAxisSizingMode = 'AUTO';
    section.counterAxisSizingMode = 'AUTO';
    section.fills = [paintFor(surfaceCard)];
    section.strokes = [paintFor(borderDef)];
    section.strokeWeight = 1;
    section.appendChild(await makeLabel(variant, 'Heading/H4', textPri));

    const grid = figma.createFrame();
    grid.layoutMode = 'VERTICAL';
    grid.itemSpacing = 12;
    grid.fills = [];
    grid.primaryAxisSizingMode = 'AUTO';
    grid.counterAxisSizingMode = 'AUTO';

    const header = figma.createFrame();
    header.layoutMode = 'HORIZONTAL';
    header.itemSpacing = 24;
    header.fills = [];
    header.counterAxisAlignItems = 'CENTER';
    header.primaryAxisSizingMode = 'AUTO';
    header.counterAxisSizingMode = 'AUTO';
    const corner = figma.createFrame(); corner.resize(80, 20); corner.fills = [];
    header.appendChild(corner);
    for (const size of SPLITBTN_SIZES) {
      const cell = figma.createFrame();
      cell.resize(CELL_W[size], 20);
      cell.fills = [];
      cell.layoutMode = 'HORIZONTAL';
      cell.primaryAxisAlignItems = 'CENTER';
      cell.counterAxisAlignItems = 'CENTER';
      cell.appendChild(await makeLabel(size, 'Label/Default', textSec));
      header.appendChild(cell);
    }
    grid.appendChild(header);

    for (const state of BUTTON_STATES) {
      const row = figma.createFrame();
      row.layoutMode = 'HORIZONTAL';
      row.itemSpacing = 24;
      row.fills = [];
      row.counterAxisAlignItems = 'CENTER';
      row.primaryAxisSizingMode = 'AUTO';
      row.counterAxisSizingMode = 'AUTO';
      const stateCell = figma.createFrame();
      stateCell.resize(80, 48); stateCell.fills = [];
      stateCell.layoutMode = 'HORIZONTAL';
      stateCell.counterAxisAlignItems = 'CENTER';
      stateCell.appendChild(await makeLabel(state, 'Label/Default', textSec));
      row.appendChild(stateCell);
      for (const size of SPLITBTN_SIZES) {
        const v = findVariant(variant, size, state);
        const cell = figma.createFrame();
        cell.resize(CELL_W[size], 48);
        cell.fills = [];
        cell.layoutMode = 'HORIZONTAL';
        cell.primaryAxisAlignItems = 'CENTER';
        cell.counterAxisAlignItems = 'CENTER';
        if (v) cell.appendChild(v.createInstance());
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }
    section.appendChild(grid);
    showcase.appendChild(section);
  }
}

// =============================================================================
// BUILD CHECKBOX
// 3 sizes (Small/Default/Large) × 4 states (Default/Hover/Active/Disabled)
//   × 3 checked-states (Unchecked/Checked/Indeterminate) = 36 variants.
// Boolean property "Has Label" toggles the label visibility.
// Disabled state uses the same opacity-dim trick as Button.
// =============================================================================
const CHECKBOX_SIZES = ['Small', 'Default', 'Large'];
const CHECKBOX_STATES = ['Default', 'Hover', 'Pressed', 'Disabled'];
const CHECKBOX_CHECKED = ['Unchecked', 'Checked', 'Indeterminate'];
// Content layouts: None = box only · Label = box + label · TitleDescription = box + bold title + secondary description
const CHECKBOX_CONTENT = ['None', 'Label', 'TitleDescription'];
const CHECKBOX_SIZE_SPECS = {
  Small:   { box: 14, icon: 10, radius: 3, gap: 6,  fontStyle: 'Body/Small', titleStyle: 'Label/Default', descStyle: 'Body/Small' },
  Default: { box: 16, icon: 12, radius: 3, gap: 8,  fontStyle: 'Body/Default', titleStyle: 'Heading/H5',    descStyle: 'Body/Default' },
  Large:   { box: 20, icon: 14, radius: 4, gap: 10, fontStyle: 'Body/Default', titleStyle: 'Heading/H4',    descStyle: 'Body/Default' },
};

async function buildCheckbox() {
  console.log('[OM DS] buildCheckbox started');
  try { await figma.loadAllPagesAsync(); } catch (e) { /* ignore */ }

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const appearanceCol = collections.find(c => c.name === '_Appearance');
  const themeCol = collections.find(c => c.name === '_Theme');
  const primitivesCol = collections.find(c => c.name === '_Primitives');
  if (!appearanceCol || !themeCol || !primitivesCol) {
    figma.notify('❌ Missing _Appearance / _Theme / _Primitives. Run Bootstrap first.', { error: true });
    return;
  }
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const findVar = (cid, n) => allColorVars.find(v => v.variableCollectionId === cid && v.name === n);
  const appBy = (n) => findVar(appearanceCol.id, n);
  const thBy  = (n) => findVar(themeCol.id, n);

  const required = {
    'brand/primary':         thBy('brand/primary'),
    'brand/primary-hover':   thBy('brand/primary-hover'),
    'brand/primary-active':  thBy('brand/primary-active'),
    'brand/primary-subtle':  thBy('brand/primary-subtle'),
    'brand/primary-muted':   thBy('brand/primary-muted'),
    'brand/on-primary':      thBy('brand/on-primary'),
    'surface/card':          appBy('surface/card'),
    'text/primary':          appBy('text/primary'),
    'text/secondary':        appBy('text/secondary'),
    'border/default':        appBy('border/default'),
    'border/strong':         appBy('border/strong'),
    'icon/default':          appBy('icon/default'),
    'state/disabled-bg':     appBy('state/disabled-bg'),
    'state/disabled-text':   appBy('state/disabled-text'),
    'state/disabled-border': appBy('state/disabled-border'),
  };
  for (const k of Object.keys(required)) {
    if (!required[k]) {
      figma.notify(`❌ Missing variable ${k}. Run Bootstrap.`, { error: true });
      return;
    }
  }

  // ---- Component/Checkbox token collection ----
  const cbCol = await getOrCreateCollection('Component/Checkbox', ['Default']);
  const FILL = ['FRAME_FILL', 'SHAPE_FILL'];
  const TEXT = ['TEXT_FILL'];
  const STRK = ['STROKE_COLOR'];

  async function cbAlias(name, src, scopes) {
    const v = await getOrCreateVariable(name, cbCol, 'COLOR');
    aliasByMode(v, cbCol, 'Default', src);
    if (scopes) { try { v.scopes = scopes; } catch (e) {} }
    return v;
  }

  const cb = {
    // Box bg — unchecked default+disabled have NO bg fill (handled in pickBoxTokens)
    'box-bg/unchecked-hover':   await cbAlias('box-bg/unchecked-hover',   required['brand/primary-subtle'],FILL),
    'box-bg/unchecked-active':  await cbAlias('box-bg/unchecked-active',  required['brand/primary-muted'], FILL),
    'box-bg/checked-default':   await cbAlias('box-bg/checked-default',   required['brand/primary'],       FILL),
    'box-bg/checked-hover':     await cbAlias('box-bg/checked-hover',     required['brand/primary-hover'], FILL),
    'box-bg/checked-active':    await cbAlias('box-bg/checked-active',    required['brand/primary-active'],FILL),
    'box-bg/checked-disabled':  await cbAlias('box-bg/checked-disabled',  required['brand/primary-muted'], FILL),
    // Box border
    'box-border/unchecked':         await cbAlias('box-border/unchecked',         required['border/strong'],    STRK),
    'box-border/unchecked-hover':   await cbAlias('box-border/unchecked-hover',   required['brand/primary'],    STRK),
    'box-border/unchecked-active':  await cbAlias('box-border/unchecked-active',  required['brand/primary'],    STRK),
    'box-border/unchecked-disabled':await cbAlias('box-border/unchecked-disabled',required['state/disabled-border'], STRK),
    'box-border/checked':           await cbAlias('box-border/checked',           required['brand/primary'],    STRK),
    'box-border/checked-hover':     await cbAlias('box-border/checked-hover',     required['brand/primary-hover'], STRK),
    'box-border/checked-active':    await cbAlias('box-border/checked-active',    required['brand/primary-active'],STRK),
    'box-border/checked-disabled':  await cbAlias('box-border/checked-disabled',  required['brand/primary-muted'], STRK),
    // Check mark (default white; disabled = muted brand text so it shows on muted bg)
    'check-icon':          await cbAlias('check-icon',          required['brand/on-primary'], FILL),
    'check-icon-disabled': await cbAlias('check-icon-disabled', required['brand/primary'],    FILL),
    // Labels
    'label-text':          await cbAlias('label-text',          required['text/primary'],     TEXT),
    'label-text-disabled': await cbAlias('label-text-disabled', required['state/disabled-text'], TEXT),
    'title-text':          await cbAlias('title-text',          required['text/primary'],     TEXT),
    'desc-text':           await cbAlias('desc-text',           required['text/secondary'],   TEXT),
  };

  // ---- Atoms page + glyph icons ----
  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);
  // Idempotency: remove existing Checkbox set + showcase + decoration wrapper
  const _existCb = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Checkbox');
  if (_existCb) _existCb.remove();
  const _existCbShow = atomsPage.findOne(n => n.name === 'Checkbox — Showcase');
  if (_existCbShow) _existCbShow.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Checkbox')) n.remove();
  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  const checkComp = await findOrCreateIconComponent('check', iconsPage, required['icon/default']);
  const minusComp = await findOrCreateIconComponent('minus', iconsPage, required['icon/default']);
  if (!checkComp || !minusComp) {
    figma.notify('❌ Could not find/create check or minus icon.', { error: true });
    return;
  }

  // Load fonts
  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  const fontsToLoad = new Set();
  for (const k of Object.keys(CHECKBOX_SIZE_SPECS)) {
    const spec = CHECKBOX_SIZE_SPECS[k];
    for (const key of ['fontStyle', 'titleStyle', 'descStyle']) {
      const st = styleByName[spec[key]];
      if (st) fontsToLoad.add(JSON.stringify(st.fontName));
    }
  }
  for (const f of fontsToLoad) await figma.loadFontAsync(JSON.parse(f));
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  function paintFor(varRef) {
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef
    );
  }
  function bindIconColor(node, colorVar) {
    if ('fills' in node && Array.isArray(node.fills) && node.fills.length) {
      node.fills = node.fills.map(p => p.type === 'SOLID' && p.visible !== false
        ? figma.variables.setBoundVariableForPaint(p, 'color', colorVar) : p);
    }
    if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length) {
      node.strokes = node.strokes.map(p => p.type === 'SOLID' && p.visible !== false
        ? figma.variables.setBoundVariableForPaint(p, 'color', colorVar) : p);
    }
    if ('children' in node) for (const c of node.children) bindIconColor(c, colorVar);
  }

  function pickBoxTokens(state, checked) {
    const stKey = state.toLowerCase() === 'pressed' ? 'active' : state.toLowerCase();
    const isChecked = checked !== 'Unchecked';
    const prefix = isChecked ? 'checked' : 'unchecked';
    let bg = cb[`box-bg/${prefix}-${stKey}`] || cb[`box-bg/${prefix}-default`];
    // Unchecked Default + Disabled: no bg fill at all (empty fills array, not transparent token)
    if (!isChecked && (state === 'Default' || state === 'Disabled')) bg = null;
    // Active = hollow ring style (no fill, surface shows through)
    if (state === 'Pressed') bg = null;
    let borderKey;
    if (state === 'Disabled') borderKey = `${prefix}-disabled`;
    else if (stKey === 'hover') borderKey = `${prefix}-hover`;
    else if (stKey === 'active') borderKey = `${prefix}-active`;
    else borderKey = isChecked ? 'checked' : 'unchecked';
    const border = cb[`box-border/${borderKey}`] || cb[`box-border/${isChecked ? 'checked' : 'unchecked'}`];
    return { bg, border };
  }

  // ---- Build one variant ----
  async function makeOneVariant(size, state, checked, content) {
    const spec = CHECKBOX_SIZE_SPECS[size];
    const { bg, border } = pickBoxTokens(state, checked);

    const comp = figma.createComponent();
    comp.name = `Size=${size}, State=${state}, Checked=${checked}, Content=${content}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.primaryAxisAlignItems = content === 'TitleDescription' ? 'MIN' : 'CENTER';
    comp.counterAxisAlignItems = content === 'TitleDescription' ? 'MIN' : 'CENTER';
    comp.itemSpacing = content === 'None' ? 0 : spec.gap;
    comp.paddingLeft = comp.paddingRight = comp.paddingTop = comp.paddingBottom = 0;
    comp.fills = [];
    // No opacity dim — use real disabled tokens (so look stays consistent on any bg)

    // The box (frame) — fixed square via FIXED sizing modes
    const box = figma.createFrame();
    box.name = 'Box';
    box.layoutMode = 'HORIZONTAL';
    box.primaryAxisSizingMode = 'FIXED';
    box.counterAxisSizingMode = 'FIXED';
    box.primaryAxisAlignItems = 'CENTER';
    box.counterAxisAlignItems = 'CENTER';
    box.paddingLeft = box.paddingRight = box.paddingTop = box.paddingBottom = 0;
    box.itemSpacing = 0;
    box.resize(spec.box, spec.box);
    box.cornerRadius = spec.radius;
    box.fills = bg ? [paintFor(bg)] : [];
    box.strokes = [paintFor(border)];
    // Active = thicker hollow ring; others = 1.5px
    box.strokeWeight = 1;
    box.strokeAlign = 'INSIDE';
    box.layoutAlign = 'INHERIT';
    box.layoutGrow = 0;

    // Check icon (only if Checked or Indeterminate, and NOT Active — Active is a hollow ring)
    if (checked !== 'Unchecked' && state !== 'Pressed') {
      const glyphSrc = checked === 'Indeterminate' ? minusComp : checkComp;
      const ic = glyphSrc.createInstance();
      ic.resize(spec.icon, spec.icon);
      ic.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
      const checkColor = state === 'Disabled' ? cb['check-icon-disabled'] : cb['check-icon'];
      bindIconColor(ic, checkColor);
      box.appendChild(ic);
    }

    // For Title+Description layout, wrap the box in a frame with top padding so
    // the box visually aligns with the center of the title's first line.
    if (content === 'TitleDescription') {
      const tStyle = styleByName[spec.titleStyle];
      // Estimate title line height: prefer style's lineHeight if pixel-based, else 1.4× font size.
      let titleLine = spec.box; // fallback
      if (tStyle && tStyle.fontSize) {
        const lh = tStyle.lineHeight;
        titleLine = (lh && lh.unit === 'PIXELS') ? lh.value : Math.round(tStyle.fontSize * 1.4);
      }
      const topPad = Math.max(0, Math.round((titleLine - spec.box) / 2));
      const wrap = figma.createFrame();
      wrap.name = 'Box-Wrap';
      wrap.layoutMode = 'VERTICAL';
      wrap.primaryAxisSizingMode = 'AUTO';
      wrap.counterAxisSizingMode = 'AUTO';
      wrap.paddingLeft = wrap.paddingRight = wrap.paddingBottom = 0;
      wrap.paddingTop = topPad;
      wrap.itemSpacing = 0;
      wrap.fills = [];
      wrap.appendChild(box);
      comp.appendChild(wrap);
    } else {
      comp.appendChild(box);
    }

    // Content slot
    const labelColorVar = state === 'Disabled' ? cb['label-text-disabled'] : cb['label-text'];
    const titleColorVar = state === 'Disabled' ? cb['label-text-disabled'] : cb['title-text'];
    const descColorVar  = state === 'Disabled' ? cb['label-text-disabled'] : cb['desc-text'];
    if (content === 'Label') {
      const label = figma.createText();
      const fStyle = styleByName[spec.fontStyle];
      if (fStyle) {
        try { await figma.loadFontAsync(fStyle.fontName); } catch (e) {}
        await label.setTextStyleIdAsync(fStyle.id);
      }
      label.characters = 'Label';
      label.fills = [paintFor(labelColorVar)];
      label.name = 'Label';
      comp.appendChild(label);
    } else if (content === 'TitleDescription') {
      // Vertical stack: Title (bold) above Description (secondary)
      const stack = figma.createFrame();
      stack.name = 'Text';
      stack.layoutMode = 'VERTICAL';
      stack.primaryAxisSizingMode = 'AUTO';
      stack.counterAxisSizingMode = 'AUTO';
      stack.itemSpacing = 4;
      stack.paddingLeft = stack.paddingRight = stack.paddingTop = stack.paddingBottom = 0;
      stack.fills = [];

      const title = figma.createText();
      const tStyle = styleByName[spec.titleStyle];
      if (tStyle) {
        try { await figma.loadFontAsync(tStyle.fontName); } catch (e) {}
        await title.setTextStyleIdAsync(tStyle.id);
      }
      title.characters = 'Title';
      title.fills = [paintFor(titleColorVar)];
      title.name = 'Title';
      stack.appendChild(title);

      const desc = figma.createText();
      const dStyle = styleByName[spec.descStyle];
      if (dStyle) {
        try { await figma.loadFontAsync(dStyle.fontName); } catch (e) {}
        await desc.setTextStyleIdAsync(dStyle.id);
      }
      desc.characters = 'Description text';
      desc.fills = [paintFor(descColorVar)];
      desc.name = 'Description';
      stack.appendChild(desc);

      comp.appendChild(stack);
    }

    return { component: comp };
  }

  // ---- Build all variants ----
  const allVariants = [];
  const variantMeta = [];
  for (const size of CHECKBOX_SIZES) {
    for (const state of CHECKBOX_STATES) {
      for (const checked of CHECKBOX_CHECKED) {
        for (const content of CHECKBOX_CONTENT) {
          const { component } = await makeOneVariant(size, state, checked, content);
          allVariants.push(component);
          variantMeta.push({ size, state, checked, content });
        }
      }
    }
  }

  // ---- Combine into a component set ----
  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Checkbox';

  // ---- Manual 2D grid positioning ----
  // Columns: outer = Content (None | Label | Title+Description), inner = Size
  const COL_W = {
    None:             { Small: 60,  Default: 70,  Large: 80  },
    Label:            { Small: 110, Default: 120, Large: 140 },
    TitleDescription: { Small: 200, Default: 220, Large: 240 },
  };
  const ROW_H = 80; // taller to accommodate Title+Description rows
  const GROUP_GAP = 96;
  const CONTENT_GAP = 56;
  const PAD_LEFT = 200;
  const PAD_TOP = 120;
  const PAD_RIGHT = 48;
  const PAD_BOT = 48;

  // Build column groups: one per Content type
  const colGroups = [];
  const cellX = {}; // keyed by `${content}|${size}` → center X
  let cx = PAD_LEFT;
  for (const ct of CHECKBOX_CONTENT) {
    const groupStart = cx;
    const sizesArr = [];
    let groupW = 0;
    for (const s of CHECKBOX_SIZES) {
      const w = COL_W[ct][s];
      sizesArr.push({ name: s, x: cx, width: w });
      cellX[`${ct}|${s}`] = cx + w / 2;
      cx += w;
      groupW += w;
    }
    const displayName = ct === 'TitleDescription' ? 'Title + Description' : ct;
    colGroups.push({ name: displayName, x: groupStart, width: groupW, sizes: sizesArr });
    cx += CONTENT_GAP;
  }

  // Row groups: one per Checked state, each containing 4 button-states
  const rowGroups = [];
  let cy = PAD_TOP;
  const stateY = {}; // keyed by `${checked}|${state}` → top-Y
  for (const ch of CHECKBOX_CHECKED) {
    const states = CHECKBOX_STATES.map((st, i) => {
      const y = cy + i * ROW_H;
      stateY[`${ch}|${st}`] = y;
      return { name: st, y, height: ROW_H };
    });
    rowGroups.push({ name: ch, y: cy, states });
    cy += CHECKBOX_STATES.length * ROW_H + GROUP_GAP;
  }

  compSet.layoutMode = 'NONE';
  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    const colCx = cellX[`${m.content}|${m.size}`];
    const rowCy = stateY[`${m.checked}|${m.state}`] + ROW_H / 2;
    v.x = Math.round(colCx - v.width / 2);
    v.y = Math.round(rowCy - v.height / 2);
  }
  const totalW = cx + PAD_RIGHT;
  const totalH = cy + PAD_BOT;
  compSet.resize(totalW, totalH);
  compSet.fills = [];

  // Position the Checkbox set BELOW any existing component sets on the page
  // (e.g., next to the Button comp set) so it doesn't overlap.
  let maxBottom = 0;
  for (const node of atomsPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) {
      const bottom = node.y + node.height;
      if (bottom > maxBottom) maxBottom = bottom;
    }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  // ---- Decorate (labels + dashed separators) ----
  await decorateComponentSet({
    page: atomsPage,
    compSet,
    colGroups,
    rowGroups,
    padTop: PAD_TOP,
    padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Checkbox',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Checkbox built: ${allVariants.length} variants. Component/Checkbox has ${Object.keys(cb).length} tokens.`);
}

// =============================================================================
// RADIO — Round selection control (single-choice). Mirrors Checkbox structure.
// 3 sizes × 4 states × 2 selected (Off/On) × 3 content (None/Label/TitleDescription)
// =============================================================================
const RADIO_SIZES    = ['Small', 'Default', 'Large'];
const RADIO_STATES   = ['Default', 'Hover', 'Pressed', 'Disabled'];
const RADIO_SELECTED = ['Off', 'On'];
const RADIO_CONTENT  = ['None', 'Label', 'TitleDescription'];
const RADIO_SIZE_SPECS = {
  Small:   { box: 14, dot: 6,  gap: 6,  fontStyle: 'Body/Small', titleStyle: 'Label/Default', descStyle: 'Body/Small' },
  Default: { box: 16, dot: 8,  gap: 8,  fontStyle: 'Body/Default', titleStyle: 'Heading/H5',    descStyle: 'Body/Default' },
  Large:   { box: 20, dot: 10, gap: 10, fontStyle: 'Body/Default', titleStyle: 'Heading/H4',    descStyle: 'Body/Default' },
};

async function buildRadio() {
  console.log('[OM DS] buildRadio started');
  try { await figma.loadAllPagesAsync(); } catch (e) { /* ignore */ }

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const appearanceCol = collections.find(c => c.name === '_Appearance');
  const themeCol = collections.find(c => c.name === '_Theme');
  if (!appearanceCol || !themeCol) {
    figma.notify('❌ Missing _Appearance / _Theme. Run Bootstrap first.', { error: true });
    return;
  }
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const findVar = (cid, n) => allColorVars.find(v => v.variableCollectionId === cid && v.name === n);
  const appBy = (n) => findVar(appearanceCol.id, n);
  const thBy  = (n) => findVar(themeCol.id, n);

  const required = {
    'brand/primary':         thBy('brand/primary'),
    'brand/primary-hover':   thBy('brand/primary-hover'),
    'brand/primary-active':  thBy('brand/primary-active'),
    'brand/primary-subtle':  thBy('brand/primary-subtle'),
    'brand/primary-muted':   thBy('brand/primary-muted'),
    'brand/on-primary':      thBy('brand/on-primary'),
    'surface/card':          appBy('surface/card'),
    'text/primary':          appBy('text/primary'),
    'text/secondary':        appBy('text/secondary'),
    'border/default':        appBy('border/default'),
    'border/strong':         appBy('border/strong'),
    'state/disabled-text':   appBy('state/disabled-text'),
    'state/disabled-border': appBy('state/disabled-border'),
  };
  for (const k of Object.keys(required)) {
    if (!required[k]) { figma.notify(`❌ Missing ${k}. Run Bootstrap.`, { error: true }); return; }
  }

  const radCol = await getOrCreateCollection('Component/Radio', ['Default']);
  const FILL = ['FRAME_FILL', 'SHAPE_FILL'];
  const TEXT = ['TEXT_FILL'];
  const STRK = ['STROKE_COLOR'];
  async function rAlias(name, src, scopes) {
    const v = await getOrCreateVariable(name, radCol, 'COLOR');
    aliasByMode(v, radCol, 'Default', src);
    if (scopes) { try { v.scopes = scopes; } catch (e) {} }
    return v;
  }
  const rad = {
    'box-bg/off-hover':      await rAlias('box-bg/off-hover',      required['brand/primary-subtle'], FILL),
    'box-bg/off-active':     await rAlias('box-bg/off-active',     required['brand/primary-muted'],  FILL),
    'box-border/off':        await rAlias('box-border/off',        required['border/strong'],        STRK),
    'box-border/off-hover':  await rAlias('box-border/off-hover',  required['brand/primary'],        STRK),
    'box-border/off-active': await rAlias('box-border/off-active', required['brand/primary'],        STRK),
    'box-border/off-disabled': await rAlias('box-border/off-disabled', required['state/disabled-border'], STRK),
    // Selected: filled brand circle, white dot in center (matches Button Primary look).
    'box-bg/on':             await rAlias('box-bg/on',             required['brand/primary'],        FILL),
    'box-bg/on-hover':       await rAlias('box-bg/on-hover',       required['brand/primary-hover'],  FILL),
    'box-bg/on-active':      await rAlias('box-bg/on-active',      required['brand/primary-active'], FILL),
    'box-bg/on-disabled':    await rAlias('box-bg/on-disabled',    required['brand/primary-muted'],  FILL),
    'box-border/on':         await rAlias('box-border/on',         required['brand/primary'],        STRK),
    'box-border/on-hover':   await rAlias('box-border/on-hover',   required['brand/primary-hover'],  STRK),
    'box-border/on-active':  await rAlias('box-border/on-active',  required['brand/primary-active'], STRK),
    'box-border/on-disabled':await rAlias('box-border/on-disabled',required['brand/primary-muted'], STRK),
    'dot':                   await rAlias('dot',                   required['brand/on-primary'],     FILL),
    'dot-disabled':          await rAlias('dot-disabled',          required['brand/on-primary'],     FILL),
    'label-text':            await rAlias('label-text',            required['text/primary'],         TEXT),
    'label-text-disabled':   await rAlias('label-text-disabled',   required['state/disabled-text'],  TEXT),
    'title-text':            await rAlias('title-text',            required['text/primary'],         TEXT),
    'desc-text':             await rAlias('desc-text',             required['text/secondary'],       TEXT),
  };

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);
  // Idempotency: remove existing Radio set + showcase + decoration wrapper
  const _existRd = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Radio');
  if (_existRd) _existRd.remove();
  const _existRdShow = atomsPage.findOne(n => n.name === 'Radio — Showcase');
  if (_existRdShow) _existRdShow.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Radio')) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  const fontsToLoad = new Set();
  for (const k of Object.keys(RADIO_SIZE_SPECS)) {
    const spec = RADIO_SIZE_SPECS[k];
    for (const key of ['fontStyle', 'titleStyle', 'descStyle']) {
      const st = styleByName[spec[key]];
      if (st) fontsToLoad.add(JSON.stringify(st.fontName));
    }
  }
  for (const f of fontsToLoad) await figma.loadFontAsync(JSON.parse(f));
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  function paintFor(varRef) {
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef);
  }
  function pickRadioTokens(state, selected) {
    const stKey = state.toLowerCase() === 'pressed' ? 'active' : state.toLowerCase();
    const isOn = selected === 'On';
    const prefix = isOn ? 'on' : 'off';
    let bg = null;
    if (isOn) {
      // On = filled brand circle in every state
      const bgKey = state === 'Disabled' ? 'on-disabled'
        : (stKey === 'hover' ? 'on-hover' : (stKey === 'active' ? 'on-active' : 'on'));
      bg = rad[`box-bg/${bgKey}`];
    } else if (stKey === 'hover' || stKey === 'active') {
      bg = rad[`box-bg/off-${stKey}`];
    }
    let borderKey;
    if (state === 'Disabled') borderKey = `${prefix}-disabled`;
    else if (stKey === 'hover') borderKey = `${prefix}-hover`;
    else if (stKey === 'active') borderKey = `${prefix}-active`;
    else borderKey = prefix;
    const border = rad[`box-border/${borderKey}`];
    return { bg, border };
  }

  async function makeRadioVariant(size, state, selected, content) {
    const spec = RADIO_SIZE_SPECS[size];
    const { bg, border } = pickRadioTokens(state, selected);
    const comp = figma.createComponent();
    comp.name = `Size=${size}, State=${state}, Selected=${selected}, Content=${content}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.primaryAxisAlignItems = content === 'TitleDescription' ? 'MIN' : 'CENTER';
    comp.counterAxisAlignItems = content === 'TitleDescription' ? 'MIN' : 'CENTER';
    comp.itemSpacing = content === 'None' ? 0 : spec.gap;
    comp.fills = [];

    // Outer circle (box)
    const box = figma.createFrame();
    box.name = 'Ring';
    box.layoutMode = 'HORIZONTAL';
    box.primaryAxisSizingMode = 'FIXED';
    box.counterAxisSizingMode = 'FIXED';
    box.primaryAxisAlignItems = 'CENTER';
    box.counterAxisAlignItems = 'CENTER';
    box.resize(spec.box, spec.box);
    box.cornerRadius = spec.box / 2; // perfect circle
    box.fills = bg ? [paintFor(bg)] : [];
    box.strokes = [paintFor(border)];
    box.strokeWeight = 1;
    box.strokeAlign = 'INSIDE';

    // Inner dot (only when On)
    if (selected === 'On') {
      const dot = figma.createEllipse();
      dot.name = 'Dot';
      dot.resize(spec.dot, spec.dot);
      const dotColor = state === 'Disabled' ? rad['dot-disabled'] : rad['dot'];
      dot.fills = [paintFor(dotColor)];
      box.appendChild(dot);
    }

    // Box-Wrap with top padding for TitleDescription alignment
    if (content === 'TitleDescription') {
      const tStyle = styleByName[spec.titleStyle];
      let titleLine = spec.box;
      if (tStyle && tStyle.fontSize) {
        const lh = tStyle.lineHeight;
        titleLine = (lh && lh.unit === 'PIXELS') ? lh.value : Math.round(tStyle.fontSize * 1.4);
      }
      const topPad = Math.max(0, Math.round((titleLine - spec.box) / 2));
      const wrap = figma.createFrame();
      wrap.name = 'Box-Wrap';
      wrap.layoutMode = 'VERTICAL';
      wrap.primaryAxisSizingMode = 'AUTO';
      wrap.counterAxisSizingMode = 'AUTO';
      wrap.paddingTop = topPad;
      wrap.fills = [];
      wrap.appendChild(box);
      comp.appendChild(wrap);
    } else {
      comp.appendChild(box);
    }

    const labelColor = state === 'Disabled' ? rad['label-text-disabled'] : rad['label-text'];
    const titleColor = state === 'Disabled' ? rad['label-text-disabled'] : rad['title-text'];
    const descColor  = state === 'Disabled' ? rad['label-text-disabled'] : rad['desc-text'];
    if (content === 'Label') {
      const label = figma.createText();
      const fStyle = styleByName[spec.fontStyle];
      if (fStyle) await label.setTextStyleIdAsync(fStyle.id);
      label.characters = 'Label';
      label.fills = [paintFor(labelColor)];
      label.name = 'Label';
      comp.appendChild(label);
    } else if (content === 'TitleDescription') {
      const stack = figma.createFrame();
      stack.name = 'Text';
      stack.layoutMode = 'VERTICAL';
      stack.primaryAxisSizingMode = 'AUTO';
      stack.counterAxisSizingMode = 'AUTO';
      stack.itemSpacing = 4;
      stack.fills = [];
      const title = figma.createText();
      const tStyle = styleByName[spec.titleStyle];
      if (tStyle) await title.setTextStyleIdAsync(tStyle.id);
      title.characters = 'Title';
      title.fills = [paintFor(titleColor)];
      title.name = 'Title';
      stack.appendChild(title);
      const desc = figma.createText();
      const dStyle = styleByName[spec.descStyle];
      if (dStyle) await desc.setTextStyleIdAsync(dStyle.id);
      desc.characters = 'Description text';
      desc.fills = [paintFor(descColor)];
      desc.name = 'Description';
      stack.appendChild(desc);
      comp.appendChild(stack);
    }

    return comp;
  }

  const allVariants = [];
  const variantMeta = [];
  for (const size of RADIO_SIZES) {
    for (const state of RADIO_STATES) {
      for (const sel of RADIO_SELECTED) {
        for (const content of RADIO_CONTENT) {
          const c = await makeRadioVariant(size, state, sel, content);
          allVariants.push(c);
          variantMeta.push({ size, state, selected: sel, content });
        }
      }
    }
  }

  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Radio';
  compSet.layoutMode = 'NONE';

  const COL_W = {
    None:             { Small: 60,  Default: 70,  Large: 80  },
    Label:            { Small: 110, Default: 120, Large: 140 },
    TitleDescription: { Small: 200, Default: 220, Large: 240 },
  };
  const ROW_H = 80;
  const GROUP_GAP = 96;
  const CONTENT_GAP = 56;
  const PAD_LEFT = 200;
  const PAD_TOP = 120;
  const PAD_RIGHT = 48;
  const PAD_BOT = 48;

  const colGroups = [];
  const cellX = {};
  let cx = PAD_LEFT;
  for (const ct of RADIO_CONTENT) {
    const groupStart = cx;
    const sizesArr = [];
    let groupW = 0;
    for (const s of RADIO_SIZES) {
      const w = COL_W[ct][s];
      sizesArr.push({ name: s, x: cx, width: w });
      cellX[`${ct}|${s}`] = cx + w / 2;
      cx += w;
      groupW += w;
    }
    const displayName = ct === 'TitleDescription' ? 'Title + Description' : ct;
    colGroups.push({ name: displayName, x: groupStart, width: groupW, sizes: sizesArr });
    cx += CONTENT_GAP;
  }

  const rowGroups = [];
  let cy = PAD_TOP;
  const stateY = {};
  for (const sel of RADIO_SELECTED) {
    const states = RADIO_STATES.map((st, i) => {
      const y = cy + i * ROW_H;
      stateY[`${sel}|${st}`] = y;
      return { name: st, y, height: ROW_H };
    });
    rowGroups.push({ name: sel, y: cy, states });
    cy += RADIO_STATES.length * ROW_H + GROUP_GAP;
  }

  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    const colCx = cellX[`${m.content}|${m.size}`];
    const rowCy = stateY[`${m.selected}|${m.state}`] + ROW_H / 2;
    v.x = Math.round(colCx - v.width / 2);
    v.y = Math.round(rowCy - v.height / 2);
  }
  compSet.resize(cx + PAD_RIGHT, cy + PAD_BOT);
  compSet.fills = [];

  let maxBottom = 0;
  for (const node of atomsPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) {
      const bottom = node.y + node.height;
      if (bottom > maxBottom) maxBottom = bottom;
    }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  await decorateComponentSet({
    page: atomsPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Radio',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Radio built: ${allVariants.length} variants. Component/Radio has ${Object.keys(rad).length} tokens.`);
}

// =============================================================================
// TOGGLE (Switch) — Pill track with sliding thumb. Same axes as Radio.
// 3 sizes × 4 states × 2 on/off × 3 content
// =============================================================================
const TOGGLE_SIZES    = ['Small', 'Default', 'Large'];
const TOGGLE_STATES   = ['Default', 'Hover', 'Pressed', 'Disabled'];
const TOGGLE_SELECTED = ['Off', 'On'];
const TOGGLE_CONTENT  = ['None', 'Label', 'TitleDescription'];
const TOGGLE_SIZE_SPECS = {
  Small:   { trackH: 16, trackW: 28, thumb: 12, gap: 6,  pad: 2, fontStyle: 'Body/Small', titleStyle: 'Label/Default', descStyle: 'Body/Small' },
  Default: { trackH: 20, trackW: 36, thumb: 16, gap: 8,  pad: 2, fontStyle: 'Body/Default', titleStyle: 'Heading/H5',    descStyle: 'Body/Default' },
  Large:   { trackH: 24, trackW: 44, thumb: 20, gap: 10, pad: 2, fontStyle: 'Body/Default', titleStyle: 'Heading/H4',    descStyle: 'Body/Default' },
};

async function buildToggle() {
  console.log('[OM DS] buildToggle started');
  try { await figma.loadAllPagesAsync(); } catch (e) { /* ignore */ }

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const appearanceCol = collections.find(c => c.name === '_Appearance');
  const themeCol = collections.find(c => c.name === '_Theme');
  if (!appearanceCol || !themeCol) {
    figma.notify('❌ Missing _Appearance / _Theme. Run Bootstrap first.', { error: true });
    return;
  }
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const findVar = (cid, n) => allColorVars.find(v => v.variableCollectionId === cid && v.name === n);
  const appBy = (n) => findVar(appearanceCol.id, n);
  const thBy  = (n) => findVar(themeCol.id, n);

  const required = {
    'brand/primary':         thBy('brand/primary'),
    'brand/primary-hover':   thBy('brand/primary-hover'),
    'brand/primary-active':  thBy('brand/primary-active'),
    'brand/primary-subtle':  thBy('brand/primary-subtle'),
    'brand/primary-muted':   thBy('brand/primary-muted'),
    'brand/on-primary':      thBy('brand/on-primary'),
    'surface/card':          appBy('surface/card'),
    'text/primary':          appBy('text/primary'),
    'text/secondary':        appBy('text/secondary'),
    'border/default':        appBy('border/default'),
    'border/strong':         appBy('border/strong'),
    'icon/disabled':         appBy('icon/disabled'),
    'state/disabled-bg':     appBy('state/disabled-bg'),
    'state/disabled-text':   appBy('state/disabled-text'),
    'state/disabled-border': appBy('state/disabled-border'),
  };
  for (const k of Object.keys(required)) {
    if (!required[k]) { figma.notify(`❌ Missing ${k}. Run Bootstrap.`, { error: true }); return; }
  }

  const tgCol = await getOrCreateCollection('Component/Toggle', ['Default']);
  const FILL = ['FRAME_FILL', 'SHAPE_FILL'];
  const TEXT = ['TEXT_FILL'];
  const STRK_TOG = ['STROKE_COLOR'];
  async function tAlias(name, src, scopes) {
    const v = await getOrCreateVariable(name, tgCol, 'COLOR');
    aliasByMode(v, tgCol, 'Default', src);
    if (scopes) { try { v.scopes = scopes; } catch (e) {} }
    return v;
  }

  const tg = {
    // Off track: visible grey by default, brand-muted peach on hover, full brand preview on active (pressed)
    'track-bg/off-default':  await tAlias('track-bg/off-default',  required['icon/disabled'],        FILL),
    'track-bg/off-hover':    await tAlias('track-bg/off-hover',    required['brand/primary-muted'],  FILL),
    'track-bg/off-active':   await tAlias('track-bg/off-active',   required['brand/primary'],        FILL),
    'track-bg/off-disabled': await tAlias('track-bg/off-disabled', required['state/disabled-bg'],FILL),
    // On track: brand
    'track-bg/on-default':   await tAlias('track-bg/on-default',   required['brand/primary'],        FILL),
    'track-bg/on-hover':     await tAlias('track-bg/on-hover',     required['brand/primary-hover'],  FILL),
    'track-bg/on-active':    await tAlias('track-bg/on-active',    required['brand/primary-active'], FILL),
    'track-bg/on-disabled':  await tAlias('track-bg/on-disabled',  required['brand/primary-muted'],  FILL),
    // Track border (mirrors checkbox/radio): strong grey when off, brand when on
    'track-border/off-default':  await tAlias('track-border/off-default',  required['border/strong'],         STRK_TOG),
    'track-border/off-hover':    await tAlias('track-border/off-hover',    required['brand/primary'],         STRK_TOG),
    'track-border/off-active':   await tAlias('track-border/off-active',   required['brand/primary-active'],  STRK_TOG),
    'track-border/off-disabled': await tAlias('track-border/off-disabled', required['state/disabled-border'], STRK_TOG),
    'track-border/on-default':   await tAlias('track-border/on-default',   required['brand/primary'],         STRK_TOG),
    'track-border/on-hover':     await tAlias('track-border/on-hover',     required['brand/primary-hover'],   STRK_TOG),
    'track-border/on-active':    await tAlias('track-border/on-active',    required['brand/primary-active'],  STRK_TOG),
    'track-border/on-disabled':  await tAlias('track-border/on-disabled',  required['brand/primary-muted'],   STRK_TOG),
    // Thumb: white in both light and dark (matches button on-primary text color)
    'thumb-bg':              await tAlias('thumb-bg',              required['brand/on-primary'], FILL),
    'thumb-bg-disabled':     await tAlias('thumb-bg-disabled',     required['brand/on-primary'], FILL),
    'label-text':            await tAlias('label-text',            required['text/primary'],     TEXT),
    'label-text-disabled':   await tAlias('label-text-disabled',   required['state/disabled-text'], TEXT),
    'title-text':            await tAlias('title-text',            required['text/primary'],     TEXT),
    'desc-text':             await tAlias('desc-text',             required['text/secondary'],   TEXT),
  };

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);
  // Idempotency: remove existing Toggle set + showcase + decoration wrapper
  const _existTg = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Toggle');
  if (_existTg) _existTg.remove();
  const _existTgShow = atomsPage.findOne(n => n.name === 'Toggle — Showcase');
  if (_existTgShow) _existTgShow.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Toggle')) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  const fontsToLoad = new Set();
  for (const k of Object.keys(TOGGLE_SIZE_SPECS)) {
    const spec = TOGGLE_SIZE_SPECS[k];
    for (const key of ['fontStyle', 'titleStyle', 'descStyle']) {
      const st = styleByName[spec[key]];
      if (st) fontsToLoad.add(JSON.stringify(st.fontName));
    }
  }
  for (const f of fontsToLoad) await figma.loadFontAsync(JSON.parse(f));
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  function paintFor(varRef) {
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef);
  }
  function pickToggleTokens(state, selected) {
    const stKey = state.toLowerCase() === 'pressed' ? 'active' : state.toLowerCase();
    const prefix = selected === 'On' ? 'on' : 'off';
    const trackBg = tg[`track-bg/${prefix}-${stKey}`] || tg[`track-bg/${prefix}-default`];
    const trackBorder = tg[`track-border/${prefix}-${stKey}`] || tg[`track-border/${prefix}-default`];
    const thumb = state === 'Disabled' ? tg['thumb-bg-disabled'] : tg['thumb-bg'];
    return { trackBg, trackBorder, thumb };
  }

  async function makeToggleVariant(size, state, selected, content) {
    const spec = TOGGLE_SIZE_SPECS[size];
    const { trackBg, trackBorder, thumb } = pickToggleTokens(state, selected);
    const comp = figma.createComponent();
    comp.name = `Size=${size}, State=${state}, Selected=${selected}, Content=${content}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.primaryAxisAlignItems = content === 'TitleDescription' ? 'MIN' : 'CENTER';
    comp.counterAxisAlignItems = content === 'TitleDescription' ? 'MIN' : 'CENTER';
    comp.itemSpacing = content === 'None' ? 0 : spec.gap;
    comp.fills = [];

    // Track (pill)
    const track = figma.createFrame();
    track.name = 'Track';
    track.layoutMode = 'HORIZONTAL';
    track.primaryAxisSizingMode = 'FIXED';
    track.counterAxisSizingMode = 'FIXED';
    track.primaryAxisAlignItems = selected === 'On' ? 'MAX' : 'MIN';
    track.counterAxisAlignItems = 'CENTER';
    track.paddingLeft = track.paddingRight = spec.pad;
    track.paddingTop = track.paddingBottom = spec.pad;
    track.resize(spec.trackW, spec.trackH);
    track.cornerRadius = spec.trackH / 2;
    track.fills = [paintFor(trackBg)];
    track.strokes = [paintFor(trackBorder)];
    track.strokeWeight = 1;
    track.strokeAlign = 'INSIDE';

    // Thumb
    const thumbNode = figma.createFrame();
    thumbNode.name = 'Thumb';
    thumbNode.resize(spec.thumb, spec.thumb);
    thumbNode.cornerRadius = spec.thumb / 2;
    thumbNode.fills = [paintFor(thumb)];
    thumbNode.strokes = [];
    track.appendChild(thumbNode);

    if (content === 'TitleDescription') {
      const tStyle = styleByName[spec.titleStyle];
      let titleLine = spec.trackH;
      if (tStyle && tStyle.fontSize) {
        const lh = tStyle.lineHeight;
        titleLine = (lh && lh.unit === 'PIXELS') ? lh.value : Math.round(tStyle.fontSize * 1.4);
      }
      const topPad = Math.max(0, Math.round((titleLine - spec.trackH) / 2));
      const wrap = figma.createFrame();
      wrap.name = 'Track-Wrap';
      wrap.layoutMode = 'VERTICAL';
      wrap.primaryAxisSizingMode = 'AUTO';
      wrap.counterAxisSizingMode = 'AUTO';
      wrap.paddingTop = topPad;
      wrap.fills = [];
      wrap.appendChild(track);
      comp.appendChild(wrap);
    } else {
      comp.appendChild(track);
    }

    const labelColor = state === 'Disabled' ? tg['label-text-disabled'] : tg['label-text'];
    const titleColor = state === 'Disabled' ? tg['label-text-disabled'] : tg['title-text'];
    const descColor  = state === 'Disabled' ? tg['label-text-disabled'] : tg['desc-text'];
    if (content === 'Label') {
      const label = figma.createText();
      const fStyle = styleByName[spec.fontStyle];
      if (fStyle) await label.setTextStyleIdAsync(fStyle.id);
      label.characters = 'Label';
      label.fills = [paintFor(labelColor)];
      label.name = 'Label';
      comp.appendChild(label);
    } else if (content === 'TitleDescription') {
      const stack = figma.createFrame();
      stack.name = 'Text';
      stack.layoutMode = 'VERTICAL';
      stack.primaryAxisSizingMode = 'AUTO';
      stack.counterAxisSizingMode = 'AUTO';
      stack.itemSpacing = 4;
      stack.fills = [];
      const title = figma.createText();
      const tStyle = styleByName[spec.titleStyle];
      if (tStyle) await title.setTextStyleIdAsync(tStyle.id);
      title.characters = 'Title';
      title.fills = [paintFor(titleColor)];
      title.name = 'Title';
      stack.appendChild(title);
      const desc = figma.createText();
      const dStyle = styleByName[spec.descStyle];
      if (dStyle) await desc.setTextStyleIdAsync(dStyle.id);
      desc.characters = 'Description text';
      desc.fills = [paintFor(descColor)];
      desc.name = 'Description';
      stack.appendChild(desc);
      comp.appendChild(stack);
    }
    return comp;
  }

  const allVariants = [];
  const variantMeta = [];
  for (const size of TOGGLE_SIZES) {
    for (const state of TOGGLE_STATES) {
      for (const sel of TOGGLE_SELECTED) {
        for (const content of TOGGLE_CONTENT) {
          const c = await makeToggleVariant(size, state, sel, content);
          allVariants.push(c);
          variantMeta.push({ size, state, selected: sel, content });
        }
      }
    }
  }

  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Toggle';
  compSet.layoutMode = 'NONE';

  const COL_W = {
    None:             { Small: 70,  Default: 80,  Large: 90  },
    Label:            { Small: 120, Default: 140, Large: 160 },
    TitleDescription: { Small: 220, Default: 240, Large: 260 },
  };
  const ROW_H = 80;
  const GROUP_GAP = 96;
  const CONTENT_GAP = 56;
  const PAD_LEFT = 200;
  const PAD_TOP = 120;
  const PAD_RIGHT = 48;
  const PAD_BOT = 48;

  const colGroups = [];
  const cellX = {};
  let cx = PAD_LEFT;
  for (const ct of TOGGLE_CONTENT) {
    const groupStart = cx;
    const sizesArr = [];
    let groupW = 0;
    for (const s of TOGGLE_SIZES) {
      const w = COL_W[ct][s];
      sizesArr.push({ name: s, x: cx, width: w });
      cellX[`${ct}|${s}`] = cx + w / 2;
      cx += w;
      groupW += w;
    }
    const displayName = ct === 'TitleDescription' ? 'Title + Description' : ct;
    colGroups.push({ name: displayName, x: groupStart, width: groupW, sizes: sizesArr });
    cx += CONTENT_GAP;
  }

  const rowGroups = [];
  let cy = PAD_TOP;
  const stateY = {};
  for (const sel of TOGGLE_SELECTED) {
    const states = TOGGLE_STATES.map((st, i) => {
      const y = cy + i * ROW_H;
      stateY[`${sel}|${st}`] = y;
      return { name: st, y, height: ROW_H };
    });
    rowGroups.push({ name: sel, y: cy, states });
    cy += TOGGLE_STATES.length * ROW_H + GROUP_GAP;
  }

  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    const colCx = cellX[`${m.content}|${m.size}`];
    const rowCy = stateY[`${m.selected}|${m.state}`] + ROW_H / 2;
    v.x = Math.round(colCx - v.width / 2);
    v.y = Math.round(rowCy - v.height / 2);
  }
  compSet.resize(cx + PAD_RIGHT, cy + PAD_BOT);
  compSet.fills = [];

  let maxBottom = 0;
  for (const node of atomsPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) {
      const bottom = node.y + node.height;
      if (bottom > maxBottom) maxBottom = bottom;
    }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  await decorateComponentSet({
    page: atomsPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Toggle',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Toggle built: ${allVariants.length} variants. Component/Toggle has ${Object.keys(tg).length} tokens.`);
}

// =============================================================================
// BADGE — Status / count / dot indicator
// Style × Color × Size × Content
// Style: Solid, Subtle, Outline, Dot (Dot only valid with Content=Dot)
// Color: Neutral, Primary, Danger, Success, Warning, Info
// Size: Small, Default, Large
// Content: Label, Icon+Label, Count, Dot (Dot only valid with Style=Dot)
// =============================================================================
const BADGE_STYLES   = ['Solid', 'Subtle', 'Dot'];
const BADGE_COLORS   = ['Neutral', 'Primary', 'Danger', 'Success', 'Warning', 'Info'];
const BADGE_SIZES    = ['Small', 'Default', 'Large'];
const BADGE_CONTENTS = ['Label', 'Icon+Label', 'Dot+Label', 'Count', 'Dot'];
const BADGE_SIZE_SPECS = {
  Small:   { h: 20, padX: 8,  gap: 6, font: 'Body/Small', icon: 12, dot: 6,  countMinW: 20, radius: 999 },
  Default: { h: 24, padX: 10, gap: 6, font: 'Body/Default', icon: 14, dot: 8,  countMinW: 24, radius: 999 },
  Large:   { h: 28, padX: 12, gap: 8, font: 'Body/Default', icon: 16, dot: 10, countMinW: 28, radius: 999 },
};

async function buildBadge() {
  console.log('[OM DS] buildBadge started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const appearanceCol = collections.find(c => c.name === '_Appearance');
  const themeCol = collections.find(c => c.name === '_Theme');
  if (!appearanceCol || !themeCol) {
    figma.notify('❌ Missing _Appearance / _Theme. Run Bootstrap first.', { error: true });
    return;
  }
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const findVar = (cid, n) => allColorVars.find(v => v.variableCollectionId === cid && v.name === n);
  const appBy = (n) => findVar(appearanceCol.id, n);
  const thBy  = (n) => findVar(themeCol.id, n);

  const required = {
    // Brand (Primary)
    'brand/primary':         thBy('brand/primary'),
    'brand/primary-subtle':  thBy('brand/primary-subtle'),
    'brand/primary-muted':   thBy('brand/primary-muted'),
    'brand/on-primary':      thBy('brand/on-primary'),
    // Neutral
    'surface/card':          appBy('surface/card'),
    'text/primary':          appBy('text/primary'),
    'text/secondary':        appBy('text/secondary'),
    'icon/inverse':          appBy('icon/inverse'),
    'border/default':        appBy('border/default'),
    'border/strong':         appBy('border/strong'),
    'state/disabled-bg':     appBy('state/disabled-bg'),
    // Status
    'status/danger':         appBy('status/danger'),
    'status/danger-subtle':  appBy('status/danger-subtle'),
    'status/danger-text':    appBy('status/danger-text'),
    'status/danger-border':  appBy('status/danger-border'),
    'status/on-danger':      appBy('status/on-danger'),
    'status/success':        appBy('status/success'),
    'status/success-subtle': appBy('status/success-subtle'),
    'status/success-text':   appBy('status/success-text'),
    'status/success-border': appBy('status/success-border'),
    'status/on-success':     appBy('status/on-success'),
    'status/warning':        appBy('status/warning'),
    'status/warning-subtle': appBy('status/warning-subtle'),
    'status/warning-text':   appBy('status/warning-text'),
    'status/warning-border': appBy('status/warning-border'),
    'status/on-warning':     appBy('status/on-warning'),
    'status/info':           appBy('status/info'),
    'status/info-subtle':    appBy('status/info-subtle'),
    'status/info-text':      appBy('status/info-text'),
    'status/info-border':    appBy('status/info-border'),
    'status/on-info':        appBy('status/on-info'),
  };
  for (const k of Object.keys(required)) {
    if (!required[k]) { figma.notify(`❌ Missing ${k}. Run Bootstrap.`, { error: true }); return; }
  }

  const bgCol = await getOrCreateCollection('Component/Badge', ['Default']);
  const FILL = ['FRAME_FILL', 'SHAPE_FILL'];
  const TEXT = ['TEXT_FILL'];
  const STRK = ['STROKE_COLOR'];
  async function bAlias(name, src, scopes) {
    const v = await getOrCreateVariable(name, bgCol, 'COLOR');
    aliasByMode(v, bgCol, 'Default', src);
    if (scopes) { try { v.scopes = scopes; } catch (e) {} }
    return v;
  }

  // For each color × style combo, define bg/text/border tokens.
  // Color sources:
  const COLOR_SRC = {
    // Neutral: light grey bg + dark primary text (was too dark before)
    Neutral:  { solid: required['state/disabled-bg'], subtle: required['state/disabled-bg'], text: required['text/primary'],         border: required['border/strong'],         on: required['text/primary'] },
    Primary:  { solid: required['brand/primary'],    subtle: required['brand/primary-subtle'],text: required['brand/primary'],         border: required['brand/primary'],         on: required['brand/on-primary'] },
    Danger:   { solid: required['status/danger'],    subtle: required['status/danger-subtle'],text: required['status/danger-text'],    border: required['status/danger-border'],  on: required['status/on-danger'] },
    Success:  { solid: required['status/success'],   subtle: required['status/success-subtle'],text: required['status/success-text'],  border: required['status/success-border'], on: required['status/on-success'] },
    // Warning: force WHITE on solid amber for legibility consistency with other Solid badges
    Warning:  { solid: required['status/warning'],   subtle: required['status/warning-subtle'],text: required['status/warning-text'],  border: required['status/warning-border'], on: required['brand/on-primary'] },
    Info:     { solid: required['status/info'],      subtle: required['status/info-subtle'],   text: required['status/info-text'],     border: required['status/info-border'],    on: required['status/on-info'] },
  };

  const bg = {};
  for (const color of BADGE_COLORS) {
    const src = COLOR_SRC[color];
    bg[`${color}/solid/bg`]       = await bAlias(`${color}/solid/bg`,       src.solid,  FILL);
    bg[`${color}/solid/text`]     = await bAlias(`${color}/solid/text`,     src.on,     TEXT);
    bg[`${color}/subtle/bg`]      = await bAlias(`${color}/subtle/bg`,      src.subtle, FILL);
    bg[`${color}/subtle/text`]    = await bAlias(`${color}/subtle/text`,    src.text,   TEXT);
    // Subtle gets a matching tinted border for the "Published" stylish look
    bg[`${color}/subtle/border`]  = await bAlias(`${color}/subtle/border`,  src.solid,  STRK);
    bg[`${color}/outline/text`]   = await bAlias(`${color}/outline/text`,   src.text,   TEXT);
    bg[`${color}/outline/border`] = await bAlias(`${color}/outline/border`, src.border, STRK);
    bg[`${color}/dot/bg`]         = await bAlias(`${color}/dot/bg`,         src.solid,  FILL);
  }

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);
  // Idempotency: remove existing Badge set + showcase + decoration wrapper
  const _existBd = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Badge');
  if (_existBd) _existBd.remove();
  const _existBdShow = atomsPage.findOne(n => n.name === 'Badge — Showcase');
  if (_existBdShow) _existBdShow.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Badge')) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  const fontsToLoad = new Set();
  for (const k of Object.keys(BADGE_SIZE_SPECS)) {
    const st = styleByName[BADGE_SIZE_SPECS[k].font];
    if (st) fontsToLoad.add(JSON.stringify(st.fontName));
  }
  for (const f of fontsToLoad) await figma.loadFontAsync(JSON.parse(f));
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  // Need a default icon for Icon+Label content. Try 'star' → 'plus' → give up gracefully.
  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  let badgeIconComp = await findOrCreateIconComponent('star', iconsPage, required['icon/inverse']);
  if (!badgeIconComp) badgeIconComp = await findOrCreateIconComponent('plus', iconsPage, required['icon/inverse']);

  function paintFor(varRef) {
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef);
  }
  function bindIconColor(node, colorVar) {
    if ('fills' in node && Array.isArray(node.fills) && node.fills.length) {
      node.fills = node.fills.map(p => p.type === 'SOLID' && p.visible !== false
        ? figma.variables.setBoundVariableForPaint(p, 'color', colorVar) : p);
    }
    if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length) {
      node.strokes = node.strokes.map(p => p.type === 'SOLID' && p.visible !== false
        ? figma.variables.setBoundVariableForPaint(p, 'color', colorVar) : p);
    }
    if ('children' in node) for (const c of node.children) bindIconColor(c, colorVar);
  }

  // Skip rule: Style=Dot only valid with Content=Dot, and vice versa.
  function isValid(style, content) {
    if (style === 'Dot') return content === 'Dot';
    if (content === 'Dot') return style === 'Dot';
    return true;
  }

  async function makeBadgeVariant(style, color, size, content) {
    const spec = BADGE_SIZE_SPECS[size];
    const comp = figma.createComponent();
    comp.name = `Style=${style}, Color=${color}, Size=${size}, Content=${content}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = spec.gap;
    comp.cornerRadius = spec.radius;

    if (style === 'Dot') {
      // Just a colored circle; size = spec.dot
      comp.layoutMode = 'NONE';
      comp.resize(spec.dot, spec.dot);
      comp.cornerRadius = spec.dot / 2;
      comp.fills = [paintFor(bg[`${color}/dot/bg`])];
      comp.strokes = [];
      return comp;
    }

    // For Label / Icon+Label / Count: pill or square depending on content
    comp.resize(spec.h * 2, spec.h);
    comp.primaryAxisSizingMode = 'AUTO';
    comp.paddingLeft = comp.paddingRight = spec.padX;
    comp.paddingTop = comp.paddingBottom = 0;

    let bgVar = null, textVar = null, borderVar = null;
    if (style === 'Solid') {
      bgVar = bg[`${color}/solid/bg`];
      textVar = bg[`${color}/solid/text`];
    } else if (style === 'Subtle') {
      bgVar = bg[`${color}/subtle/bg`];
      textVar = bg[`${color}/subtle/text`];
      borderVar = bg[`${color}/subtle/border`];
    } else if (style === 'Outline') {
      textVar = bg[`${color}/outline/text`];
      borderVar = bg[`${color}/outline/border`];
    }
    comp.fills = bgVar ? [paintFor(bgVar)] : [];
    comp.strokes = borderVar ? [paintFor(borderVar)] : [];
    if (borderVar) {
      comp.strokeWeight = 1;
      comp.strokeAlign = 'INSIDE';
    }

    // Soft glow effect — gives badges visual presence ("user-eye notice")
    // Drop shadow with the bubble color tinted at low opacity so it reads as a glow.
    comp.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.08 },
      offset: { x: 0, y: 1 },
      radius: 2,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    }, {
      // Outer halo glow — soft, larger, lower opacity
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.06 },
      offset: { x: 0, y: 2 },
      radius: 6,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    }];
    if (content === 'Icon+Label' && badgeIconComp) {
      const ic = badgeIconComp.createInstance();
      ic.resize(spec.icon, spec.icon);
      try { ic.layoutSizingHorizontal = 'FIXED'; ic.layoutSizingVertical = 'FIXED'; } catch (e) {}
      bindIconColor(ic, textVar);
      comp.appendChild(ic);
    } else if (content === 'Dot+Label') {
      // Small filled circle. For Solid badges (bg = brand color) use the text
      // color (white) so the dot is visible. For Subtle/Outline use the solid
      // brand color so the dot pops against the light/transparent bg.
      const dotColorVar = (style === 'Solid') ? textVar : bg[`${color}/dot/bg`];
      const dotNode = figma.createEllipse();
      dotNode.name = 'Dot';
      dotNode.resize(spec.dot, spec.dot);
      dotNode.fills = [paintFor(dotColorVar)];
      try { dotNode.layoutSizingHorizontal = 'FIXED'; dotNode.layoutSizingVertical = 'FIXED'; } catch (e) {}
      comp.appendChild(dotNode);
    }

    const label = figma.createText();
    const fStyle = styleByName[spec.font];
    if (fStyle) {
      try { await figma.loadFontAsync(fStyle.fontName); } catch (e) {}
      await label.setTextStyleIdAsync(fStyle.id);
    }
    label.characters = content === 'Count' ? '12' : (content === 'Dot+Label' ? 'Published' : 'Label');
    label.fills = [paintFor(textVar)];
    label.name = content === 'Count' ? 'Count' : 'Label';
    if (content === 'Count') {
      label.textAlignHorizontal = 'CENTER';
    }
    comp.appendChild(label);

    if (content === 'Count') {
      try { comp.minWidth = spec.countMinW; } catch (e) {}
    }

    return comp;
  }

  const allVariants = [];
  const variantMeta = [];
  for (const style of BADGE_STYLES) {
    for (const color of BADGE_COLORS) {
      for (const size of BADGE_SIZES) {
        for (const content of BADGE_CONTENTS) {
          if (!isValid(style, content)) continue;
          const c = await makeBadgeVariant(style, color, size, content);
          allVariants.push(c);
          variantMeta.push({ style, color, size, content });
        }
      }
    }
  }

  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Badge';
  compSet.layoutMode = 'NONE';

  // 2D grid: rows = Style × Color, cols = Content × Size
  const COL_W = {
    Label:        { Small: 80,  Default: 90,  Large: 100 },
    'Icon+Label': { Small: 100, Default: 110, Large: 120 },
    'Dot+Label':  { Small: 110, Default: 120, Large: 130 },
    Count:        { Small: 56,  Default: 64,  Large: 72  },
    Dot:          { Small: 30,  Default: 36,  Large: 40  },
  };
  const ROW_H = 56;
  const GROUP_GAP = 56;
  const CONTENT_GAP = 40;
  const PAD_LEFT = 220;
  const PAD_TOP = 140;
  const PAD_RIGHT = 56;
  const PAD_BOT = 56;

  // Columns: for each Content, three Sizes
  const colGroups = [];
  const cellX = {};
  let cx = PAD_LEFT;
  for (const ct of BADGE_CONTENTS) {
    const groupStart = cx;
    const sizesArr = [];
    let groupW = 0;
    for (const s of BADGE_SIZES) {
      const w = COL_W[ct][s];
      sizesArr.push({ name: s, x: cx, width: w });
      cellX[`${ct}|${s}`] = cx + w / 2;
      cx += w;
      groupW += w;
    }
    colGroups.push({ name: ct, x: groupStart, width: groupW, sizes: sizesArr });
    cx += CONTENT_GAP;
  }

  // Rows: for each Style, all Colors
  const rowGroups = [];
  let cy = PAD_TOP;
  const rowY = {};
  for (const style of BADGE_STYLES) {
    const startY = cy;
    const states = BADGE_COLORS.map((color, i) => {
      const y = cy + i * ROW_H;
      rowY[`${style}|${color}`] = y;
      return { name: color, y, height: ROW_H };
    });
    rowGroups.push({ name: style, y: startY, states });
    cy += BADGE_COLORS.length * ROW_H + GROUP_GAP;
  }

  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    const colCx = cellX[`${m.content}|${m.size}`];
    const rowCy = rowY[`${m.style}|${m.color}`] + ROW_H / 2;
    v.x = Math.round(colCx - v.width / 2);
    v.y = Math.round(rowCy - v.height / 2);
  }
  compSet.resize(cx + PAD_RIGHT, cy + PAD_BOT);
  compSet.fills = [];

  let maxBottom = 0;
  for (const node of atomsPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) {
      const b = node.y + node.height;
      if (b > maxBottom) maxBottom = b;
    }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  await decorateComponentSet({
    page: atomsPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Badge',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Badge built: ${allVariants.length} variants. Component/Badge has ${Object.keys(bg).length} tokens.`);
}

// =============================================================================
// TOOLTIP
// Dark inverse surface in BOTH light/dark modes. Small triangular arrow on one
// of 4 sides. Optional leading check icon. Optional "Learn More" inline link
// styled with text/inverse-link.
//
// Variants:
//   Placement: Top | Right | Bottom | Left   (arrow position)
//   Size:      Small | Default
//   Icon:      None | Check
//   Action:    None | Link
// =============================================================================
const TOOLTIP_PLACEMENTS = ['Top', 'Right', 'Bottom', 'Left'];
const TOOLTIP_SIZES      = ['Small', 'Default'];
const TOOLTIP_HEADINGS   = ['None', 'Heading'];
const TOOLTIP_ICONS      = ['None', 'Check'];
const TOOLTIP_ACTIONS    = ['None', 'Button Left', 'Button Right'];
const TOOLTIP_SIZE_SPECS = {
  Small:   { padX: 10, padY: 8,  gap: 8,  font: 'Body/Small',   headingFont: 'Label/Default', icon: 12, radius: 6, arrow: 5, actionGap: 12, maxTextWidth: 240, vGap: 4 },
  Default: { padX: 12, padY: 10, gap: 10, font: 'Body/Default', headingFont: 'Label/Default', icon: 14, radius: 8, arrow: 6, actionGap: 16, maxTextWidth: 320, vGap: 6 },
};

async function buildTooltip() {
  console.log('[OM DS] buildTooltip started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const appearanceCol = collections.find(c => c.name === '_Appearance');
  const themeCol = collections.find(c => c.name === '_Theme');
  if (!appearanceCol || !themeCol) {
    figma.notify('❌ Missing _Appearance / _Theme. Run Bootstrap first.', { error: true });
    return;
  }
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const findVar = (cid, n) => allColorVars.find(v => v.variableCollectionId === cid && v.name === n);
  const appBy = (n) => findVar(appearanceCol.id, n);
  const thBy  = (n) => findVar(themeCol.id, n);

  const required = {
    'surface/inverse':        appBy('surface/inverse'),
    'border/inverse':         appBy('border/inverse'),
    'text/inverse-primary':   appBy('text/inverse-primary'),
    'text/inverse-secondary': appBy('text/inverse-secondary'),
    'text/inverse-link':      appBy('text/inverse-link'),
    'icon/inverse-strong':    appBy('icon/inverse-strong'),
    'surface/card':           appBy('surface/card'),
    'text/primary':           appBy('text/primary'),
    'text/secondary':         appBy('text/secondary'),
    'border/default':         appBy('border/default'),
  };
  for (const [k, v] of Object.entries(required)) {
    if (!v) { figma.notify(`❌ Missing token ${k}. Re-run Bootstrap.`, { error: true }); return; }
  }

  // Component-level aliases under Component/Tooltip
  let tooltipCol = collections.find(c => c.name === 'Component/Tooltip');
  if (tooltipCol) {
    try { tooltipCol.remove(); } catch (e) {}
  }
  tooltipCol = figma.variables.createVariableCollection('Component/Tooltip');
  // Single mode (Default)
  try { tooltipCol.renameMode(tooltipCol.modes[0].modeId, 'Default'); } catch (e) {}

  const FILL = ['FRAME_FILL', 'SHAPE_FILL'];
  const STRK = ['STROKE_COLOR'];
  const TEXT = ['TEXT_FILL'];
  const ICON = ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR'];

  async function tAlias(name, src, scopes) {
    const v = figma.variables.createVariable(name, tooltipCol, 'COLOR');
    v.setValueForMode(tooltipCol.modes[0].modeId, { type: 'VARIABLE_ALIAS', id: src.id });
    if (scopes) { try { v.scopes = scopes; } catch (e) {} }
    return v;
  }

  const tt = {
    'bg':          await tAlias('bg',          required['surface/inverse'],        FILL),
    'border':      await tAlias('border',      required['border/inverse'],         STRK),
    'text':        await tAlias('text',        required['text/inverse-primary'],   TEXT),
    'text-muted':  await tAlias('text-muted',  required['text/inverse-secondary'], TEXT),
    'link':        await tAlias('link',        required['text/inverse-link'],      TEXT),
    'icon':        await tAlias('icon',        required['icon/inverse-strong'],    ICON),
  };

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);
  // Idempotency: remove existing Tooltip set + showcase + decoration wrapper
  const _existTt = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Tooltip');
  if (_existTt) _existTt.remove();
  const _existTtShow = atomsPage.findOne(n => n.name === 'Tooltip — Showcase');
  if (_existTtShow) _existTtShow.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Tooltip')) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  const fontsToLoad = new Set();
  for (const k of Object.keys(TOOLTIP_SIZE_SPECS)) {
    const st = styleByName[TOOLTIP_SIZE_SPECS[k].font];
    if (st) fontsToLoad.add(JSON.stringify(st.fontName));
  }
  for (const f of fontsToLoad) await figma.loadFontAsync(JSON.parse(f));
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  // Find icon component (check) — use the same helper used by Checkbox.
  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  const checkIconComp = await findOrCreateIconComponent('check', iconsPage, required['icon/inverse-strong']);

  // Find Ghost button component (Type=Default, Color=Ghost). Pick a Default
  // size variant matching tooltip size, and Default state.
  const buttonSet = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Button');
  function findGhostBtn(btnSize) {
    if (!buttonSet) return null;
    return buttonSet.children.find(c => c.name === `Type=Default, Color=Ghost, Size=${btnSize}, State=Default`)
      || buttonSet.children.find(c => c.name.startsWith('Type=Default, Color=Ghost'));
  }

  function paintFor(varRef) {
    return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef);
  }
  function bindIconColor(inst, colorVar) {
    if (!inst || !colorVar) return;
    const apply = (n) => {
      if ('fills' in n && Array.isArray(n.fills) && n.fills.length > 0) {
        n.fills = [paintFor(colorVar)];
      }
      if ('strokes' in n && Array.isArray(n.strokes) && n.strokes.length > 0) {
        n.strokes = [paintFor(colorVar)];
      }
      if ('children' in n) for (const c of n.children) apply(c);
    };
    try { apply(inst); } catch (e) {}
  }

  // Build a tight arrow as a Vector with explicit path. No rotation, so the
  // bounding box matches the visible triangle exactly — easy positioning.
  function makeArrow(size, placement) {
    const t = size;         // thickness (perpendicular to bubble edge)
    const b = size * 2;     // base (parallel to bubble edge)
    let w, h, data;
    if (placement === 'Top') {
      // sits BELOW bubble, tip points DOWN
      w = b; h = t;
      data = `M 0 0 L ${b} 0 L ${b / 2} ${t} Z`;
    } else if (placement === 'Bottom') {
      // sits ABOVE bubble, tip points UP
      w = b; h = t;
      data = `M 0 ${t} L ${b} ${t} L ${b / 2} 0 Z`;
    } else if (placement === 'Left') {
      // sits on RIGHT of bubble, tip points RIGHT
      w = t; h = b;
      data = `M 0 0 L 0 ${b} L ${t} ${b / 2} Z`;
    } else { // Right
      // sits on LEFT of bubble, tip points LEFT
      w = t; h = b;
      data = `M ${t} 0 L ${t} ${b} L 0 ${b / 2} Z`;
    }
    const v = figma.createVector();
    v.name = `Arrow ${placement}`;
    v.resize(w, h);
    v.vectorPaths = [{ windingRule: 'NONZERO', data }];
    v.fills = [paintFor(tt['bg'])];
    v.strokes = [];
    return v;
  }

  async function makeTooltipVariant(placement, size, heading, icon, action) {
    const spec = TOOLTIP_SIZE_SPECS[size];
    const hasHeading = heading === 'Heading';

    // Outer: pure FRAME with NO autolayout — we position the bubble + arrow
    // manually so the arrow can sit flush against the bubble edge.
    const outer = figma.createComponent();
    outer.name = `Placement=${placement}, Size=${size}, Heading=${heading}, Icon=${icon}, Action=${action}`;
    outer.layoutMode = 'NONE';
    outer.fills = [];
    outer.clipsContent = false;

    // Bubble — VERTICAL when heading present OR action is Button Left (stacked layout).
    // Button Right keeps bubble HORIZONTAL: [icon | message | button] all centered vertically.
    const bubble = figma.createFrame();
    bubble.name = 'Bubble';
    const hasAction = action === 'Button Left' || action === 'Button Right';
    const actionRight = action === 'Button Right';
    const stacked = hasHeading || action === 'Button Left';
    bubble.layoutMode = stacked ? 'VERTICAL' : 'HORIZONTAL';
    bubble.primaryAxisSizingMode = 'AUTO';
    bubble.counterAxisSizingMode = 'AUTO';
    bubble.primaryAxisAlignItems = stacked ? 'MIN' : 'CENTER';
    bubble.counterAxisAlignItems = stacked ? 'MIN' : 'CENTER';
    bubble.itemSpacing = stacked ? spec.vGap : spec.gap;
    bubble.paddingLeft = bubble.paddingRight = spec.padX;
    bubble.paddingTop = bubble.paddingBottom = spec.padY;
    bubble.cornerRadius = spec.radius;
    bubble.fills = [paintFor(tt['bg'])];
    bubble.strokes = [paintFor(tt['border'])];
    bubble.strokeWeight = 1;
    bubble.strokeAlign = 'INSIDE';

    // Optional heading row (semibold, primary inverse text)
    if (hasHeading) {
      const hd = figma.createText();
      const hStyle = styleByName[spec.headingFont];
      if (hStyle) {
        try { await figma.loadFontAsync(hStyle.fontName); } catch (e) {}
        await hd.setTextStyleIdAsync(hStyle.id);
      }
      hd.characters = 'Need help?';
      hd.fills = [paintFor(tt['text'])];
      hd.name = 'Heading';
      hd.textAutoResize = 'HEIGHT';
      hd.resize(spec.maxTextWidth, hd.height);
      bubble.appendChild(hd);
      try { hd.layoutSizingHorizontal = 'FIXED'; hd.layoutSizingVertical = 'HUG'; } catch (e) {}
    }

    // Content row — when stacked AND has icon, build [icon | right-column]
    // where right-column stacks message + action vertically. This ensures the
    // action button's left edge aligns with the message text (not with the icon).
    let msgParent = bubble;
    let rightCol = null;
    if (stacked && icon === 'Check' && checkIconComp) {
      const row = figma.createFrame();
      row.name = 'Content';
      row.layoutMode = 'HORIZONTAL';
      row.primaryAxisSizingMode = 'AUTO';
      row.counterAxisSizingMode = 'AUTO';
      row.primaryAxisAlignItems = 'MIN';
      row.counterAxisAlignItems = 'MIN';
      row.itemSpacing = spec.gap;
      row.paddingLeft = row.paddingRight = row.paddingTop = row.paddingBottom = 0;
      row.fills = [];
      bubble.appendChild(row);
      try { row.layoutSizingHorizontal = 'HUG'; row.layoutSizingVertical = 'HUG'; } catch (e) {}

      // Right-side column (will hold message and the action)
      rightCol = figma.createFrame();
      rightCol.name = 'Body';
      rightCol.layoutMode = 'VERTICAL';
      rightCol.primaryAxisSizingMode = 'AUTO';
      rightCol.counterAxisSizingMode = 'AUTO';
      rightCol.primaryAxisAlignItems = 'MIN';
      rightCol.counterAxisAlignItems = 'MIN';
      rightCol.itemSpacing = spec.vGap;
      rightCol.paddingLeft = rightCol.paddingRight = rightCol.paddingTop = rightCol.paddingBottom = 0;
      rightCol.fills = [];

      msgParent = row;  // icon goes here directly
    } else if (stacked) {
      // No icon — message + action both stack inside bubble; rightCol = bubble
      rightCol = bubble;
    }

    // Optional leading check icon (placed in row so it sits inline with message column)
    if (icon === 'Check' && checkIconComp) {
      const ic = checkIconComp.createInstance();
      ic.resize(spec.icon, spec.icon);
      try { ic.layoutSizingHorizontal = 'FIXED'; ic.layoutSizingVertical = 'FIXED'; } catch (e) {}
      bindIconColor(ic, tt['icon']);
      msgParent.appendChild(ic);
      // After adding the icon, append the right column (so layout = [icon | rightCol])
      if (stacked && rightCol !== bubble) msgParent.appendChild(rightCol);
    }

    // Main message text — fixed max width with wrap
    const label = figma.createText();
    const fStyle = styleByName[spec.font];
    if (fStyle) {
      try { await figma.loadFontAsync(fStyle.fontName); } catch (e) {}
      await label.setTextStyleIdAsync(fStyle.id);
    }
    label.characters = "Hello! I'm a Tooltip, here to help explain whatever you hover over.";
    label.fills = [paintFor(hasHeading ? tt['text-muted'] : tt['text'])];
    label.name = 'Message';
    label.textAutoResize = 'HEIGHT';
    label.resize(spec.maxTextWidth, label.height);
    // Place message in rightCol when stacked, otherwise inline in horizontal bubble
    const labelHost = stacked ? rightCol : bubble;
    labelHost.appendChild(label);
    try { label.layoutSizingHorizontal = 'FIXED'; label.layoutSizingVertical = 'HUG'; } catch (e) {}

    // Optional Ghost button — Button Left nests inside rightCol (under message);
    // Button Right is appended directly to the horizontal bubble (sits on the right,
    // vertically centered with the message via bubble's counterAxisAlignItems='CENTER').
    if (hasAction) {
      const ghost = findGhostBtn(size === 'Small' ? 'XS' : 'Small');
      if (ghost) {
        const inst = ghost.createInstance();
        inst.name = 'Action';
        try {
          const txt = inst.findOne(n => n.type === 'TEXT');
          if (txt) {
            await figma.loadFontAsync(txt.fontName);
            txt.characters = 'Learn More';
          }
        } catch (e) {}

        if (actionRight) {
          // Append button directly to horizontal bubble — sits on right, centered.
          bubble.appendChild(inst);
        } else {
          // Button Left — wrap in FILL-width row inside rightCol; left-align.
          const actionRow = figma.createFrame();
          actionRow.name = 'Actions';
          actionRow.layoutMode = 'HORIZONTAL';
          actionRow.primaryAxisSizingMode = 'FIXED';
          actionRow.counterAxisSizingMode = 'AUTO';
          actionRow.primaryAxisAlignItems = 'MIN';
          actionRow.counterAxisAlignItems = 'CENTER';
          actionRow.itemSpacing = 8;
          actionRow.paddingLeft = actionRow.paddingRight = 0;
          actionRow.paddingTop = actionRow.paddingBottom = 0;
          actionRow.fills = [];
          actionRow.appendChild(inst);
          (stacked ? rightCol : bubble).appendChild(actionRow);
          try { actionRow.layoutSizingHorizontal = 'FILL'; actionRow.layoutSizingVertical = 'HUG'; } catch (e) {}
        }
      }
    }

    // Add bubble first so we can read its size
    outer.appendChild(bubble);
    bubble.x = 0;
    bubble.y = 0;

    // Arrow — overlap bubble by 1px to hide seam
    const arrow = makeArrow(spec.arrow, placement);
    outer.appendChild(arrow);
    const bw = bubble.width, bh = bubble.height;
    if (placement === 'Top') {
      // arrow below bubble, pointing down
      arrow.x = (bw - arrow.width) / 2;
      arrow.y = bh - 1;
      outer.resize(bw, bh + arrow.height - 1);
    } else if (placement === 'Bottom') {
      // arrow above bubble, pointing up — reorder so arrow renders behind bubble seam
      bubble.y = arrow.height - 1;
      arrow.x = (bw - arrow.width) / 2;
      arrow.y = 0;
      outer.resize(bw, bh + arrow.height - 1);
    } else if (placement === 'Left') {
      // arrow on right of bubble, pointing right
      arrow.x = bw - 1;
      arrow.y = (bh - arrow.height) / 2;
      outer.resize(bw + arrow.width - 1, bh);
    } else if (placement === 'Right') {
      // arrow on left of bubble, pointing left
      bubble.x = arrow.width - 1;
      arrow.x = 0;
      arrow.y = (bh - arrow.height) / 2;
      outer.resize(bw + arrow.width - 1, bh);
    }

    return outer;
  }

  const allVariants = [];
  const variantMeta = [];
  for (const placement of TOOLTIP_PLACEMENTS) {
    for (const size of TOOLTIP_SIZES) {
      for (const heading of TOOLTIP_HEADINGS) {
        for (const icon of TOOLTIP_ICONS) {
          for (const action of TOOLTIP_ACTIONS) {
            const c = await makeTooltipVariant(placement, size, heading, icon, action);
            allVariants.push(c);
            variantMeta.push({ placement, size, heading, icon, action });
          }
        }
      }
    }
  }

  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Tooltip';
  compSet.layoutMode = 'NONE';

  // Layout grid: 4 cols (Icon × Action), rows = Placement × Size
  const COL_GAP = 80;
  const ROW_GAP = 60;
  const PAD = 80;

  // Compute column widths from the widest variant in that column
  const colKeys = [];
  for (const heading of TOOLTIP_HEADINGS)
    for (const icon of TOOLTIP_ICONS)
      for (const action of TOOLTIP_ACTIONS)
        colKeys.push({ heading, icon, action });
  const colWidths = colKeys.map(({ heading, icon, action }) => {
    let w = 0;
    for (let i = 0; i < variantMeta.length; i++) {
      const m = variantMeta[i];
      if (m.heading === heading && m.icon === icon && m.action === action) w = Math.max(w, allVariants[i].width);
    }
    return w;
  });

  let y = PAD;
  for (const placement of TOOLTIP_PLACEMENTS) {
    for (const size of TOOLTIP_SIZES) {
      let rowH = 0;
      let x = PAD;
      colKeys.forEach(({ heading, icon, action }, ci) => {
        const idx = variantMeta.findIndex(m =>
          m.placement === placement && m.size === size && m.heading === heading && m.icon === icon && m.action === action);
        if (idx < 0) return;
        const node = allVariants[idx];
        node.x = x;
        node.y = y;
        rowH = Math.max(rowH, node.height);
        x += colWidths[ci] + COL_GAP;
      });
      y += rowH + ROW_GAP;
    }
  }

  const totalW = PAD * 2 + colWidths.reduce((a, b) => a + b, 0) + COL_GAP * (colWidths.length - 1);
  compSet.resize(Math.max(800, totalW), y + PAD);
  compSet.fills = [paintFor(required['surface/card'])];
  compSet.strokes = [paintFor(required['border/default'])];
  compSet.strokeWeight = 1;
  compSet.cornerRadius = 12;
  compSet.paddingLeft = compSet.paddingRight = compSet.paddingTop = compSet.paddingBottom = 0;

  // Simple wrapper frame (skip decorateComponentSet for Tooltip — its 1-axis
  // grid doesn't match the col/row groups format).
  const wrapper = figma.createFrame();
  wrapper.name = 'Tooltip';
  wrapper.layoutMode = 'VERTICAL';
  wrapper.primaryAxisSizingMode = 'AUTO';
  wrapper.counterAxisSizingMode = 'AUTO';
  wrapper.itemSpacing = 24;
  wrapper.paddingLeft = wrapper.paddingRight = wrapper.paddingTop = wrapper.paddingBottom = 48;
  wrapper.fills = [paintFor(required['surface/card'])];
  wrapper.strokes = [paintFor(required['border/default'])];
  wrapper.strokeWeight = 1;
  wrapper.cornerRadius = 16;

  const heading = figma.createText();
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
  const h4 = styleByName['Heading/H4'];
  if (h4) {
    try { await figma.loadFontAsync(h4.fontName); } catch (e) {}
    await heading.setTextStyleIdAsync(h4.id);
  }
  heading.characters = 'Tooltip';
  heading.fills = [paintFor(required['text/primary'])];
  wrapper.appendChild(heading);

  // Reparent compSet into wrapper
  wrapper.appendChild(compSet);
  atomsPage.appendChild(wrapper);

  // Place wrapper BELOW all existing components on the Atoms page (no overlap)
  let maxBottom = 0;
  for (const c of atomsPage.children) {
    if (c === wrapper || c.removed) continue;
    if (typeof c.y === 'number' && typeof c.height === 'number') {
      maxBottom = Math.max(maxBottom, c.y + c.height);
    }
  }
  wrapper.x = 80;
  wrapper.y = maxBottom > 0 ? maxBottom + 80 : 80;

  figma.notify(`✅ Tooltip built: ${allVariants.length} variants.`);
}


// =============================================================================
// AVATAR
// Sizes: XS(24) Small(32) Default(40) Large(56) XL(72)
// Variant: Image | Initials | Icon | Empty
// Shape: Circle | Square (rounded)
// Status: None | Online | Offline | Busy | Away (small dot bottom-right with white ring)
// =============================================================================
const AVATAR_SIZES    = ['XS', 'Small', 'Default'];
const AVATAR_VARIANTS = ['Image', 'Initials', 'Icon'];
const AVATAR_SHAPES   = ['Circle'];
const AVATAR_STATUSES = ['None', 'Online', 'Offline', 'Busy', 'Away'];
const AVATAR_SIZE_SPECS = {
  XS:      { box: 24, font: 'Label/Default', icon: 14, status: 8,  ring: 1.5, radius: 6 },
  Small:   { box: 32, font: 'Label/Default', icon: 16, status: 10, ring: 2,   radius: 8 },
  Default: { box: 40, font: 'Body/Default',  icon: 20, status: 12, ring: 2,   radius: 10 },
};
const AVATAR_INITIALS = {
  XS: 'A', Small: 'AB', Default: 'AB',
};

async function buildAvatar() {
  console.log('[OM DS] buildAvatar started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  console.log('[OM DS] avatar: loaded all pages');

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const appearanceCol = collections.find(c => c.name === '_Appearance');
  const themeCol = collections.find(c => c.name === '_Theme');
  if (!appearanceCol) { figma.notify('❌ Run Bootstrap first.', { error: true }); return; }
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const appBy = (n) => allColorVars.find(v => v.variableCollectionId === appearanceCol.id && v.name === n);
  const thBy  = (n) => themeCol && allColorVars.find(v => v.variableCollectionId === themeCol.id && v.name === n);
  // Resolve from EITHER appearance OR theme (brand tokens live in theme)
  const anyBy = (n) => appBy(n) || thBy(n);

  const required = {
    'surface/card':       anyBy('surface/card'),
    'surface/base':       anyBy('surface/base'),
    'state/disabled-bg':  anyBy('state/disabled-bg'),
    'border/default':     anyBy('border/default'),
    'border/strong':      anyBy('border/strong'),
    'text/primary':       anyBy('text/primary'),
    'text/secondary':     anyBy('text/secondary'),
    'icon/default':       anyBy('icon/default'),
    'icon/subtle':        anyBy('icon/subtle'),
    'brand/primary':      anyBy('brand/primary'),
    'brand/primary-subtle': anyBy('brand/primary-subtle'),
    'brand/on-primary':   anyBy('brand/on-primary'),
    'status/success':     anyBy('status/success'),
    'status/danger':      anyBy('status/danger'),
    'status/warning':     anyBy('status/warning'),
  };
  for (const [k, v] of Object.entries(required)) {
    if (!v) {
      console.error('[OM DS] avatar: MISSING token:', k);
      figma.notify(`❌ Missing token ${k}. Re-run Bootstrap.`, { error: true });
      return;
    }
  }
  console.log('[OM DS] avatar: tokens ok');

  // Component-level aliases
  let avCol = collections.find(c => c.name === 'Component/Avatar');
  if (avCol) { try { avCol.remove(); } catch (e) {} }
  avCol = figma.variables.createVariableCollection('Component/Avatar');
  try { avCol.renameMode(avCol.modes[0].modeId, 'Default'); } catch (e) {}

  const FILL = ['FRAME_FILL', 'SHAPE_FILL'];
  const TEXT = ['TEXT_FILL'];
  const STRK = ['STROKE_COLOR'];
  const ICON = ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR'];

  async function aAlias(name, src, scopes) {
    const v = figma.variables.createVariable(name, avCol, 'COLOR');
    v.setValueForMode(avCol.modes[0].modeId, { type: 'VARIABLE_ALIAS', id: src.id });
    if (scopes) { try { v.scopes = scopes; } catch (e) {} }
    return v;
  }

  const av = {
    'image-bg':     await aAlias('image-bg',     required['state/disabled-bg'],     FILL),
    'initials-bg':  await aAlias('initials-bg',  required['brand/primary-subtle'], FILL),
    'initials-text':await aAlias('initials-text',required['brand/primary'],        TEXT),
    'icon-bg':      await aAlias('icon-bg',      required['state/disabled-bg'],     FILL),
    'icon-color':   await aAlias('icon-color',   required['icon/default'],          ICON),
    'empty-bg':     await aAlias('empty-bg',     required['state/disabled-bg'],     FILL),
    'empty-border': await aAlias('empty-border', required['border/strong'],         STRK),
    'ring':         await aAlias('ring',         required['surface/card'],          STRK),
    'status-online':await aAlias('status-online',required['status/success'],        FILL),
    'status-busy':  await aAlias('status-busy',  required['status/danger'],         FILL),
    'status-away':  await aAlias('status-away',  required['status/warning'],        FILL),
    'status-offline':await aAlias('status-offline',required['icon/subtle'],         FILL),
  };

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);
  // Idempotency
  const _existAv = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Avatar');
  if (_existAv) _existAv.remove();
  const _existAvShow = atomsPage.findOne(n => n.name === 'Avatar — Showcase');
  if (_existAvShow) _existAvShow.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Avatar')) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  const fontsToLoad = new Set();
  for (const k of Object.keys(AVATAR_SIZE_SPECS)) {
    const st = styleByName[AVATAR_SIZE_SPECS[k].font];
    if (st) fontsToLoad.add(JSON.stringify(st.fontName));
  }
  for (const f of fontsToLoad) await figma.loadFontAsync(JSON.parse(f));
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  let userIconComp = null;
  try {
    if (iconsPage) {
      // Try several common names: user-01, user, person, account, profile, user-circle
      const wanted = ['user-01', 'user', 'user-1', 'person', 'account', 'profile', 'user-circle', 'avatar'];
      const allComps = iconsPage.findAllWithCriteria({ types: ['COMPONENT'] });
      for (const w of wanted) {
        userIconComp = allComps.find(n => n.name.toLowerCase() === w
          || n.name.toLowerCase() === `icon/${w}`
          || n.name.toLowerCase().endsWith(`/${w}`));
        if (userIconComp) { console.log('[OM DS] avatar icon matched:', userIconComp.name); break; }
      }
    }
  } catch (e) {
    console.warn('[OM DS] user icon lookup failed:', e);
    userIconComp = null;
  }
  console.log('[OM DS] icons page:', iconsPage && iconsPage.name, 'user icon found:', !!userIconComp);

  // Draw a proper user-icon silhouette inside `parent` using a real SVG path,
  // then scale it to glyphSize via .rescale() so the geometry actually scales
  // (resizing alone would distort or letterbox). Falls back to two-shape glyph
  // only if SVG creation fails.
  function drawUserGlyph(parent, glyphSize, colorVar) {
    const W = parent.width, H = parent.height;
    // Material person 24×24 path (head + shoulders), well-formed silhouette.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
    let node;
    try {
      node = figma.createNodeFromSvg(svg);
    } catch (e) {
      node = null;
    }
    if (node) {
      try {
        // Scale geometry from 24px source to target glyphSize using rescale (true geometric scale)
        const scale = glyphSize / 24;
        if (scale !== 1) node.rescale(scale);
        node.x = Math.round((W - node.width) / 2);
        node.y = Math.round((H - node.height) / 2);
        const apply = (n) => {
          if ('fills' in n && Array.isArray(n.fills) && n.fills.length > 0) n.fills = [paintFor(colorVar)];
          if ('strokes' in n && Array.isArray(n.strokes) && n.strokes.length > 0) n.strokes = [paintFor(colorVar)];
          if ('children' in n) for (const c of n.children) apply(c);
        };
        apply(node);
        parent.appendChild(node);
        return;
      } catch (e) {
        try { node.remove(); } catch (e2) {}
      }
    }
    // Fallback (only if SVG path failed entirely)
    const headD = Math.max(4, Math.round(glyphSize * 0.38));
    const head = figma.createEllipse();
    head.resize(headD, headD);
    head.x = Math.round((W - headD) / 2);
    head.y = Math.round(H / 2 - headD * 1.05);
    head.fills = [paintFor(colorVar)];
    parent.appendChild(head);
    const bodyW = Math.round(glyphSize * 1.05);
    const bodyH = Math.round(glyphSize * 1.05);
    const body = figma.createEllipse();
    body.resize(bodyW, bodyH);
    body.x = Math.round((W - bodyW) / 2);
    body.y = Math.round(H / 2 + headD * 0.05);
    body.fills = [paintFor(colorVar)];
    parent.appendChild(body);
  }

  // Try to fetch a sample portrait image and convert to a Figma image fill.
  // Cached per session so we don't refetch the same seed repeatedly.
  const imageHashCache = {};
  async function getSampleImagePaint(seed) {
    if (imageHashCache[seed]) {
      return { type: 'IMAGE', scaleMode: 'FILL', imageHash: imageHashCache[seed] };
    }
    // randomuser.me serves direct JPGs with no redirect — works reliably with allowedDomains.
    // Genders alternate: men 0-2, women 3-4 → arbitrary mapping by seed mod 99.
    const gender = (seed % 2 === 0) ? 'men' : 'women';
    const idx = seed % 99;
    const candidates = [
      `https://randomuser.me/api/portraits/${gender}/${idx}.jpg`,
      `https://i.pravatar.cc/150?img=${seed}`,  // fallback (may redirect to gravatar)
    ];
    for (const url of candidates) {
      try {
        const img = await figma.createImageAsync(url);
        imageHashCache[seed] = img.hash;
        console.log('[OM DS] sample image OK:', url);
        return { type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash };
      } catch (e) {
        console.warn('[OM DS] sample image failed:', url, e.message);
      }
    }
    return null;
  }

  function paintFor(varRef) {
    return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef);
  }
  function bindIconColor(inst, colorVar) {
    if (!inst || !colorVar) return;
    const apply = (n) => {
      if ('fills' in n && Array.isArray(n.fills) && n.fills.length > 0) n.fills = [paintFor(colorVar)];
      if ('strokes' in n && Array.isArray(n.strokes) && n.strokes.length > 0) n.strokes = [paintFor(colorVar)];
      if ('children' in n) for (const c of n.children) apply(c);
    };
    try { apply(inst); } catch (e) {}
  }

  // Pre-fetch one sample portrait per status seed (5 seeds total = 1 per status row).
  // Reused across all Single/Image variants. Errors are tolerated; falls back to silhouette.
  const SAMPLE_SEEDS = { None: 12, Online: 13, Offline: 14, Busy: 15, Away: 16 };
  const samplePaints = {};
  for (const [k, seed] of Object.entries(SAMPLE_SEEDS)) {
    samplePaints[k] = await getSampleImagePaint(seed);
  }
  // Pool of additional portraits used by Image-variant Group avatars (one per slot).
  const GROUP_IMAGE_SEEDS = [21, 22, 23, 24, 25];
  const groupImagePaints = [];
  for (const seed of GROUP_IMAGE_SEEDS) {
    groupImagePaints.push(await getSampleImagePaint(seed));
  }
  console.log('[OM DS] sample portraits fetched:',
    Object.entries(samplePaints).map(([k, p]) => `${k}=${!!p}`).join(' '),
    '| group:', groupImagePaints.map(p => !!p).join(','));

  async function makeAvatarVariant(size, variant, shape, status) {
    const spec = AVATAR_SIZE_SPECS[size];
    const comp = figma.createComponent();
    comp.name = `Type=Single, Size=${size}, Variant=${variant}, Shape=${shape}, Status=${status}, Count=1, Overflow=None`;
    comp.layoutMode = 'NONE';
    comp.resize(spec.box, spec.box);
    comp.fills = [];
    comp.clipsContent = false;

    // Avatar body
    const body = figma.createFrame();
    body.name = 'Body';
    body.resize(spec.box, spec.box);
    body.x = 0; body.y = 0;
    body.layoutMode = 'NONE';
    body.cornerRadius = (shape === 'Circle') ? spec.box / 2 : spec.radius;
    body.clipsContent = true;
    body.strokes = [];

    if (variant === 'Image') {
      // Use real sample portrait when available; otherwise fall back to silhouette.
      const samplePaint = samplePaints[status];
      if (samplePaint) {
        body.fills = [samplePaint];
      } else {
        body.fills = [paintFor(av['image-bg'])];
        drawUserGlyph(body, Math.round(spec.box * 0.7), av['icon-color']);
      }
    } else if (variant === 'Initials') {
      body.fills = [paintFor(av['initials-bg'])];
      const t = figma.createText();
      const fStyle = styleByName[spec.font];
      if (fStyle) {
        try { await figma.loadFontAsync(fStyle.fontName); } catch (e) {}
        await t.setTextStyleIdAsync(fStyle.id);
      }
      // Initials should be Semi Bold for emphasis
      try {
        await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
        t.fontName = { family: 'Inter', style: 'Semi Bold' };
      } catch (e) {}
      t.characters = AVATAR_INITIALS[size];
      t.fills = [paintFor(av['initials-text'])];
      t.textAutoResize = 'NONE';
      t.resize(spec.box, spec.box);
      t.textAlignHorizontal = 'CENTER';
      t.textAlignVertical = 'CENTER';
      t.x = 0; t.y = 0;
      body.appendChild(t);
    } else if (variant === 'Icon') {
      body.fills = [paintFor(av['icon-bg'])];
      if (userIconComp) {
        const ic = userIconComp.createInstance();
        ic.resize(spec.icon, spec.icon);
        ic.x = (spec.box - spec.icon) / 2;
        ic.y = (spec.box - spec.icon) / 2;
        bindIconColor(ic, av['icon-color']);
        body.appendChild(ic);
      } else {
        // Use ~60% of the box so the silhouette reads as a person, not a small square
        drawUserGlyph(body, Math.round(spec.box * 0.6), av['icon-color']);
      }
    }

    comp.appendChild(body);

    // Status dot (bottom-right, with white ring)
    if (status !== 'None') {
      const statusVar = status === 'Online' ? av['status-online']
        : status === 'Busy' ? av['status-busy']
        : status === 'Away' ? av['status-away']
        : av['status-offline'];
      const dot = figma.createEllipse();
      dot.name = `Status ${status}`;
      const ds = spec.status;
      dot.resize(ds, ds);
      // Position bottom-right with slight overlap
      dot.x = spec.box - ds + Math.max(1, spec.ring);
      dot.y = spec.box - ds + Math.max(1, spec.ring);
      dot.fills = [paintFor(statusVar)];
      dot.strokes = [paintFor(av['ring'])];
      dot.strokeWeight = spec.ring;
      dot.strokeAlign = 'OUTSIDE';
      comp.appendChild(dot);
      // Expand component to include the ring's outside stroke
      const extra = Math.ceil(spec.ring);
      comp.resize(spec.box + extra, spec.box + extra);
    }

    return comp;
  }

  const allVariants = [];
  const variantMeta = [];
  let count = 0;
  for (const size of AVATAR_SIZES) {
    for (const variant of AVATAR_VARIANTS) {
      for (const shape of AVATAR_SHAPES) {
        for (const status of AVATAR_STATUSES) {
          try {
            const c = await makeAvatarVariant(size, variant, shape, status);
            allVariants.push(c);
            variantMeta.push({ size, variant, shape, status });
            count++;
            if (count % 25 === 0) console.log('[OM DS] avatar variants built:', count);
          } catch (e) {
            console.error(`[OM DS] Avatar variant FAILED ${size}/${variant}/${shape}/${status}:`, e);
            throw e;
          }
        }
      }
    }
  }
  console.log('[OM DS] all single avatar variants built:', allVariants.length);

  // ===== GROUP VARIANTS — overlapping stack with optional +N overflow chip =====
  const GROUP_VARIANTS = ['Initials', 'Image'];
  const GROUP_COUNTS   = [2, 3, 4, 5];
  const GROUP_OVERFLOW = ['None', 'Plus'];
  const GROUP_OVERLAP  = { XS: 8, Small: 10, Default: 12 };
  const GROUP_INITIALS = ['A', 'B', 'C', 'D', 'E'];

  async function makeGroupSlot(size, slotIndex, isPlusChip, plusN, slotVariant) {
    const spec = AVATAR_SIZE_SPECS[size];
    const wrap = figma.createFrame();
    wrap.name = isPlusChip ? `+${plusN}` : `Slot ${slotIndex + 1}`;
    wrap.layoutMode = 'NONE';
    wrap.resize(spec.box, spec.box);
    wrap.cornerRadius = spec.box / 2;
    wrap.clipsContent = true;
    // White outer ring (surface/card) for separation between overlapping slots
    wrap.strokes = [paintFor(av['ring'])];
    wrap.strokeWeight = spec.ring;
    wrap.strokeAlign = 'OUTSIDE';

    if (isPlusChip) {
      wrap.fills = [paintFor(required['state/disabled-bg'])];
    } else if (slotVariant === 'Image') {
      const imgPaint = groupImagePaints[slotIndex % groupImagePaints.length];
      if (imgPaint) {
        wrap.fills = [imgPaint];
      } else {
        // fallback to silhouette over grey if image fetch failed
        wrap.fills = [paintFor(av['image-bg'])];
        drawUserGlyph(wrap, Math.round(spec.box * 0.7), av['icon-color']);
        return wrap;
      }
      return wrap;  // no text overlay for image slots
    } else {
      wrap.fills = [paintFor(av['initials-bg'])];
    }

    const t = figma.createText();
    const fStyle = styleByName[spec.font];
    if (fStyle) {
      try { await figma.loadFontAsync(fStyle.fontName); } catch (e) {}
      await t.setTextStyleIdAsync(fStyle.id);
    }
    try {
      await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
      t.fontName = { family: 'Inter', style: 'Semi Bold' };
    } catch (e) {}
    t.characters = isPlusChip ? `+${plusN}` : GROUP_INITIALS[slotIndex % GROUP_INITIALS.length];
    t.fills = [paintFor(isPlusChip ? required['text/primary'] : av['initials-text'])];
    t.textAutoResize = 'NONE';
    t.resize(spec.box, spec.box);
    t.textAlignHorizontal = 'CENTER';
    t.textAlignVertical = 'CENTER';
    t.x = 0; t.y = 0;
    wrap.appendChild(t);
    return wrap;
  }

  async function makeGroupVariant(size, slotVariant, count, overflow) {
    const spec = AVATAR_SIZE_SPECS[size];
    const overlap = GROUP_OVERLAP[size];
    const comp = figma.createComponent();
    comp.name = `Type=Group, Size=${size}, Variant=${slotVariant}, Shape=Circle, Status=None, Count=${count}, Overflow=${overflow}`;
    comp.layoutMode = 'NONE';
    comp.fills = [];
    comp.clipsContent = false;

    const slots = [];
    const visible = (overflow === 'Plus') ? Math.max(1, count - 1) : count;
    for (let i = 0; i < visible; i++) {
      slots.push(await makeGroupSlot(size, i, false, 0, slotVariant));
    }
    if (overflow === 'Plus') {
      slots.push(await makeGroupSlot(size, visible, true, 5, slotVariant));
    }

    let x = spec.ring;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      s.x = x;
      s.y = spec.ring;
      comp.appendChild(s);
      x += spec.box - overlap;
    }
    const totalW = spec.box + (slots.length - 1) * (spec.box - overlap) + spec.ring * 2;
    const totalH = spec.box + spec.ring * 2;
    comp.resize(totalW, totalH);
    return comp;
  }

  // Build all group variants and append to allVariants/variantMeta
  for (const size of AVATAR_SIZES) {
    for (const slotVariant of GROUP_VARIANTS) {
      for (const count of GROUP_COUNTS) {
        for (const overflow of GROUP_OVERFLOW) {
          try {
            const c = await makeGroupVariant(size, slotVariant, count, overflow);
            allVariants.push(c);
            variantMeta.push({
              type: 'Group', size, variant: slotVariant, shape: 'Circle', status: 'None',
              count, overflow,
            });
          } catch (e) {
            console.error(`[OM DS] Avatar Group variant FAILED ${size}/${slotVariant}/${count}/${overflow}:`, e);
            throw e;
          }
        }
      }
    }
  }
  // Tag single variants too
  for (let i = 0; i < variantMeta.length; i++) {
    if (!variantMeta[i].type) {
      variantMeta[i] = Object.assign({ type: 'Single', count: 1, overflow: 'None' }, variantMeta[i]);
    }
  }
  console.log('[OM DS] all avatar variants built (single + group):', allVariants.length);

  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Avatar';
  compSet.layoutMode = 'NONE';
  compSet.fills = [];

  // 2D grid:
  //   cols = Variant (Image/Initials/Icon) × Status (None/Online/Offline/Busy/Away)
  //   rows = Shape (Circle/Square) × Size (XS/Small/Default/Large/XL)
  const COL_W = 96;        // accommodates XL=72 + ring + gutter
  const STATUS_GAP = 0;    // statuses sit flush within a variant group
  const VARIANT_GAP = 40;  // visual gap between variant groups
  const SHAPE_GAP = 56;    // gap between shape groups
  const PAD_LEFT = 220;
  const PAD_TOP = 140;
  const PAD_RIGHT = 56;
  const PAD_BOT = 56;

  // Per-size row height (taller for bigger avatars)
  const ROW_H = { XS: 44, Small: 52, Default: 64, Large: 80, XL: 100 };

  const colGroups = [];
  const cellX = {};
  let cx = PAD_LEFT;
  for (const variant of AVATAR_VARIANTS) {
    const groupStart = cx;
    const sizesArr = [];
    let groupW = 0;
    for (const status of AVATAR_STATUSES) {
      sizesArr.push({ name: status, x: cx, width: COL_W });
      cellX[`${variant}|${status}`] = cx + COL_W / 2;
      cx += COL_W + STATUS_GAP;
      groupW += COL_W + STATUS_GAP;
    }
    colGroups.push({ name: variant, x: groupStart, width: groupW - STATUS_GAP, sizes: sizesArr });
    cx += VARIANT_GAP;
  }

  const rowGroups = [];
  const rowY = {};
  let cy = PAD_TOP;
  for (const shape of AVATAR_SHAPES) {
    const startY = cy;
    const states = AVATAR_SIZES.map((size) => {
      const h = ROW_H[size];
      const entry = { name: size, y: cy, height: h };
      rowY[`${shape}|${size}`] = cy + h / 2;
      cy += h;
      return entry;
    });
    rowGroups.push({ name: shape, y: startY, states });
    cy += SHAPE_GAP;
  }

  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    if (m.type === 'Group') continue; // placed in second sub-grid below
    const colCx = cellX[`${m.variant}|${m.status}`];
    const rowCy = rowY[`${m.shape}|${m.size}`];
    v.x = Math.round(colCx - v.width / 2);
    v.y = Math.round(rowCy - v.height / 2);
  }

  // ---- GROUP sub-grid (below singles) ----
  // cols = Count (2/3/4/5), rows = Size × Overflow
  const GROUP_SECTION_GAP = 120;       // space between Single section and Group section
  const GROUP_PAD_TOP = cy + GROUP_SECTION_GAP;  // start of group rows in compSet coords
  const GROUP_COL_GAP = 32;
  const GROUP_OVF_GAP = 56;            // gap between size's two overflow rows? actually between size groups

  // Determine widest group variant per Count to size columns
  const groupColWidth = {}; // count -> width
  for (const c of GROUP_COUNTS) {
    let maxW = 0;
    for (let i = 0; i < allVariants.length; i++) {
      if (variantMeta[i].type === 'Group' && variantMeta[i].count === c) {
        maxW = Math.max(maxW, allVariants[i].width);
      }
    }
    groupColWidth[c] = maxW;
  }

  const groupCellX = {};
  let gcx = PAD_LEFT;
  const groupSizesArr = [];
  for (const c of GROUP_COUNTS) {
    const w = groupColWidth[c];
    groupSizesArr.push({ name: String(c), x: gcx, width: w });
    groupCellX[c] = gcx + w / 2;
    gcx += w + GROUP_COL_GAP;
  }
  gcx -= GROUP_COL_GAP;
  const groupColGroups = [{ name: 'Count', x: PAD_LEFT, width: gcx - PAD_LEFT, sizes: groupSizesArr }];

  // Rows: Size × Overflow
  const groupRowY = {};   // `${size}|${overflow}` -> centerY
  const groupRowGroups = [];
  let gcy = GROUP_PAD_TOP;
  for (const size of AVATAR_SIZES) {
    const startY = gcy;
    const states = GROUP_OVERFLOW.map((overflow) => {
      const h = AVATAR_SIZE_SPECS[size].box + AVATAR_SIZE_SPECS[size].ring * 2 + 24;
      const entry = { name: overflow === 'Plus' ? '+N overflow' : 'No overflow', y: gcy, height: h };
      groupRowY[`${size}|${overflow}`] = gcy + h / 2;
      gcy += h;
      return entry;
    });
    groupRowGroups.push({ name: size, y: startY, states });
    gcy += GROUP_OVF_GAP;
  }

  // Place group variants
  for (let i = 0; i < allVariants.length; i++) {
    const m = variantMeta[i];
    if (m.type !== 'Group') continue;
    const v = allVariants[i];
    const colCx = groupCellX[m.count];
    const rowCy = groupRowY[`${m.size}|${m.overflow}`];
    v.x = Math.round(colCx - v.width / 2);
    v.y = Math.round(rowCy - v.height / 2);
  }

  // Final compSet bounds = max of single and group sub-grids
  const finalW = Math.max(cx + PAD_RIGHT, gcx + PAD_RIGHT);
  const finalH = gcy + PAD_BOT;
  compSet.resize(finalW, finalH);

  let maxBottom = 0;
  for (const node of atomsPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) {
      const b = node.y + node.height;
      if (b > maxBottom) maxBottom = b;
    }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  await decorateComponentSet({
    page: atomsPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Avatar',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  // ---- Add Group section labels inside the wrapper frame ----
  // decorateComponentSet wraps compSet inside a FRAME named 'Avatar'.
  const wrapper = atomsPage.findOne(n => n.type === 'FRAME' && n.name === 'Avatar' && n.children && n.children.find(c => c === compSet));
  if (wrapper) {
    const labelStyle = styleByName['Label/Default'];
    const headingStyle = styleByName['Heading/H4'];
    async function mkText(text, style, colorVar, opts) {
      const t = figma.createText();
      if (style) {
        try { await figma.loadFontAsync(style.fontName); } catch (e) {}
        await t.setTextStyleIdAsync(style.id);
      }
      t.characters = text;
      if (colorVar) t.fills = [paintFor(colorVar)];
      if (opts && opts.semibold) {
        try { await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }); t.fontName = { family: 'Inter', style: 'Semi Bold' }; } catch (e) {}
      }
      if (opts && opts.size) t.fontSize = opts.size;
      return t;
    }

    const groupSectionNodes = [];

    // Section title above group sub-grid
    const sectionTitle = await mkText('Grouped (Type=Group)', headingStyle, required['text/primary'], { semibold: true, size: 24 });
    sectionTitle.x = compSet.x + PAD_LEFT - 16;
    sectionTitle.y = compSet.y + GROUP_PAD_TOP - 64;
    wrapper.appendChild(sectionTitle);
    groupSectionNodes.push(sectionTitle);

    // Column header: "Count" + sub-labels 2/3/4/5
    const colHdr = await mkText('Count', headingStyle, required['text/primary'], { semibold: true, size: 18 });
    colHdr.x = compSet.x + groupColGroups[0].x + groupColGroups[0].width / 2 - 30;
    colHdr.y = compSet.y + GROUP_PAD_TOP - 32;
    wrapper.appendChild(colHdr);
    groupSectionNodes.push(colHdr);
    for (const s of groupSizesArr) {
      const sub = await mkText(s.name, labelStyle, required['text/secondary']);
      sub.x = compSet.x + s.x + s.width / 2 - 8;
      sub.y = compSet.y + GROUP_PAD_TOP - 14;
      wrapper.appendChild(sub);
      groupSectionNodes.push(sub);
    }

    // Row labels: Size headings + overflow sub-labels
    for (const rg of groupRowGroups) {
      const hdr = await mkText(rg.name, headingStyle, required['text/primary'], { semibold: true, size: 18 });
      hdr.x = compSet.x + 24;
      hdr.y = compSet.y + rg.y - 28;
      wrapper.appendChild(hdr);
      groupSectionNodes.push(hdr);
      for (const st of rg.states) {
        const lbl = await mkText(st.name, labelStyle, required['text/secondary']);
        lbl.x = compSet.x + 24;
        lbl.y = compSet.y + st.y + st.height / 2 - 8;
        wrapper.appendChild(lbl);
        groupSectionNodes.push(lbl);
      }
    }

    // Group decoration into a locked layer
    if (groupSectionNodes.length > 0) {
      const grp = figma.group(groupSectionNodes, wrapper);
      grp.name = 'Group section labels';
      grp.locked = true;
      grp.expanded = false;
    }

    // Resize wrapper to fit extended compSet
    const PAD = 40;
    const newH = compSet.y + compSet.height + PAD;
    if (wrapper.height < newH) wrapper.resize(wrapper.width, newH);
  }

  figma.notify(`✅ Avatar built: ${allVariants.length} variants (Single + Group).`);
}




// =============================================================================
// FORM ATOMS — Label, TextField, Textarea, Dropdown
//
// Shared design rules:
//   - Sizes (match Button): XS=24 / Small=28 / Medium=32 / Default=36
//   - States: Default / Hover / Active(focused) / Disabled
//   - Status: None / Error / Success / Warning (only at Default state for compactness)
//   - Border: 1px (border/strong rest, brand/primary on focus, status/* on validation)
//   - Active state: only border color change (no outer ring/shadow)
//   - Vertical gap: 2px between Label↔Field and Field↔Helper
//   - Helper text: hidden by default; user enables via boolean
//   - Label is its own component, single size (no per-input size)
// =============================================================================

const FORM_SIZES = ['XS', 'Small', 'Medium', 'Default'];
const FORM_STATES = ['Default', 'Hover', 'Active', 'Disabled'];
const FORM_STATUSES = ['None', 'Error', 'Success', 'Warning'];
const FORM_VGAP = 2;
// Compressed state×status: full state matrix only for None; Error/Success/Warning only at Default
const FORM_STATE_STATUS = (() => {
  const out = [];
  for (const s of FORM_STATES) out.push({ state: s, status: 'None' });
  for (const st of ['Error', 'Success', 'Warning']) out.push({ state: 'Default', status: st });
  return out;
})();
const FORM_SIZE_SPECS = {
  XS:      { h: 24, padX: 8, fontText: 'Body/Small',   icon: 12, gap: 6, radius: 4 },
  Small:   { h: 28, padX: 8, fontText: 'Body/Small',   icon: 14, gap: 6, radius: 6 },
  Medium:  { h: 32, padX: 8, fontText: 'Body/Default', icon: 14, gap: 8, radius: 6 },
  Default: { h: 36, padX: 8, fontText: 'Body/Default', icon: 16, gap: 8, radius: 8 },
};
const FORM_LABEL_STYLE = 'Label/Default';

// Resolve all form-related tokens (used by all 4 builders)
async function resolveFormTokens() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const appearanceCol = collections.find(c => c.name === '_Appearance');
  const themeCol = collections.find(c => c.name === '_Theme');
  if (!appearanceCol) throw new Error('Run Bootstrap first.');
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const appBy = (n) => allColorVars.find(v => v.variableCollectionId === appearanceCol.id && v.name === n);
  const thBy  = (n) => themeCol && allColorVars.find(v => v.variableCollectionId === themeCol.id && v.name === n);
  const anyBy = (n) => appBy(n) || thBy(n);
  const required = {
    'surface/card':           anyBy('surface/card'),
    'surface/base':           anyBy('surface/base'),
    'state/disabled-bg':      anyBy('state/disabled-bg'),
    'state/disabled-border':  anyBy('state/disabled-border'),
    'state/disabled-text':    anyBy('state/disabled-text'),
    'border/default':         anyBy('border/default'),
    'border/strong':          anyBy('border/strong'),
    'text/primary':           anyBy('text/primary'),
    'text/secondary':         anyBy('text/secondary'),
    'text/tertiary':          anyBy('text/tertiary'),
    'icon/default':           anyBy('icon/default'),
    'icon/subtle':            anyBy('icon/subtle'),
    'brand/primary':          anyBy('brand/primary'),
    'brand/primary-subtle':   anyBy('brand/primary-subtle'),
    'brand/primary-muted':    anyBy('brand/primary-muted'),
    'state/focus-ring':       anyBy('state/focus-ring'),
    'status/danger':          anyBy('status/danger'),
    'status/danger-text':     anyBy('status/danger-text') || anyBy('status/danger'),
    'status/danger-border':   anyBy('status/danger-border') || anyBy('status/danger'),
    'status/danger-subtle':   anyBy('status/danger-subtle'),
    'status/success':         anyBy('status/success'),
    'status/success-text':    anyBy('status/success-text') || anyBy('status/success'),
    'status/success-border':  anyBy('status/success-border') || anyBy('status/success'),
    'status/success-subtle':  anyBy('status/success-subtle'),
    'status/warning':         anyBy('status/warning'),
    'status/warning-text':    anyBy('status/warning-text') || anyBy('status/warning'),
    'status/warning-border':  anyBy('status/warning-border') || anyBy('status/warning'),
    'status/warning-subtle':  anyBy('status/warning-subtle'),
  };
  // text/tertiary may not exist; fall back to text/secondary
  if (!required['text/tertiary']) required['text/tertiary'] = required['text/secondary'];
  for (const [k, v] of Object.entries(required)) {
    if (!v) console.warn('[OM DS] form token missing:', k);
  }
  return required;
}

function paintForVar(varRef) {
  return figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', varRef
  );
}

function bindIconColorForm(inst, colorVar) {
  if (!inst || !colorVar) return;
  const apply = (n) => {
    if ('fills' in n && Array.isArray(n.fills) && n.fills.length > 0) n.fills = [paintForVar(colorVar)];
    if ('strokes' in n && Array.isArray(n.strokes) && n.strokes.length > 0) n.strokes = [paintForVar(colorVar)];
    if ('children' in n) for (const c of n.children) apply(c);
  };
  try { apply(inst); } catch (e) {}
}

// Find an icon component by trying multiple common names.
async function findIconComp(iconsPage, names, fallbackColor) {
  if (!iconsPage) return null;
  try {
    const allComps = iconsPage.findAllWithCriteria({ types: ['COMPONENT'] });
    for (const w of names) {
      const found = allComps.find(n => n.name.toLowerCase() === w
        || n.name.toLowerCase() === `icon/${w}`
        || n.name.toLowerCase().endsWith(`/${w}`));
      if (found) return found;
    }
  } catch (e) {}
  return null;
}

// =============================================================================
// LABEL — atom used as instance inside TextField/Textarea/Dropdown
//   Single size (Label/Default text style)
//   State:    Default | Disabled
//   Booleans: Has Optional, Has Info Icon
// =============================================================================
async function buildLabel() {
  console.log('[OM DS] buildLabel started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  const required = await resolveFormTokens();

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);

  // Idempotency — remove old Label set + any orphaned variants
  const _existSet = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Label');
  if (_existSet) _existSet.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Label')) n.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'COMPONENT' && /^State=(Default|Disabled)$/.test(c.name))) n.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'COMPONENT' && /^Size=(XS|Small|Medium|Default|Large), State=(Default|Disabled)$/.test(c.name))) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  const lblStyle = styleByName[FORM_LABEL_STYLE];
  if (lblStyle) try { await figma.loadFontAsync(lblStyle.fontName); } catch (e) {}

  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  const infoIconComp = await findIconComp(iconsPage, ['info-circle', 'info', 'help-circle', 'help', 'i-circle']);

  async function makeLabelVariant(state) {
    const comp = figma.createComponent();
    comp.name = `State=${state}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = 2;
    comp.paddingLeft = comp.paddingRight = comp.paddingTop = comp.paddingBottom = 0;
    comp.fills = [];

    const labelText = figma.createText();
    if (lblStyle) await labelText.setTextStyleIdAsync(lblStyle.id);
    labelText.characters = 'Label';
    labelText.fills = [paintForVar(state === 'Disabled' ? required['state/disabled-text'] : required['text/secondary'])];
    comp.appendChild(labelText);

    const optText = figma.createText();
    if (lblStyle) await optText.setTextStyleIdAsync(lblStyle.id);
    optText.characters = '(Optional)';
    optText.fills = [paintForVar(state === 'Disabled' ? required['state/disabled-text'] : required['text/secondary'])];
    comp.appendChild(optText);

    let infoIc = null;
    if (infoIconComp) {
      infoIc = infoIconComp.createInstance();
      infoIc.resize(14, 14);
      bindIconColorForm(infoIc, state === 'Disabled' ? required['state/disabled-text'] : required['icon/subtle']);
      comp.appendChild(infoIc);
      try { infoIc.layoutSizingHorizontal = 'FIXED'; infoIc.layoutSizingVertical = 'FIXED'; } catch (e) {}
    }

    return { comp, optText, infoIc };
  }

  const allVariants = [];
  const variantMeta = [];
  const optTexts = [];
  const infoIcons = [];
  for (const state of ['Default', 'Disabled']) {
    const { comp, optText, infoIc } = await makeLabelVariant(state);
    allVariants.push(comp);
    variantMeta.push({ state });
    optTexts.push(optText);
    if (infoIc) infoIcons.push(infoIc);
  }

  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Label';
  compSet.layoutMode = 'NONE';
  compSet.fills = [];

  let optPropId = null, infoPropId = null;
  try { optPropId  = compSet.addComponentProperty('Has Optional',  'BOOLEAN', false); } catch (e) {}
  try { infoPropId = compSet.addComponentProperty('Has Info Icon', 'BOOLEAN', false); } catch (e) {}
  if (optPropId)  for (const t of optTexts)  { try { t.componentPropertyReferences  = { visible: optPropId  }; } catch (e) {} }
  if (infoPropId) for (const ic of infoIcons) { try { ic.componentPropertyReferences = { visible: infoPropId }; } catch (e) {} }

  const PAD_LEFT = 220, PAD_TOP = 140, PAD_RIGHT = 56, PAD_BOT = 56;
  const COL_W = 240, ROW_H = 56;
  const colGroups = [{
    name: 'State', x: PAD_LEFT, width: COL_W * 2 + 32,
    sizes: [
      { name: 'Default',  x: PAD_LEFT,                  width: COL_W },
      { name: 'Disabled', x: PAD_LEFT + COL_W + 32,     width: COL_W },
    ],
  }];
  const rowGroups = [{
    name: 'Label', y: PAD_TOP,
    states: [{ name: 'Default', y: PAD_TOP, height: ROW_H }],
  }];
  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    const colX = (m.state === 'Default') ? PAD_LEFT : (PAD_LEFT + COL_W + 32);
    v.x = Math.round(colX + 8);
    v.y = Math.round(PAD_TOP + (ROW_H - v.height) / 2);
  }
  compSet.resize(PAD_LEFT + COL_W * 2 + 32 + PAD_RIGHT, PAD_TOP + ROW_H + PAD_BOT);

  let maxBottom = 0;
  for (const node of atomsPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) { const b = node.y + node.height; if (b > maxBottom) maxBottom = b; }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  await decorateComponentSet({
    page: atomsPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Label',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Label built: ${allVariants.length} variants.`);
}

// Helper: locate the Label component-set on Atoms and return the variant matching state
async function findLabelComponent(state) {
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms'));
  if (!atomsPage) return null;
  const set = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Label');
  if (!set) return null;
  const target = `State=${state}`;
  return set.children.find(c => c.name === target) || set.defaultVariant || set.children[0];
}


// =============================================================================
// TEXTFIELD — single-line text input
//   Size: Small | Default | Large
//   State+Status: 7 combos (None×4 states + 3 statuses × Default state)
//   Content: Empty | Filled
//   Booleans: Has Label, Has Helper, Has Prefix Icon, Has Suffix Icon, Has Clear
// =============================================================================
async function buildTextField() {
  console.log('[OM DS] buildTextField started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  const required = await resolveFormTokens();

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);

  const _existSet = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'TextField');
  if (_existSet) _existSet.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'TextField')) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  const searchIc = await findIconComp(iconsPage, ['search', 'magnifying-glass']);
  const closeIc = await findIconComp(iconsPage, ['x', 'close', 'x-circle', 'close-circle']);

  // Returns { bgVar, borderVar, textVar, placeholderVar }
  function pickColors(state, status, content) {
    const r = required;
    const isDisabled = state === 'Disabled';
    if (isDisabled) {
      return {
        bg: r['state/disabled-bg'], border: r['state/disabled-border'],
        text: r['state/disabled-text'], placeholder: r['state/disabled-text'],
      };
    }
    let border = r['border/strong']; // rest = visible neutral border
    let bg = r['surface/card'];
    if (state === 'Hover')   border = r['text/secondary']; // hover = darker than rest
    if (status === 'Error')   { border = r['status/danger-border'];  bg = r['status/danger-subtle']; }
    if (status === 'Success') { border = r['status/success-border']; }
    if (status === 'Warning') { border = r['status/warning-border']; }
    if (state === 'Active')   { border = r['brand/primary']; }
    return {
      bg, border,
      text: content === 'Filled' ? r['text/primary'] : r['text/tertiary'],
      placeholder: r['text/tertiary'],
    };
  }

  // Look up Label component (built by buildLabel) so we can instance it
  const labelDefault  = await findLabelComponent('Default');
  const labelDisabled = await findLabelComponent('Disabled');
  if (!labelDefault) throw new Error('Run "Build Label" first — TextField needs the Label component.');

  async function makeTextFieldVariant(size, state, status, content) {
    const spec = FORM_SIZE_SPECS[size];
    const comp = figma.createComponent();
    comp.name = `Size=${size}, State=${state}, Status=${status}, Content=${content}`;
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = FORM_VGAP;
    comp.paddingLeft = comp.paddingRight = comp.paddingTop = comp.paddingBottom = 0;
    comp.fills = [];
    const FIELD_W = 320;
    comp.resize(FIELD_W, comp.height);

    const colors = pickColors(state, status, content);

    // Label — instance of Label component (so its nested Has Optional / Has Info Icon
    // properties are exposed when this TextField is used).
    const labelComp = state === 'Disabled' ? (labelDisabled || labelDefault) : labelDefault;
    const labelInst = labelComp.createInstance();
    labelInst.name = 'Label';
    comp.appendChild(labelInst);
    try { labelInst.layoutSizingHorizontal = 'HUG'; labelInst.layoutSizingVertical = 'HUG'; } catch (e) {}

    // Field box
    const field = figma.createFrame();
    field.name = 'Field';
    field.layoutMode = 'HORIZONTAL';
    field.primaryAxisSizingMode = 'FIXED';
    field.counterAxisSizingMode = 'FIXED';
    field.counterAxisAlignItems = 'CENTER';
    field.itemSpacing = spec.gap;
    field.paddingLeft = field.paddingRight = spec.padX;
    field.paddingTop = field.paddingBottom = 0;
    field.cornerRadius = spec.radius;
    field.fills = [paintForVar(colors.bg)];
    field.strokes = [paintForVar(colors.border)];
    field.strokeWeight = 1;
    field.strokeAlign = 'INSIDE';
    field.resize(FIELD_W, spec.h);
    comp.appendChild(field);
    try { field.layoutSizingHorizontal = 'FILL'; } catch (e) {}

    // Prefix icon
    let prefixIc = null;
    if (searchIc) {
      prefixIc = searchIc.createInstance();
      prefixIc.resize(spec.icon, spec.icon);
      bindIconColorForm(prefixIc, state === 'Disabled' ? required['state/disabled-text'] : required['icon/default']);
      prefixIc.visible = false;
      field.appendChild(prefixIc);
      try { prefixIc.layoutSizingHorizontal = 'FIXED'; prefixIc.layoutSizingVertical = 'FIXED'; } catch (e) {}
    }

    // Input text (placeholder or filled)
    const inputText = figma.createText();
    const txtStyle = styleByName[spec.fontText];
    if (txtStyle) await inputText.setTextStyleIdAsync(txtStyle.id);
    inputText.characters = content === 'Filled' ? 'john.doe@example.com' : 'Enter text';
    inputText.fills = [paintForVar(content === 'Filled' ? colors.text : colors.placeholder)];
    inputText.textAutoResize = 'WIDTH_AND_HEIGHT';
    field.appendChild(inputText);
    try { inputText.layoutSizingHorizontal = 'FILL'; } catch (e) {}

    // Clear button (× icon) — always created, hidden by default
    let clearIc = null;
    if (closeIc) {
      clearIc = closeIc.createInstance();
      clearIc.resize(spec.icon, spec.icon);
      bindIconColorForm(clearIc, state === 'Disabled' ? required['state/disabled-text'] : required['icon/subtle']);
      clearIc.visible = false;
      field.appendChild(clearIc);
      try { clearIc.layoutSizingHorizontal = 'FIXED'; clearIc.layoutSizingVertical = 'FIXED'; } catch (e) {}
    }

    // Suffix icon (generic)
    let suffixIc = null;
    if (searchIc) {
      suffixIc = searchIc.createInstance();
      suffixIc.resize(spec.icon, spec.icon);
      bindIconColorForm(suffixIc, state === 'Disabled' ? required['state/disabled-text'] : required['icon/default']);
      suffixIc.visible = false;
      field.appendChild(suffixIc);
      try { suffixIc.layoutSizingHorizontal = 'FIXED'; suffixIc.layoutSizingVertical = 'FIXED'; } catch (e) {}
    }

    // Helper text — hidden by default; shown via boolean
    const helper = figma.createText();
    const helperStyle = styleByName['Body/Small'];
    if (helperStyle) await helper.setTextStyleIdAsync(helperStyle.id);
    if (status === 'Error')        { helper.characters = 'This field is required.';      helper.fills = [paintForVar(required['status/danger-text'])]; }
    else if (status === 'Success') { helper.characters = 'Looks good.';                  helper.fills = [paintForVar(required['status/success-text'])]; }
    else if (status === 'Warning') { helper.characters = 'Double-check this value.';     helper.fills = [paintForVar(required['status/warning-text'])]; }
    else                            { helper.characters = 'Helper text goes here.';      helper.fills = [paintForVar(required['text/secondary'])]; }
    comp.appendChild(helper);
    try { helper.layoutSizingHorizontal = 'FILL'; } catch (e) {}

    return { comp, labelInst, prefixIc, suffixIc, clearIc, helper };
  }

  const allVariants = [];
  const variantMeta = [];
  const labelInsts = [], prefixes = [], suffixes = [], clears = [], helpers = [];
  const CONTENTS = ['Empty', 'Filled'];
  for (const size of FORM_SIZES) {
    for (const ss of FORM_STATE_STATUS) {
      for (const content of CONTENTS) {
        try {
          const r = await makeTextFieldVariant(size, ss.state, ss.status, content);
          allVariants.push(r.comp);
          variantMeta.push({ size, state: ss.state, status: ss.status, content });
          labelInsts.push(r.labelInst);
          if (r.prefixIc) prefixes.push(r.prefixIc);
          if (r.suffixIc) suffixes.push(r.suffixIc);
          if (r.clearIc) clears.push(r.clearIc);
          helpers.push(r.helper);
        } catch (e) {
          console.error(`[OM DS] TextField variant FAILED ${size}/${ss.state}/${ss.status}/${content}:`, e);
          throw e;
        }
      }
    }
  }
  console.log('[OM DS] TextField variants built:', allVariants.length);

  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'TextField';
  compSet.layoutMode = 'NONE';
  compSet.fills = [];

  // Booleans — helper hidden by default
  const propIds = {};
  try { propIds.label   = compSet.addComponentProperty('Has Label',        'BOOLEAN', true);  } catch (e) {}
  try { propIds.helper  = compSet.addComponentProperty('Has Helper',       'BOOLEAN', false); } catch (e) {}
  try { propIds.prefix  = compSet.addComponentProperty('Has Prefix Icon',  'BOOLEAN', false); } catch (e) {}
  try { propIds.suffix  = compSet.addComponentProperty('Has Suffix Icon',  'BOOLEAN', false); } catch (e) {}
  try { propIds.clear   = compSet.addComponentProperty('Has Clear',        'BOOLEAN', false); } catch (e) {}
  if (propIds.label)  for (const n of labelInsts) try { n.componentPropertyReferences = { visible: propIds.label }; } catch (e) {}
  if (propIds.helper) for (const n of helpers)    try { n.componentPropertyReferences = { visible: propIds.helper }; } catch (e) {}
  if (propIds.prefix) for (const n of prefixes)   try { n.componentPropertyReferences = { visible: propIds.prefix }; } catch (e) {}
  if (propIds.suffix) for (const n of suffixes)   try { n.componentPropertyReferences = { visible: propIds.suffix }; } catch (e) {}
  if (propIds.clear)  for (const n of clears)     try { n.componentPropertyReferences = { visible: propIds.clear  }; } catch (e) {}

  // Layout grid: cols = State+Status (7), rows = Size × Content (3 × 2 = 6)
  const PAD_LEFT = 220, PAD_TOP = 160, PAD_RIGHT = 56, PAD_BOT = 56;
  const COL_W = 360, ROW_H = 130, GROUP_GAP = 56;

  const colGroups = [{
    name: 'State × Status', x: PAD_LEFT, width: COL_W * FORM_STATE_STATUS.length,
    sizes: FORM_STATE_STATUS.map((ss, i) => ({
      name: ss.status === 'None' ? ss.state : `${ss.status}`,
      x: PAD_LEFT + i * COL_W, width: COL_W,
    })),
  }];

  const rowGroups = [];
  let cy = PAD_TOP;
  for (const size of FORM_SIZES) {
    const states = CONTENTS.map((c, i) => ({ name: c, y: cy + i * ROW_H, height: ROW_H }));
    rowGroups.push({ name: size, y: cy, states });
    cy += CONTENTS.length * ROW_H + GROUP_GAP;
  }

  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    const colIdx = FORM_STATE_STATUS.findIndex(ss => ss.state === m.state && ss.status === m.status);
    const rg = rowGroups.find(r => r.name === m.size);
    const st = rg.states.find(s => s.name === m.content);
    v.x = Math.round(PAD_LEFT + colIdx * COL_W + (COL_W - v.width) / 2);
    v.y = Math.round(st.y + (ROW_H - v.height) / 2);
  }
  compSet.resize(PAD_LEFT + FORM_STATE_STATUS.length * COL_W + PAD_RIGHT, cy + PAD_BOT);

  let maxBottom = 0;
  for (const node of atomsPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) { const b = node.y + node.height; if (b > maxBottom) maxBottom = b; }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  await decorateComponentSet({
    page: atomsPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'TextField',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ TextField built: ${allVariants.length} variants.`);
}


// =============================================================================
// TEXTAREA — multi-line text, single size (Default 96h)
// =============================================================================
async function buildTextarea() {
  console.log('[OM DS] buildTextarea started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  const required = await resolveFormTokens();

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);

  const _existSet = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Textarea');
  if (_existSet) _existSet.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Textarea')) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  function pickColors(state, status, content) {
    const r = required;
    if (state === 'Disabled') return { bg: r['state/disabled-bg'], border: r['state/disabled-border'], text: r['state/disabled-text'], placeholder: r['state/disabled-text'] };
    let border = r['border/strong']; let bg = r['surface/card'];
    if (state === 'Hover')    border = r['text/secondary'];
    if (status === 'Error')   { border = r['status/danger-border']; bg = r['status/danger-subtle']; }
    if (status === 'Success') border = r['status/success-border'];
    if (status === 'Warning') border = r['status/warning-border'];
    if (state === 'Active')   border = r['brand/primary'];
    return { bg, border, text: content === 'Filled' ? r['text/primary'] : r['text/tertiary'], placeholder: r['text/tertiary'] };
  }

  const labelDefault  = await findLabelComponent('Default');
  const labelDisabled = await findLabelComponent('Disabled');
  if (!labelDefault) throw new Error('Run "Build Label" first — Textarea needs the Label component.');

  async function makeTextareaVariant(state, status, content) {
    const spec = FORM_SIZE_SPECS.Default;
    const comp = figma.createComponent();
    comp.name = `Size=Default, State=${state}, Status=${status}, Content=${content}`;
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = FORM_VGAP;
    comp.fills = [];
    const W = 360;
    comp.resize(W, comp.height);
    const colors = pickColors(state, status, content);

    // Label — instance
    const labelComp = state === 'Disabled' ? (labelDisabled || labelDefault) : labelDefault;
    const labelInst = labelComp.createInstance();
    labelInst.name = 'Label';
    comp.appendChild(labelInst);
    try { labelInst.layoutSizingHorizontal = 'HUG'; labelInst.layoutSizingVertical = 'HUG'; } catch (e) {}

    // Field
    const field = figma.createFrame();
    field.name = 'Field';
    field.layoutMode = 'VERTICAL';
    field.primaryAxisSizingMode = 'FIXED';
    field.counterAxisSizingMode = 'FIXED';
    field.itemSpacing = 0;
    field.paddingLeft = field.paddingRight = spec.padX;
    field.paddingTop = field.paddingBottom = 10;
    field.cornerRadius = spec.radius;
    field.fills = [paintForVar(colors.bg)];
    field.strokes = [paintForVar(colors.border)];
    field.strokeWeight = 1;
    field.strokeAlign = 'INSIDE';
    field.resize(W, 96);
    comp.appendChild(field);
    try { field.layoutSizingHorizontal = 'FILL'; } catch (e) {}

    const inputText = figma.createText();
    const txtStyle = styleByName[spec.fontText];
    if (txtStyle) await inputText.setTextStyleIdAsync(txtStyle.id);
    inputText.characters = content === 'Filled'
      ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Multi-line content sample text.'
      : 'Enter description...';
    inputText.fills = [paintForVar(content === 'Filled' ? colors.text : colors.placeholder)];
    inputText.textAutoResize = 'HEIGHT';
    inputText.resize(W - 2 * spec.padX, inputText.height);
    field.appendChild(inputText);

    // Helper — hidden by default
    const helper = figma.createText();
    const helperStyle = styleByName['Body/Small'];
    if (helperStyle) await helper.setTextStyleIdAsync(helperStyle.id);
    if (status === 'Error')        { helper.characters = 'This field is required.'; helper.fills = [paintForVar(required['status/danger-text'])]; }
    else if (status === 'Success') { helper.characters = 'Looks good.';             helper.fills = [paintForVar(required['status/success-text'])]; }
    else if (status === 'Warning') { helper.characters = 'Please review.';          helper.fills = [paintForVar(required['status/warning-text'])]; }
    else                            { helper.characters = 'Up to 500 characters.';   helper.fills = [paintForVar(required['text/secondary'])]; }
    comp.appendChild(helper);
    try { helper.layoutSizingHorizontal = 'FILL'; } catch (e) {}

    return { comp, labelInst, helper };
  }

  const allVariants = [];
  const variantMeta = [];
  const labelInsts = [], helpers = [];
  const CONTENTS = ['Empty', 'Filled'];
  for (const ss of FORM_STATE_STATUS) {
    for (const content of CONTENTS) {
      const r = await makeTextareaVariant(ss.state, ss.status, content);
      allVariants.push(r.comp);
      variantMeta.push({ state: ss.state, status: ss.status, content });
      labelInsts.push(r.labelInst);
      helpers.push(r.helper);
    }
  }

  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Textarea';
  compSet.layoutMode = 'NONE';
  compSet.fills = [];

  const propIds = {};
  try { propIds.label  = compSet.addComponentProperty('Has Label',  'BOOLEAN', true);  } catch (e) {}
  try { propIds.helper = compSet.addComponentProperty('Has Helper', 'BOOLEAN', false); } catch (e) {}
  if (propIds.label)  for (const n of labelInsts) try { n.componentPropertyReferences = { visible: propIds.label }; } catch (e) {}
  if (propIds.helper) for (const n of helpers)    try { n.componentPropertyReferences = { visible: propIds.helper }; } catch (e) {}

  // Layout: cols = State+Status, rows = Content (Empty/Filled)
  const PAD_LEFT = 220, PAD_TOP = 160, PAD_RIGHT = 56, PAD_BOT = 56;
  const COL_W = 400, ROW_H = 200;
  const colGroups = [{
    name: 'State × Status', x: PAD_LEFT, width: COL_W * FORM_STATE_STATUS.length,
    sizes: FORM_STATE_STATUS.map((ss, i) => ({
      name: ss.status === 'None' ? ss.state : ss.status,
      x: PAD_LEFT + i * COL_W, width: COL_W,
    })),
  }];
  const rowGroups = [{
    name: 'Content', y: PAD_TOP,
    states: CONTENTS.map((c, i) => ({ name: c, y: PAD_TOP + i * ROW_H, height: ROW_H })),
  }];

  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    const colIdx = FORM_STATE_STATUS.findIndex(ss => ss.state === m.state && ss.status === m.status);
    const rowIdx = CONTENTS.indexOf(m.content);
    v.x = Math.round(PAD_LEFT + colIdx * COL_W + (COL_W - v.width) / 2);
    v.y = Math.round(PAD_TOP + rowIdx * ROW_H + (ROW_H - v.height) / 2);
  }
  compSet.resize(PAD_LEFT + FORM_STATE_STATUS.length * COL_W + PAD_RIGHT,
                 PAD_TOP + CONTENTS.length * ROW_H + PAD_BOT);

  let maxBottom = 0;
  for (const node of atomsPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) { const b = node.y + node.height; if (b > maxBottom) maxBottom = b; }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  await decorateComponentSet({
    page: atomsPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Textarea',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Textarea built: ${allVariants.length} variants.`);
}


// =============================================================================
// CHIP — neutral/grey chip used inside Dropdown Multi-Chips
//   Size:     Small (16h) | Default (20h)
//   Booleans: Has Icon, Has Close
// =============================================================================
const CHIP_SIZE_SPECS = {
  Small:   { h: 20, padX: 6, gap: 4, icon: 12, font: 'Body/Small',   radius: 4 },
  Default: { h: 28, padX: 10, gap: 6, icon: 14, font: 'Body/Default', radius: 6 },
};

async function buildChip() {
  console.log('[OM DS] buildChip started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  const required = await resolveFormTokens();

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);

  const _existSet = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Chip');
  if (_existSet) _existSet.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Chip')) n.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'COMPONENT' && /^Size=(Small|Default)(, State=(Default|Disabled))?$/.test(c.name))) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });

  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  const tagIc = await findIconComp(iconsPage, ['tag', 'bookmark', 'link', 'flag']);
  const closeIc = await findIconComp(iconsPage, ['x', 'close', 'x-circle']);

  async function makeChipVariant(size, state) {
    const spec = CHIP_SIZE_SPECS[size];
    const isDisabled = state === 'Disabled';
    const comp = figma.createComponent();
    comp.name = `Size=${size}, State=${state}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = spec.gap;
    comp.paddingLeft = comp.paddingRight = spec.padX;
    comp.paddingTop = comp.paddingBottom = 0;
    comp.cornerRadius = spec.radius;
    comp.fills = [paintForVar(required['state/disabled-bg'])];
    comp.strokes = [paintForVar(isDisabled ? required['state/disabled-border'] : required['border/default'])];
    comp.strokeWeight = 1;
    comp.strokeAlign = 'INSIDE';
    comp.resize(comp.width, spec.h);

    let leadingIc = null;
    if (tagIc) {
      leadingIc = tagIc.createInstance();
      leadingIc.resize(spec.icon, spec.icon);
      bindIconColorForm(leadingIc, isDisabled ? required['state/disabled-text'] : required['icon/default']);
      comp.appendChild(leadingIc);
      try { leadingIc.layoutSizingHorizontal = 'FIXED'; leadingIc.layoutSizingVertical = 'FIXED'; } catch (e) {}
    }

    const t = figma.createText();
    const ts = styleByName[spec.font];
    if (ts) { try { await figma.loadFontAsync(ts.fontName); } catch (e) {} await t.setTextStyleIdAsync(ts.id); }
    t.characters = 'Active list';
    t.fills = [paintForVar(isDisabled ? required['state/disabled-text'] : required['text/primary'])];
    comp.appendChild(t);

    let closeBtn = null;
    if (closeIc) {
      closeBtn = closeIc.createInstance();
      closeBtn.resize(spec.icon, spec.icon);
      bindIconColorForm(closeBtn, isDisabled ? required['state/disabled-text'] : required['icon/subtle']);
      comp.appendChild(closeBtn);
      try { closeBtn.layoutSizingHorizontal = 'FIXED'; closeBtn.layoutSizingVertical = 'FIXED'; } catch (e) {}
    }

    // Force fixed height AFTER children added so counter-axis doesn't hug down
    try { comp.layoutSizingVertical = 'FIXED'; } catch (e) {}
    comp.resize(comp.width, spec.h);

    return { comp, leadingIc, closeBtn };
  }

  const allVariants = [];
  const variantMeta = [];
  const leadings = [], closes = [];
  for (const size of ['Small', 'Default']) {
    for (const state of ['Default', 'Disabled']) {
      const r = await makeChipVariant(size, state);
      allVariants.push(r.comp);
      variantMeta.push({ size, state });
      if (r.leadingIc) leadings.push(r.leadingIc);
      if (r.closeBtn) closes.push(r.closeBtn);
    }
  }

  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Chip';
  compSet.layoutMode = 'NONE';
  compSet.fills = [];

  let iconPropId = null, closePropId = null;
  try { iconPropId  = compSet.addComponentProperty('Has Icon',  'BOOLEAN', true); } catch (e) {}
  try { closePropId = compSet.addComponentProperty('Has Close', 'BOOLEAN', true); } catch (e) {}
  if (iconPropId)  for (const n of leadings) try { n.componentPropertyReferences = { visible: iconPropId }; } catch (e) {}
  if (closePropId) for (const n of closes)   try { n.componentPropertyReferences = { visible: closePropId }; } catch (e) {}

  const PAD_LEFT = 220, PAD_TOP = 140, PAD_RIGHT = 56, PAD_BOT = 56;
  const COL_W = 200, ROW_H = 60;
  const colGroups = [{
    name: 'Size', x: PAD_LEFT, width: COL_W * 2 + 32,
    sizes: [
      { name: 'Small',   x: PAD_LEFT,                width: COL_W },
      { name: 'Default', x: PAD_LEFT + COL_W + 32,   width: COL_W },
    ],
  }];
  const rowGroups = [{
    name: 'State', y: PAD_TOP,
    states: [
      { name: 'Default',  y: PAD_TOP,             height: ROW_H },
      { name: 'Disabled', y: PAD_TOP + ROW_H,     height: ROW_H },
    ],
  }];
  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    const colX = (m.size === 'Small') ? PAD_LEFT : (PAD_LEFT + COL_W + 32);
    const rowY = PAD_TOP + (m.state === 'Disabled' ? ROW_H : 0);
    v.x = Math.round(colX + 8);
    v.y = Math.round(rowY + (ROW_H - v.height) / 2);
  }
  compSet.resize(PAD_LEFT + COL_W * 2 + 32 + PAD_RIGHT, PAD_TOP + ROW_H * 2 + PAD_BOT);

  let maxBottom = 0;
  for (const node of atomsPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) { const b = node.y + node.height; if (b > maxBottom) maxBottom = b; }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  await decorateComponentSet({
    page: atomsPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Chip',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Chip built: ${allVariants.length} variants.`);
}

// Look up Chip component by Size + State variant
async function findChipComponent(size, state) {
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms'));
  if (!atomsPage) return null;
  const set = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Chip');
  if (!set) return null;
  const target = `Size=${size}, State=${state || 'Default'}`;
  return set.children.find(c => c.name === target)
      || set.children.find(c => c.name === `Size=${size}`)
      || set.defaultVariant || set.children[0];
}


// =============================================================================
// DIVIDER — visual separator
//   Orientation: Horizontal | Vertical
//   Style:       Solid | Dashed
//   Booleans:    Has Label (horizontal only — text centered with rules on each side)
//   Tokens:      stroke = border/default, label text = text/secondary
// =============================================================================
async function buildDivider() {
  console.log('[OM DS] buildDivider started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  const required = await resolveFormTokens();

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);

  // Idempotency
  const _existSet = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Divider');
  if (_existSet) _existSet.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Divider')) n.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'COMPONENT' && /^Orientation=(Horizontal|Vertical), Style=(Solid|Dashed)$/.test(c.name))) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  const lblStyle = styleByName['Label/Default'];
  if (lblStyle) try { await figma.loadFontAsync(lblStyle.fontName); } catch (e) {}

  const H_LEN = 320;   // horizontal divider total length
  const V_LEN = 80;    // vertical divider total length
  const STROKE = 1;
  const DASH_PATTERN = [4, 4];

  function makeRule(orientation, style, length) {
    const ln = figma.createLine();
    ln.name = 'Rule';
    ln.strokes = [paintForVar(required['border/default'])];
    ln.strokeWeight = STROKE;
    if (style === 'Dashed') ln.dashPattern = DASH_PATTERN;
    if (orientation === 'Horizontal') {
      ln.resize(length, 0);
    } else {
      ln.rotation = -90;
      ln.resize(length, 0);
    }
    return ln;
  }

  async function makeVariant(orientation, style) {
    const comp = figma.createComponent();
    comp.name = `Orientation=${orientation}, Style=${style}`;

    if (orientation === 'Horizontal') {
      // HORIZONTAL frame: [rule] [label] [rule]
      comp.layoutMode = 'HORIZONTAL';
      comp.primaryAxisSizingMode = 'FIXED';
      comp.counterAxisSizingMode = 'AUTO';
      comp.primaryAxisAlignItems = 'CENTER';
      comp.counterAxisAlignItems = 'CENTER';
      comp.itemSpacing = 12;
      comp.paddingLeft = comp.paddingRight = 0;
      comp.paddingTop = comp.paddingBottom = 0;
      comp.fills = [];
      comp.resize(H_LEN, 16);

      const ruleA = makeRule('Horizontal', style, 100);
      comp.appendChild(ruleA);
      try { ruleA.layoutGrow = 1; ruleA.layoutSizingHorizontal = 'FILL'; } catch (e) {}

      const label = figma.createText();
      if (lblStyle) await label.setTextStyleIdAsync(lblStyle.id);
      label.characters = 'OR';
      label.fills = [paintForVar(required['text/secondary'])];
      label.name = 'Label';
      comp.appendChild(label);
      try { label.layoutSizingHorizontal = 'HUG'; label.layoutSizingVertical = 'HUG'; } catch (e) {}

      const ruleB = makeRule('Horizontal', style, 100);
      comp.appendChild(ruleB);
      try { ruleB.layoutGrow = 1; ruleB.layoutSizingHorizontal = 'FILL'; } catch (e) {}

      return { comp, label, ruleA, ruleB };
    } else {
      // VERTICAL — single line, no label option
      comp.layoutMode = 'VERTICAL';
      comp.primaryAxisSizingMode = 'FIXED';
      comp.counterAxisSizingMode = 'AUTO';
      comp.primaryAxisAlignItems = 'CENTER';
      comp.counterAxisAlignItems = 'CENTER';
      comp.itemSpacing = 0;
      comp.paddingLeft = comp.paddingRight = 0;
      comp.paddingTop = comp.paddingBottom = 0;
      comp.fills = [];
      comp.resize(STROKE, V_LEN);

      const rule = makeRule('Vertical', style, V_LEN);
      comp.appendChild(rule);

      return { comp, label: null, ruleA: rule, ruleB: null };
    }
  }

  const allVariants = [];
  const variantMeta = [];
  const labelNodes = [];   // for Has Label boolean wiring (horizontal only)
  for (const orientation of ['Horizontal', 'Vertical']) {
    for (const style of ['Solid', 'Dashed']) {
      const { comp, label } = await makeVariant(orientation, style);
      allVariants.push(comp);
      variantMeta.push({ orientation, style });
      if (label) labelNodes.push(label);
    }
  }

  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Divider';
  compSet.layoutMode = 'NONE';
  compSet.fills = [];

  // Has Label boolean — applies only to horizontal variants. We toggle the label
  // visibility on horizontal variants; vertical variants have no label so the
  // boolean is harmless there.
  let labelPropId = null;
  try { labelPropId = compSet.addComponentProperty('Has Label', 'BOOLEAN', true); } catch (e) {}
  if (labelPropId) {
    for (const t of labelNodes) {
      try { t.componentPropertyReferences = { visible: labelPropId }; } catch (e) {}
    }
  }

  // Layout — 2 cols (Solid/Dashed) × 2 rows (Horizontal/Vertical)
  const PAD_LEFT = 220, PAD_TOP = 140, PAD_RIGHT = 56, PAD_BOT = 56;
  const COL_W = 360, ROW_H = 100, COL_GAP = 32, ROW_GAP = 32;
  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    const colIdx = m.style === 'Solid' ? 0 : 1;
    const rowIdx = m.orientation === 'Horizontal' ? 0 : 1;
    v.x = Math.round(PAD_LEFT + colIdx * (COL_W + COL_GAP));
    v.y = Math.round(PAD_TOP + rowIdx * (ROW_H + ROW_GAP) + (ROW_H - v.height) / 2);
  }
  compSet.resize(
    PAD_LEFT + COL_W * 2 + COL_GAP + PAD_RIGHT,
    PAD_TOP + ROW_H * 2 + ROW_GAP + PAD_BOT
  );

  // Position below all existing components
  let maxBottom = 0;
  for (const node of atomsPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) { const b = node.y + node.height; if (b > maxBottom) maxBottom = b; }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  const colGroups = [{
    name: 'Style', x: PAD_LEFT, width: COL_W * 2 + COL_GAP,
    sizes: [
      { name: 'Solid',  x: PAD_LEFT,                     width: COL_W },
      { name: 'Dashed', x: PAD_LEFT + COL_W + COL_GAP,   width: COL_W },
    ],
  }];
  const rowGroups = [{
    name: 'Orientation', y: PAD_TOP,
    states: [
      { name: 'Horizontal', y: PAD_TOP,                          height: ROW_H },
      { name: 'Vertical',   y: PAD_TOP + ROW_H + ROW_GAP,        height: ROW_H },
    ],
  }];
  await decorateComponentSet({
    page: atomsPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Divider',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Divider built: ${allVariants.length} variants.`);
}


// =============================================================================
// SPINNER — loading indicator
//   Size:  XS(12) | Small(16) | Default(20) | Large(24) | XL(32)
//   Color: Brand | Neutral | On-Brand (white spinner for use on brand bg)
//   Booleans: Has Label (inline label after spinner)
//   Implementation: 360° arc as a circle with a stroke gap (using stroke +
//   square cornered ellipse + transparent gap arc) — simplest cross-version
//   approach is an ellipse with stroke and a top "notch" achieved by a small
//   white-colored arc cap. We use a stroked ellipse with `strokeAlign='CENTER'`,
//   then a smaller filled arc on top is impractical without vector math.
//   Instead: ring = stroked ellipse + a single colored vector arc covering 75%.
// =============================================================================
const SPINNER_SIZE_SPECS = {
  XS:      { d: 12, weight: 1.5, font: 'Body/Small',   labelGap: 6 },
  Small:   { d: 16, weight: 2,   font: 'Body/Small',   labelGap: 8 },
  Default: { d: 20, weight: 2,   font: 'Body/Default', labelGap: 8 },
  Large:   { d: 24, weight: 2.5, font: 'Body/Default', labelGap: 10 },
  XL:      { d: 32, weight: 3,   font: 'Body/Default', labelGap: 12 },
};

async function buildSpinner() {
  console.log('[OM DS] buildSpinner started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  const required = await resolveFormTokens();

  // Need brand/on-primary too
  const allColorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const themeCol = collections.find(c => c.name === '_Theme');
  const onPrimary = themeCol && allColorVars.find(v => v.variableCollectionId === themeCol.id && v.name === 'brand/on-primary');

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);

  // Idempotency
  const _existSet = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Spinner');
  if (_existSet) _existSet.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Spinner')) n.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'COMPONENT' && /^Size=(XS|Small|Medium|Default|Large|XL), Color=(Brand|Neutral|On-Brand)$/.test(c.name))) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  const fontsToLoad = new Set();
  for (const k of Object.keys(SPINNER_SIZE_SPECS)) {
    const st = styleByName[SPINNER_SIZE_SPECS[k].font];
    if (st) fontsToLoad.add(JSON.stringify(st.fontName));
  }
  for (const f of fontsToLoad) await figma.loadFontAsync(JSON.parse(f));

  function colorVarFor(color) {
    if (color === 'Brand')    return required['brand/primary'];
    if (color === 'On-Brand') return onPrimary || required['surface/card'];
    return required['icon/default'];                 // Neutral
  }
  function trackVarFor(color) {
    // Light "track" ring behind the moving arc
    if (color === 'On-Brand') return required['brand/primary-muted'] || required['state/disabled-bg'];
    return required['state/disabled-bg'];
  }

  // Build a spinner ring as: ellipse track (full circle, stroked) + ellipse 270° arc
  // drawn as a FILLED donut sector via arcData + innerRadius. This avoids both the
  // pacman-pie problem (radial edges) and the SVG-A path issue (Figma vectorPaths
  // don't support the A arc command).
  function makeRing(d, weight, activeVar, trackVar) {
    const wrap = figma.createFrame();
    wrap.name = 'Ring';
    wrap.layoutMode = 'NONE';
    wrap.fills = [];
    wrap.clipsContent = false;
    wrap.resize(d, d);

    // Track (full ring) — stroked ellipse
    const track = figma.createEllipse();
    track.name = 'Track';
    track.resize(d, d);
    track.fills = [];
    track.strokes = [paintForVar(trackVar)];
    track.strokeWeight = weight;
    track.strokeAlign = 'INSIDE';
    wrap.appendChild(track);

    // Active arc — donut sector (filled): outer radius = d/2, inner radius = d/2 - weight.
    // innerRadius is normalized 0..1. Set angles so arc starts at top and sweeps 270°
    // clockwise to the left — avoids needing rotation (rotation in Figma is around
    // top-left and would shift the bounding box off the track).
    const inner = Math.max(0, (d / 2 - weight) / (d / 2));
    const arc = figma.createEllipse();
    arc.name = 'Arc';
    arc.resize(d, d);
    arc.strokes = [];
    arc.fills = [paintForVar(activeVar)];
    arc.arcData = {
      startingAngle: -Math.PI / 2,           // top (12 o'clock)
      endingAngle:    Math.PI,               // left (9 o'clock) — sweep 270°
      innerRadius: inner,
    };
    wrap.appendChild(arc);

    return wrap;
  }

  async function makeVariant(size, color) {
    const spec = SPINNER_SIZE_SPECS[size];
    const comp = figma.createComponent();
    comp.name = `Size=${size}, Color=${color}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = spec.labelGap;
    comp.paddingLeft = comp.paddingRight = 0;
    comp.paddingTop = comp.paddingBottom = 0;
    comp.fills = [];

    const ring = makeRing(spec.d, spec.weight, colorVarFor(color), trackVarFor(color));
    comp.appendChild(ring);
    try { ring.layoutSizingHorizontal = 'FIXED'; ring.layoutSizingVertical = 'FIXED'; } catch (e) {}

    const label = figma.createText();
    const fStyle = styleByName[spec.font];
    if (fStyle) await label.setTextStyleIdAsync(fStyle.id);
    label.characters = 'Loading…';
    label.fills = [paintForVar(color === 'On-Brand' ? (onPrimary || required['surface/card']) : required['text/secondary'])];
    label.name = 'Label';
    comp.appendChild(label);
    try { label.layoutSizingHorizontal = 'HUG'; label.layoutSizingVertical = 'HUG'; } catch (e) {}

    return { comp, label };
  }

  const SIZES  = ['XS', 'Small', 'Default', 'Large', 'XL'];
  const COLORS = ['Brand', 'Neutral', 'On-Brand'];

  const allVariants = [];
  const variantMeta = [];
  const labelNodes = [];
  for (const size of SIZES) {
    for (const color of COLORS) {
      const { comp, label } = await makeVariant(size, color);
      allVariants.push(comp);
      variantMeta.push({ size, color });
      labelNodes.push(label);
    }
  }

  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Spinner';
  compSet.layoutMode = 'NONE';
  compSet.fills = [];

  let labelPropId = null;
  try { labelPropId = compSet.addComponentProperty('Has Label', 'BOOLEAN', false); } catch (e) {}
  if (labelPropId) {
    for (const t of labelNodes) {
      try { t.componentPropertyReferences = { visible: labelPropId }; } catch (e) {}
    }
  }

  // Layout: 3 cols (Brand/Neutral/On-Brand) × 5 rows (sizes)
  // On-Brand col gets a brand-muted backdrop so the white spinner is visible.
  const PAD_LEFT = 220, PAD_TOP = 140, PAD_RIGHT = 56, PAD_BOT = 56;
  const COL_W = 220, ROW_H = 56, COL_GAP = 32, ROW_GAP = 24;
  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    const colIdx = COLORS.indexOf(m.color);
    const rowIdx = SIZES.indexOf(m.size);
    v.x = Math.round(PAD_LEFT + colIdx * (COL_W + COL_GAP) + (COL_W - v.width) / 2);
    v.y = Math.round(PAD_TOP + rowIdx * (ROW_H + ROW_GAP) + (ROW_H - v.height) / 2);
  }
  compSet.resize(
    PAD_LEFT + COL_W * COLORS.length + COL_GAP * (COLORS.length - 1) + PAD_RIGHT,
    PAD_TOP + ROW_H * SIZES.length + ROW_GAP * (SIZES.length - 1) + PAD_BOT
  );

  let maxBottom = 0;
  for (const node of atomsPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) { const b = node.y + node.height; if (b > maxBottom) maxBottom = b; }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  const colGroups = [{
    name: 'Color', x: PAD_LEFT, width: COL_W * COLORS.length + COL_GAP * (COLORS.length - 1),
    sizes: COLORS.map((c, i) => ({ name: c, x: PAD_LEFT + i * (COL_W + COL_GAP), width: COL_W })),
  }];
  const rowGroups = [{
    name: 'Size', y: PAD_TOP,
    states: SIZES.map((s, i) => ({ name: s, y: PAD_TOP + i * (ROW_H + ROW_GAP), height: ROW_H })),
  }];
  await decorateComponentSet({
    page: atomsPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Spinner',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Spinner built: ${allVariants.length} variants.`);
}


// =============================================================================
// MENU ITEM (molecule) — rich row used inside Dropdown Menu / Context Menu
//   Size:   Small (28h) | Default (32h)
//   Type:   Single | Multi-Select  (Multi shows checkbox at leading slot)
//   State:  Default | Hover | Selected | Disabled
//   Bools:  Has Leading Icon (Single only — default true), Has Description,
//           Has Shortcut, Has Trailing Icon
//   Visual:
//     Default  → no fill, text=primary, icon=icon/default
//     Hover    → bg=state/disabled-bg (light grey), text=primary
//     Selected → bg=brand/primary-subtle (peach), text=brand/primary,
//                trailing CHECK icon shown (Single) / checkbox = ON (Multi)
//     Disabled → text=state/disabled-text, no bg
// =============================================================================
const MENU_ITEM_SIZE_SPECS = {
  Small:   { h: 30, padX: 10, font: 'Body/Small',   gap: 8,  icon: 14, radius: 4 },
  Default: { h: 36, padX: 12, font: 'Body/Default', gap: 10, icon: 16, radius: 6 },
};

async function findCheckboxComponent(checked /* 'Checked'|'Unchecked' */, state /* 'Default'|'Disabled' */) {
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms'));
  if (!atomsPage) return null;
  const set = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Checkbox');
  if (!set) return null;
  state = state || 'Default';
  // Prefer smallest Size + Content=None when present.
  const wantSize    = /Size=Small/i;
  const wantState   = new RegExp(`State=${state}`, 'i');
  const wantChecked = new RegExp(`Checked=${checked}`, 'i');
  const wantContent = /Content=(None|none|Default)/i;
  const score = (c) => (wantState.test(c.name) ? 8 : 0)
                    + (wantChecked.test(c.name) ? 4 : 0)
                    + (wantSize.test(c.name) ? 2 : 0)
                    + (wantContent.test(c.name) ? 1 : 0);
  let best = null, bestScore = -1;
  for (const c of set.children) {
    const s = score(c);
    if (s > bestScore) { best = c; bestScore = s; }
  }
  return best || set.defaultVariant || set.children[0];
}

// Light shadow for popovers (subtle elevation)
function menuShadowEffects() {
  return [
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 2 },  radius: 4,  spread: 0, visible: true, blendMode: 'NORMAL' },
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.10 }, offset: { x: 0, y: 8 },  radius: 24, spread: 0, visible: true, blendMode: 'NORMAL' },
  ];
}

async function buildMenuItem() {
  console.log('[OM DS] buildMenuItem started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  const required = await resolveFormTokens();

  const moleculesPage = figma.root.children.find(p => p.name.includes('Molecules'))
                     || figma.root.children.find(p => p.name.includes('Atoms'))
                     || figma.currentPage;
  await figma.setCurrentPageAsync(moleculesPage);

  // Idempotency
  const _exist = moleculesPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Menu Item');
  if (_exist) _exist.remove();
  for (const n of moleculesPage.children.filter(c => c.type === 'FRAME' && c.name === 'Menu Item')) n.remove();
  for (const n of moleculesPage.children.filter(c => c.type === 'COMPONENT' && /^Size=(Small|Default), Type=(Single|Multi-Select), State=(Default|Hover|Selected|Disabled)$/.test(c.name))) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  const fontsToLoad = new Set();
  for (const k of Object.keys(MENU_ITEM_SIZE_SPECS)) {
    const st = styleByName[MENU_ITEM_SIZE_SPECS[k].font];
    if (st) fontsToLoad.add(JSON.stringify(st.fontName));
  }
  const descStyle = styleByName['Body/Small'];
  if (descStyle) fontsToLoad.add(JSON.stringify(descStyle.fontName));
  for (const f of fontsToLoad) await figma.loadFontAsync(JSON.parse(f));

  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  const leadIc   = await findIconComp(iconsPage, ['user', 'profile', 'home', 'settings', 'star']);
  const trailIc  = await findIconComp(iconsPage, ['chevron-right', 'arrow-right', 'caret-right']);
  const checkIc  = await findIconComp(iconsPage, ['check', 'tick', 'checkmark', 'check-mark']);
  const checkOnDef   = await findCheckboxComponent('Checked',   'Default');
  const checkOffDef  = await findCheckboxComponent('Unchecked', 'Default');
  const checkOnDis   = await findCheckboxComponent('Checked',   'Disabled');
  const checkOffDis  = await findCheckboxComponent('Unchecked', 'Disabled');
  const cbForMenu = (menuState) => {
    if (menuState === 'Selected') return checkOnDef  || checkOffDef;
    if (menuState === 'Disabled') return checkOffDis || checkOffDef;
    return checkOffDef;
  };

  function colorsFor(state) {
    if (state === 'Disabled') return {
      bg: null,
      text: required['state/disabled-text'],
      desc: required['state/disabled-text'],
      icon: required['state/disabled-text'],
      shortcut: required['state/disabled-text'],
    };
    if (state === 'Selected') return {
      bg: required['brand/primary-subtle'] || required['brand/primary-muted'],
      text: required['brand/primary'],
      desc: required['text/secondary'],
      icon: required['brand/primary'],
      shortcut: required['brand/primary'],
    };
    if (state === 'Hover') return {
      bg: required['state/disabled-bg'] || required['surface/base'],   // greyish per user
      text: required['text/primary'],
      desc: required['text/secondary'],
      icon: required['icon/default'] || required['text/primary'],
      shortcut: required['text/secondary'],
    };
    return {
      bg: null,
      text: required['text/primary'],
      desc: required['text/secondary'],
      icon: required['icon/default'] || required['text/primary'],
      shortcut: required['text/secondary'],
    };
  }

  async function makeVariant(size, type, state) {
    const spec = MENU_ITEM_SIZE_SPECS[size];
    const colors = colorsFor(state);

    const comp = figma.createComponent();
    comp.name = `Size=${size}, Type=${type}, State=${state}`;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'AUTO';
    comp.primaryAxisAlignItems = 'MIN';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = spec.gap;
    comp.paddingLeft = comp.paddingRight = spec.padX;
    comp.paddingTop = comp.paddingBottom = (spec.h - 16) / 2;
    comp.cornerRadius = spec.radius;
    comp.fills = colors.bg ? [paintForVar(colors.bg)] : [];
    comp.resize(240, spec.h);

    // Leading slot — Multi-Select shows Checkbox; Single shows leading icon (toggleable)
    let leadInst = null;
    let cbInst = null;
    if (type === 'Multi-Select') {
      const cbComp = cbForMenu(state);
      if (cbComp) {
        cbInst = cbComp.createInstance();
        cbInst.name = 'Checkbox';
        comp.appendChild(cbInst);
        try { cbInst.layoutSizingHorizontal = 'HUG'; cbInst.layoutSizingVertical = 'HUG'; } catch (e) {}
      }
    } else if (leadIc) {
      leadInst = leadIc.createInstance();
      leadInst.name = 'Leading';
      leadInst.resize(spec.icon, spec.icon);
      bindIconColorForm(leadInst, colors.icon);
      comp.appendChild(leadInst);
      try { leadInst.layoutSizingHorizontal = 'FIXED'; leadInst.layoutSizingVertical = 'FIXED'; } catch (e) {}
    }

    // Text column (Label + optional Description)
    const textCol = figma.createFrame();
    textCol.name = 'Text';
    textCol.layoutMode = 'VERTICAL';
    textCol.primaryAxisSizingMode = 'AUTO';
    textCol.counterAxisSizingMode = 'AUTO';
    textCol.primaryAxisAlignItems = 'MIN';
    textCol.counterAxisAlignItems = 'MIN';
    textCol.itemSpacing = 1;
    textCol.fills = [];
    comp.appendChild(textCol);

    const label = figma.createText();
    const fStyle = styleByName[spec.font];
    if (fStyle) await label.setTextStyleIdAsync(fStyle.id);
    label.characters = 'Menu item label';
    label.fills = [paintForVar(colors.text)];
    label.name = 'Label';
    textCol.appendChild(label);

    const desc = figma.createText();
    if (descStyle) await desc.setTextStyleIdAsync(descStyle.id);
    desc.characters = 'Helpful description';
    desc.fills = [paintForVar(colors.desc)];
    desc.name = 'Description';
    textCol.appendChild(desc);

    try { textCol.layoutSizingHorizontal = 'FILL'; textCol.layoutSizingVertical = 'HUG'; } catch (e) {}

    // Shortcut text (right-aligned via FILL textCol)
    const shortcut = figma.createText();
    if (fStyle) await shortcut.setTextStyleIdAsync(fStyle.id);
    shortcut.characters = '⌘K';
    shortcut.fills = [paintForVar(colors.shortcut)];
    shortcut.name = 'Shortcut';
    comp.appendChild(shortcut);

    // Trailing — Selected (Single) shows CHECK; otherwise chevron-right (boolean toggle)
    let trailInst = null;
    let trailCheckInst = null;
    if (type === 'Single' && state === 'Selected' && checkIc) {
      trailCheckInst = checkIc.createInstance();
      trailCheckInst.name = 'Selected Check';
      trailCheckInst.resize(spec.icon, spec.icon);
      bindIconColorForm(trailCheckInst, colors.icon);
      comp.appendChild(trailCheckInst);
      try { trailCheckInst.layoutSizingHorizontal = 'FIXED'; trailCheckInst.layoutSizingVertical = 'FIXED'; } catch (e) {}
    } else if (trailIc) {
      trailInst = trailIc.createInstance();
      trailInst.name = 'Trailing';
      trailInst.resize(spec.icon, spec.icon);
      bindIconColorForm(trailInst, colors.icon);
      comp.appendChild(trailInst);
      try { trailInst.layoutSizingHorizontal = 'FIXED'; trailInst.layoutSizingVertical = 'FIXED'; } catch (e) {}
    }

    return { comp, leadInst, cbInst, desc, shortcut, trailInst, trailCheckInst };
  }

  const SIZES  = ['Small', 'Default'];
  const TYPES  = ['Single', 'Multi-Select'];
  const STATES = ['Default', 'Hover', 'Selected', 'Disabled'];

  const allVariants = [];
  const meta = [];
  const leadNodes = [];
  const descNodes = [];
  const shortcutNodes = [];
  const trailNodes = [];
  for (const size of SIZES) {
    for (const type of TYPES) {
      for (const state of STATES) {
        const r = await makeVariant(size, type, state);
        allVariants.push(r.comp);
        meta.push({ size, type, state });
        if (r.leadInst)  leadNodes.push(r.leadInst);
        if (r.desc)      descNodes.push(r.desc);
        if (r.shortcut)  shortcutNodes.push(r.shortcut);
        if (r.trailInst) trailNodes.push(r.trailInst);
      }
    }
  }

  const compSet = figma.combineAsVariants(allVariants, moleculesPage);
  compSet.name = 'Menu Item';
  compSet.layoutMode = 'NONE';
  compSet.fills = [];

  const wire = (id, nodes) => {
    if (!id) return;
    for (const n of nodes) {
      try { n.componentPropertyReferences = { visible: id }; } catch (e) {}
    }
  };
  let pLead = null, pTrail = null, pDesc = null, pShortcut = null;
  try { pLead     = compSet.addComponentProperty('Has Leading Icon',  'BOOLEAN', true); }  catch (e) {}
  try { pTrail    = compSet.addComponentProperty('Has Trailing Icon', 'BOOLEAN', false); } catch (e) {}
  try { pDesc     = compSet.addComponentProperty('Has Description',   'BOOLEAN', false); } catch (e) {}
  try { pShortcut = compSet.addComponentProperty('Has Shortcut',      'BOOLEAN', false); } catch (e) {}
  wire(pLead, leadNodes);
  wire(pTrail, trailNodes);
  wire(pDesc, descNodes);
  wire(pShortcut, shortcutNodes);

  // Layout grid: cols=States, rows = Size×Type pairs
  const PAD_LEFT = 240, PAD_TOP = 160, PAD_RIGHT = 56, PAD_BOT = 56;
  const COL_W = 260, ROW_H = 60, COL_GAP = 24, ROW_GAP = 24;
  const rowKeys = [];
  for (const size of SIZES) for (const type of TYPES) rowKeys.push(`${size}/${type}`);
  for (let i = 0; i < allVariants.length; i++) {
    const m = meta[i];
    const v = allVariants[i];
    const colIdx = STATES.indexOf(m.state);
    const rowIdx = rowKeys.indexOf(`${m.size}/${m.type}`);
    v.x = Math.round(PAD_LEFT + colIdx * (COL_W + COL_GAP) + (COL_W - v.width) / 2);
    v.y = Math.round(PAD_TOP + rowIdx * (ROW_H + ROW_GAP) + (ROW_H - v.height) / 2);
  }
  compSet.resize(
    PAD_LEFT + COL_W * STATES.length + COL_GAP * (STATES.length - 1) + PAD_RIGHT,
    PAD_TOP + ROW_H * rowKeys.length + ROW_GAP * (rowKeys.length - 1) + PAD_BOT
  );

  let maxBottom = 0;
  for (const node of moleculesPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) { const b = node.y + node.height; if (b > maxBottom) maxBottom = b; }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  const colGroups = [{
    name: 'State', x: PAD_LEFT, width: COL_W * STATES.length + COL_GAP * (STATES.length - 1),
    sizes: STATES.map((s, i) => ({ name: s, x: PAD_LEFT + i * (COL_W + COL_GAP), width: COL_W })),
  }];
  const rowGroups = [{
    name: 'Size / Type', y: PAD_TOP,
    states: rowKeys.map((s, i) => ({ name: s, y: PAD_TOP + i * (ROW_H + ROW_GAP), height: ROW_H })),
  }];
  await decorateComponentSet({
    page: moleculesPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Menu Item',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Menu Item built: ${allVariants.length} variants.`);
}


// =============================================================================
// DROPDOWN MENU (molecule) — overlay panel containing Menu Item instances
//   Size:    Small | Default
//   Content: Items | Search Default | Search Hover | Search Active | Search Filled
//            | No Results | Multi-Select | Footer
//   Bools:   Has Title (header)
//   Visual:  surface/card bg, border/default 1px, drop shadow, 6px radius
// =============================================================================
async function buildDropdownMenu() {
  console.log('[OM DS] buildDropdownMenu started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  const required = await resolveFormTokens();

  const moleculesPage = figma.root.children.find(p => p.name.includes('Molecules'))
                     || figma.root.children.find(p => p.name.includes('Atoms'))
                     || figma.currentPage;
  await figma.setCurrentPageAsync(moleculesPage);

  const _exist = moleculesPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Dropdown Menu');
  if (_exist) _exist.remove();
  for (const n of moleculesPage.children.filter(c => c.type === 'FRAME' && c.name === 'Dropdown Menu')) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  const titleStyle = styleByName['Label/Default'];
  const bodyStyle  = styleByName['Body/Default'];
  const smallStyle = styleByName['Body/Small'];
  for (const st of [titleStyle, bodyStyle, smallStyle]) {
    if (st) { try { await figma.loadFontAsync(st.fontName); } catch (e) {} }
  }

  // Find Menu Item set on Molecules page
  const miSet = moleculesPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Menu Item');
  if (!miSet) throw new Error('Run "Build Menu Item" first.');
  const miBy = (size, type, state) =>
       miSet.children.find(c => c.name === `Size=${size}, Type=${type}, State=${state}`)
    || miSet.children.find(c => c.name.startsWith(`Size=${size}, Type=${type}`))
    || miSet.children.find(c => c.name.startsWith(`Size=${size}`))
    || miSet.children[0];

  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  const searchIc = await findIconComp(iconsPage, ['search', 'magnifying-glass']);
  const clearIc  = await findIconComp(iconsPage, ['x', 'close', 'cross', 'circle-x', 'remove', 'x-circle']);
  const emptyIc  = await findIconComp(iconsPage, ['search', 'inbox', 'folder', 'file']);
  const checkIc  = await findIconComp(iconsPage, ['check', 'tick', 'checkmark']);
  const checkOff = await findCheckboxComponent('Unchecked', 'Default');

  // ---- helpers (declared inside; capture required + styleByName) ----
  function makeSearchRow(size, mode /* 'Default' | 'Hover' | 'Active' | 'Filled' */) {
    const padX = 10, h = size === 'Small' ? 34 : 38;
    const row = figma.createFrame();
    row.name = `Search/${mode}`;
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'FIXED';
    row.counterAxisSizingMode = 'FIXED';
    row.primaryAxisAlignItems = 'MIN';
    row.counterAxisAlignItems = 'CENTER';
    row.itemSpacing = 8;
    row.paddingLeft = row.paddingRight = padX;
    // Bg per mode
    if (mode === 'Hover')       row.fills = [paintForVar(required['state/disabled-bg'] || required['surface/base'])];
    else if (mode === 'Active') row.fills = [paintForVar(required['surface/card'])];
    else                        row.fills = [];
    // Border: Active gets full focus border w/ rounded top to match container; others = bottom separator only
    row.strokes = mode === 'Active'
      ? [paintForVar(required['brand/primary'])]
      : [paintForVar(required['border/default'])];
    if (mode === 'Active') {
      row.strokeWeight = 1;
      row.strokeAlign = 'INSIDE';
      // Round only top corners so it visually nests inside the menu's 8px radius
      row.topLeftRadius = 7; row.topRightRadius = 7;
      row.bottomLeftRadius = 0; row.bottomRightRadius = 0;
    } else {
      row.strokeWeight = 0; row.strokeBottomWeight = 1; row.strokeAlign = 'INSIDE';
    }
    row.resize(240, h);

    if (searchIc) {
      const ic = searchIc.createInstance();
      ic.name = 'Search Icon';
      ic.resize(14, 14);
      bindIconColorForm(ic, mode === 'Active' || mode === 'Filled'
        ? (required['icon/default'] || required['text/primary'])
        : (required['icon/subtle']  || required['text/secondary']));
      row.appendChild(ic);
    }
    const t = figma.createText();
    if (bodyStyle) t.setTextStyleIdAsync(bodyStyle.id);
    if (mode === 'Filled') {
      t.characters = 'Doc';
      t.fills = [paintForVar(required['text/primary'])];
    } else if (mode === 'Active') {
      t.characters = '|';   // cursor hint
      t.fills = [paintForVar(required['brand/primary'])];
    } else {
      t.characters = 'Search…';
      t.fills = [paintForVar(required['text/secondary'])];
    }
    t.name = 'Placeholder';
    row.appendChild(t);
    try { t.layoutSizingHorizontal = 'FILL'; } catch (e) {}

    // Trailing clear X (only when Filled — user has typed)
    if (mode === 'Filled' && clearIc) {
      const x = clearIc.createInstance();
      x.name = 'Clear';
      x.resize(14, 14);
      bindIconColorForm(x, required['icon/subtle'] || required['text/secondary']);
      row.appendChild(x);
    }
    return row;
  }

  function makeFooterRow(size) {
    const padX = 12, h = size === 'Small' ? 34 : 38;
    const row = figma.createFrame();
    row.name = 'Footer';
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'FIXED';
    row.counterAxisSizingMode = 'FIXED';
    row.primaryAxisAlignItems = 'CENTER';
    row.counterAxisAlignItems = 'CENTER';
    row.itemSpacing = 6;
    row.paddingLeft = row.paddingRight = padX;
    row.fills = [];
    row.strokes = [paintForVar(required['border/default'])];
    row.strokeWeight = 0;
    row.strokeTopWeight = 1;
    row.strokeAlign = 'INSIDE';
    row.resize(240, h);
    const t = figma.createText();
    if (smallStyle) t.setTextStyleIdAsync(smallStyle.id);
    t.characters = '+ Add new option';
    t.fills = [paintForVar(required['brand/primary'])];
    t.name = 'Action';
    row.appendChild(t);
    return row;
  }

  function makeSelectAllRow(size) {
    const padX = 12, h = size === 'Small' ? 32 : 36;
    const row = figma.createFrame();
    row.name = 'Select All';
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'FIXED';
    row.counterAxisSizingMode = 'FIXED';
    row.primaryAxisAlignItems = 'MIN';
    row.counterAxisAlignItems = 'CENTER';
    row.itemSpacing = 10;
    row.paddingLeft = row.paddingRight = padX;
    row.fills = [];
    row.strokes = [paintForVar(required['border/default'])];
    row.strokeWeight = 0;
    row.strokeBottomWeight = 1;
    row.strokeAlign = 'INSIDE';
    row.resize(240, h);
    if (checkOff) {
      const cb = checkOff.createInstance();
      cb.name = 'Checkbox';
      row.appendChild(cb);
    }
    const t = figma.createText();
    if (bodyStyle) t.setTextStyleIdAsync(bodyStyle.id);
    t.characters = 'Select all';
    t.fills = [paintForVar(required['text/primary'])];
    t.name = 'Label';
    row.appendChild(t);

    const count = figma.createText();
    if (smallStyle) count.setTextStyleIdAsync(smallStyle.id);
    count.characters = '0 / 12';
    count.fills = [paintForVar(required['text/secondary'])];
    count.name = 'Count';
    row.appendChild(count);
    return row;
  }

  function makeNoResults(size) {
    const f = figma.createFrame();
    f.name = 'No Results';
    f.layoutMode = 'VERTICAL';
    f.primaryAxisSizingMode = 'FIXED';
    f.counterAxisSizingMode = 'AUTO';
    f.primaryAxisAlignItems = 'CENTER';
    f.counterAxisAlignItems = 'CENTER';
    f.itemSpacing = 10;
    f.paddingTop = f.paddingBottom = size === 'Small' ? 32 : 40;
    f.paddingLeft = f.paddingRight = 24;
    f.fills = [];
    f.resize(240, size === 'Small' ? 120 : 140);
    if (emptyIc) {
      const ic = emptyIc.createInstance();
      ic.name = 'Icon';
      ic.resize(28, 28);
      bindIconColorForm(ic, required['text/tertiary'] || required['text/secondary']);
      f.appendChild(ic);
    }
    const title = figma.createText();
    if (bodyStyle) title.setTextStyleIdAsync(bodyStyle.id);
    title.characters = 'No results found';
    title.fills = [paintForVar(required['text/primary'])];
    title.textAlignHorizontal = 'CENTER';
    f.appendChild(title);
    const sub = figma.createText();
    if (smallStyle) sub.setTextStyleIdAsync(smallStyle.id);
    sub.characters = 'Try a different keyword';
    sub.fills = [paintForVar(required['text/secondary'])];
    sub.textAlignHorizontal = 'CENTER';
    f.appendChild(sub);
    return f;
  }

  async function makeVariant(size, content) {
    const comp = figma.createComponent();
    comp.name = `Size=${size}, Content=${content}`;
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.primaryAxisAlignItems = 'MIN';
    comp.counterAxisAlignItems = 'MIN';
    comp.itemSpacing = 0;
    comp.paddingLeft = comp.paddingRight = 0;
    comp.paddingTop = comp.paddingBottom = 4;
    comp.cornerRadius = 8;
    comp.fills = [paintForVar(required['surface/card'])];
    comp.strokes = [paintForVar(required['border/default'])];
    comp.strokeWeight = 1;
    comp.strokeAlign = 'INSIDE';
    comp.effects = menuShadowEffects();
    comp.resize(260, 100);

    // Optional Title row (boolean)
    const titleWrap = figma.createFrame();
    titleWrap.name = 'TitleWrap';
    titleWrap.layoutMode = 'HORIZONTAL';
    titleWrap.primaryAxisSizingMode = 'FIXED';
    titleWrap.counterAxisSizingMode = 'AUTO';
    titleWrap.paddingLeft = titleWrap.paddingRight = 12;
    titleWrap.paddingTop = 8;
    titleWrap.paddingBottom = 4;
    titleWrap.fills = [];
    const title = figma.createText();
    if (smallStyle) await title.setTextStyleIdAsync(smallStyle.id);
    title.characters = 'SECTION';
    title.fills = [paintForVar(required['text/secondary'])];
    title.name = 'Title';
    titleWrap.appendChild(title);
    comp.appendChild(titleWrap);
    try { titleWrap.layoutSizingHorizontal = 'FILL'; titleWrap.layoutSizingVertical = 'HUG'; } catch (e) {}

    // Search rows (also for Multi-Select Search)
    const searchModes = { 'Search Default': 'Default', 'Search Hover': 'Hover', 'Search Active': 'Active', 'Search Filled': 'Filled', 'No Results': 'Default', 'Multi-Select Search': 'Filled' };
    if (searchModes[content]) {
      const row = makeSearchRow(size, searchModes[content]);
      comp.appendChild(row);
      try { row.layoutSizingHorizontal = 'FILL'; row.layoutSizingVertical = 'FIXED'; } catch (e) {}
    }

    // Multi-Select: Select all header (also Multi-Select Search)
    if (content === 'Multi-Select' || content === 'Multi-Select Search') {
      const sa = makeSelectAllRow(size);
      comp.appendChild(sa);
      try { sa.layoutSizingHorizontal = 'FILL'; sa.layoutSizingVertical = 'FIXED'; } catch (e) {}
    }

    // Body
    if (content === 'No Results') {
      const nr = makeNoResults(size);
      comp.appendChild(nr);
      try { nr.layoutSizingHorizontal = 'FILL'; nr.layoutSizingVertical = 'HUG'; } catch (e) {}
    } else {
      // Items list — Multi types use Multi-Select item with mixed states (1st & 3rd selected)
      const isMulti = content === 'Multi-Select' || content === 'Multi-Select Search';
      const itemType = isMulti ? 'Multi-Select' : 'Single';
      const states = ['Default', 'Default', 'Default', 'Default'];
      if (content === 'Items') states[1] = 'Hover';
      if (isMulti) { states[0] = 'Selected'; states[2] = 'Selected'; }
      for (let i = 0; i < 4; i++) {
        const miComp = miBy(size, itemType, states[i]);
        if (!miComp) continue;
        const inst = miComp.createInstance();
        inst.name = `Item ${i + 1}`;
        comp.appendChild(inst);
        try { inst.layoutSizingHorizontal = 'FILL'; inst.layoutSizingVertical = 'HUG'; } catch (e) {}
      }
    }

    // Footer row (separate variant)
    if (content === 'Footer') {
      const f = makeFooterRow(size);
      comp.appendChild(f);
      try { f.layoutSizingHorizontal = 'FILL'; f.layoutSizingVertical = 'FIXED'; } catch (e) {}
    }

    return { comp, titleWrap };
  }

  const SIZES   = ['Small', 'Default'];
  const CONTENT = ['Items', 'Search Default', 'Search Hover', 'Search Active', 'Search Filled', 'No Results', 'Multi-Select', 'Multi-Select Search', 'Footer'];

  const allVariants = [];
  const meta = [];
  const titleNodes = [];
  for (const size of SIZES) {
    for (const content of CONTENT) {
      const r = await makeVariant(size, content);
      allVariants.push(r.comp);
      meta.push({ size, content });
      if (r.titleWrap) titleNodes.push(r.titleWrap);
    }
  }

  const compSet = figma.combineAsVariants(allVariants, moleculesPage);
  compSet.name = 'Dropdown Menu';
  compSet.layoutMode = 'NONE';
  compSet.fills = [];

  let pTitle = null;
  try { pTitle = compSet.addComponentProperty('Has Title', 'BOOLEAN', false); } catch (e) {}
  if (pTitle) for (const t of titleNodes) {
    try { t.componentPropertyReferences = { visible: pTitle }; } catch (e) {}
  }

  // Layout grid: cols = Content (8), rows = Size (2)
  const PAD_LEFT = 240, PAD_TOP = 160, PAD_RIGHT = 56, PAD_BOT = 56;
  const COL_W = 290, ROW_H = 280, COL_GAP = 32, ROW_GAP = 40;
  for (let i = 0; i < allVariants.length; i++) {
    const m = meta[i];
    const v = allVariants[i];
    const colIdx = CONTENT.indexOf(m.content);
    const rowIdx = SIZES.indexOf(m.size);
    v.x = Math.round(PAD_LEFT + colIdx * (COL_W + COL_GAP) + (COL_W - v.width) / 2);
    v.y = Math.round(PAD_TOP + rowIdx * (ROW_H + ROW_GAP));
  }
  compSet.resize(
    PAD_LEFT + COL_W * CONTENT.length + COL_GAP * (CONTENT.length - 1) + PAD_RIGHT,
    PAD_TOP + ROW_H * SIZES.length + ROW_GAP * (SIZES.length - 1) + PAD_BOT
  );

  let maxBottom = 0;
  for (const node of moleculesPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) { const b = node.y + node.height; if (b > maxBottom) maxBottom = b; }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  const colGroups = [{
    name: 'Content', x: PAD_LEFT, width: COL_W * CONTENT.length + COL_GAP * (CONTENT.length - 1),
    sizes: CONTENT.map((c, i) => ({ name: c, x: PAD_LEFT + i * (COL_W + COL_GAP), width: COL_W })),
  }];
  const rowGroups = [{
    name: 'Size', y: PAD_TOP,
    states: SIZES.map((s, i) => ({ name: s, y: PAD_TOP + i * (ROW_H + ROW_GAP), height: ROW_H })),
  }];
  await decorateComponentSet({
    page: moleculesPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Dropdown Menu',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Dropdown Menu built: ${allVariants.length} variants.`);
}


// =============================================================================
// DROPDOWN — Single + Multi-Chips + Multi-Inline merged
//   Type: Single | Multi-Chips | Multi-Inline
//   Size: Small | Default | Large
//   State+Status: 7
//   Content (per Type):
//     Single        → Empty | Filled | Filled+Icon
//     Multi-Chips   → Empty | 1 chip | 2 chips | Overflow
//     Multi-Inline  → Empty | Filled | Overflow
// =============================================================================
async function buildDropdown() {
  console.log('[OM DS] buildDropdown started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}
  const required = await resolveFormTokens();

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms')) || figma.currentPage;
  await figma.setCurrentPageAsync(atomsPage);

  const _existSet = atomsPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Dropdown');
  if (_existSet) _existSet.remove();
  for (const n of atomsPage.children.filter(c => c.type === 'FRAME' && c.name === 'Dropdown')) n.remove();

  const styles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of styles) styleByName[s.name] = s;
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  const iconsPage = figma.root.children.find(p => p.name.includes('Icons'));
  const chevronIc = await findIconComp(iconsPage, ['chevron-down', 'arrow-down', 'caret-down']);
  const tagIc = await findIconComp(iconsPage, ['tag', 'bookmark', 'link', 'flag']);
  const closeSmallIc = await findIconComp(iconsPage, ['x', 'close', 'x-circle']);

  function pickColors(state, status, content) {
    const r = required;
    if (state === 'Disabled') return { bg: r['state/disabled-bg'], border: r['state/disabled-border'], text: r['state/disabled-text'] };
    let border = r['border/strong']; let bg = r['surface/card'];
    if (state === 'Hover')    border = r['text/secondary'];
    if (status === 'Error')   { border = r['status/danger-border']; bg = r['status/danger-subtle']; }
    if (status === 'Success') border = r['status/success-border'];
    if (status === 'Warning') border = r['status/warning-border'];
    if (state === 'Active')   border = r['brand/primary'];
    return { bg, border, text: content === 'Empty' ? r['text/tertiary'] : r['text/primary'] };
  }

  const labelDefault  = await findLabelComponent('Default');
  const labelDisabled = await findLabelComponent('Disabled');
  if (!labelDefault) throw new Error('Run "Build Label" first — Dropdown needs the Label component.');

  // Chip component instances (built by buildChip). Map dropdown size → chip size.
  const chipSmallDef    = await findChipComponent('Small',   'Default');
  const chipSmallDis    = await findChipComponent('Small',   'Disabled');
  const chipDefaultDef  = await findChipComponent('Default', 'Default');
  const chipDefaultDis  = await findChipComponent('Default', 'Disabled');
  if (!chipSmallDef || !chipDefaultDef) throw new Error('Run "Build Chip" first — Dropdown needs the Chip component.');
  const chipFor = (dropdownSize, state) => {
    const isSmall = (dropdownSize === 'XS' || dropdownSize === 'Small');
    if (state === 'Disabled') return isSmall ? (chipSmallDis || chipSmallDef) : (chipDefaultDis || chipDefaultDef);
    return isSmall ? chipSmallDef : chipDefaultDef;
  };

  // Dropdown drops Success / Warning — keep None (4 states) + Error only
  const DROPDOWN_STATE_STATUS = (() => {
    const out = [];
    for (const s of FORM_STATES) out.push({ state: s, status: 'None' });
    out.push({ state: 'Default', status: 'Error' });
    return out;
  })();

  async function makeDropdownVariant(type, size, state, status, content) {
    const spec = FORM_SIZE_SPECS[size];
    const comp = figma.createComponent();
    comp.name = `Type=${type}, Size=${size}, State=${state}, Status=${status}, Content=${content}`;
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = FORM_VGAP;
    comp.fills = [];
    const W = 360;
    comp.resize(W, comp.height);
    const colors = pickColors(state, status, content);

    // Label — instance
    const labelComp = state === 'Disabled' ? (labelDisabled || labelDefault) : labelDefault;
    const labelInst = labelComp.createInstance();
    labelInst.name = 'Label';
    comp.appendChild(labelInst);
    try { labelInst.layoutSizingHorizontal = 'HUG'; labelInst.layoutSizingVertical = 'HUG'; } catch (e) {}

    // Field
    const field = figma.createFrame();
    field.name = 'Field';
    field.layoutMode = 'HORIZONTAL';
    field.primaryAxisSizingMode = 'FIXED';
    field.counterAxisSizingMode = 'AUTO';
    field.counterAxisAlignItems = 'CENTER';
    field.itemSpacing = spec.gap;
    field.paddingLeft = field.paddingRight = spec.padX;
    field.paddingTop = field.paddingBottom = 2;
    field.minHeight = spec.h;
    field.cornerRadius = spec.radius;
    field.fills = [paintForVar(colors.bg)];
    field.strokes = [paintForVar(colors.border)];
    field.strokeWeight = 1;
    field.strokeAlign = 'INSIDE';
    field.resize(W, spec.h);
    comp.appendChild(field);
    try { field.layoutSizingHorizontal = 'FILL'; } catch (e) {}

    // Content area
    const contentArea = figma.createFrame();
    contentArea.name = 'Content';
    contentArea.layoutMode = 'HORIZONTAL';
    contentArea.primaryAxisSizingMode = 'AUTO';
    contentArea.counterAxisSizingMode = 'AUTO';
    contentArea.counterAxisAlignItems = 'CENTER';
    contentArea.itemSpacing = 6;
    contentArea.fills = [];
    field.appendChild(contentArea);
    try { contentArea.layoutSizingHorizontal = 'FILL'; } catch (e) {}

    if (content === 'Empty') {
      const t = figma.createText();
      const ts = styleByName[spec.fontText];
      if (ts) await t.setTextStyleIdAsync(ts.id);
      t.characters = 'Select List';
      t.fills = [paintForVar(state === 'Disabled' ? required['state/disabled-text'] : required['text/tertiary'])];
      contentArea.appendChild(t);
    } else if (type === 'Single') {
      if (content === 'Filled+Icon' && tagIc) {
        const ic = tagIc.createInstance();
        ic.resize(spec.icon, spec.icon);
        bindIconColorForm(ic, state === 'Disabled' ? required['state/disabled-text'] : required['icon/default']);
        contentArea.appendChild(ic);
        try { ic.layoutSizingHorizontal = 'FIXED'; ic.layoutSizingVertical = 'FIXED'; } catch (e) {}
      }
      const t = figma.createText();
      const ts = styleByName[spec.fontText];
      if (ts) await t.setTextStyleIdAsync(ts.id);
      t.characters = 'Active list';
      t.fills = [paintForVar(state === 'Disabled' ? required['state/disabled-text'] : required['text/primary'])];
      contentArea.appendChild(t);
    } else if (type === 'Multi-Chips') {
      const chipComp = chipFor(size, state);
      function addChip() {
        const inst = chipComp.createInstance();
        contentArea.appendChild(inst);
        try { inst.layoutSizingHorizontal = 'HUG'; inst.layoutSizingVertical = 'HUG'; } catch (e) {}
        return inst;
      }
      function addOverflow(text) {
        // Reuse chip component but turn off icon + close, set characters via overrides
        const inst = chipComp.createInstance();
        // Toggle the booleans off
        try {
          const props = chipComp.parent.componentPropertyDefinitions || {};
          const iconKey = Object.keys(props).find(k => k.startsWith('Has Icon'));
          const closeKey = Object.keys(props).find(k => k.startsWith('Has Close'));
          const overrides = {};
          if (iconKey)  overrides[iconKey]  = false;
          if (closeKey) overrides[closeKey] = false;
          if (Object.keys(overrides).length) inst.setProperties(overrides);
        } catch (e) {}
        // Override the text node
        try {
          const txt = inst.findOne(n => n.type === 'TEXT');
          if (txt) txt.characters = text;
        } catch (e) {}
        contentArea.appendChild(inst);
        try { inst.layoutSizingHorizontal = 'HUG'; inst.layoutSizingVertical = 'HUG'; } catch (e) {}
        return inst;
      }
      if (content === '1 chip')         { addChip(); }
      else if (content === '2 chips')   { addChip(); addChip(); }
      else if (content === 'Overflow')  { addChip(); addChip(); addOverflow('+2'); }
    } else if (type === 'Multi-Inline') {
      const t = figma.createText();
      const ts = styleByName[spec.fontText];
      if (ts) await t.setTextStyleIdAsync(ts.id);
      if (content === 'Filled')        t.characters = 'India, US, Europe';
      else if (content === 'Overflow') t.characters = 'India, US, Europe  +2';
      t.fills = [paintForVar(state === 'Disabled' ? required['state/disabled-text'] : required['text/primary'])];
      contentArea.appendChild(t);
    }

    // Chevron suffix
    if (chevronIc) {
      const ic = chevronIc.createInstance();
      ic.resize(spec.icon, spec.icon);
      bindIconColorForm(ic, state === 'Disabled' ? required['state/disabled-text'] : required['text/primary']);
      field.appendChild(ic);
      try { ic.layoutSizingHorizontal = 'FIXED'; ic.layoutSizingVertical = 'FIXED'; } catch (e) {}
    }

    // Helper — hidden by default
    const helper = figma.createText();
    const helperStyle = styleByName['Body/Small'];
    if (helperStyle) await helper.setTextStyleIdAsync(helperStyle.id);
    if (status === 'Error')        { helper.characters = 'This field is required.'; helper.fills = [paintForVar(required['status/danger-text'])]; }
    else if (status === 'Success') { helper.characters = 'Looks good.';             helper.fills = [paintForVar(required['status/success-text'])]; }
    else if (status === 'Warning') { helper.characters = 'Please review.';          helper.fills = [paintForVar(required['status/warning-text'])]; }
    else                            { helper.characters = 'Helper text goes here.';  helper.fills = [paintForVar(required['text/secondary'])]; }
    comp.appendChild(helper);
    try { helper.layoutSizingHorizontal = 'FILL'; } catch (e) {}

    return { comp, labelInst, helper };
  }

  const allVariants = [];
  const variantMeta = [];
  const labelInsts = [], helpers = [];
  const TYPE_CONTENTS = {
    Single:        ['Empty', 'Filled', 'Filled+Icon'],
    'Multi-Chips': ['Empty', '1 chip', '2 chips', 'Overflow'],
    'Multi-Inline':['Empty', 'Filled', 'Overflow'],
  };
  for (const type of Object.keys(TYPE_CONTENTS)) {
    for (const size of FORM_SIZES) {
      for (const ss of DROPDOWN_STATE_STATUS) {
        for (const content of TYPE_CONTENTS[type]) {
          try {
            const r = await makeDropdownVariant(type, size, ss.state, ss.status, content);
            allVariants.push(r.comp);
            variantMeta.push({ type, size, state: ss.state, status: ss.status, content });
            labelInsts.push(r.labelInst);
            helpers.push(r.helper);
          } catch (e) {
            console.error(`[OM DS] Dropdown variant FAILED ${type}/${size}/${ss.state}/${ss.status}/${content}:`, e);
            throw e;
          }
        }
      }
    }
  }
  console.log('[OM DS] Dropdown variants built:', allVariants.length);

  const compSet = figma.combineAsVariants(allVariants, atomsPage);
  compSet.name = 'Dropdown';
  compSet.layoutMode = 'NONE';
  compSet.fills = [];

  const propIds = {};
  try { propIds.label  = compSet.addComponentProperty('Has Label',  'BOOLEAN', true);  } catch (e) {}
  try { propIds.helper = compSet.addComponentProperty('Has Helper', 'BOOLEAN', false); } catch (e) {}
  if (propIds.label)  for (const n of labelInsts) try { n.componentPropertyReferences = { visible: propIds.label }; } catch (e) {}
  if (propIds.helper) for (const n of helpers)    try { n.componentPropertyReferences = { visible: propIds.helper }; } catch (e) {}

  // Layout grid: cols = State+Status (5 — No Success/Warning), rows = Type × Size × Content
  const PAD_LEFT = 220, PAD_TOP = 160, PAD_RIGHT = 56, PAD_BOT = 56;
  const COL_W = 420, ROW_H = 130, GROUP_GAP = 56;

  const colGroups = [{
    name: 'State × Status', x: PAD_LEFT, width: COL_W * DROPDOWN_STATE_STATUS.length,
    sizes: DROPDOWN_STATE_STATUS.map((ss, i) => ({
      name: ss.status === 'None' ? ss.state : ss.status,
      x: PAD_LEFT + i * COL_W, width: COL_W,
    })),
  }];

  const rowGroups = [];
  let cy = PAD_TOP;
  for (const type of Object.keys(TYPE_CONTENTS)) {
    for (const size of FORM_SIZES) {
      const states = TYPE_CONTENTS[type].map((c, i) => ({ name: c, y: cy + i * ROW_H, height: ROW_H }));
      rowGroups.push({ name: `${type} · ${size}`, y: cy, states });
      cy += TYPE_CONTENTS[type].length * ROW_H + GROUP_GAP;
    }
  }

  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    const m = variantMeta[i];
    const colIdx = DROPDOWN_STATE_STATUS.findIndex(ss => ss.state === m.state && ss.status === m.status);
    const rg = rowGroups.find(r => r.name === `${m.type} · ${m.size}`);
    const st = rg.states.find(s => s.name === m.content);
    v.x = Math.round(PAD_LEFT + colIdx * COL_W + (COL_W - v.width) / 2);
    v.y = Math.round(st.y + (ROW_H - v.height) / 2);
  }
  compSet.resize(PAD_LEFT + DROPDOWN_STATE_STATUS.length * COL_W + PAD_RIGHT, cy + PAD_BOT);

  let maxBottom = 0;
  for (const node of atomsPage.children) {
    if (node === compSet) continue;
    if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT' && node.type !== 'FRAME') continue;
    if ('y' in node && 'height' in node) { const b = node.y + node.height; if (b > maxBottom) maxBottom = b; }
  }
  compSet.x = 0;
  compSet.y = maxBottom > 0 ? Math.round(maxBottom + 120) : 0;

  await decorateComponentSet({
    page: atomsPage, compSet, colGroups, rowGroups,
    padTop: PAD_TOP, padLeft: PAD_LEFT,
    labelStyle: styleByName['Label/Default'],
    sectionStyle: styleByName['Heading/H4'],
    labelPrimaryVar: required['text/primary'],
    labelSecondaryVar: required['text/secondary'],
    componentName: 'Dropdown',
    surfaceVar: required['surface/card'],
    borderVar: required['border/default'],
  });

  figma.notify(`✅ Dropdown built: ${allVariants.length} variants.`);
}


// =============================================================================
// REBUILD ALL — refresh only components that already exist on the Atoms page.
// Each build function already removes its own previous set+showcase before
// recreating, so this chains them safely. Components you never built are
// skipped (nothing is created from scratch you didn't ask for).
// =============================================================================
async function rebuildAll() {
  console.log('[OM DS] rebuildAll started');
  try { await figma.loadAllPagesAsync(); } catch (e) {}

  const atomsPage = figma.root.children.find(p => p.name.includes('Atoms'));
  if (!atomsPage) {
    figma.notify('❌ No "Atoms" page found. Run Bootstrap first.', { error: true });
    return;
  }

  // Map of component-set name → build function
  const registry = [
    { setName: 'Button',       fn: buildButton       },
    { setName: 'IconButton',   fn: typeof buildIconButton === 'function' ? buildIconButton : null },
    { setName: 'SplitButton',  fn: typeof buildSplitButton === 'function' ? buildSplitButton : null },
    { setName: 'Checkbox',     fn: buildCheckbox     },
    { setName: 'Radio',        fn: buildRadio        },
    { setName: 'Toggle',       fn: buildToggle       },
    { setName: 'Badge',        fn: buildBadge        },
    { setName: 'Tooltip',      fn: typeof buildTooltip === 'function' ? buildTooltip : null },
    { setName: 'Avatar',       fn: typeof buildAvatar === 'function' ? buildAvatar : null },
  ];

  // After decorateComponentSet, the COMPONENT_SET lives inside a wrapper FRAME
  // with the same name. So check for either a top-level set OR a wrapper frame.
  const existingNames = new Set();
  for (const c of atomsPage.children) {
    if (c.type === 'COMPONENT_SET' || c.type === 'FRAME') existingNames.add(c.name);
  }
  const toRebuild = registry.filter(r => r.fn && existingNames.has(r.setName));

  if (toRebuild.length === 0) {
    figma.notify('ℹ️ No existing components found on Atoms. Build them individually first.');
    return;
  }

  for (const r of toRebuild) {
    try {
      console.log(`[OM DS] Rebuilding ${r.setName}…`);
      await r.fn();
    } catch (e) {
      console.error(`[OM DS] Rebuild ${r.setName} failed:`, e);
      figma.notify(`❌ ${r.setName} failed: ${e.message}`, { error: true });
    }
  }
  figma.notify(`✅ Rebuilt ${toRebuild.length} components: ${toRebuild.map(r => r.setName).join(', ')}`);
}

(async () => {
  try {
    console.log('[OM DS] Plugin start. command =', figma.command);
    if (figma.command === 'reset') {
      await reset();
    } else if (figma.command === 'resetTextStyles') {
      await resetTextStyles();
    } else if (figma.command === 'buildIcons') {
      await buildIconComponents();
    } else if (figma.command === 'buildButton') {
      await buildButton();
    } else if (figma.command === 'buildCheckbox') {
      await buildCheckbox();
    } else if (figma.command === 'buildRadio') {
      await buildRadio();
    } else if (figma.command === 'buildToggle') {
      await buildToggle();
    } else if (figma.command === 'buildBadge') {
      await buildBadge();
    } else if (figma.command === 'buildTooltip') {
      await buildTooltip();
    } else if (figma.command === 'buildAvatar') {
      await buildAvatar();
    } else if (figma.command === 'buildLabel') {
      await buildLabel();
    } else if (figma.command === 'buildChip') {
      await buildChip();
    } else if (figma.command === 'buildTextField') {
      await buildTextField();
    } else if (figma.command === 'buildTextarea') {
      await buildTextarea();
    } else if (figma.command === 'buildDropdown') {
      await buildDropdown();
    } else if (figma.command === 'buildDivider') {
      await buildDivider();
    } else if (figma.command === 'buildSpinner') {
      await buildSpinner();
    } else if (figma.command === 'buildIconButton') {
      await buildIconButton();
    } else if (figma.command === 'buildSplitButton') {
      await buildSplitButton();
    } else if (figma.command === 'buildMenuItem') {
      await buildMenuItem();
    } else if (figma.command === 'buildDropdownMenu') {
      await buildDropdownMenu();
    } else {
      await bootstrap();
    }
  } catch (e) {
    console.error('[OM DS] Plugin error:', e);
    figma.notify('❌ ' + e.message, { error: true });
  }
  figma.closePlugin();
})();
