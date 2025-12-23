// app/page.tsx
'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import UploadPanel from '@/components/UploadPanel';
import PreviewPanel from '@/components/PreviewPanel';
import DownloadModal from '@/components/DownloadModal';
import CharacterSelectModal from '@/components/CharacterSelectModal';

// 타입 정의
interface BackendScene {
  scene_no: string;
  location: string;
  ie: string;
  dn: string;
  summary: string;
  characters: string[];
  extras: string;
}

export interface FrontendScene {
  scene: string;
  location: string;
  dn: string;
  ie: string;
  summary: string;
  characters: { [key: string]: boolean };
  extras: string;
}

export default function ScriptAnalyzerDashboard() {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [hasData, setHasData] = useState<boolean>(false);

  // 모달 상태
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [showCharModal, setShowCharModal] = useState<boolean>(false);

  // 데이터 상태
  const [fileName, setFileName] = useState<string>(""); // [3] 파일명 저장
  const [rawBackendData, setRawBackendData] = useState<BackendScene[]>([]);
  const [allDetectedChars, setAllDetectedChars] = useState<string[]>([]);
  const [sceneData, setSceneData] = useState<FrontendScene[]>([]);
  const [selectedMainChars, setSelectedMainChars] = useState<string[]>([]);

  // 2. 파일 업로드 및 분석 요청
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setFileName(file.name); // 파일명 저장

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('서버 에러');

      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setRawBackendData(result.data);
        const charsFromMeta = result.meta?.all_detected_characters || [];
        setAllDetectedChars(charsFromMeta);
        setShowCharModal(true);
      } else {
        throw new Error('분석 데이터가 비어있습니다.');
      }
    } catch (error) {
      console.error(error);
      alert("분석 실패! 서버 상태를 확인하세요.");
    } finally {
      setIsUploading(false);
    }
  };

  // 3. 인물 선택 완료 및 데이터 변환
  const handleCharacterSelection = (selectedChars: string[]) => {
    setSelectedMainChars(selectedChars);
    const formatted = transformData(rawBackendData, selectedChars);
    setSceneData(formatted);
    setHasData(true);
    setShowCharModal(false);
  };

  const transformData = (rawData: BackendScene[], mainChars: string[]): FrontendScene[] => {
    return rawData.map(item => {
      const charMap: { [key: string]: boolean } = {};
      const extrasInScene: string[] = [];
      const currentSceneChars = item.characters || [];

      mainChars.forEach(mainChar => {
        const isPresent = currentSceneChars.some(c => c.includes(mainChar));
        charMap[mainChar] = isPresent;
      });

      currentSceneChars.forEach(char => {
        const isMain = mainChars.some(main => char.includes(main));
        if (!isMain) extrasInScene.push(char);
      });

      let finalExtras = item.extras || "";
      if (extrasInScene.length > 0) {
        const droppedCharsStr = extrasInScene.join(', ');
        finalExtras = finalExtras ? `${droppedCharsStr}, ${finalExtras}` : droppedCharsStr;
      }

      return {
        scene: item.scene_no,
        location: item.location,
        dn: item.dn,
        ie: item.ie,
        summary: item.summary,
        characters: charMap,
        extras: finalExtras
      };
    });
  };

  // [5] 데이터 수정 핸들러 (PreviewPanel에서 호출)
  const handleSceneUpdate = (index: number, field: keyof FrontendScene | string, value: any) => {
    const newData = [...sceneData];

    // 캐릭터(O/X) 수정인 경우
    if (selectedMainChars.includes(field as string)) {
      newData[index].characters = {
        ...newData[index].characters,
        [field as string]: value // boolean
      };
    } else {
      // 일반 텍스트 수정인 경우
      (newData[index] as any)[field] = value;
    }
    setSceneData(newData);
  };

  // 6. 엑셀 다운로드
  // app/page.tsx (handleDownloadExcel 교체)
  const handleDownloadExcel = async () => {
    if (sceneData.length === 0) return;

    setShowDownloadModal(true);

    try {
      // 1) 파일명 정리: "2. 결혼하지마요_알고.pdf" 같은 거에서 제목만 뽑기
      const getCleanTitle = (name: string) => {
        const base = name.replace(/\.[^/.]+$/, ""); // 확장자 제거

        // 앞쪽 "숫자/기호/공백" 제거 (예: "2. ", "01_", "4고 " 같은 거)
        let t = base
          .replace(/^\s*\d+\s*[.·)\]-_ ]+\s*/g, "")     // "2. " "01 - "
          .replace(/^\s*\d+\s*[가-힣]\s+/g, "")        // "4고 제목" 같은 패턴이면 "4고 " 제거
          .replace(/^[\s._-]+/g, "")                   // 나머지 잡다한 기호
          .trim();

        // 너무 짧으면 원본 base fallback
        if (t.length < 1) t = base.trim();
        return t;
      };

      const title = getCleanTitle(fileName);

      // 2) 템플릿 로드
      const templateUrl = "/templates/scenelist_form.xlsx";
      const res = await fetch(templateUrl);
      if (!res.ok) throw new Error("엑셀 템플릿을 불러오지 못했습니다.");
      const buf = await res.arrayBuffer();

      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];

      // 3) 유틸: 시트 내 특정 텍스트가 있는 셀 찾기
      const findCellByText = (worksheet: XLSX.WorkSheet, text: string) => {
        for (const addr of Object.keys(worksheet)) {
          if (addr.startsWith("!")) continue;
          const cell = worksheet[addr] as any;
          if (cell && cell.v === text) return addr;
        }
        return null;
      };

      // 4) 제목 삽입: "<제목>" 셀을 찾아 "<제목>"를 "<{title}>"로 바꿈
      //   예: "<결혼하지마요_알고> SceneList"
      const titleCellAddr = findCellByText(ws, "<제목>") || findCellByText(ws, "<제목> SceneList");
      if (titleCellAddr) {
        const current = (ws as any)[titleCellAddr]?.v ?? "";
        const replaced =
          typeof current === "string"
            ? current.replace("<제목>", `<${title}>`)
            : `<${title}> SceneList`;

        (ws as any)[titleCellAddr] = { t: "s", v: replaced };
      } else {
        // 못 찾으면 그냥 B1에 넣기(안전장치)
        (ws as any)["B1"] = { t: "s", v: `<${title}> SceneList` };
      }

      // 5) 헤더 행 찾기: "S#"가 있는 행을 찾아 그 행을 헤더로 봄
      const getRowCol = (addr: string) => XLSX.utils.decode_cell(addr);
      const headerCell = findCellByText(ws, "S#");
      if (!headerCell) throw new Error('템플릿에서 "S#" 헤더를 찾지 못했습니다.');
      const headerRC = getRowCol(headerCell);
      const headerRow = headerRC.r; // 0-index row

      // 6) 헤더에서 "내용"과 "비고" 컬럼 인덱스 찾기
      const getColIndexByHeader = (headerText: string) => {
        for (const addr of Object.keys(ws)) {
          if (addr.startsWith("!")) continue;
          const rc = XLSX.utils.decode_cell(addr);
          if (rc.r !== headerRow) continue;
          const cell: any = (ws as any)[addr];
          if (cell?.v === headerText) return rc.c;
        }
        return -1;
      };

      const colContent = getColIndexByHeader("내용");
      const colRemark = getColIndexByHeader("비고");
      if (colContent < 0 || colRemark < 0) {
        throw new Error('템플릿에서 "내용" 또는 "비고" 헤더를 찾지 못했습니다.');
      }

      // 7) "내용"과 "비고" 사이에 인물 열 삽입
      //    삽입 위치: colRemark (비고가 밀려남)
      const insertAt = colRemark; // 비고 컬럼이 오른쪽으로 밀리게
      const insertCount = selectedMainChars.length;

      const insertColumns = (worksheet: XLSX.WorkSheet, startCol: number, count: number) => {
        const range = XLSX.utils.decode_range((worksheet["!ref"] as string) || "A1:A1");

        // 기존 셀들을 새 주소로 옮김(오른쪽으로 shift)
        const newWs: any = {};
        for (const addr of Object.keys(worksheet)) {
          if (addr.startsWith("!")) continue;
          const rc = XLSX.utils.decode_cell(addr);
          let newC = rc.c;
          if (rc.c >= startCol) newC = rc.c + count;
          const newAddr = XLSX.utils.encode_cell({ r: rc.r, c: newC });
          newWs[newAddr] = (worksheet as any)[addr];
        }

        // 메타 복사
        newWs["!merges"] = (worksheet as any)["!merges"] ? JSON.parse(JSON.stringify((worksheet as any)["!merges"])) : [];
        newWs["!cols"] = (worksheet as any)["!cols"] ? JSON.parse(JSON.stringify((worksheet as any)["!cols"])) : [];

        // 병합도 shift
        if (newWs["!merges"]?.length) {
          newWs["!merges"] = newWs["!merges"].map((m: any) => {
            const out = { ...m };
            if (out.s.c >= startCol) out.s.c += count;
            if (out.e.c >= startCol) out.e.c += count;
            return out;
          });
        }

        // 컬럼 너비도 shift
        if (newWs["!cols"]?.length) {
          const cols = newWs["!cols"];
          const blanks = new Array(count).fill({ wch: 8 });
          cols.splice(startCol, 0, ...blanks);
          newWs["!cols"] = cols;
        }

        // !ref 확장
        range.e.c += count;
        newWs["!ref"] = XLSX.utils.encode_range(range);

        return newWs as XLSX.WorkSheet;
      };

      const wsShifted = insertCount > 0 ? insertColumns(ws, insertAt, insertCount) : ws;
      wb.Sheets[sheetName] = wsShifted;

      // 8) 새 헤더(인물 컬럼) 이름 채우기: 내용과 비고 사이에 인물들 넣기
      selectedMainChars.forEach((char, idx) => {
        const c = insertAt + idx; // 새로 생긴 컬럼
        const addr = XLSX.utils.encode_cell({ r: headerRow, c });
        (wsShifted as any)[addr] = { t: "s", v: char };
      });

      // 9) 데이터 채우기 시작 행: 헤더 다음 줄부터
      const startRow = headerRow + 1;

      sceneData.forEach((item, i) => {
        const r = startRow + i;

        const setCell = (col: number, value: any) => {
          const addr = XLSX.utils.encode_cell({ r, c: col });
          (wsShifted as any)[addr] = { t: "s", v: value ?? "" };
        };

        // 기본 컬럼들(템플릿 헤더 위치 기준)
        setCell(getColIndexByHeader("S#"), item.scene);
        setCell(getColIndexByHeader("장소"), item.location);
        setCell(getColIndexByHeader("I/E"), item.ie);
        setCell(getColIndexByHeader("D/N"), item.dn);
        setCell(colContent, item.summary);

        // 인물 O 표기(너 UI는 점인데 엑셀은 O가 더 현실적)
        selectedMainChars.forEach((char, idx) => {
          const col = insertAt + idx;
          const v = item.characters[char] ? "O" : "";
          setCell(col, v);
        });

        // 비고
        setCell(colRemark + insertCount, item.extras); // 밀린 비고 컬럼
      });

      // !ref 업데이트(행 확장)
      const currentRange = XLSX.utils.decode_range((wsShifted["!ref"] as string) || "A1:A1");
      const lastRow = startRow + sceneData.length + 5;
      if (lastRow > currentRange.e.r) currentRange.e.r = lastRow;
      wsShifted["!ref"] = XLSX.utils.encode_range(currentRange);

      // 10) 저장
      XLSX.writeFile(wb, `${title}_SceneList.xlsx`);

    } catch (e) {
      console.error(e);
      alert("엑셀 생성 실패! 템플릿 경로/형식을 확인하세요.");
    } finally {
      // 1) 다운로드가 끝나면 모달 닫기
      // writeFile은 동기라서 여기 도달하면 사실상 끝난 상태임
      setShowDownloadModal(false);
    }
  };


  return (
    // [4] 전체 레이아웃 스크롤 방지 (h-screen, overflow-hidden)
    <div className="h-screen bg-neutral-900 text-neutral-100 flex overflow-hidden relative">
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />

      <CharacterSelectModal
        isOpen={showCharModal}
        allCharacters={allDetectedChars}
        onConfirm={handleCharacterSelection}
        onClose={() => setShowCharModal(false)}
      />

      <UploadPanel
        hasData={hasData}
        isUploading={isUploading}
        fileName={fileName} // [3] 파일명 전달
        onFileSelect={handleFileUpload}
      />

      <PreviewPanel
        hasData={hasData}
        data={sceneData}
        columns={selectedMainChars}
        onDownload={handleDownloadExcel}
        onUpdate={handleSceneUpdate} // [5] 수정 함수 전달
      />
    </div>
  );
}