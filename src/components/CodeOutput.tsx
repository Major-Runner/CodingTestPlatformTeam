'use client';

import { useState, useEffect } from 'react';

interface CodeOutputProps {
  isVisible: boolean;
  output: string[];
  result: any;
  executionTime: number;
  success: boolean;
  onClose: () => void;
}

/**
 * 코드 실행 결과를 표시하는 컴포넌트
 */
export default function CodeOutput({ 
  isVisible, 
  output, 
  result, 
  executionTime, 
  success, 
  onClose 
}: CodeOutputProps) {
  const [isRendered, setIsRendered] = useState(false);
  
  // 애니메이션을 위한 상태 관리
  useEffect(() => {
    if (isVisible) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 300); // 애니메이션 시간과 일치시켜야 함
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]);
  
  if (!isRendered) {
    return null;
  }
  
  return (
    <div className={`fixed bottom-0 right-0 left-0 bg-gray-900 border-t border-teal-600 text-white 
      transition-all duration-300 ease-in-out h-64 
      ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="flex justify-between items-center bg-teal-900 px-4 py-2 border-b border-teal-600">
        <h3 className="font-bold text-lg">코드 실행 결과</h3>
        <div className="flex items-center">
          <span className={`px-2 py-0.5 rounded text-xs mr-2 ${success ? 'bg-green-600' : 'bg-red-600'}`}>
            {success ? '성공' : '실패'}
          </span>
          <span className="text-xs text-gray-300 mr-4">
            실행 시간: {executionTime.toFixed(2)}ms
          </span>
          <button 
            onClick={onClose}
            className="bg-teal-800 hover:bg-teal-700 text-white p-1 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex flex-col h-[calc(100%-40px)]">
        {/* 출력 결과 */}
        <div className="flex-1 overflow-auto p-3 font-mono text-sm bg-black">
          {output.length > 0 ? (
            output.map((line, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500 mr-2">{index + 1}:</span>
                <span>{line}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500">출력 없음</div>
          )}
        </div>
        
        {/* 결과 정보 */}
        <div className={`p-3 ${success ? 'bg-teal-900' : 'bg-red-900'} font-mono text-sm`}>
          <strong>결과:</strong> {typeof result === 'object' ? JSON.stringify(result) : String(result)}
        </div>
      </div>
    </div>
  );
} 