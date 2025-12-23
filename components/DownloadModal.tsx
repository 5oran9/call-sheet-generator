// components/DownloadModal.tsx

'use client';
import { CheckCircle, X } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-800 border border-neutral-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative transform transition-all scale-100 animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">다운로드 시작</h3>
          <p className="text-sm text-neutral-400 mb-6">
            엑셀 파일 변환이 시작되었습니다.<br/>
            잠시만 기다려주세요.
          </p>
          
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};