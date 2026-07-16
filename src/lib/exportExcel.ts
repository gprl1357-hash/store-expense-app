import ExcelJS from "exceljs";
import html2canvas from "html2canvas";
import { APP_TITLE, formatAmount, formatDate } from "./constants";
import { buildCategorySummary } from "./chartData";
import type { Expense } from "./supabase/types";

const DETAIL_HEADERS = ["날짜", "카테고리", "금액(원)", "작성자", "메모", "등록일시"];
const CATEGORY_HEADERS = ["카테고리", "건수", "금액(원)", "비율(%)"];

async function captureChartViaSvg(container: HTMLElement): Promise<string | null> {
  const svgs = container.querySelectorAll("svg");
  if (svgs.length === 0) return null;

  const width = container.offsetWidth || 360;
  const padding = 16;
  const scale = 2;

  const svgDimensions = Array.from(svgs).map((svg) => {
    const rect = svg.getBoundingClientRect();
    return {
      w: rect.width || width - padding * 2,
      h: rect.height || 200,
    };
  });

  let totalHeight = padding + 36 + 28;
  for (const { h } of svgDimensions) totalHeight += h + padding;
  totalHeight += padding;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, totalHeight);

  let yOffset = padding;
  ctx.fillStyle = "#111827";
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.fillText("지출 그래프", padding, yOffset + 18);
  yOffset += 36;

  ctx.font = "14px Arial, sans-serif";
  ctx.fillStyle = "#6b7280";
  const subtitle = container.querySelector("p")?.textContent;
  if (subtitle) {
    ctx.fillText(subtitle, padding, yOffset + 14);
    yOffset += 28;
  }

  for (let i = 0; i < svgs.length; i++) {
    const svg = svgs[i];
    const { w: svgW, h: svgH } = svgDimensions[i];

    const svgClone = svg.cloneNode(true) as SVGElement;
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!svgClone.getAttribute("viewBox")) {
      svgClone.setAttribute("viewBox", `0 0 ${svgW} ${svgH}`);
    }
    svgClone.setAttribute("width", String(svgW));
    svgClone.setAttribute("height", String(svgH));

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const url = URL.createObjectURL(
      new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    );

    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, padding, yOffset, svgW, svgH);
          yOffset += svgH + padding;
          resolve();
        };
        img.onerror = () => reject(new Error("SVG render failed"));
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
}

async function captureChartImage(): Promise<string | null> {
  const el = document.getElementById("expense-chart-export");
  if (!el) return null;

  // 1) SVG 직접 캡처 (Tailwind lab() 색상 이슈 회피)
  try {
    const svgResult = await captureChartViaSvg(el);
    if (svgResult) return svgResult;
  } catch (err) {
    console.warn("SVG chart capture failed:", err);
  }

  // 2) html2canvas 폴백 — stylesheet 제거 후 시도
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll("link[rel='stylesheet'], style").forEach((n) => n.remove());
        const cloned = clonedDoc.getElementById("expense-chart-export");
        if (cloned) {
          cloned.style.background = "#ffffff";
          cloned.style.color = "#111827";
        }
      },
    });
    return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
  } catch (err) {
    console.warn("html2canvas chart capture failed:", err);
    return null;
  }
}

function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** @returns 그래프 시트 포함 여부 */
export async function exportExpensesToExcel(expenses: Expense[]): Promise<boolean> {
  if (expenses.length === 0) {
    alert("내보낼 지출 내역이 없습니다.");
    return false;
  }

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const total = sorted.reduce((sum, e) => sum + e.amount, 0);
  const categorySummary = buildCategorySummary(sorted);

  const wb = new ExcelJS.Workbook();
  wb.creator = APP_TITLE;
  wb.created = new Date();

  // ── 시트 1: 지출내역 ──
  const wsDetail = wb.addWorksheet("지출내역");
  wsDetail.addRow(DETAIL_HEADERS);
  wsDetail.getRow(1).font = { bold: true };
  for (const e of sorted) {
    wsDetail.addRow([
      formatDate(e.date),
      e.category,
      e.amount,
      e.created_by,
      e.memo ?? "",
      new Date(e.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
    ]);
  }
  wsDetail.addRow([]);
  const totalRow = wsDetail.addRow(["합계", "", total, "", "", ""]);
  totalRow.font = { bold: true };
  wsDetail.columns = [
    { width: 12 },
    { width: 10 },
    { width: 14 },
    { width: 10 },
    { width: 24 },
    { width: 20 },
  ];

  // ── 시트 2: 카테고리별합계 ──
  const wsCategory = wb.addWorksheet("카테고리별합계");
  wsCategory.addRow(CATEGORY_HEADERS);
  wsCategory.getRow(1).font = { bold: true };
  for (const row of categorySummary) {
    wsCategory.addRow([row.label, row.count, row.amount, row.ratio]);
  }
  const catTotalRow = wsCategory.addRow(["합계", sorted.length, total, total > 0 ? 100 : 0]);
  catTotalRow.font = { bold: true };
  wsCategory.columns = [{ width: 12 }, { width: 8 }, { width: 14 }, { width: 10 }];

  // ── 시트 3: 그래프 ──
  let hasChart = false;
  const chartBase64 = await captureChartImage();
  if (chartBase64) {
    try {
      const wsChart = wb.addWorksheet("그래프");
      wsChart.addRow(["지출 분석 그래프"]);
      wsChart.getRow(1).font = { bold: true, size: 14 };
      wsChart.addRow([`출력일: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`]);
      wsChart.addRow([`총 ${sorted.length}건 · ${formatAmount(total)}`]);
      wsChart.addRow([]);

      const imageId = wb.addImage({ base64: chartBase64, extension: "png" });
      wsChart.addImage(imageId, {
        tl: { col: 0, row: 4 },
        ext: { width: 720, height: 480 },
      });
      hasChart = true;
    } catch (err) {
      console.warn("Excel chart sheet failed:", err);
    }
  }

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const filenamePrefix = APP_TITLE.replace(/\s/g, "_").slice(0, 20);
  const buffer = await wb.xlsx.writeBuffer();
  downloadBuffer(buffer, `${filenamePrefix}_${today}.xlsx`);
  return hasChart;
}

/** 인쇄용 HTML (카테고리 막대 그래프 포함) */
export function printExpenses(expenses: Expense[]): void {
  if (expenses.length === 0) {
    alert("인쇄할 지출 내역이 없습니다.");
    return;
  }

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const total = sorted.reduce((sum, e) => sum + e.amount, 0);
  const categorySummary = buildCategorySummary(sorted);
  const maxAmount = Math.max(...categorySummary.map((c) => c.amount), 1);

  const categoryBars = categorySummary
    .filter((c) => c.amount > 0)
    .map(
      (c) => `
    <div class="bar-row">
      <span class="bar-label">${c.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round((c.amount / maxAmount) * 100)}%"></div></div>
      <span class="bar-value">${formatAmount(c.amount)} (${c.ratio}%)</span>
    </div>`
    )
    .join("");

  const rows = sorted
    .map(
      (e) => `
    <tr>
      <td>${formatDate(e.date)}</td>
      <td>${e.category}</td>
      <td style="text-align:right">${formatAmount(e.amount)}</td>
      <td>${e.created_by}</td>
      <td>${e.memo ?? ""}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<title>${APP_TITLE}</title>
<style>
  body { font-family: sans-serif; padding: 24px; font-size: 14px; }
  h1 { font-size: 20px; margin-bottom: 8px; }
  h2 { font-size: 16px; margin: 24px 0 12px; }
  .meta { color: #666; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; }
  th { background: #f3f4f6; text-align: left; }
  tfoot td { font-weight: bold; background: #f9fafb; }
  .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .bar-label { width: 56px; font-weight: bold; }
  .bar-track { flex: 1; height: 24px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; background: #3b82f6; border-radius: 4px; }
  .bar-value { width: 160px; text-align: right; font-size: 13px; }
  .chart-box { background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
</style></head><body>
<h1>${APP_TITLE}</h1>
<p class="meta">출력일: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · ${sorted.length}건 · ${formatAmount(total)}</p>
<div class="chart-box">
  <h2>카테고리별 지출</h2>
  ${categoryBars}
</div>
<h2>지출 내역</h2>
<table>
  <thead><tr><th>날짜</th><th>카테고리</th><th>금액</th><th>작성자</th><th>메모</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr><td colspan="2">합계</td><td style="text-align:right">${formatAmount(total)}</td><td colspan="2"></td></tr></tfoot>
</table>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해 주세요.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}
