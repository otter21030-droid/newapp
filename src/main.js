const FORMAT_ICONS = {
  jpeg: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#f3c36b"/><path d="M8 21.5 12.2 11h2.3l4.2 10.5h-2.3l-.8-2.2h-4.4l-.8 2.2H8Zm3.2-4h3.1L12.8 13h-.1L11.2 17.5ZM20 21.5V11h5.6v1.9h-3.4v2.1h3.1v1.8h-3.1v2.8H20Z" fill="#5a3b0c"/></svg>`,
  png: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#7eb6d6"/><path d="M7.8 21.5V11h2.3l3.1 7.3h.1V11h2v10.5h-2.3l-3.2-7.5h-.1v7.5H7.8Zm10.6 0V11h5.4v1.9h-3.2v2.2h2.9v1.8h-2.9v4.6h-2.2Z" fill="#16394c"/></svg>`,
  webp: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#8fce7d"/><path d="M6.4 21.5 8.8 11h2.2l1.4 7.2h.1L14 11h2.2l1.5 7.2h.1L19.2 11h2.2l2.4 10.5h-2.2l-1.3-6.6h-.1l-1.5 6.6h-2.1l-1.5-6.6h-.1l-1.4 6.6h-2.1l-1.5-6.6h-.1l-1.3 6.6H6.4Z" fill="#234018"/></svg>`,
  gif: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#d9a0df"/><path d="M9.2 16.6V14h4.4v7.5H11V21c-.5.5-1.2.8-2.1.8-2.2 0-3.6-1.6-3.6-4.2S6.7 13.3 9 13.3c1.6 0 2.7.7 3.2 1.8l-1.8.9c-.3-.5-.8-.8-1.5-.8-.9 0-1.5.8-1.5 2.2s.6 2.2 1.6 2.2c.5 0 1-.2 1.2-.7v-2.3H9.2Zm8.1 5.2h-2.2V11h2.2v10.8Zm1.7-10.8h5.5v1.9h-3.3v2.2h3v1.8h-3v4.9h-2.2V11Z" fill="#4a2150"/></svg>`,
  bmp: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#f0a36a"/><path d="M8.4 21.5V11h3.3c2.2 0 3.5 1.1 3.5 2.8 0 1.1-.6 2-1.6 2.4 1.3.4 2.1 1.4 2.1 2.7 0 2-1.5 3.6-3.9 3.6H8.4Zm2.2-6.6h1.2c.9 0 1.4-.5 1.4-1.2s-.5-1.2-1.4-1.2h-1.2v2.4Zm0 4.8h1.5c1 0 1.6-.5 1.6-1.4s-.6-1.4-1.6-1.4h-1.5v2.8Zm8.8 1.8V11h5.4v1.9h-3.2v2.2h2.9v1.8h-2.9v4.6h-2.2Z" fill="#5a2d0d"/></svg>`,
  pdf: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#e26a5c"/><path d="M9 21.5V11h3.4c2.3 0 3.6 1.2 3.6 3.1 0 1.9-1.4 3.2-3.7 3.2h-1.1v4.2H9Zm2.2-6h1.2c.9 0 1.5-.5 1.5-1.4s-.5-1.3-1.5-1.3h-1.2V15.5Zm8.6 6.3c-2.3 0-3.6-1.6-3.6-4.3s1.4-4.4 3.7-4.4c1.5 0 2.6.6 3.1 1.7l-1.9.8c-.3-.5-.8-.8-1.3-.8-.9 0-1.5.8-1.5 2.6s.6 2.6 1.5 2.6c.6 0 1.1-.3 1.3-.9l1.9.8c-.5 1.2-1.7 1.9-3.2 1.9Z" fill="#5a1610"/></svg>`,
  mp4: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#6b8fd6"/><path d="M11 10.8 22 16 11 21.2V10.8Z" fill="#14284a"/></svg>`,
  webm: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#6b8fd6"/><path d="M11 10.8 22 16 11 21.2V10.8Z" fill="#14284a"/></svg>`,
  mov: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#6b8fd6"/><path d="M11 10.8 22 16 11 21.2V10.8Z" fill="#14284a"/></svg>`,
};

const PRESETS = ["1:1", "3:4", "4:3", "9:16", "16:9", "custom"];
const POSITIONS = [
  ["tl", "좌상"],
  ["tr", "우상"],
  ["center", "중앙"],
  ["bl", "좌하"],
  ["br", "우하"],
  ["diag", "대각선"],
];

const state = {
  items: [],
  processing: false,
  batchDownloading: false,
  batchProgress: 0,
  lightbox: null,
};

const app = document.querySelector("#app");
const previewCache = new Map();

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `file-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function stagedCount() {
  return state.items.filter((item) => item.status === "staged").length;
}

function allDone() {
  return state.items.length > 0 && state.items.every((item) => item.status === "done");
}

function markStaged(item) {
  item.status = item.format ? "staged" : "error";
  item.progress = 0;
  item.blob = null;
  item.outputName = "";
  item.downloadProgress = 0;
}

function render() {
  const hasFiles = state.items.length > 0;
  const doneCount = state.items.filter((item) => item.status === "done").length;
  const canUpload = hasFiles && !state.processing && state.items.some((item) => item.format);

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="formats" aria-label="작업 가능한 파일 포맷">
          ${SUPPORTED_FORMATS.map(
            (format) => `
              <div class="format-chip">
                ${FORMAT_ICONS[format.id]}
                <div>
                  <strong>${format.label}</strong>
                  <span>${format.note ? format.note : "리사이즈 지원"}</span>
                </div>
              </div>
            `,
          ).join("")}
        </div>
        <div class="brand">
          <p>Photo Ratio Studio</p>
          <h1>프레임핏</h1>
        </div>
      </header>

      <main class="stage">
        <section class="dropzone ${hasFiles ? "is-compact" : ""}" data-dropzone>
          <div class="drop-copy">
            <h2>${hasFiles ? "파일을 더 추가하세요" : "파일을 여기에 올려 주세요"}</h2>
            <p>이미지, PDF, 동영상을 드래그하거나 선택하세요. 바로 변환되지 않으니 파일마다 설정을 마친 뒤 업로드하세요.</p>
          </div>
          <button class="file-btn" type="button" data-browse>파일 선택</button>
          <input class="hidden-input" type="file" accept="${acceptAttribute()}" multiple data-file-input />
        </section>

        ${
          hasFiles
            ? `
        <div class="workspace">
          <section class="controls">
            <div class="control-block">
              <h3>작업</h3>
              <p class="hint">캔버스·필터·편집은 파일마다 따로 적용됩니다. 설정이 끝나면 파일별 업로드 또는 일괄 업로드를 누르세요.</p>
            </div>
            <div class="batch">
              <button type="button" class="primary" data-upload ${canUpload ? "" : "disabled"}>
                ${state.processing ? "업로드 중" : "일괄 업로드"}
              </button>
              <button type="button" data-batch ${allDone() && !state.batchDownloading ? "" : "disabled"}>
                ${state.batchDownloading ? "ZIP 준비 중" : "일괄 다운로드"}
              </button>
              ${
                state.batchDownloading
                  ? `
                    <div class="batch-progress">
                      <div class="bar is-download"><i style="width:${state.batchProgress}%"></i></div>
                      <div class="status-copy">저장 ${state.batchProgress}%</div>
                    </div>
                  `
                  : `<div class="status-copy">${doneCount}/${state.items.length}개 완료 · 대기 ${stagedCount()}개</div>`
              }
            </div>
          </section>

          <section class="list-wrap">
            <div class="list-head">
              <h2>선택한 파일</h2>
              <p>파일마다 캔버스를 고르고, 미리보기·삭제·필터·편집을 사용할 수 있습니다.</p>
            </div>
            <div class="file-list">
              ${state.items.map(renderCard).join("")}
            </div>
          </section>
        </div>
        `
            : `<p class="empty-hint">JPEG, PNG, WebP, GIF, BMP, PDF, MP4, WebM, MOV 파일을 사용할 수 있습니다.</p>`
        }
      </main>
      ${state.lightbox ? renderLightbox() : ""}
    </div>
  `;

  bindEvents();
  state.items.forEach((item) => {
    if (item.panel === "filter" || item.panel === "edit" || item.panel === "preview") {
      refreshLivePreview(item);
    }
    if (item.panel === "edit") bindCropEditor(item);
    if (item.panel === "clips") {
      (item.settings.clips || []).forEach((clip) => {
        if (clip.panel === "edit") bindCropEditor(item, false, clip.id);
      });
    }
    if (item.panel === "preview") {
      bindVideoPreview(item);
      fillPdfPreview(item);
    }
  });
  if (state.lightbox) fillLightbox();
}

function renderCard(item) {
  const canDownload = item.status === "done" && !item.downloading;
  const statusText =
    item.status === "error"
      ? item.error
      : item.downloading
        ? `저장 ${item.downloadProgress}%`
        : item.status === "done"
          ? `완료 · ${item.outputName}`
          : item.status === "processing"
            ? `변환 중 ${item.progress}%`
            : "설정 후 업로드 대기";

  return `
    <article class="file-card" data-id="${item.id}">
      <div class="file-card-top">
        <div class="thumb">${item.thumbnail ? `<img src="${item.thumbnail}" alt="" />` : ""}</div>
        <div class="meta">
          <strong title="${item.file.name}">${item.file.name}</strong>
          <span>${item.format?.label ?? "지원하지 않는 형식"} · ${formatBytes(item.file.size)}</span>
        </div>
        <div class="row-actions">
          <button type="button" class="ghost" data-preview="${item.id}">미리보기</button>
          <button type="button" class="danger" data-remove="${item.id}">삭제</button>
        </div>
      </div>

      ${
        item.format
          ? `
      <div class="file-settings">
        <div class="control-block">
          <h3>이 파일의 캔버스</h3>
          <div class="ratio-row">
            ${PRESETS.map(
              (value) => `
                <label class="choice">
                  <input type="radio" name="ratio-${item.id}" value="${value}" ${item.settings.ratio === value ? "checked" : ""} data-setting="ratio" data-id="${item.id}" />
                  <span>${value === "custom" ? "커스텀" : value}</span>
                </label>
              `,
            ).join("")}
          </div>
          ${
            item.settings.ratio === "custom"
              ? `
                <div class="custom-ratio">
                  <input type="number" min="1" step="1" value="${item.settings.customW}" data-setting="customW" data-id="${item.id}" />
                  <span>:</span>
                  <input type="number" min="1" step="1" value="${item.settings.customH}" data-setting="customH" data-id="${item.id}" />
                </div>
              `
              : ""
          }
        </div>
        <div class="control-block">
          <h3>맞춤 방식</h3>
          <div class="mode-row">
            <label class="choice">
              <input type="radio" name="mode-${item.id}" value="padding" ${item.settings.mode === "padding" ? "checked" : ""} data-setting="mode" data-id="${item.id}" />
              <span>Padding</span>
            </label>
            <label class="choice">
              <input type="radio" name="mode-${item.id}" value="crop" ${item.settings.mode === "crop" ? "checked" : ""} data-setting="mode" data-id="${item.id}" />
              <span>Crop</span>
            </label>
            ${
              item.settings.mode === "padding"
                ? `
                  <label class="pad-color">
                    여백 색
                    <input type="color" value="${item.settings.padColor}" data-setting="padColor" data-id="${item.id}" />
                  </label>
                `
                : ""
            }
          </div>
        </div>
        <div class="file-toolbar">
          <button type="button" class="${item.panel === "filter" ? "is-on" : "ghost"}" data-panel="filter" data-id="${item.id}">필터</button>
          <button type="button" class="${item.panel === "edit" ? "is-on" : "ghost"}" data-panel="edit" data-id="${item.id}">이미지 편집</button>
          ${
            item.format?.kind === "video"
              ? `<button type="button" class="${item.panel === "clips" ? "is-on" : "ghost"}" data-panel="clips" data-id="${item.id}">구간 편집</button>`
              : ""
          }
          <button type="button" class="primary" data-upload-one="${item.id}" ${item.status === "processing" || state.processing ? "disabled" : ""}>업로드</button>
          <button type="button" data-download="${item.id}" ${canDownload ? "" : "disabled"}>다운로드</button>
        </div>
      </div>
      `
          : ""
      }

      <div class="progress-col">
        <div class="bar-track">
          <div class="bar ${item.status === "done" ? "is-done" : ""}"><i style="width:${item.progress}%"></i></div>
        </div>
        <div class="status-copy ${item.status === "done" ? "is-done" : ""} ${item.status === "error" ? "is-error" : ""}">${statusText}</div>
        ${
          item.downloading
            ? `<div class="bar-track"><div class="bar is-download"><i style="width:${item.downloadProgress}%"></i></div></div>`
            : ""
        }
      </div>

      ${item.panel ? renderPanel(item) : ""}
    </article>
  `;
}

function clipAttr(clip) {
  return clip ? `data-clip="${clip.id}"` : "";
}

function editTarget(item, clip) {
  if (!clip) return item.settings;
  if (!clip.edit) clip.edit = snapshotEdit(item.settings);
  return clip.edit;
}

function renderFilterBlock(item, clip) {
  const settings = editTarget(item, clip);
  return `
    <div class="filter-grid">
      ${FILTERS.map(
        (filter) => `
          <button type="button" class="filter-swatch ${settings.filter === filter.id ? "is-on" : ""}" data-filter="${filter.id}" data-id="${item.id}" ${clipAttr(clip)}>
            <i style="filter:${filter.css === "none" ? "none" : filter.css}"></i>
            <span>${filter.label}</span>
          </button>
        `,
      ).join("")}
    </div>
    <label class="slider-row">
      필터 강도
      <input type="range" min="0" max="100" value="${settings.filterAmount}" data-live="filterAmount" data-id="${item.id}" ${clipAttr(clip)} />
      <em data-live-label="filterAmount">${settings.filterAmount}</em>
    </label>
  `;
}

function renderEditBlock(item, clip) {
  const settings = editTarget(item, clip);
  const mark = settings.watermark;
  const rotation = settings.rotation || 0;
  return `
    <div class="edit-grid">
      <div>
        <h4>잘라내기</h4>
        <canvas class="crop-canvas" width="360" height="240" data-crop-canvas="${item.id}" ${clipAttr(clip)}></canvas>
        <p class="hint">드래그해서 남길 영역을 지정하세요.</p>
      </div>
      <div class="edit-fields">
        <div class="edit-group">
          <h4>워터마크</h4>
          <label>문구
            <input type="text" value="${mark.text || ""}" placeholder="예: FrameFit" data-live="watermark.text" data-id="${item.id}" ${clipAttr(clip)} />
          </label>
          <label>위치
            <select data-live="watermark.position" data-id="${item.id}" ${clipAttr(clip)}>
              ${POSITIONS.map(
                ([value, label]) =>
                  `<option value="${value}" ${mark.position === value ? "selected" : ""}>${label}</option>`,
              ).join("")}
            </select>
          </label>
          <label class="inline-color">색
            <input type="color" value="${mark.color || "#ffffff"}" data-live="watermark.color" data-id="${item.id}" ${clipAttr(clip)} />
          </label>
          <label class="slider-row">크기
            <input type="range" min="20" max="220" value="${Math.round((mark.scale || 1) * 100)}" data-live="watermark.scale" data-id="${item.id}" ${clipAttr(clip)} />
            <input class="value-input" type="number" min="20" max="220" value="${Math.round((mark.scale || 1) * 100)}" data-live="watermark.scale" data-id="${item.id}" ${clipAttr(clip)} />
          </label>
          <label class="slider-row">투명도
            <input type="range" min="0" max="100" value="${Math.round((mark.opacity ?? 0.5) * 100)}" data-live="watermark.opacity" data-id="${item.id}" ${clipAttr(clip)} />
            <input class="value-input" type="number" min="0" max="100" value="${Math.round((mark.opacity ?? 0.5) * 100)}" data-live="watermark.opacity" data-id="${item.id}" ${clipAttr(clip)} />
          </label>
          <button type="button" class="ghost" data-reset="watermark" data-id="${item.id}" ${clipAttr(clip)}>워터마크 초기화</button>
        </div>
        <div class="edit-group">
          <h4>이미지</h4>
          <div class="rotate-row">
            <button type="button" class="ghost" data-rotate="-90" data-id="${item.id}" ${clipAttr(clip)}>왼쪽 90°</button>
            <strong>${rotation}°</strong>
            <button type="button" class="ghost" data-rotate="90" data-id="${item.id}" ${clipAttr(clip)}>오른쪽 90°</button>
          </div>
          <label class="slider-row">색조
            <input type="range" min="-180" max="180" value="${settings.hue}" data-live="hue" data-id="${item.id}" ${clipAttr(clip)} />
            <input class="value-input" type="number" min="-180" max="180" value="${settings.hue}" data-live="hue" data-id="${item.id}" ${clipAttr(clip)} />
          </label>
          <label class="slider-row">대비
            <input type="range" min="40" max="180" value="${settings.contrast}" data-live="contrast" data-id="${item.id}" ${clipAttr(clip)} />
            <input class="value-input" type="number" min="40" max="180" value="${settings.contrast}" data-live="contrast" data-id="${item.id}" ${clipAttr(clip)} />
          </label>
          <button type="button" class="ghost" data-reset="image" data-id="${item.id}" ${clipAttr(clip)}>이미지 초기화</button>
        </div>
      </div>
    </div>
  `;
}

function renderPanel(item) {
  if (item.panel === "filter") {
    return `
      <section class="inline-panel">
        <div class="panel-head">
          <h3>사진 필터</h3>
          <p>Adobe Express 계열의 톤을 참고한 필터입니다. 강도는 슬라이더로 조절하세요.</p>
        </div>
        ${renderFilterBlock(item)}
        <canvas class="live-preview zoomable" width="520" height="280" data-live-preview="${item.id}" data-zoom="result" data-id="${item.id}"></canvas>
      </section>
    `;
  }

  if (item.panel === "edit") {
    return `
      <section class="inline-panel">
        <div class="panel-head">
          <h3>이미지 편집</h3>
          <p>워터마크와 이미지 보정을 구분해 조절할 수 있습니다. 각각 초기화가 있습니다.</p>
        </div>
        ${renderEditBlock(item)}
        <canvas class="live-preview zoomable" width="520" height="280" data-live-preview="${item.id}" data-zoom="result" data-id="${item.id}"></canvas>
      </section>
    `;
  }

  if (item.panel === "clips") {
    const duration = Number(item.duration) || 0;
    return `
      <section class="inline-panel">
        <div class="panel-head">
          <h3>구간 편집</h3>
          <p>초 단위로 구간을 나눈 뒤, 구간만 따로 올릴지 전체 영상에 편집을 반영할지 고르세요. 영상 길이 ${duration.toFixed(1)}초</p>
        </div>
        <div class="clip-export">
          <label class="choice">
            <input type="radio" name="clip-export-${item.id}" value="separate" ${item.settings.clipExport === "separate" ? "checked" : ""} data-setting="clipExport" data-id="${item.id}" />
            <span>구간별 별도 파일</span>
          </label>
          <label class="choice">
            <input type="radio" name="clip-export-${item.id}" value="full" ${item.settings.clipExport === "full" ? "checked" : ""} data-setting="clipExport" data-id="${item.id}" />
            <span>전체 파일에 구간 편집 반영</span>
          </label>
        </div>
        <div class="clip-list">
          ${(item.settings.clips || [])
            .map(
              (clip, index) => `
                <article class="clip-card">
                  <div class="clip-row">
                    <strong>구간 ${index + 1}</strong>
                    <label>시작
                      <input type="number" min="0" step="0.1" max="${duration || ""}" value="${clip.start}" data-clip-field="start" data-clip="${clip.id}" data-id="${item.id}" />
                    </label>
                    <label>끝
                      <input type="number" min="0" step="0.1" max="${duration || ""}" value="${clip.end}" data-clip-field="end" data-clip="${clip.id}" data-id="${item.id}" />
                    </label>
                    <button type="button" class="${clip.panel === "filter" ? "is-on" : "ghost"}" data-clip-panel="filter" data-clip="${clip.id}" data-id="${item.id}">필터</button>
                    <button type="button" class="${clip.panel === "edit" ? "is-on" : "ghost"}" data-clip-panel="edit" data-clip="${clip.id}" data-id="${item.id}">이미지 편집</button>
                    <button type="button" class="danger" data-remove-clip="${clip.id}" data-id="${item.id}">삭제</button>
                  </div>
                  ${
                    clip.panel === "filter"
                      ? `<div class="clip-editor">${renderFilterBlock(item, clip)}</div>`
                      : clip.panel === "edit"
                        ? `<div class="clip-editor">${renderEditBlock(item, clip)}</div>`
                        : ""
                  }
                </article>
              `,
            )
            .join("")}
        </div>
        <button type="button" class="ghost" data-add-clip="${item.id}">구간 추가</button>
        <p class="hint">${
          item.settings.clipExport === "separate"
            ? "업로드하면 각 구간이 별도의 영상 파일로 저장됩니다."
            : "업로드하면 원본 길이의 전체 영상이 만들어지고, 지정한 구간에만 워터마크·필터·색 보정이 들어갑니다."
        }</p>
      </section>
    `;
  }

  if (item.panel === "preview") {
    const kind = item.format?.kind;
    return `
      <section class="inline-panel">
        <div class="panel-head">
          <h3>미리보기</h3>
          <p>원본과 현재 설정이 반영된 결과를 함께 봅니다.</p>
        </div>
        <div class="preview-pair">
          <div>
            <span>원본 · 클릭하면 확대</span>
            ${
              kind === "video"
                ? `<video class="zoomable" src="${item.previewUrl}" controls muted playsinline data-preview-video="${item.id}" data-zoom="original" data-id="${item.id}"></video>`
                : kind === "pdf"
                  ? `<div class="pdf-scroll" data-pdf-scroll="${item.id}"></div>`
                  : `<img class="zoomable" src="${item.previewUrl}" alt="원본 미리보기" data-zoom="original" data-id="${item.id}" />`
            }
          </div>
          <div>
            <span>적용 결과 · 클릭하면 확대</span>
            ${
              kind === "pdf"
                ? `<div class="pdf-scroll" data-pdf-result-scroll="${item.id}"></div>`
                : `<canvas class="live-preview zoomable" width="420" height="300" data-live-preview="${item.id}" data-zoom="result" data-id="${item.id}"></canvas>`
            }
          </div>
        </div>
      </section>
    `;
  }
  return "";
}

function bindEvents() {
  const dropzone = app.querySelector("[data-dropzone]");
  const input = app.querySelector("[data-file-input]");
  app.querySelector("[data-browse]")?.addEventListener("click", () => input.click());
  input?.addEventListener("change", () => {
    addFiles(input.files);
    input.value = "";
  });

  ["dragenter", "dragover"].forEach((type) => {
    dropzone?.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-over");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    dropzone?.addEventListener(type, (event) => {
      event.preventDefault();
      if (type === "dragleave" && dropzone.contains(event.relatedTarget)) return;
      dropzone.classList.remove("is-over");
    });
  });
  dropzone?.addEventListener("drop", (event) => addFiles(event.dataTransfer?.files));

  app.querySelector("[data-upload]")?.addEventListener("click", () => processQueue());
  app.querySelectorAll("[data-upload-one]").forEach((button) => {
    button.addEventListener("click", () => processOne(findItem(button.getAttribute("data-upload-one"))));
  });
  app.querySelector("[data-batch]")?.addEventListener("click", () => handleBatchDownload());
  app.querySelectorAll("[data-reset]").forEach((button) => {
    button.addEventListener("click", () =>
      resetEdit(button.getAttribute("data-id"), button.getAttribute("data-reset"), button.getAttribute("data-clip")),
    );
  });
  app.querySelectorAll("[data-rotate]").forEach((button) => {
    button.addEventListener("click", () =>
      rotateEdit(button.getAttribute("data-id"), Number(button.getAttribute("data-rotate")), button.getAttribute("data-clip")),
    );
  });
  app.querySelectorAll("[data-clip-panel]").forEach((button) => {
    button.addEventListener("click", () =>
      toggleClipPanel(button.getAttribute("data-id"), button.getAttribute("data-clip"), button.getAttribute("data-clip-panel")),
    );
  });
  app.querySelectorAll("[data-zoom]").forEach((el) => {
    el.addEventListener("click", (event) => {
      if (el.tagName === "VIDEO" && event.target === el) {
        /* allow native controls except we still zoom on canvas/img; skip video control clicks */
        const box = el.getBoundingClientRect();
        if (event.clientY > box.bottom - 40) return;
      }
      openLightbox(el.getAttribute("data-id"), el.getAttribute("data-zoom"));
    });
  });
  app.querySelector(".lightbox")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("lightbox") || event.target.hasAttribute("data-close-lightbox")) {
      state.lightbox = null;
      render();
    }
  });
  app.querySelectorAll("[data-add-clip]").forEach((button) => {
    button.addEventListener("click", () => addClip(button.getAttribute("data-add-clip")));
  });
  app.querySelectorAll("[data-remove-clip]").forEach((button) => {
    button.addEventListener("click", () =>
      removeClip(button.getAttribute("data-id"), button.getAttribute("data-remove-clip")),
    );
  });
  app.querySelectorAll("[data-clip-field]").forEach((el) => {
    el.addEventListener("change", () => {
      const item = findItem(el.getAttribute("data-id"));
      const clip = item?.settings.clips.find((entry) => entry.id === el.getAttribute("data-clip"));
      if (!clip) return;
      clip[el.getAttribute("data-clip-field")] = Number(el.value);
      markStaged(item);
    });
  });

  app.querySelectorAll("[data-preview]").forEach((button) => {
    button.addEventListener("click", () => togglePanel(button.getAttribute("data-preview"), "preview"));
  });
  app.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => removeItem(button.getAttribute("data-remove")));
  });
  app.querySelectorAll("[data-panel]").forEach((button) => {
    button.addEventListener("click", () =>
      togglePanel(button.getAttribute("data-id"), button.getAttribute("data-panel")),
    );
  });
  app.querySelectorAll("[data-download]").forEach((button) => {
    button.addEventListener("click", () => handleDownload(button.getAttribute("data-download")));
  });
  app.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = findItem(button.getAttribute("data-id"));
      if (!item) return;
      const target = settingsFromEl(item, button);
      target.filter = button.getAttribute("data-filter");
      markStaged(item);
      render();
    });
  });
  app.querySelectorAll("[data-setting]").forEach((el) => {
    el.addEventListener("change", () => {
      const item = findItem(el.getAttribute("data-id"));
      if (!item) return;
      item.settings[el.getAttribute("data-setting")] = el.value;
      markStaged(item);
      render();
    });
  });
  app.querySelectorAll("[data-live]").forEach((el) => {
    const eventName = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(eventName, () => {
      const item = findItem(el.getAttribute("data-id"));
      if (!item) return;
      setLiveValue(item, el.getAttribute("data-live"), el, el.getAttribute("data-clip"));
      markStaged(item);
      const label = el.parentElement.querySelector("[data-live-label]");
      if (label) label.textContent = el.value;
      const clipId = el.getAttribute("data-clip") || "";
      app.querySelectorAll(`[data-live="${el.getAttribute("data-live")}"][data-id="${item.id}"]`).forEach((other) => {
        if (other !== el && (other.getAttribute("data-clip") || "") === clipId) other.value = el.value;
      });
      refreshLivePreview(item);
      if (item.panel === "edit") bindCropEditor(item, true);
      if (clipId) bindCropEditor(item, true, clipId);
    });
  });
}

function settingsFromEl(item, el) {
  const clipId = el?.getAttribute?.("data-clip");
  if (!clipId) return item.settings;
  const clip = item.settings.clips.find((entry) => entry.id === clipId);
  return clip ? editTarget(item, clip) : item.settings;
}

function setLiveValue(item, path, el, clipId) {
  let value = el.value;
  if (path === "watermark.opacity" || path === "watermark.scale") value = Number(el.value) / 100;
  if (path === "hue" || path === "contrast" || path === "filterAmount") value = Number(el.value);
  const target = clipId
    ? editTarget(item, item.settings.clips.find((entry) => entry.id === clipId))
    : item.settings;
  const parts = path.split(".");
  if (parts.length === 1) {
    target[parts[0]] = value;
    return;
  }
  target[parts[0]][parts[1]] = value;
}

function resetEdit(id, kind, clipId) {
  const item = findItem(id);
  if (!item?.editDefaults) return;
  const target = clipId
    ? editTarget(item, item.settings.clips.find((entry) => entry.id === clipId))
    : item.settings;
  const defaults = item.editDefaults;
  if (kind === "watermark") {
    const mark = defaults.watermark || {
      text: "",
      position: "br",
      color: "#ffffff",
      opacity: defaults.opacity,
      scale: defaults.scale,
    };
    target.watermark = { ...mark };
  }
  if (kind === "image") {
    target.hue = defaults.hue;
    target.contrast = defaults.contrast;
    target.rotation = defaults.rotation;
  }
  markStaged(item);
  render();
}

function rotateEdit(id, amount, clipId) {
  const item = findItem(id);
  if (!item) return;
  const target = clipId
    ? editTarget(item, item.settings.clips.find((entry) => entry.id === clipId))
    : item.settings;
  target.rotation = ((Number(target.rotation) || 0) + amount + 360) % 360;
  markStaged(item);
  render();
}

function toggleClipPanel(id, clipId, panel) {
  const item = findItem(id);
  const clip = item?.settings.clips.find((entry) => entry.id === clipId);
  if (!clip) return;
  clip.panel = clip.panel === panel ? null : panel;
  if (clip.panel) editTarget(item, clip);
  markStaged(item);
  render();
}

function addClip(id) {
  const item = findItem(id);
  if (!item) return;
  const last = item.settings.clips[item.settings.clips.length - 1];
  const start = last ? Number(last.end) || 0 : 0;
  const end = Math.min(item.duration || start + 5, start + 5);
  item.settings.clips.push({
    id: createId(),
    start,
    end: end > start ? end : start + 1,
    panel: null,
    edit: snapshotEdit(item.settings),
  });
  markStaged(item);
  render();
}

function removeClip(id, clipId) {
  const item = findItem(id);
  if (!item) return;
  item.settings.clips = item.settings.clips.filter((clip) => clip.id !== clipId);
  markStaged(item);
  render();
}

function findItem(id) {
  return state.items.find((item) => item.id === id);
}

function togglePanel(id, panel) {
  const item = findItem(id);
  if (!item) return;
  item.panel = item.panel === panel ? null : panel;
  render();
}

function removeItem(id) {
  const item = findItem(id);
  if (!item) return;
  if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  const cached = previewCache.get(id);
  if (cached?._objectUrl) URL.revokeObjectURL(cached._objectUrl);
  previewCache.delete(id);
  state.items = state.items.filter((entry) => entry.id !== id);
  render();
}

async function addFiles(fileList) {
  if (!fileList?.length) return;
  const incoming = [...fileList].map((file) => {
    const format = detectFormat(file);
    return {
      id: createId(),
      file,
      format,
      thumbnail: "",
      previewUrl: URL.createObjectURL(file),
      settings: defaultSettings(),
      editDefaults: editDefaultsFrom(defaultSettings()),
      duration: 0,
      status: format ? "staged" : "error",
      progress: 0,
      downloadProgress: 0,
      downloading: false,
      blob: null,
      outputName: "",
      panel: null,
      error: format ? "" : "이 앱에서 처리할 수 없는 형식입니다.",
    };
  });
  state.items = [...state.items, ...incoming];
  render();
  await Promise.all(
    incoming.map(async (item) => {
      if (!item.format) return;
      try {
        item.thumbnail = await createThumbnail(item);
      } catch {
        item.thumbnail = "";
      }
      if (item.format?.kind === "video") {
        item.duration = await readVideoDuration(item.previewUrl);
      }
    }),
  );
  render();
}

async function refreshLivePreview(item) {
  const canvas = app.querySelector(`[data-live-preview="${item.id}"]`);
  const pdfCanvas = app.querySelector(`[data-pdf-preview="${item.id}"]`);
  if (!item.format) return;
  try {
    let source = previewCache.get(item.id);
    if (!source) {
      source = await loadPreviewSource(item);
      previewCache.set(item.id, source);
    }
    if (pdfCanvas && source instanceof HTMLCanvasElement) {
      const ctx = pdfCanvas.getContext("2d");
      const scale = Math.min(pdfCanvas.width / source.width, pdfCanvas.height / source.height);
      const w = source.width * scale;
      const h = source.height * scale;
      ctx.fillStyle = "#ece5d8";
      ctx.fillRect(0, 0, pdfCanvas.width, pdfCanvas.height);
      ctx.drawImage(source, (pdfCanvas.width - w) / 2, (pdfCanvas.height - h) / 2, w, h);
    }
    if (canvas) drawPreview(canvas, source, item.settings);
  } catch {
    /* preview optional */
  }
}

function bindCropEditor(item, keepOnlyPaint = false, clipId = null) {
  const canvas = clipId
    ? app.querySelector(`[data-crop-canvas="${item.id}"][data-clip="${clipId}"]`)
    : app.querySelector(`[data-crop-canvas="${item.id}"]:not([data-clip])`);
  if (!canvas) return;
  const source = previewCache.get(item.id);
  if (!source) {
    loadPreviewSource(item).then((loaded) => {
      previewCache.set(item.id, loaded);
      bindCropEditor(item, keepOnlyPaint, clipId);
    });
    return;
  }

  const clip = clipId ? item.settings.clips.find((entry) => entry.id === clipId) : null;
  const settings = clip ? editTarget(item, clip) : item.settings;
  const oriented = rotateSource(source, settings.rotation);
  const { w: srcW, h: srcH } = { w: oriented.w, h: oriented.h };
  const drawn = oriented.source;
  const fit = Math.min(canvas.width / srcW, canvas.height / srcH);
  const dw = srcW * fit;
  const dh = srcH * fit;
  const ox = (canvas.width - dw) / 2;
  const oy = (canvas.height - dh) / 2;

  const paint = () => {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1c1915";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(drawn, ox, oy, dw, dh);
    const crop = settings.crop;
    const rx = ox + crop.x * dw;
    const ry = oy + crop.y * dh;
    const rw = crop.w * dw;
    const rh = crop.h * dh;
    ctx.fillStyle = "rgba(28,25,21,0.45)";
    ctx.fillRect(ox, oy, dw, dh);
    ctx.clearRect(rx, ry, rw, rh);
    ctx.drawImage(drawn, crop.x * srcW, crop.y * srcH, crop.w * srcW, crop.h * srcH, rx, ry, rw, rh);
    ctx.strokeStyle = "#c24b1e";
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, ry, rw, rh);
  };
  paint();
  if (keepOnlyPaint) return;

  let dragging = false;
  const toCrop = (event) => {
    const box = canvas.getBoundingClientRect();
    const x = (event.clientX - box.left) * (canvas.width / box.width);
    const y = (event.clientY - box.top) * (canvas.height / box.height);
    return {
      x: Math.min(Math.max((x - ox) / dw, 0), 1),
      y: Math.min(Math.max((y - oy) / dh, 0), 1),
    };
  };

  canvas.onmousedown = (event) => {
    dragging = true;
    const start = toCrop(event);
    settings.crop = { x: start.x, y: start.y, w: 0.02, h: 0.02 };
    paint();
    const move = (ev) => {
      if (!dragging) return;
      const now = toCrop(ev);
      const x = Math.min(start.x, now.x);
      const y = Math.min(start.y, now.y);
      settings.crop = {
        x,
        y,
        w: Math.max(0.05, Math.abs(now.x - start.x)),
        h: Math.max(0.05, Math.abs(now.y - start.y)),
      };
      paint();
      refreshLivePreview(item);
    };
    const up = () => {
      dragging = false;
      markStaged(item);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
}

function readVideoDuration(url) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;
    const finish = (value) => resolve(Number.isFinite(value) && value > 0 ? value : 0);
    video.onloadedmetadata = () => {
      const direct = Number(video.duration);
      if (Number.isFinite(direct) && direct > 0) {
        finish(direct);
        return;
      }
      const done = () => finish(Number(video.currentTime) || 0);
      video.addEventListener("seeked", done);
      try {
        video.currentTime = 1e9;
      } catch {
        finish(0);
      }
      setTimeout(done, 900);
    };
    video.onerror = () => finish(0);
  });
}

function renderLightbox() {
  const item = findItem(state.lightbox.itemId);
  if (!item) return "";
  return `
    <div class="lightbox" data-close-lightbox>
      <div class="lightbox-frame">
        <button type="button" class="ghost" data-close-lightbox>닫기</button>
        <div class="lightbox-body" data-lightbox-body></div>
      </div>
    </div>
  `;
}

function openLightbox(id, which) {
  state.lightbox = { itemId: id, which };
  render();
}

async function fillLightbox() {
  const box = app.querySelector("[data-lightbox-body]");
  if (!box || !state.lightbox) return;
  const item = findItem(state.lightbox.itemId);
  if (!item) return;
  box.innerHTML = "";
  if (state.lightbox.which === "original") {
    if (item.format?.kind === "video") {
      box.innerHTML = `<video src="${item.previewUrl}" controls autoplay muted playsinline></video>`;
      return;
    }
    if (item.format?.kind === "pdf") {
      const pages = await renderAllPdfPages(item.file, 1.4);
      pages.forEach((page) => {
        page.className = "pdf-page";
        box.appendChild(page);
      });
      return;
    }
    box.innerHTML = `<img src="${item.previewUrl}" alt="확대 미리보기" />`;
    return;
  }
  if (item.format?.kind === "pdf") {
    const pages = await renderAllPdfPages(item.file, 1.2);
    pages.forEach((page) => {
      const composed = composeSource(page, item.settings);
      composed.className = "pdf-page";
      box.appendChild(composed);
    });
    return;
  }
  const source = previewCache.get(item.id) || (await loadPreviewSource(item));
  previewCache.set(item.id, source);
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 720;
  drawPreview(canvas, source, item.settings);
  box.appendChild(canvas);
}

async function fillPdfPreview(item) {
  if (item.format?.kind !== "pdf") return;
  const original = app.querySelector(`[data-pdf-scroll="${item.id}"]`);
  const result = app.querySelector(`[data-pdf-result-scroll="${item.id}"]`);
  if (!original && !result) return;
  try {
    const pages = await renderAllPdfPages(item.file, 1.05);
    if (original) {
      original.innerHTML = "";
      pages.forEach((page) => {
        page.className = "pdf-page";
        original.appendChild(page);
      });
    }
    if (result) {
      result.innerHTML = "";
      pages.forEach((page) => {
        const composed = composeSource(page, item.settings);
        composed.className = "pdf-page";
        result.appendChild(composed);
      });
    }
  } catch {
    /* optional */
  }
}

function bindVideoPreview(item) {
  if (item.format?.kind !== "video") return;
  const video = app.querySelector(`[data-preview-video="${item.id}"]`);
  const canvas = app.querySelector(`[data-live-preview="${item.id}"]`);
  if (!video || !canvas) return;
  const paint = () => {
    try {
      drawPreview(canvas, video, item.settings);
    } catch {
      /* ignore empty frames */
    }
  };
  const tick = () => {
    if (item.panel !== "preview") return;
    paint();
    if (!video.paused && !video.ended) requestAnimationFrame(tick);
  };
  video.addEventListener("play", () => requestAnimationFrame(tick));
  video.addEventListener("seeked", paint);
  video.addEventListener("timeupdate", paint);
  video.addEventListener("loadeddata", paint);
  if (video.readyState >= 2) paint();
}

function updateProcessUi(item, value, label) {
  item.progress = value;
  const row = app.querySelector(`[data-id="${item.id}"]`);
  const bar = row?.querySelector(".bar:not(.is-download) > i");
  const copy = row?.querySelector(".status-copy");
  if (bar) bar.style.width = `${value}%`;
  if (copy) copy.textContent = `${label} ${value}%`;
}

async function processOne(item, fromBatch = false) {
  if (!item?.format || item.status === "processing") return;
  if (state.processing && !fromBatch) return;
  if (!itemRatio(item.settings)) {
    item.status = "error";
    item.error = "캔버스 비율을 확인하세요.";
    render();
    return;
  }
  item.status = "processing";
  item.progress = 0;
  render();
  try {
    const result = await processItem(item, (value) => updateProcessUi(item, value, "변환 중"));
    item.blob = result.blob;
    item.outputName = result.name;
    item.status = "done";
    item.progress = 100;
  } catch (error) {
    item.status = "error";
    item.error = error.message || "변환에 실패했습니다.";
  }
  render();
}

async function processQueue() {
  if (state.processing) return;
  const jobs = state.items.filter((item) => item.format && item.status !== "processing");
  const pending = jobs.filter((item) => item.status === "staged" || item.status === "error");
  const list = pending.length ? pending : jobs;
  if (!list.length) return;
  state.processing = true;
  render();
  for (const item of list) {
    await processOne(item, true);
  }
  state.processing = false;
  render();
}

async function handleDownload(id) {
  const item = findItem(id);
  if (!item?.blob || item.downloading) return;
  const handle = await chooseSaveHandle(item.outputName, item.blob.type);
  if (!handle) return;
  item.downloading = true;
  item.downloadProgress = 0;
  render();
  try {
    await writeBlobToDestination(handle, item.blob, item.outputName, (value) => {
      item.downloadProgress = value;
      const row = app.querySelector(`[data-id="${item.id}"]`);
      const bar = row?.querySelector(".bar.is-download > i");
      const copy = row?.querySelector(".status-copy");
      if (bar) bar.style.width = `${value}%`;
      if (copy) copy.textContent = `저장 ${value}%`;
    });
  } catch (error) {
    if (error.name !== "AbortError") {
      item.status = "error";
      item.error = "저장에 실패했습니다.";
    }
  } finally {
    item.downloading = false;
    render();
  }
}

async function handleBatchDownload() {
  if (!allDone() || state.batchDownloading) return;
  const handle = await chooseSaveHandle(zipFilename(), "application/zip");
  if (!handle) return;
  state.batchDownloading = true;
  state.batchProgress = 0;
  render();
  try {
    const packed = await createZipBlob(
      state.items.filter((item) => item.blob).map((item) => ({ name: item.outputName, blob: item.blob })),
      (value) => {
        state.batchProgress = value;
        const bar = app.querySelector(".batch-progress .bar > i");
        const copy = app.querySelector(".batch-progress .status-copy");
        if (bar) bar.style.width = `${value}%`;
        if (copy) copy.textContent = `저장 ${value}%`;
      },
    );
    await writeBlobToDestination(handle, packed, zipFilename(), (value) => {
      state.batchProgress = Math.max(state.batchProgress, value);
      const bar = app.querySelector(".batch-progress .bar > i");
      const copy = app.querySelector(".batch-progress .status-copy");
      if (bar) bar.style.width = `${state.batchProgress}%`;
      if (copy) copy.textContent = `저장 ${state.batchProgress}%`;
    });
  } catch (error) {
    if (error.name !== "AbortError") {
      /* keep UI */
    }
  } finally {
    state.batchDownloading = false;
    render();
  }
}

window.addEventListener("dragover", (event) => event.preventDefault());
window.addEventListener("drop", (event) => event.preventDefault());

render();
