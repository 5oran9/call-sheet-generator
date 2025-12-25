// app/page.tsx
'use client';

import React, { useState } from 'react';
import UploadPanel from '@/components/UploadPanel';
import PreviewPanel from '@/components/PreviewPanel';
import DownloadModal from '@/components/DownloadModal';
import CharacterSelectModal from '@/components/CharacterSelectModal';
import { buildSceneListExcel } from '@/components/excelSceneList';

// 백엔드 응답 타입
interface BackendScene {
  scene_no: string;
  location: string;
  ie: string;
  dn: string;
  summary: string;
  characters: string[];
  extras: string;
}

// 프론트에서 쓰는 테이블 타입
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

  // 모달
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [showCharModal, setShowCharModal] = useState<boolean>(false);

  // 데이터
  const [fileName, setFileName] = useState<string>('');
  const [rawBackendData, setRawBackendData] = useState<BackendScene[]>([]);
  const [allDetectedChars, setAllDetectedChars] = useState<string[]>([]);
  const [sceneData, setSceneData] = useState<FrontendScene[]>([]);
  const [selectedMainChars, setSelectedMainChars] = useState<string[]>([]);

  // 파일 업로드 → 분석 요청
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setFileName(file.name);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('NEXT_PUBLIC_API_URL이 비어있습니다. .env 확인 후 dev 서버 재시작하세요.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('서버 응답 실패', {
          status: response.status,
          statusText: response.statusText,
          bodyPreview: text.slice(0, 300),
        });
        throw new Error(`서버 에러: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setRawBackendData(result.data as BackendScene[]);
        const charsFromMeta = result.meta?.all_detected_characters || [];
        setAllDetectedChars(charsFromMeta);
        setShowCharModal(true);
      } else {
        console.error('응답은 200인데 status가 success가 아님', result);
        throw new Error(result.message || '분석 데이터가 비어있습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('분석 실패! 서버 상태를 확인하세요.');
    } finally {
      setIsUploading(false);
    }
  };

  // 백엔드 raw → 프론트 table 형태로 변환
  const transformData = (rawData: BackendScene[], mainChars: string[]): FrontendScene[] => {
    return rawData.map((item) => {
      const charMap: { [key: string]: boolean } = {};
      const extrasInScene: string[] = [];
      const currentSceneChars = item.characters || [];

      // 메인 캐릭터 O/X
      mainChars.forEach((mainChar) => {
        const isPresent = currentSceneChars.some((c) => c.includes(mainChar));
        charMap[mainChar] = isPresent;
      });

      // 메인 아닌 인물은 extras 후보로
      currentSceneChars.forEach((char) => {
        const isMain = mainChars.some((main) => char.includes(main));
        if (!isMain) extrasInScene.push(char);
      });

      // extras 합치기 (인물 + 기존 extras)
      let finalExtras = item.extras || '';
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
        extras: finalExtras,
      };
    });
  };

  // 인물 선택 완료
  const handleCharacterSelection = (selectedChars: string[]) => {
    setSelectedMainChars(selectedChars);
    const formatted = transformData(rawBackendData, selectedChars);
    setSceneData(formatted);
    setHasData(true);
    setShowCharModal(false);
  };

  // PreviewPanel에서 셀 수정
  const handleSceneUpdate = (index: number, field: keyof FrontendScene | string, value: any) => {
    const newData = [...sceneData];

    // 캐릭터(O/X) 수정
    if (selectedMainChars.includes(field as string)) {
      newData[index].characters = {
        ...newData[index].characters,
        [field as string]: value, // boolean
      };
    } else {
      // 일반 텍스트 수정
      (newData[index] as any)[field] = value;
    }

    setSceneData(newData);
  };

  // 엑셀 다운로드
  const handleDownloadExcel = async () => {
    if (!sceneData.length) return;

    setShowDownloadModal(true);

    try {
      await buildSceneListExcel(sceneData, selectedMainChars, fileName);
    } catch (e) {
      console.error(e);
      alert('엑셀 생성 실패! 템플릿 경로/형식을 확인하세요.');
    } finally {
      setShowDownloadModal(false);
    }
  };

  return (
    <div className="h-screen bg-neutral-900 text-neutral-100 flex overflow-hidden relative">
      <DownloadModal isOpen={showDownloadModal} onClose={() => setShowDownloadModal(false)} />

      <CharacterSelectModal
        isOpen={showCharModal}
        allCharacters={allDetectedChars}
        onConfirm={handleCharacterSelection}
        onClose={() => setShowCharModal(false)}
      />

      <UploadPanel
        hasData={hasData}
        isUploading={isUploading}
        fileName={fileName}
        onFileSelect={handleFileUpload}
      />

      <PreviewPanel
        hasData={hasData}
        data={sceneData}
        columns={selectedMainChars}
        onDownload={handleDownloadExcel}
        onUpdate={handleSceneUpdate}
      />
    </div>
  );
}
