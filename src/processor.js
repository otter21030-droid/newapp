const RATIO_PRESETS = {
  "1:1": [1, 1],
  "3:4": [3, 4],
  "4:3": [4, 3],
  "9:16": [9, 16],
  "16:9": [16, 9],
};

function resolveRatio(preset, customW, customH) {
  if (preset === "custom") {
    const w = Number(customW);
    const h = Number(customH);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
    return [w, h];
  }
  return RATIO_PRESETS[preset] ?? null;
}

function itemRatio(settings) {
  return resolveRatio(settings.ratio, settings.customW, settings.customH);
}

function sourceSize(source) {
  if (source instanceof HTMLVideoElement) {
    return { w: source.videoWidth, h: source.videoHeight };
  }
  return {
    w: source.naturalWidth || source.width,
    h: source.naturalHeight || source.height,
  };
}

function normalizeRotation(value) {
  return ((Number(value) || 0) % 360 + 360) % 360;
}

function rotateSource(source, rotation) {
  const deg = normalizeRotation(rotation);
  const { w, h } = sourceSize(source);
  if (!w || !h) return { source, w: w || 1, h: h || 1 };
  if (!deg) return { source, w, h };
  const canvas = document.createElement("canvas");
  if (deg === 90 || deg === 270) {
    canvas.width = h;
    canvas.height = w;
  } else {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(source, -w / 2, -h / 2);
  return { source: canvas, w: canvas.width, h: canvas.height };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽을 수 없습니다."));
    };
    image.src = url;
  });
}

function mediaHost() {
  let host = document.getElementById("media-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "media-host";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText =
      "position:fixed;left:-12000px;top:0;width:240px;height:140px;overflow:hidden;opacity:0.02;pointer-events:none;z-index:-1;";
    document.body.appendChild(host);
  }
  return host;
}

function mountHiddenVideo(video) {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");
  video.controls = false;
  video.style.cssText = "width:240px;height:140px;background:#000;";
  if (!video.isConnected) mediaHost().appendChild(video);
}

function discardVideo(video, url) {
  try {
    video.pause();
  } catch {
    /* ignore */
  }
  video.removeAttribute("src");
  video.load();
  video.remove();
  if (url) URL.revokeObjectURL(url);
}

function waitAnim() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadVideoElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    mountHiddenVideo(video);
    video.src = url;
    let settled = false;
    const finish = (ok, value) => {
      if (settled) return;
      settled = true;
      if (ok) resolve(value);
      else {
        discardVideo(video, url);
        reject(value);
      }
    };
    const ready = () => {
      if (video.videoWidth > 0) finish(true, { video, url });
    };
    video.addEventListener("loadeddata", ready);
    video.addEventListener("loadedmetadata", ready);
    video.addEventListener("canplay", ready);
    video.onerror = () => finish(false, new Error("동영상을 읽을 수 없습니다."));
    video.load();
    setTimeout(() => {
      if (video.videoWidth > 0) ready();
      else finish(false, new Error("동영상 정보를 읽지 못했습니다."));
    }, 12000);
  });
}

async function resolveVideoDuration(video) {
  const direct = Number(video.duration);
  if (Number.isFinite(direct) && direct > 0) return direct;
  await new Promise((resolve) => {
    const finish = () => {
      video.removeEventListener("seeked", finish);
      resolve();
    };
    video.addEventListener("seeked", finish);
    try {
      video.currentTime = 1e9;
    } catch {
      finish();
      return;
    }
    setTimeout(finish, 900);
  });
  const guessed = Number(video.currentTime);
  try {
    video.currentTime = 0;
  } catch {
    /* ignore */
  }
  if (Number.isFinite(guessed) && guessed > 0.05) return guessed;
  return 0;
}

function seekVideo(video, time) {
  return new Promise((resolve) => {
    const duration = Number(video.duration);
    const maxTime = Number.isFinite(duration) && duration > 0 ? Math.max(duration - 0.04, 0) : Math.max(time, 0);
    const target = Math.min(Math.max(time, 0), maxTime);
    if (video.readyState >= 2 && Math.abs(video.currentTime - target) < 0.04 && video.videoWidth > 0) {
      resolve();
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener("seeked", finish);
      video.removeEventListener("error", finish);
      resolve();
    };
    video.addEventListener("seeked", finish);
    video.addEventListener("error", finish);
    try {
      video.pause();
      video.currentTime = target;
    } catch {
      finish();
      return;
    }
    setTimeout(finish, 280);
  });
}

async function renderAllPdfPages(file, scale = 1.15) {
  if (!window.pdfjsLib) throw new Error("PDF 엔진을 불러오지 못했습니다.");
  const data = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    pages.push(canvas);
  }
  return pages;
}

async function renderPdfPage(file, pageNumber, scale = 2) {
  if (!window.pdfjsLib) {
    throw new Error("PDF 엔진을 불러오지 못했습니다.");
  }
  const data = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  return { canvas, pageCount: pdf.numPages };
}

function computeLayout(srcW, srcH, ratioW, ratioH, mode) {
  const srcRatio = srcW / srcH;
  const targetRatio = ratioW / ratioH;

  if (mode === "padding") {
    let canvasW;
    let canvasH;
    if (srcRatio > targetRatio) {
      canvasW = srcW;
      canvasH = Math.round(srcW / targetRatio);
    } else {
      canvasH = srcH;
      canvasW = Math.round(srcH * targetRatio);
    }
    return {
      canvasW,
      canvasH,
      sx: 0,
      sy: 0,
      sw: srcW,
      sh: srcH,
      dx: Math.round((canvasW - srcW) / 2),
      dy: Math.round((canvasH - srcH) / 2),
      dw: srcW,
      dh: srcH,
    };
  }

  let sx;
  let sy;
  let sw;
  let sh;
  if (srcRatio > targetRatio) {
    sw = srcH * targetRatio;
    sh = srcH;
    sx = (srcW - sw) / 2;
    sy = 0;
  } else {
    sw = srcW;
    sh = srcW / targetRatio;
    sx = 0;
    sy = (srcH - sh) / 2;
  }

  const canvasW = Math.max(1, Math.round(sw));
  const canvasH = Math.max(1, Math.round(sh));
  return {
    canvasW,
    canvasH,
    sx,
    sy,
    sw,
    sh,
    dx: 0,
    dy: 0,
    dw: canvasW,
    dh: canvasH,
  };
}

function userCrop(srcW, srcH, crop) {
  const x = Math.round(srcW * (crop?.x ?? 0));
  const y = Math.round(srcH * (crop?.y ?? 0));
  const w = Math.round(srcW * (crop?.w ?? 1));
  const h = Math.round(srcH * (crop?.h ?? 1));
  return {
    x: Math.min(Math.max(0, x), srcW - 1),
    y: Math.min(Math.max(0, y), srcH - 1),
    w: Math.max(1, Math.min(w, srcW - x)),
    h: Math.max(1, Math.min(h, srcH - y)),
  };
}

function stampText(ctx, text, x, y) {
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

function drawWatermark(ctx, width, height, mark) {
  if (!mark?.text) return;
  const scale = Math.max(0.2, Number(mark.scale) || 1);
  const size = Math.max(12, Math.round(width * 0.035 * scale));
  ctx.save();
  ctx.globalAlpha = Number(mark.opacity ?? 0.5);
  ctx.fillStyle = mark.color || "#ffffff";
  ctx.font = `600 ${size}px "IBM Plex Sans", sans-serif`;
  ctx.lineWidth = Math.max(2, Math.round(size * 0.12));
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (mark.position === "diag") {
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 4);
    const gap = size * 6;
    const span = Math.sqrt(width * width + height * height);
    for (let y = -span; y <= span; y += gap) {
      for (let x = -span; x <= span; x += Math.max(gap * 1.6, ctx.measureText(mark.text).width + size * 2)) {
        stampText(ctx, mark.text, x, y);
      }
    }
    ctx.restore();
    return;
  }

  const pad = size * 0.8;
  let x = width / 2;
  let y = height / 2;
  if (mark.position === "tl") {
    x = pad;
    y = pad;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  } else if (mark.position === "tr") {
    x = width - pad;
    y = pad;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
  } else if (mark.position === "bl") {
    x = pad;
    y = height - pad;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
  } else if (mark.position === "br") {
    x = width - pad;
    y = height - pad;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
  }
  stampText(ctx, mark.text, x, y);
  ctx.restore();
}

function composeSource(source, settings, targetCanvas) {
  const ratio = itemRatio(settings);
  if (!ratio) throw new Error("캔버스 비율을 확인하세요.");
  const rotated = rotateSource(source, settings.rotation);
  source = rotated.source;
  const srcW = rotated.w;
  const srcH = rotated.h;
  if (!srcW || !srcH) throw new Error("원본 크기를 읽을 수 없습니다.");
  const cut = userCrop(srcW, srcH, settings.crop);
  const layout = computeLayout(cut.w, cut.h, ratio[0], ratio[1], settings.mode);
  const canvas = targetCanvas || document.createElement("canvas");
  if (canvas.width !== layout.canvasW) canvas.width = layout.canvasW;
  if (canvas.height !== layout.canvasH) canvas.height = layout.canvasH;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (settings.mode === "padding") {
    ctx.fillStyle = settings.padColor || "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const amount = Math.max(0, Math.min(100, Number(settings.filterAmount ?? 100))) / 100;
  const sx = cut.x + layout.sx;
  const sy = cut.y + layout.sy;
  const sw = layout.sw;
  const sh = layout.sh;
  const hue = Number(settings.hue) || 0;
  const contrast = Number(settings.contrast) || 100;

  ctx.save();
  ctx.filter = `hue-rotate(${hue}deg) contrast(${contrast}%)`;
  ctx.drawImage(source, sx, sy, sw, sh, layout.dx, layout.dy, layout.dw, layout.dh);
  ctx.restore();

  const preset = getFilter(settings.filter);
  if (preset.id !== "none" && amount > 0) {
    ctx.save();
    ctx.filter = buildCanvasFilter(settings);
    ctx.globalAlpha = amount;
    ctx.drawImage(source, sx, sy, sw, sh, layout.dx, layout.dy, layout.dw, layout.dh);
    ctx.restore();
  }

  drawWatermark(ctx, canvas.width, canvas.height, settings.watermark);
  return canvas;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("파일 변환에 실패했습니다."));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

async function createThumbnail(item, maxSize = 160) {
  const format = item.format;
  if (!format) return "";
  if (format.kind === "pdf") {
    const { canvas } = await renderPdfPage(item.file, 1, 0.6);
    return scaleCanvas(canvas, maxSize).toDataURL("image/jpeg", 0.72);
  }
  if (format.kind === "video") {
    const { video, url } = await loadVideoElement(item.file);
    await seekVideo(video, Math.min(0.2, (video.duration || 1) * 0.05));
    const canvas = composeSource(video, {
      ...item.settings,
      filter: "none",
      filterAmount: 0,
      hue: 0,
      contrast: 100,
      watermark: { text: "" },
      crop: { x: 0, y: 0, w: 1, h: 1 },
      mode: "crop",
      ratio: "1:1",
    });
    discardVideo(video, url);
    return scaleCanvas(canvas, maxSize).toDataURL("image/jpeg", 0.72);
  }
  const image = await loadImage(item.file);
  const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

function scaleCanvas(source, maxSize) {
  const scale = Math.min(maxSize / source.width, maxSize / source.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function drawPreview(targetCanvas, source, settings) {
  const composed = composeSource(source, settings);
  const maxW = targetCanvas.width;
  const maxH = targetCanvas.height;
  const scale = Math.min(maxW / composed.width, maxH / composed.height, 1);
  const w = Math.max(1, Math.round(composed.width * scale));
  const h = Math.max(1, Math.round(composed.height * scale));
  const ctx = targetCanvas.getContext("2d");
  ctx.clearRect(0, 0, maxW, maxH);
  ctx.fillStyle = "#ece5d8";
  ctx.fillRect(0, 0, maxW, maxH);
  ctx.drawImage(composed, Math.round((maxW - w) / 2), Math.round((maxH - h) / 2), w, h);
}

async function processImageFile(item, onProgress) {
  onProgress?.(10);
  const image = await loadImage(item.file);
  onProgress?.(40);
  const canvas = composeSource(image, item.settings);
  onProgress?.(75);
  const ratio = itemRatio(item.settings);
  const blob = await canvasToBlob(canvas, item.format.outputType, item.format.quality);
  onProgress?.(100);
  return {
    blob,
    name: outputFilename(
      item.file.name,
      ratio[0],
      ratio[1],
      canvas.width,
      canvas.height,
      item.format.outputExt,
    ),
    width: canvas.width,
    height: canvas.height,
  };
}

function buildPdfFromJpegs(pages) {
  const encoder = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const offsets = [0];
  const write = (data) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    chunks.push(bytes);
    offset += bytes.length;
  };
  const obj = (num, body, extra) => {
    offsets[num] = offset;
    write(`${num} 0 obj\n`);
    write(body);
    if (extra) write(extra);
    write("\nendobj\n");
  };

  write("%PDF-1.4\n");
  const kids = [];
  let num = 3;
  const pageRecords = pages.map((page) => {
    const imageId = num++;
    const contentId = num++;
    const pageId = num++;
    kids.push(pageId);
    return { page, imageId, contentId, pageId };
  });

  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map((id) => `${id} 0 R`).join(" ")}] >>`);

  pageRecords.forEach(({ page, imageId, contentId, pageId }) => {
    obj(
      imageId,
      `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.data.length} >>\nstream\n`,
      (() => {
        const end = encoder.encode("\nendstream");
        const merged = new Uint8Array(page.data.length + end.length);
        merged.set(page.data, 0);
        merged.set(end, page.data.length);
        return merged;
      })(),
    );
    const content = `q ${page.width} 0 0 ${page.height} 0 0 cm /Im${imageId} Do Q`;
    const contentBytes = encoder.encode(content);
    obj(
      contentId,
      `<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream`,
    );
    obj(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /XObject << /Im${imageId} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
  });

  const xrefPos = offset;
  write(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (let i = 1; i < offsets.length; i += 1) {
    write(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }
  write(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`);
  const total = chunks.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  chunks.forEach((part) => {
    out.set(part, cursor);
    cursor += part.length;
  });
  return new Blob([out], { type: "application/pdf" });
}

async function processPdf(item, onProgress) {
  if (!window.pdfjsLib) throw new Error("PDF 엔진을 불러오지 못했습니다.");
  onProgress?.(6);
  const data = await item.file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data }).promise;
  const ratio = itemRatio(item.settings);
  const pages = [];
  let lastWidth = 0;
  let lastHeight = 0;
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = Math.ceil(viewport.width);
    pageCanvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: pageCanvas.getContext("2d"), viewport }).promise;
    const composed = composeSource(pageCanvas, item.settings);
    const jpeg = await canvasToBlob(composed, "image/jpeg", 0.92);
    pages.push({
      width: composed.width,
      height: composed.height,
      data: new Uint8Array(await jpeg.arrayBuffer()),
    });
    lastWidth = composed.width;
    lastHeight = composed.height;
    onProgress?.(Math.round((pageNumber / pdf.numPages) * 92));
  }
  const blob = buildPdfFromJpegs(pages);
  onProgress?.(100);
  return {
    blob,
    name: outputFilename(item.file.name, ratio[0], ratio[1], lastWidth, lastHeight, "pdf"),
    width: lastWidth,
    height: lastHeight,
  };
}

function pickRecorderType() {
  const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return types.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "";
}

function activeClips(settings) {
  return (settings.clips || [])
    .map((clip) => ({
      id: clip.id,
      start: Math.max(0, Number(clip.start) || 0),
      end: Math.max(0, Number(clip.end) || 0),
      edit: clip.edit,
    }))
    .filter((clip) => clip.end > clip.start)
    .sort((a, b) => a.start - b.start);
}

function settingsAtTime(settings, time) {
  const clips = activeClips(settings);
  if (!clips.length || settings.clipExport === "separate") return settings;
  const clip = clips.find((entry) => time >= entry.start && time <= entry.end);
  if (!clip) {
    return {
      ...settings,
      filter: "none",
      filterAmount: 0,
      hue: 0,
      contrast: 100,
      rotation: 0,
      watermark: { ...settings.watermark, text: "" },
    };
  }
  return mergedSettings(settings, clip.edit);
}

async function recordVideoRange(video, settings, start, end, mimeType, onProgress, progressFrom, progressTo) {
  if (!video.videoWidth) throw new Error("동영상 크기를 읽을 수 없습니다.");
  const duration = Number(video.duration);
  const safeEnd = Number.isFinite(duration) && duration > 0 ? Math.min(end, duration) : end;
  const safeStart = Math.max(0, Math.min(start, Math.max(safeEnd - 0.1, 0)));
  if (!(safeEnd > safeStart)) throw new Error("동영상 구간이 올바르지 않습니다.");

  mountHiddenVideo(video);
  video.muted = true;
  video.defaultMuted = true;
  video.pause();
  await seekVideo(video, safeStart);

  const sample = composeSource(video, settingsAtTime(settings, safeStart));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, sample.width);
  canvas.height = Math.max(2, sample.height);
  mediaHost().appendChild(canvas);

  const fps = 12;
  const stream = canvas.captureStream(fps);
  const track = stream.getVideoTracks()[0];
  const pushFrame = () => {
    if (track && typeof track.requestFrame === "function") track.requestFrame();
  };

  const chunks = [];
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_500_000 });
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size) chunks.push(event.data);
  };
  const stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = () => reject(new Error("동영상 변환에 실패했습니다."));
  });

  const paint = (time) => {
    try {
      composeSource(video, settingsAtTime(settings, time), canvas);
      pushFrame();
    } catch {
      /* skip empty frame */
    }
  };

  const span = Math.max(safeEnd - safeStart, 0.1);
  const report = (time) => {
    const local = Math.min(1, Math.max(0, (time - safeStart) / span));
    onProgress?.(Math.round(progressFrom + local * (progressTo - progressFrom)));
  };

  paint(safeStart);
  recorder.start(100);
  await waitAnim();
  await waitAnim();

  let advanced = false;
  try {
    video.currentTime = safeStart;
    video.playbackRate = 1;
    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.then === "function") await playAttempt;
    const mark = video.currentTime;
    await waitMs(280);
    advanced = !video.paused && video.currentTime > mark + 0.03;
  } catch {
    advanced = false;
  }

  if (advanced) {
    let lastTime = video.currentTime;
    let stall = 0;
    while (!video.ended && video.currentTime < safeEnd - 0.05) {
      paint(video.currentTime);
      report(video.currentTime);
      await waitAnim();
      if (Math.abs(video.currentTime - lastTime) < 0.008) {
        stall += 1;
        if (stall > 18) {
          advanced = false;
          break;
        }
      } else {
        stall = 0;
        lastTime = video.currentTime;
      }
    }
    video.pause();
  }

  if (!advanced || video.currentTime < safeEnd - 0.25) {
    video.pause();
    const step = 1 / fps;
    let time = advanced ? Math.max(video.currentTime, safeStart) : safeStart;
    let frames = 0;
    const maxFrames = Math.ceil(span / step) + 12;
    while (time < safeEnd && frames < maxFrames) {
      await seekVideo(video, time);
      paint(time);
      report(time);
      await waitAnim();
      time += step;
      frames += 1;
    }
    await seekVideo(video, Math.max(safeEnd - 0.05, safeStart));
    paint(safeEnd);
    report(safeEnd);
    await waitAnim();
  } else {
    report(safeEnd);
  }

  await waitMs(160);
  if (recorder.state === "recording" && typeof recorder.requestData === "function") recorder.requestData();
  if (recorder.state !== "inactive") recorder.stop();
  await Promise.race([
    stopped,
    new Promise((_, reject) => setTimeout(() => reject(new Error("동영상 변환이 시간 초과되었습니다.")), 8000)),
  ]);
  canvas.remove();

  const blob = new Blob(chunks, { type: mimeType || "video/webm" });
  if (!blob.size) throw new Error("변환된 동영상 데이터가 없습니다.");
  return {
    blob,
    width: canvas.width,
    height: canvas.height,
  };
}

async function processVideo(item, onProgress) {
  if (!window.MediaRecorder) throw new Error("이 브라우저에서는 동영상 변환을 지원하지 않습니다.");
  const mimeType = pickRecorderType();
  if (!mimeType) throw new Error("WebM 녹화를 지원하지 않는 브라우저입니다.");

  onProgress?.(4);
  const { video, url } = await loadVideoElement(item.file);
  const duration = await resolveVideoDuration(video);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("동영상 길이를 읽을 수 없습니다.");
  }
  const clips = activeClips(item.settings);
  const ratio = itemRatio(item.settings);

  try {
    if (item.settings.clipExport === "separate" && clips.length) {
      const outputs = [];
      clips.forEach((clip, index) => {
        clip._from = 8 + Math.round((index / clips.length) * 84);
        clip._to = 8 + Math.round(((index + 1) / clips.length) * 84);
      });
      for (let i = 0; i < clips.length; i += 1) {
        const clip = clips[i];
        const recorded = await recordVideoRange(
          video,
          mergedSettings(item.settings, clip.edit),
          clip.start,
          Math.min(clip.end, duration),
          mimeType,
          onProgress,
          clip._from,
          clip._to,
        );
        outputs.push({
          blob: recorded.blob,
          name: outputFilename(
            item.file.name,
            ratio[0],
            ratio[1],
            recorded.width,
            recorded.height,
            "webm",
            `구간${i + 1}`,
          ),
          width: recorded.width,
          height: recorded.height,
        });
      }
      if (outputs.length === 1) {
        onProgress?.(100);
        return outputs[0];
      }
      const zip = new JSZip();
      outputs.forEach((entry) => zip.file(entry.name, entry.blob));
      const blob = await zip.generateAsync({ type: "blob" });
      onProgress?.(100);
      return {
        blob,
        name: `${getStem(item.file.name)}_${ratioLabel(ratio[0], ratio[1])}_구간모음.zip`,
      };
    }

    const start = 0;
    const end = duration;
    const recorded = await recordVideoRange(
      video,
      item.settings,
      start,
      end,
      mimeType,
      onProgress,
      8,
      96,
    );
    onProgress?.(100);
    return {
      blob: recorded.blob,
      name: outputFilename(item.file.name, ratio[0], ratio[1], recorded.width, recorded.height, "webm"),
      width: recorded.width,
      height: recorded.height,
    };
  } finally {
    discardVideo(video, url);
  }
}

async function processItem(item, onProgress) {
  if (item.format.kind === "pdf") return processPdf(item, onProgress);
  if (item.format.kind === "video") return processVideo(item, onProgress);
  return processImageFile(item, onProgress);
}

function pickerTypes(filename, mime) {
  const ext = `.${getExtension(filename)}`;
  return [
    {
      description: filename,
      accept: { [mime || "application/octet-stream"]: [ext] },
    },
  ];
}

async function chooseSaveHandle(filename, mime) {
  if (!window.showSaveFilePicker) return "anchor";
  try {
    return await window.showSaveFilePicker({
      suggestedName: filename,
      types: pickerTypes(filename, mime),
    });
  } catch (error) {
    if (error.name === "AbortError") return null;
    return "anchor";
  }
}

async function writeBlobToDestination(handle, blob, filename, onProgress) {
  if (handle && handle !== "anchor") {
    const buffer = new Uint8Array(await blob.arrayBuffer());
    const writable = await handle.createWritable();
    const chunk = 256 * 1024;
    for (let i = 0; i < buffer.length; i += chunk) {
      await writable.write(buffer.subarray(i, Math.min(i + chunk, buffer.length)));
      onProgress?.(Math.min(99, Math.round(((i + chunk) / Math.max(buffer.length, 1)) * 100)));
    }
    await writable.close();
    onProgress?.(100);
    return "saved";
  }

  const total = Math.max(blob.size, 1);
  const reader = blob.stream().getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress?.(Math.min(90, Math.round((loaded / total) * 90)));
  }
  const out = new Blob(chunks, { type: blob.type || "application/octet-stream" });
  const url = URL.createObjectURL(out);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  onProgress?.(100);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return "downloaded";
}

async function saveBlob(blob, filename, onProgress) {
  const handle = await chooseSaveHandle(filename, blob.type);
  if (!handle) {
    const cancel = new Error("cancelled");
    cancel.name = "AbortError";
    throw cancel;
  }
  return writeBlobToDestination(handle, blob, filename, onProgress);
}

async function createZipBlob(items, onProgress) {
  const zip = new JSZip();
  items.forEach((item) => zip.file(item.name, item.blob));
  return zip.generateAsync(
    { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
    (meta) => onProgress?.(Math.min(55, Math.round(meta.percent * 0.55))),
  );
}

async function loadPreviewSource(item) {
  if (item.format.kind === "pdf") {
    const { canvas } = await renderPdfPage(item.file, 1, 1.2);
    return canvas;
  }
  if (item.format.kind === "video") {
    const { video, url } = await loadVideoElement(item.file);
    await seekVideo(video, Math.min(0.15, (video.duration || 1) * 0.04));
    video._objectUrl = url;
    return video;
  }
  return loadImage(item.file);
}
