// 실행 결과 인터페이스
export interface ExecutionResult {
  success: boolean;
  result: any;
  output: string[];
  executionTime: number;
}

/**
 * 코드 실행기 클래스
 * 서버 API를 호출하여 다양한 프로그래밍 언어 코드를 실행합니다.
 */
export class CodeExecutor {
  /**
   * API를 호출하여 코드를 실행합니다.
   * @param code 실행할 코드
   * @param language 프로그래밍 언어
   * @returns 실행 결과
   */
  private static async executeViaAPI(code: string, language: string): Promise<ExecutionResult> {
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, language })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.result || '서버 오류가 발생했습니다.');
      }

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        result: error.message || '서버와 통신 중 오류가 발생했습니다.',
        output: [],
        executionTime: 0
      };
    }
  }

  /**
   * JavaScript 코드를 실행합니다.
   * @param code 실행할 JavaScript 코드
   * @returns 실행 결과
   */
  static async executeJavaScript(code: string): Promise<ExecutionResult> {
    return this.executeViaAPI(code, 'javascript');
  }

  /**
   * Python 코드를 실행합니다.
   * @param code 실행할 Python 코드
   * @returns 실행 결과
   */
  static async executePython(code: string): Promise<ExecutionResult> {
    return this.executeViaAPI(code, 'python');
  }

  /**
   * Java 코드를 실행합니다.
   * @param code 실행할 Java 코드
   * @returns 실행 결과
   */
  static async executeJava(code: string): Promise<ExecutionResult> {
    return this.executeViaAPI(code, 'java');
  }

  /**
   * C++ 코드를 실행합니다.
   * @param code 실행할 C++ 코드
   * @returns 실행 결과
   */
  static async executeCpp(code: string): Promise<ExecutionResult> {
    return this.executeViaAPI(code, 'cpp');
  }
}
