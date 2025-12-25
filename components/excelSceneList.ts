import * as XLSX from "xlsx-js-style";

export interface FrontendScene {
  scene: string | number;
  location: string;
  dn: string;
  ie: string;
  summary: string;
  characters: { [key: string]: boolean };
  extras: string;
}

// =============================================================================
// 스타일 상수 정의
// =============================================================================
const BORDER_STYLE = {
  top: { style: "thin", color: { rgb: "000000" } },
  bottom: { style: "thin", color: { rgb: "000000" } },
  left: { style: "thin", color: { rgb: "000000" } },
  right: { style: "thin", color: { rgb: "000000" } },
};

const ALIGN_CENTER = { horizontal: "center", vertical: "center", wrapText: true };
// 내용은 왼쪽 정렬이되, 줄바꿈(wrapText)이 반드시 되어야 함
const ALIGN_LEFT = { horizontal: "left", vertical: "center", wrapText: true };

// 기본 셀 스타일 (테두리 포함)
const DEFAULT_STYLE = {
  border: BORDER_STYLE,
  alignment: ALIGN_CENTER,
  font: { name: "맑은 고딕", sz: 11 },
};

// =============================================================================
// 유틸리티 함수
// =============================================================================

/* 제목 정리 */
const getCleanTitle = (name: string) => {
  const base = name.replace(/\.[^/.]+$/, "");
  return (
    base
      .replace(/^\s*\d+\s*[.·)\]-_ ]+\s*/g, "")
      .replace(/^\s*\d+\s*[가-힣]\s+/g, "")
      .replace(/^[\s._-]+/g, "")
      .trim() || base
  );
};

/* 셀 텍스트로 주소 찾기(부분일치) */
const findCellByIncludes = (ws: XLSX.WorkSheet, includes: string) => {
  for (const addr of Object.keys(ws)) {
    if (addr.startsWith("!")) continue;
    const v = (ws as any)[addr]?.v;
    if (typeof v === "string" && v.includes(includes)) return addr;
  }
  return null;
};

/* !ref 범위 확장 */
const expandSheetRef = (ws: XLSX.WorkSheet, endRow: number, endCol: number) => {
  const curRef = (ws as any)["!ref"] || "A1:A1";
  const range = XLSX.utils.decode_range(curRef);
  range.e.r = Math.max(range.e.r, endRow);
  range.e.c = Math.max(range.e.c, endCol);
  (ws as any)["!ref"] = XLSX.utils.encode_range(range);
};

/* 셀 값 및 스타일 설정 */
const setCell = (ws: XLSX.WorkSheet, r: number, c: number, value: any, style: any) => {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cell: any = (ws as any)[addr] || {};
  
  cell.v = value ?? "";
  cell.t = typeof value === "number" ? "n" : "s";
  cell.s = style; // 스타일 강제 적용
  
  (ws as any)[addr] = cell;
};

/* 병합 범위(타이틀) 확장 */
const extendTitleMerge = (ws: XLSX.WorkSheet, titleRow: number, newEndCol: number) => {
  const merges = (ws as any)["!merges"] as any[] | undefined;
  if (!merges || merges.length === 0) return;

  for (const m of merges) {
    if (m.s?.r === titleRow && m.s?.c === 0) {
      m.e.c = Math.max(m.e.c, newEndCol);
    }
  }
};

/* [NEW] 행 높이 계산 (내용 길이에 따라 자동 조절) */
const calculateRowHeights = (
  data: FrontendScene[], 
  contentColWidth: number, 
  baseRowIdx: number
) => {
  const rows: { hpx: number }[] = [];
  
  // 헤더 부분 높이 (0행 ~ baseRowIdx-1행)
  // 0: 제목, 1: 빈칸, 2: 헤더
  rows[0] = { hpx: 30 }; 
  rows[1] = { hpx: 24 };
  rows[2] = { hpx: 30 }; 

  // 데이터 부분 높이 계산
  data.forEach((item, i) => {
    const text = item.summary || "";
    // 대략적인 줄 수 계산 (한글/영어 섞임 고려하여 보정값 1.6 사용)
    // contentColWidth가 55일 때, 한 줄에 약 80바이트 정도 들어간다고 가정
    const approxCharsPerLine = contentColWidth * 1.6; 
    const lines = Math.ceil(text.length / approxCharsPerLine);
    
    // 기본 높이 24px + (줄 수 - 1) * 18px (최소 24px)
    // 줄이 1개면 24, 2개면 42, 3개면 60...
    const height = Math.max(24, lines > 1 ? lines * 18 + 10 : 24); 
    
    // 실제 데이터 행은 baseRowIdx(3) 부터 시작
    rows[baseRowIdx + i] = { hpx: height };
  });

  return rows;
};

// =============================================================================
// 메인 함수
// =============================================================================
export async function buildSceneListExcel(
  sceneData: FrontendScene[],
  selectedMainChars: string[],
  fileName: string
) {
  const title = getCleanTitle(fileName);

  // 1. 템플릿 로드
  const res = await fetch("/scenelist_form.xlsx");
  if (!res.ok) throw new Error("엑셀 템플릿 로드 실패");
  const buf = await res.arrayBuffer();

  const wb = XLSX.read(buf, { type: "array", cellStyles: true });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // 2. 제목 수정
  const titleCellAddr = findCellByIncludes(ws, "<제목>");
  if (titleCellAddr) {
    const cell: any = (ws as any)[titleCellAddr];
    cell.v = `<${title}> SceneList`;
    cell.s = {
      font: { name: "맑은 고딕", sz: 20, bold: true },
      alignment: ALIGN_CENTER,
    };
  }

  // 3. 헤더 위치 찾기 (S# 기준)
  let headerRow = 2; // 기본값
  const headerCellAddr = findCellByIncludes(ws, "S#");
  if (headerCellAddr) {
    headerRow = XLSX.utils.decode_cell(headerCellAddr).r;
  }
  const startRow = headerRow + 1;

  // 4. 인물 리스트 확정 (범용성 강화)
  // 선택된 인물 + 데이터에서 발견된 인물 키 통합
  const picked = (selectedMainChars || []).map((v) => (v || "").trim()).filter(Boolean);
  const fromData = new Set<string>();
  
  sceneData.forEach((sc) => {
    if (sc.characters) {
      Object.keys(sc.characters).forEach(char => fromData.add(char));
    }
  });

  // 중복 제거 및 병합
  const mainChars = [
    ...picked,
    ...Array.from(fromData).filter((n) => !picked.includes(n)),
  ].filter(Boolean);

  const peopleColsCount = Math.max(1, mainChars.length);

  // 5. 헤더 다시 그리기 (인물 컬럼 동적 추가)
  const headerStyle = {
    border: BORDER_STYLE,
    alignment: ALIGN_CENTER,
    font: { name: "맑은 고딕", sz: 11, bold: true },
    fill: { fgColor: { rgb: "EFEFEF" } }
  };

  const headers = ["S#", "장소", "I/E", "D/N", "내용", ...mainChars, "비고"];
  // 인물이 하나도 없으면 '인물'이라는 빈 헤더 하나 추가
  if (mainChars.length === 0) {
      headers.splice(5, 0, "인물");
  }

  headers.forEach((h, idx) => {
    setCell(ws, headerRow, idx, h, headerStyle);
  });

  // 6. 데이터 채우기
  sceneData.forEach((item, i) => {
    const r = startRow + i;

    // Ep/Pr 처리 로직
    let sNo = String(item.scene).trim();
    const lower = sNo.toLowerCase();
    if (lower.includes("epi") || lower.includes("end") || lower.includes("outro")) sNo = "Ep";
    else if (lower.includes("pro") || lower.includes("intro")) sNo = "Pr";

    setCell(ws, r, 0, sNo, DEFAULT_STYLE);
    setCell(ws, r, 1, item.location, DEFAULT_STYLE);
    setCell(ws, r, 2, item.ie, DEFAULT_STYLE);
    setCell(ws, r, 3, item.dn, DEFAULT_STYLE);
    
    // 내용: 왼쪽 정렬 + 줄바꿈 허용 (스타일 객체 생성)
    const contentStyle = { 
        border: BORDER_STYLE, 
        alignment: ALIGN_LEFT, 
        font: { name: "맑은 고딕", sz: 10 } 
    };
    setCell(ws, r, 4, item.summary, contentStyle);

    // 인물 체크 (○ 표시)
    let colIdx = 5;
    if (mainChars.length > 0) {
      mainChars.forEach((charName) => {
        // characters 객체에 있거나, 요약문에 이름이 포함되어 있으면 체크
        const hasChar = 
          item.characters?.[charName] || 
          (item.summary || "").includes(charName);
        
        setCell(ws, r, colIdx++, hasChar ? "○" : "", DEFAULT_STYLE);
      });
    } else {
      setCell(ws, r, colIdx++, "", DEFAULT_STYLE); // 인물 빈칸
    }
    
    // 비고
    setCell(ws, r, colIdx, item.extras, DEFAULT_STYLE);
  });

  // 7. [핵심 수정] 열 너비(Width) 강제 설정
  // calculateAutoWidth 대신 직접 지정하여 S#이 커지는 것 방지
  const cols = [
      { wch: 6 },  // S# (작게 고정)
      { wch: 18 }, // 장소 (적당히)
      { wch: 6 },  // I/E
      { wch: 6 },  // D/N
      { wch: 55 }, // 내용 (아주 넓게 고정)
  ];
  
  // 인물 컬럼들 (좁게)
  for(let i=0; i<Math.max(1, mainChars.length); i++) {
      cols.push({ wch: 6 });
  }
  // 비고 컬럼 (적당히)
  cols.push({ wch: 20 });

  ws["!cols"] = cols;

  // 8. [핵심 수정] 행 높이(Height) 자동 계산 적용
  ws["!rows"] = calculateRowHeights(sceneData, 55, startRow);

  // 9. 마무리 (시트 범위 확장 및 저장)
  const lastColIndex = headers.length - 1;
  const lastRowIndex = startRow + sceneData.length - 1;

  extendTitleMerge(ws, 0, lastColIndex);
  expandSheetRef(ws, lastRowIndex, lastColIndex);

  // 파일 다운로드
  XLSX.writeFile(wb, `${title}_SceneList.xlsx`, { bookType: "xlsx", cellStyles: true });
}