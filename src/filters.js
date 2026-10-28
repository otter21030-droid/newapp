const FILTERS = [
  { id: "none", label: "원본", css: "none" },
  { id: "goldenHour", label: "골든 아워", css: "sepia(0.35) saturate(1.35) hue-rotate(-12deg) brightness(1.08)" },
  { id: "matteBw", label: "매트 흑백", css: "grayscale(1) contrast(0.86) brightness(1.06)" },
  { id: "vintage", label: "빈티지", css: "sepia(0.5) contrast(0.92) saturate(0.82) brightness(1.04)" },
  { id: "sepia", label: "세피아", css: "sepia(1) contrast(1.05)" },
  { id: "bw", label: "흑백", css: "grayscale(1) contrast(1.08)" },
  { id: "colorPunch", label: "컬러 펀치", css: "saturate(1.65) contrast(1.18) brightness(1.03)" },
  { id: "soft", label: "소프트", css: "contrast(0.88) brightness(1.1) saturate(0.92)" },
  { id: "warm", label: "웜", css: "sepia(0.22) saturate(1.18) hue-rotate(-18deg) brightness(1.04)" },
  { id: "cool", label: "쿨", css: "hue-rotate(18deg) saturate(1.12) brightness(1.03)" },
  { id: "dramatic", label: "드라마틱", css: "contrast(1.38) saturate(1.22) brightness(0.94)" },
  { id: "fade", label: "페이드", css: "contrast(0.82) brightness(1.14) saturate(0.78)" },
  { id: "vivid", label: "생동감", css: "saturate(1.48) contrast(1.12) brightness(1.06)" },
  { id: "portrait", label: "인물", css: "contrast(1.06) saturate(1.12) brightness(1.08) sepia(0.1)" },
  { id: "matte", label: "매트", css: "contrast(0.86) saturate(0.88) brightness(1.07)" },
];

function getFilter(id) {
  return FILTERS.find((item) => item.id === id) ?? FILTERS[0];
}

function buildCanvasFilter(settings) {
  const hue = `hue-rotate(${Number(settings.hue) || 0}deg)`;
  const contrast = `contrast(${Number(settings.contrast) || 100}%)`;
  const preset = getFilter(settings.filter);
  if (preset.id === "none") return `${hue} ${contrast}`.trim();
  return `${preset.css} ${hue} ${contrast}`;
}
