// components/UploadPanel.tsx
'use client';
import { useState } from 'react';
import { FileText, Loader2, Film, CheckCircle } from 'lucide-react';

interface UploadPanelProps {
  hasData: boolean;
  isUploading: boolean;
  fileName: string; // [3] 파일명 props 추가
  onFileSelect: (file: File) => void;
}

export default function UploadPanel({ hasData, isUploading, fileName, onFileSelect }: UploadPanelProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className={`flex flex-col border-r border-neutral-800 transition-all duration-700 ease-in-out h-full ${hasData ? 'w-[30%]' : 'w-[50%]'}`}>
      <div className="h-20 shrink-0 flex flex-col justify-center px-8 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Film className="w-3.5 h-3.5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white mb-0.5">AI SceneList</h1>
        </div>
        <p className="text-sm text-neutral-500 pl-1">시나리오를 업로드하면 씬 리스트가 생성됩니다.</p>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-900 relative">
        <div className={`w-full transition-all duration-500 ${hasData ? 'max-w-[280px]' : 'max-w-md'}`}>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 group
              ${dragActive 
                ? 'border-blue-500 bg-blue-500/10 scale-105' 
                : 'border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800/30'
              } 
              ${isUploading ? 'pointer-events-none' : ''}
              ${hasData ? 'py-6 border-green-500/30 bg-green-500/5' : ''}
            `}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isUploading}
            />
            
            <div className="flex flex-col items-center gap-4">
              {isUploading ? (
                <div className="py-4">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3 mx-auto" />
                  <div>
                    <p className="text-base font-semibold text-white">AI 분석 중...</p>
                    <p className="text-xs text-neutral-400 mt-1">잠시만 기다려주세요</p>
                  </div>
                </div>
              ) : hasData ? (
                 /* [3] 분석 완료 시 파일명 표시 */
                 <div className="py-2">
                    <CheckCircle className="w-10 h-10 text-green-500 mb-3 mx-auto" />
                    <p className="text-sm text-neutral-300 font-medium truncate max-w-[200px] mx-auto">{fileName}</p>
                    <p className="text-xs text-green-500 mt-1">분석 완료</p>
                    <div className="mt-4 px-4 py-2 bg-neutral-800 rounded text-xs text-neutral-400">
                        다른 파일을 업로드하려면 <br/>
                        드래그하거나 클릭하세요
                    </div>
                 </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-700 transition-colors">
                    <FileText className="w-7 h-7 text-neutral-400 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white mb-1">시나리오 업로드</p>
                    <p className="text-xs text-neutral-400">드래그 또는 클릭하여 업로드</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};