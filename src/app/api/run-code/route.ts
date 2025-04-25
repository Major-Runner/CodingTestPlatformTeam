import { NextRequest, NextResponse } from 'next/server';

// 코드 실행 시 제한 시간 (밀리초)
const EXECUTION_TIMEOUT = 5000;

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const { code, language, input } = await request.json();

    // 필수 파라미터 검증
    if (!code || !language) {
      return NextResponse.json(
        { success: false, result: '코드와 언어를 모두 제공해야 합니다.' },
        { status: 400 }
      );
    }

    // 시작 시간 기록
    const startTime = performance.now();
    let result: any = null;
    let output: string[] = [];
    let success = false;

    // 언어별 코드 실행
    switch (language) {
      case 'javascript':
        // JavaScript 코드 실행
        try {
          const executionResult = await executeJavaScript(code);
          result = executionResult.result;
          output = executionResult.output;
          success = executionResult.success;
        } catch (error: any) {
          result = `실행 오류: ${error.message}`;
          success = false;
        }
        break;
      
      case 'python':
      case 'java':
      case 'cpp':
        // 다른 언어 지원은 아직 구현되지 않음
        return NextResponse.json({
          success: false,
          result: `${language} 언어는 현재 지원되지 않습니다. 백엔드에 해당 언어 실행 환경 구성이 필요합니다.`,
          output: [],
          executionTime: 0
        });
      
      default:
        return NextResponse.json(
          { success: false, result: '지원되지 않는 언어입니다.' },
          { status: 400 }
        );
    }

    // 소요 시간 계산
    const executionTime = performance.now() - startTime;

    // 응답 반환
    return NextResponse.json({
      success,
      result,
      output,
      executionTime
    });
  } catch (error: any) {
    // 오류 처리
    return NextResponse.json(
      { 
        success: false, 
        result: `서버 오류: ${error.message || '알 수 없는 오류'}`,
        output: [],
        executionTime: 0
      },
      { status: 500 }
    );
  }
}

/**
 * JavaScript 코드 실행하는 함수
 */
async function executeJavaScript(code: string) {
  let output: string[] = [];
  let result: any = null;
  let success = false;

  // 콘솔 출력을 캡처하기 위한 원본 console.log 저장
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  try {
    // 콘솔 출력 캡처를 위한 래핑
    console.log = (...args) => {
      output.push(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '));
      originalConsoleLog(...args);
    };
    
    console.error = (...args) => {
      output.push(`[ERROR]: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}`);
      originalConsoleError(...args);
    };
    
    console.warn = (...args) => {
      output.push(`[WARN]: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}`);
      originalConsoleWarn(...args);
    };
    
    console.info = (...args) => {
      output.push(`[INFO]: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}`);
      originalConsoleInfo(...args);
    };

    // 사용자 코드에 타임아웃 처리 및 출력 캡처 로직 추가
    const wrappedCode = `
      // 사용자 코드 시작
      ${code}
      // 사용자 코드 종료
    `;
    
    // 비동기 코드 실행 함수 생성 (async/await 지원)
    const asyncFn = new Function(`
      return (async () => {
        try {
          ${wrappedCode}
        } catch (error) {
          return { error: error.message || '코드 실행 중 오류가 발생했습니다.' };
        }
      })();
    `);
    
    // 타임아웃 프로미스
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('코드 실행 시간이 초과되었습니다.')), EXECUTION_TIMEOUT);
    });
    
    // 코드 실행 또는 타임아웃 중 먼저 완료되는 것 처리
    result = await Promise.race([asyncFn(), timeoutPromise]);
    
    // 오류 객체 확인
    if (result && typeof result === 'object' && 'error' in result) {
      success = false;
      result = result.error;
    } else {
      success = true;
    }
  } catch (error: any) {
    // 코드 실행 중 오류 발생
    result = error.message || '코드 실행 중 오류가 발생했습니다.';
    success = false;
  } finally {
    // 원래 콘솔 메서드 복원
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
  }

  return { result, output, success };
} 