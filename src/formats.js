const SUPPORTED_FORMATS = [
  {
    id: "jpeg",
    label: "JPEG",
    kind: "image",
    extensions: ["jpg", "jpeg"],
    mime: ["image/jpeg"],
    outputType: "image/jpeg",
    outputExt: "jpg",
    quality: 0.92,
  },
  {
    id: "png",
    label: "PNG",
    kind: "image",
    extensions: ["png"],
    mime: ["image/png"],
    outputType: "image/png",
    outputExt: "png",
  },
  {
    id: "webp",
    label: "WebP",
    kind: "image",
    extensions: ["webp"],
    mime: ["image/webp"],
    outputType: "image/webp",
    outputExt: "webp",
    quality: 0.92,
  },
  {
    id: "gif",
    label: "GIF",
    kind: "image",
    extensions: ["gif"],
    mime: ["image/gif"],
    outputType: "image/png",
    outputExt: "png",
    note: "첫 프레임",
  },
  {
    id: "bmp",
    label: "BMP",
    kind: "image",
    extensions: ["bmp"],
    mime: ["image/bmp", "image/x-bmp"],
    outputType: "image/png",
    outputExt: "png",
  },
  {
    id: "pdf",
    label: "PDF",
    kind: "pdf",
    extensions: ["pdf"],
    mime: ["application/pdf"],
    outputType: "application/pdf",
    outputExt: "pdf",
    note: "PDF 유지",
  },
  {
    id: "mp4",
    label: "MP4",
    kind: "video",
    extensions: ["mp4"],
    mime: ["video/mp4"],
    outputType: "video/webm",
    outputExt: "webm",
    note: "동영상",
  },
  {
    id: "webm",
    label: "WebM",
    kind: "video",
    extensions: ["webm"],
    mime: ["video/webm"],
    outputType: "video/webm",
    outputExt: "webm",
    note: "동영상",
  },
  {
    id: "mov",
    label: "MOV",
    kind: "video",
    extensions: ["mov"],
    mime: ["video/quicktime"],
    outputType: "video/webm",
    outputExt: "webm",
    note: "동영상",
  },
];

const EXT_MAP = new Map();
const MIME_MAP = new Map();

for (const format of SUPPORTED_FORMATS) {
  for (const ext of format.extensions) EXT_MAP.set(ext, format);
  for (const mime of format.mime) MIME_MAP.set(mime, format);
}

function getExtension(filename) {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : "";
}

function getStem(filename) {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(0, idx) : filename;
}

function detectFormat(file) {
  return MIME_MAP.get(file.type) ?? EXT_MAP.get(getExtension(file.name)) ?? null;
}

function acceptAttribute() {
  return SUPPORTED_FORMATS.flatMap((f) => [
    ...f.mime,
    ...f.extensions.map((ext) => `.${ext}`),
  ]).join(",");
}

function ratioLabel(width, height) {
  return `${width}x${height}`;
}

function outputFilename(originalName, ratioW, ratioH, outW, outH, ext, extra = "") {
  const stem = getStem(originalName);
  const suffix = extra ? `_${extra}` : "";
  return `${stem}${suffix}_${ratioLabel(ratioW, ratioH)}_${outW}x${outH}.${ext}`;
}

function zipFilename() {
  return "프레임핏_편집본.zip";
}

function defaultSettings() {
  return {
    ratio: "1:1",
    customW: "1",
    customH: "1",
    mode: "padding",
    padColor: "#ffffff",
    filter: "none",
    filterAmount: 100,
    crop: { x: 0, y: 0, w: 1, h: 1 },
    hue: 0,
    contrast: 100,
    rotation: 0,
    watermark: {
      text: "",
      position: "br",
      color: "#ffffff",
      opacity: 0.5,
      scale: 1,
    },
    clips: [],
    clipExport: "full",
  };
}

function editDefaultsFrom(settings) {
  return {
    hue: settings.hue,
    contrast: settings.contrast,
    rotation: settings.rotation || 0,
    opacity: settings.watermark.opacity,
    scale: settings.watermark.scale || 1,
    watermark: { ...settings.watermark },
  };
}

function snapshotEdit(settings) {
  return {
    filter: settings.filter,
    filterAmount: settings.filterAmount,
    hue: settings.hue,
    contrast: settings.contrast,
    rotation: settings.rotation || 0,
    crop: { ...(settings.crop || { x: 0, y: 0, w: 1, h: 1 }) },
    watermark: { ...settings.watermark },
  };
}

function mergedSettings(base, edit) {
  if (!edit) return base;
  return {
    ...base,
    filter: edit.filter,
    filterAmount: edit.filterAmount,
    hue: edit.hue,
    contrast: edit.contrast,
    rotation: edit.rotation || 0,
    crop: edit.crop || base.crop,
    watermark: { ...base.watermark, ...edit.watermark },
  };
}
