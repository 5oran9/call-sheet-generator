// components/PreviewPanel.tsx
'use client';
import { Download, FileText, Edit2 } from 'lucide-react';
import { FrontendScene } from '@/app/page';

interface PreviewPanelProps {
  hasData: boolean;
  data: FrontendScene[];
  columns: string[];
  onDownload: () => void;
  // [5] 데이터 수정 함수 타입 정의
  onUpdate: (index: number, field: string, value: any) => void;
}

export default function PreviewPanel({ hasData, data, columns, onDownload, onUpdate }: PreviewPanelProps) {

  return (
    // [4] flex-col, h-full로 높이 고정
    <div className={`flex flex-col bg-neutral-950 border-l border-neutral-800 transition-all duration-700 ease-in-out h-full ${hasData ? 'w-[70%]' : 'w-[50%]'}`}>
      
      {/* 헤더 (고정) */}
      <div className="h-20 shrink-0 flex items-center justify-between px-8 border-b border-neutral-800 bg-neutral-950">
        <div>
          <h2 className="text-xl font-bold text-white mb-0.5">씬 리스트 미리보기</h2>
          <p className="text-sm text-neutral-500 flex items-center gap-1">
             <Edit2 className="w-3 h-3"/>  내용을 클릭하여 수정 가능합니다.
          </p>
        </div>
        
        {hasData && (
          <div className="flex items-center gap-4 animate-fade-in">
            <span className="px-3 py-1 bg-neutral-800 text-neutral-300 text-xs font-medium rounded-full border border-neutral-700">
              {data.length} Scenes
            </span>
            <button
              onClick={onDownload}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-green-900/20"
            >
              <Download className="w-4 h-4" />
              엑셀 다운로드
            </button>
          </div>
        )}
      </div>

      {/* 컨텐츠 영역 (여기만 스크롤 됨) */}
      <div className="flex-1 overflow-hidden relative bg-neutral-900">
        {!hasData ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/50">
            <div className="text-center p-8 opacity-50">
              <div className="w-32 h-32 mx-auto mb-6 rounded-2xl bg-neutral-900 border-2 border-dashed border-neutral-800 flex items-center justify-center">
                <FileText className="w-10 h-10 text-neutral-700" />
              </div>
              <h3 className="text-xl text-neutral-300 font-medium mb-2">데이터 없음</h3>
              <p className="text-neutral-500">좌측에서 파일을 업로드해주세요.</p>
            </div>
          </div>
        ) : (
          // [4] overflow-y-auto 적용
          <div className="h-full overflow-y-auto custom-scrollbar p-6 animate-fade-in">
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-[#1a1a1a] shadow-sm">
                      <th className="border-b border-r border-neutral-800 px-3 py-3 text-left text-xs font-bold text-neutral-400 w-14 sticky left-0 bg-[#1a1a1a]">S#</th>
                      <th className="border-b border-r border-neutral-800 px-2 py-3 text-left text-xs font-bold text-neutral-400 min-w-[120px]">장소</th>
                      <th className="border-b border-r border-neutral-800 px-1 py-3 text-center text-xs font-bold text-neutral-400 w-14">D/N</th>
                      <th className="border-b border-r border-neutral-800 px-1 py-3 text-center text-xs font-bold text-neutral-400 w-14">I/E</th>
                      <th className="border-b border-r border-neutral-800 px-3 py-3 text-left text-xs font-bold text-neutral-400 min-w-[300px]">요약</th>
                      
                      {columns.map((name) => (
                        <th key={name} className="border-b border-r border-neutral-800 px-1 py-3 text-center text-xs font-bold text-green-500 w-16 bg-[#202020] whitespace-nowrap">
                          {name}
                        </th>
                      ))}
                      
                      <th className="border-b border-neutral-800 px-3 py-3 text-center text-xs font-bold text-neutral-400 min-w-[150px]">비고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {data.map((scene, idx) => (
                      <tr key={idx} className="hover:bg-neutral-800/40 transition-colors group">
                        {/* S# (수정 불가) */}
                        <td className="border-r border-neutral-800 px-3 py-3 text-neutral-400 font-bold bg-neutral-900 group-hover:bg-neutral-800/40 sticky left-0 z-10 text-center">
                            {scene.scene}
                        </td>

                        {/* 장소 (수정 가능) */}
                        <td className="border-r border-neutral-800 p-0">
                            <input 
                                type="text"
                                value={scene.location}
                                onChange={(e) => onUpdate(idx, 'location', e.target.value)}
                                className="w-full h-full px-3 py-3 bg-transparent text-neutral-300 focus:bg-neutral-800 focus:text-white outline-none"
                            />
                        </td>

                        {/* D/N (수정 가능) */}
                        <td className="border-r border-neutral-800 p-0">
                             <input 
                                type="text"
                                value={scene.dn}
                                onChange={(e) => onUpdate(idx, 'dn', e.target.value)}
                                className="w-full h-full text-center bg-transparent text-neutral-400 focus:bg-neutral-800 focus:text-white outline-none"
                            />
                        </td>

                        {/* I/E (수정 가능) */}
                        <td className="border-r border-neutral-800 p-0">
                             <input 
                                type="text"
                                value={scene.ie}
                                onChange={(e) => onUpdate(idx, 'ie', e.target.value)}
                                className="w-full h-full text-center bg-transparent text-neutral-400 focus:bg-neutral-800 focus:text-white outline-none"
                            />
                        </td>

                        {/* 요약 (Textarea로 수정 가능) */}
                        <td className="border-r border-neutral-800 p-0">
                            <textarea 
                                value={scene.summary}
                                onChange={(e) => onUpdate(idx, 'summary', e.target.value)}
                                className="w-full h-full px-3 py-3 bg-transparent text-neutral-300 text-sm leading-relaxed focus:bg-neutral-800 focus:text-white outline-none resize-none min-h-[60px]"
                            />
                        </td>
                        
                        {/* 캐릭터 O/X (클릭하여 토글) */}
                        {columns.map((name) => (
                          <td 
                            key={name} 
                            onClick={() => onUpdate(idx, name, !scene.characters[name])} // 클릭 시 반전
                            className="border-r border-neutral-800 px-1 py-3 text-center bg-neutral-900/50 cursor-pointer hover:bg-neutral-800 transition-colors"
                          >
                            {scene.characters[name] && (
                              <div className="flex justify-center pointer-events-none">
                                <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                              </div>
                            )}
                          </td>
                        ))}
                        
                        {/* 비고 (수정 가능) */}
                        <td className="p-0">
                             <input 
                                type="text"
                                value={scene.extras}
                                onChange={(e) => onUpdate(idx, 'extras', e.target.value)}
                                className="w-full h-full px-3 py-3 bg-transparent text-neutral-500 text-xs text-center focus:bg-neutral-800 focus:text-neutral-300 outline-none"
                            />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};