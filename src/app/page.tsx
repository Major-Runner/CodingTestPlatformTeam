'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import CodeOutput from '@/components/CodeOutput'
import { CodeExecutor } from '@/lib/code-executor'

export default function Home() {
  // 지원하는 프로그래밍 언어 정의
  const supportedLanguages = [
    { id: 'javascript', name: 'JavaScript', template: `// JavaScript 코드를 작성하세요
function solution() {
  // 여기에 코드를 작성하세요
  console.log('Hello, World!');
  return 42;
}

// 함수 실행
solution();` },
    { id: 'python', name: 'Python', template: `# Python 코드를 작성하세요
def solution():
    # 여기에 코드를 작성하세요
    print('Hello, World!')
    return 42

# 함수 실행
solution()` },
    { id: 'java', name: 'Java', template: `// Java 코드를 작성하세요
public class Solution {
    public static void main(String[] args) {
        // 여기에 코드를 작성하세요
        System.out.println("Hello, World!");
    }
}` },
    { id: 'cpp', name: 'C++', template: `// C++ 코드를 작성하세요
#include <iostream>

int main() {
    // 여기에 코드를 작성하세요
    std::cout << "Hello, World!" << std::endl;
    return 0;
}` }
  ]
  
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [text, setText] = useState(supportedLanguages.find(lang => lang.id === 'javascript')?.template || '')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [wpm, setWpm] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [competitors, setCompetitors] = useState([
    { id: 1, name: 'Bot 1', wpm: 24, progress: 0 },
    { id: 2, name: 'Bot 2', wpm: 26, progress: 0 }
  ])
  const [userProgress, setUserProgress] = useState(0)
  const [showRaceTrack, setShowRaceTrack] = useState(true)
  const [userTypedCharCount, setUserTypedCharCount] = useState(0)
  const [initialTemplate, setInitialTemplate] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // 코드 실행 결과 상태
  const [codeOutput, setCodeOutput] = useState<{
    isVisible: boolean;
    output: string[];
    result: any;
    executionTime: number;
    success: boolean;
    isLoading: boolean;
  }>({
    isVisible: false,
    output: [],
    result: null,
    executionTime: 0,
    success: false,
    isLoading: false
  })
  
  // 알고리즘 문제
  const algorithmProblem = {
    title: "두 수의 합 찾기",
    description: `정수 배열 nums와 정수 target이 주어지면, 배열에서 두 수의 합이 target이 되는 인덱스를 반환하세요.
    
예시:
입력: nums = [2, 7, 11, 15], target = 9
출력: [0, 1] (nums[0] + nums[1] = 2 + 7 = 9)

입력: nums = [3, 2, 4], target = 6
출력: [1, 2] (nums[1] + nums[2] = 2 + 4 = 6)

조건:
- 정확히 하나의 솔루션이 존재합니다.
- 같은 요소를 두 번 사용할 수 없습니다.
- 답은 어떤 순서로든 반환할 수 있습니다.`,
    difficulty: "쉬움",
    example: `function twoSum(nums, target) {
  // 코드를 작성하세요
}`
  }

  // 타자 속도 계산
  const calculateWpm = (text: string, seconds: number) => {
    const words = text.length / 5 // 평균 단어 길이를 5자로 가정
    const minutes = seconds / 60
    return Math.round(words / minutes)
  }

  // 텍스트 변경 핸들러
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    
    // 현재 선택된 언어의 템플릿 코드 가져오기
    const currentTemplate = supportedLanguages.find(lang => lang.id === selectedLanguage)?.template || ''
    
    // 초기 템플릿 코드 설정 (첫 실행 시)
    if (initialTemplate === '') {
      setInitialTemplate(currentTemplate)
    }
    
    // 타이머 시작 - 템플릿 코드와 다를 때
    if (!startTime && newText !== currentTemplate) {
      setStartTime(Date.now())
      // 실제 타이핑한 글자 수 초기화
      setUserTypedCharCount(1) // 첫 글자 입력
    } else if (startTime && newText !== currentTemplate) {
      // 이전 텍스트와 현재 텍스트의 길이 차이로 타이핑 수 변경 추정
      // 간단한 구현을 위해 길이 증가만 카운트
      const prevText = text
      if (newText.length > prevText.length) {
        setUserTypedCharCount(prev => prev + (newText.length - prevText.length))
      }
    }
    
    // 진행도 업데이트 (예상 코드 길이를 300자로 가정하지만 실제 타이핑한 글자 수 기준)
    const progress = Math.min(100, (userTypedCharCount / 300) * 100)
    setUserProgress(progress)
    
    // 진행 중인 타자 속도 계산
    if (startTime) {
      const currentTime = Date.now()
      const timeInSeconds = (currentTime - startTime) / 1000
      if (timeInSeconds > 0) {
        // 실제 타이핑한 글자 수 기준으로 WPM 계산
        const currentWpm = calculateWpm(userTypedCharCount.toString(), timeInSeconds)
        setWpm(currentWpm)
      }
    }
  }
  
  // 언어 변경 핸들러
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value
    // 현재 작업 중인 코드가 있을 경우 확인
    const currentTemplate = supportedLanguages.find(lang => lang.id === selectedLanguage)?.template || ''
    if (text.trim() && text !== currentTemplate) {
      if (window.confirm('언어를 변경하면 현재 작성 중인 코드가 초기화됩니다. 계속하시겠습니까?')) {
        setSelectedLanguage(newLanguage)
        // 새 언어의 템플릿으로 코드 초기화
        const newTemplate = supportedLanguages.find(lang => lang.id === newLanguage)?.template || ''
        setText(newTemplate)
        // 초기 템플릿 업데이트
        setInitialTemplate(newTemplate)
        // 타이핑 카운트 및 진행도 초기화
        setUserTypedCharCount(0)
        setUserProgress(0)
      }
    } else {
      setSelectedLanguage(newLanguage)
      const newTemplate = supportedLanguages.find(lang => lang.id === newLanguage)?.template || ''
      setText(newTemplate)
      // 초기 템플릿 업데이트
      setInitialTemplate(newTemplate)
      // 타이핑 카운트 및 진행도 초기화
      setUserTypedCharCount(0)
      setUserProgress(0)
    }
  }

  // 봇 경쟁자들의 진행도를 시뮬레이션
  useEffect(() => {
    if (!startTime) return
    
    const interval = setInterval(() => {
      setCompetitors(prev => 
        prev.map(competitor => ({
          ...competitor,
          progress: Math.min(100, competitor.progress + (competitor.wpm / 60) * 2)
        }))
      )
    }, 1000)
    
    return () => clearInterval(interval)
  }, [startTime])

  // 게임 재시작
  const resetGame = () => {
    // 확인 대화상자 표시
    if (window.confirm('정말 리셋하시겠습니까?')) {
      const currentTemplate = supportedLanguages.find(lang => lang.id === selectedLanguage)?.template || ''
      setText(currentTemplate)
      setStartTime(null)
      setWpm(0)
      setIsCompleted(false)
      setUserProgress(0)
      setUserTypedCharCount(0)
      setInitialTemplate(currentTemplate)
      setCompetitors([
        { id: 1, name: 'Bot 1', wpm: 24, progress: 0 },
        { id: 2, name: 'Bot 2', wpm: 26, progress: 0 }
      ])
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }
  
  // 코드 실행 핸들러
  const runCode = async () => {
    if (text.trim().length === 0) {
      alert('코드를 입력해주세요.');
      return;
    }
    
    // 로딩 상태로 변경
    setCodeOutput(prev => ({
      ...prev,
      isVisible: true,
      isLoading: true,
      output: ['코드 실행 중...'],
      result: '실행 중...'
    }))
    
    try {
      // 클라이언트에서 직접 코드 실행
      let executionResult;
      
      switch (selectedLanguage) {
        case 'javascript':
          executionResult = await CodeExecutor.executeJavaScript(text);
          break;
        case 'python':
          executionResult = await CodeExecutor.executePython(text);
          break;
        case 'java':
          executionResult = await CodeExecutor.executeJava(text);
          break;
        case 'cpp':
          executionResult = await CodeExecutor.executeCpp(text);
          break;
        default:
          throw new Error('지원되지 않는 언어입니다.');
      }
      
      // 결과 표시
      setCodeOutput({
        isVisible: true,
        output: executionResult.output || [],
        result: executionResult.result,
        executionTime: executionResult.executionTime || 0,
        success: executionResult.success,
        isLoading: false
      });
    } catch (error: any) {
      // 오류 처리
      setCodeOutput({
        isVisible: true,
        output: [],
        result: `오류: ${error.message || '알 수 없는 오류'}`,
        executionTime: 0,
        success: false,
        isLoading: false
      });
    }
  }
  
  // 코드 출력 닫기
  const closeCodeOutput = () => {
    setCodeOutput(prev => ({
      ...prev,
      isVisible: false
    }));
  }
  
  // 레이싱 트랙 토글
  const toggleRaceTrack = () => {
    setShowRaceTrack(prev => !prev)
  }
  
  // 코드 제출 핸들러
  const handleSubmit = () => {
    if (text.trim().length === 0) {
      alert('코드를 입력해주세요.');
      return;
    }
    
    // 여기서 실제로는 코드 평가 로직이 구현되어야 함
    alert('코드가 제출되었습니다!');
    setIsCompleted(true);
  }
  
  // 새로운 문제 선택
  const handleNextProblem = () => {
    if (text && !isCompleted) {
      if (!window.confirm('현재 작업 중인 코드가 있습니다. 다른 문제로 이동하시겠습니까?')) {
        return;
      }
    }
    
    // 여기서 실제로는 새 문제를 가져오는 로직이 구현되어야 함
    alert('새로운 문제 페이지로 이동합니다.');
  }

  return (
    <div className="min-h-screen bg-teal-700 text-white flex flex-col">
      {/* 헤더 영역 */}
      <header className="bg-teal-900 border-b border-teal-600 py-2 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">코드 레이서</h1>
            <div className="ml-4 bg-teal-800 px-2 py-0.5 rounded text-xs">
              난이도: <span className="font-bold text-green-300">{algorithmProblem.difficulty}</span>
            </div>
          </div>
          <button 
            onClick={handleNextProblem}
            className="text-sm bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded-md transition"
          >
            다른 문제 풀어보기 →
          </button>
        </div>
      </header>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 grid grid-cols-2">
        {/* 왼쪽 영역 - 알고리즘 문제 */}
        <div className="border-r border-teal-600 p-4 overflow-auto">
          <h1 className="text-2xl font-bold mb-3">{algorithmProblem.title}</h1>
          <div className="text-sm whitespace-pre-wrap bg-teal-800 p-4 rounded-lg mb-4">
            {algorithmProblem.description}
          </div>
          
          {/* 문제 설명 추가 정보 */}
          <div className="mt-4 text-sm text-teal-300">
            <p className="mb-2">💡 힌트: 해시 맵(객체)을 사용하면 더 효율적으로 풀 수 있습니다.</p>
            <p>⏱️ 시간 복잡도: O(n) 솔루션을 찾아보세요.</p>
          </div>
        </div>
        
        {/* 오른쪽 영역 - 상단 레이싱 트랙, 하단 코드 입력 */}
        <div className="flex flex-col">
          {/* 상단 - 레이싱 트랙 (토글 가능) */}
          {showRaceTrack && (
            <div className="border-b border-teal-600 p-4 h-48">
              <header className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold">레이싱 트랙</h2>
                <div className="flex items-center">
                  <span className="text-lg mr-2">{wpm} WPM</span>
                  <button 
                    onClick={toggleRaceTrack}
                    className="text-xs bg-teal-600 hover:bg-teal-500 px-2 py-1 rounded-md flex items-center text-teal-100"
                    title="레이싱 트랙 숨기기"
                  >
                    <span>🔼</span>
                  </button>
                </div>
              </header>
              
              {/* 레이싱 트랙 영역 */}
              <div className="overflow-y-auto">
                {/* 사용자 트랙 */}
                <div className="flex items-center mb-2">
                  <div className="w-20 text-sm">
                    <div>사용자</div>
                  </div>
                  <div className="flex-1 h-8 bg-teal-800 relative">
                    <div 
                      className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${userProgress}%` }}
                    >
                      <div className="absolute -right-3 top-0 w-6 h-8">
                        🚙
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm">{wpm} wpm</div>
                </div>
                
                {/* 경쟁자 트랙 */}
                {competitors.map(competitor => (
                  <div key={competitor.id} className="flex items-center mb-2">
                    <div className="w-20 text-sm">{competitor.name}</div>
                    <div className="flex-1 h-8 bg-teal-800 relative">
                      <div 
                        className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${competitor.progress}%` }}
                      >
                        <div className="absolute -right-3 top-0 w-6 h-8">
                          🚗
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm">{competitor.wpm} wpm</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 레이싱 트랙이 숨겨졌을 때 보여줄 헤더 */}
          {!showRaceTrack && (
            <div className="border-b border-teal-600 p-2 flex justify-between items-center">
              <h2 className="text-lg font-bold">코딩 모드</h2>
              <div className="flex items-center">
                <span className="text-lg mr-2">{wpm} WPM</span>
                <button 
                  onClick={toggleRaceTrack}
                  className="text-xs bg-teal-600 hover:bg-teal-500 px-2 py-1 rounded-md flex items-center text-teal-100"
                  title="레이싱 트랙 보기"
                >
                  <span>🔽</span>
                </button>
              </div>
            </div>
          )}
          
          {/* 하단 - 코드 입력 영역 */}
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">코드 입력</h2>
              <div className="flex items-center">
                <label htmlFor="language-select" className="text-sm mr-2">언어:</label>
                <select
                  id="language-select"
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="bg-teal-800 text-white text-sm border border-teal-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {supportedLanguages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 타자 영역 */}
            <div className="flex-1 bg-teal-800 p-4 rounded-lg shadow-lg flex flex-col">
              <div className="text-xs text-gray-300 mb-2">
                위의 문제를 해결하는 코드를 작성하세요:
              </div>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                className="flex-1 w-full p-3 border border-gray-600 rounded-lg font-mono text-sm bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-auto"
                placeholder={supportedLanguages.find(lang => lang.id === selectedLanguage)?.template}
                disabled={isCompleted}
                style={{ minHeight: "calc(100% - 30px)" }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* 푸터 영역 - 버튼들 */}
      <footer className="bg-teal-900 py-2 px-4 border-t border-teal-600">
        <div className="flex justify-center space-x-4">
          <button
            onClick={resetGame}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 px-4 rounded-md transition text-sm"
          >
            코드 리셋
          </button>
          <button
            onClick={runCode}
            className={`bg-green-600 hover:bg-green-500 text-white font-bold py-1.5 px-4 rounded-md transition text-sm ${codeOutput.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={codeOutput.isLoading}
          >
            {codeOutput.isLoading ? '실행 중...' : '코드 실행'}
          </button>
          <button
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-md transition text-sm"
            disabled={isCompleted}
          >
            코드 제출
          </button>
        </div>
      </footer>
      
      {/* 코드 실행 결과 출력 */}
      <CodeOutput
        isVisible={codeOutput.isVisible}
        output={codeOutput.output}
        result={codeOutput.result}
        executionTime={codeOutput.executionTime}
        success={codeOutput.success}
        onClose={closeCodeOutput}
      />
    </div>
  )
}
