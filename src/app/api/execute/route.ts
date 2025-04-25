import { NextRequest, NextResponse } from 'next/server';
import { ServerExecutor } from '@/lib/server-executor';

/**
 * 코드 실행 API 엔드포인트
 * POST 메서드로 요청을 받아 서버에서 코드를 실행하고 결과를 반환합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const { code, language } = await request.json();

    // 필수 파라미터 검증
    if (!code || !language) {
      return NextResponse.json(
        { 
          success: false, 
          result: '코드와 언어를 모두 제공해야 합니다.',
          output: [],
          executionTime: 0
        },
        { status: 400 }
      );
    }

    // 언어별 코드 실행
    let executionResult;
    
    switch (language) {
      case 'javascript':
        executionResult = await ServerExecutor.executeJavaScript(code);
        break;
      
      case 'python':
        executionResult = await ServerExecutor.executePython(code);
        break;
      
      case 'java':
        executionResult = await ServerExecutor.executeJava(code);
        break;
      
      case 'cpp':
        executionResult = await ServerExecutor.executeCpp(code);
        break;
      
      default:
        return NextResponse.json(
          { 
            success: false, 
            result: '지원되지 않는 언어입니다.',
            output: [],
            executionTime: 0
          },
          { status: 400 }
        );
    }

    // 응답 반환
    return NextResponse.json(executionResult);
    
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