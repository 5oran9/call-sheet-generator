// components/CharacterSelectModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Users, Check, X } from 'lucide-react';

interface CharacterSelectModalProps {
  isOpen: boolean;
  allCharacters: string[]; // 서버에서 받은 전체 인물 리스트 (이미 '빈도순'으로 정렬되어 들어오게 될 것)
  onConfirm: (selected: string[]) => void;
  onClose: () => void;
}

export default function CharacterSelectModal({
  isOpen,
  allCharacters,
  onConfirm,
  onClose,
}: CharacterSelectModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 모달 열릴 때: 자동 선택 없음
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set());
    }
  }, [isOpen]);

  const toggleChar = (char: string) => {
    const next = new Set(selected);
    if (next.has(char)) next.delete(char);
    else next.add(char);
    setSelected(next);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
  };

  const handleClearAll = () => {
    setSelected(new Set());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-800 border border-neutral-700 rounded-2xl shadow-2xl max-w-2xl w-full p-6 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">주요 등장인물 선택</h2>
              <p className="text-sm text-neutral-400">
                테이블에 표시할 인물을 선택해주세요. (나머지는 비고란에 표기됨)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors" type="button">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 컨트롤 바 */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-sm text-neutral-500">{selected.size}명 선택됨</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAll}
              className="px-3 py-2 text-sm rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 hover:border-neutral-500 transition-colors"
              type="button"
            >
              전체 선택 해제
            </button>
          </div>
        </div>

        {/* 체크박스 영역 (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allCharacters.map((char) => (
              <label
                key={char}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                  ${selected.has(char)
                    ? 'bg-blue-600/10 border-blue-500/50'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'}
                `}
              >
                <div
                  className={`
                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                    ${selected.has(char) ? 'bg-blue-500 border-blue-500' : 'border-neutral-600'}
                  `}
                >
                  {selected.has(char) && <Check className="w-3 h-3 text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selected.has(char)}
                  onChange={() => toggleChar(char)}
                />
                <span className={`text-sm font-medium ${selected.has(char) ? 'text-white' : 'text-neutral-400'}`}>
                  {char}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-700">
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-colors"
            type="button"
          >
            선택 완료 및 분석 보기
          </button>
        </div>
      </div>
    </div>
  );
}
