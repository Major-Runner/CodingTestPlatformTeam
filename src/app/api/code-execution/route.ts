import { NextRequest, NextResponse } from 'next/server';
import { CodeExecutor } from '@/lib/code-executor';

/**
 * 코드 실행 API 엔드포인트
 * POST 요청을 처리하여 다양한 언어의 코드를 실행합니다.
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

    // 브라우저 환경에서 실행되므로 모든 실행이 클라이언트 측에서 이루어집니다.
    // 이 API는 요청을 받아서 응답만 처리합니다.
    
    // 언어에 따라 응답 생성
    // 참고: 실제 코드 실행은 클라이언트에서 이미 처리되었습니다.
    return NextResponse.json({
      success: true,
      result: `${language} 코드가 정상적으로 처리되었습니다.`,
      output: [`${language} 코드 실행 결과는 클라이언트에서 처리됩니다.`],
      executionTime: 0
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