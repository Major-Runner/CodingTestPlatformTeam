import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vm from 'vm';
import { promisify } from 'util';

// promisify exec 함수
const execPromise = promisify(exec);

// 코드 실행 시 제한 시간 (밀리초)
const EXECUTION_TIMEOUT = 5000;

// 실행 결과 인터페이스
export interface ExecutionResult {
  success: boolean;
  result: any;
  output: string[];
  executionTime: number;
}

/**
 * 서버 측 코드 실행기 클래스
 * 다양한 프로그래밍 언어 코드 실행을 지원합니다.
 */
export class ServerExecutor {
  /**
   * JavaScript 코드를 실행합니다.
   * @param code 실행할 JavaScript 코드
   * @returns 실행 결과
   */
  static async executeJavaScript(code: string): Promise<ExecutionResult> {
    const startTime = performance.now();
    let output: string[] = [];
    let result: any = null;
    let success = false;

    // 콘솔 출력을 캡처하기 위한 객체
    const consoleMock = {
      log: (...args: any[]) => {
        const logMessage = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        output.push(logMessage);
      },
      error: (...args: any[]) => {
        const logMessage = `[ERROR]: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')}`;
        output.push(logMessage);
      },
      warn: (...args: any[]) => {
        const logMessage = `[WARN]: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')}`;
        output.push(logMessage);
      },
      info: (...args: any[]) => {
        const logMessage = `[INFO]: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')}`;
        output.push(logMessage);
      }
    };

    try {
      // 샌드박스 컨텍스트 생성
      const context = {
        console: consoleMock,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        process: { env: {} },
      };

      // 코드 실행을 위한 컨텍스트
      const vmContext = vm.createContext(context);
      
      // 타임아웃 설정 및 코드 실행
      const vmScript = new vm.Script(code);
      
      // 스크립트 실행
      const executionPromise = new Promise<any>((resolve, reject) => {
        try {
          const value = vmScript.runInContext(vmContext, { timeout: EXECUTION_TIMEOUT });
          resolve(value);
        } catch (err) {
          reject(err);
        }
      });
      
      // 코드 실행 또는 타임아웃 대기
      result = await executionPromise;
      success = true;
    } catch (error: any) {
      if (error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
        result = '코드 실행 시간이 초과되었습니다.';
      } else {
        result = error.message || '코드 실행 중 오류가 발생했습니다.';
      }
      success = false;
    }

    const executionTime = performance.now() - startTime;

    return {
      success,
      result,
      output,
      executionTime
    };
  }

  /**
   * Python 코드를 실행합니다.
   * @param code 실행할 Python 코드
   * @returns 실행 결과
   */
  static async executePython(code: string): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    try {
      // 임시 디렉토리에 Python 파일 생성
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `python_code_${Date.now()}.py`);
      
      // 파일에 코드 작성
      fs.writeFileSync(tempFile, code);
      
      // Python 실행
      const { stdout, stderr } = await execPromise(`python ${tempFile}`, { 
        timeout: EXECUTION_TIMEOUT 
      });
      
      // 임시 파일 삭제
      fs.unlinkSync(tempFile);
      
      const executionTime = performance.now() - startTime;
      const output = stdout.split('\n').filter(line => line.trim() !== '');
      
      return {
        success: !stderr,
        result: stderr || '실행 완료',
        output,
        executionTime
      };
    } catch (error: any) {
      const executionTime = performance.now() - startTime;
      
      return {
        success: false,
        result: error.message || 'Python 코드 실행 중 오류가 발생했습니다.',
        output: [],
        executionTime
      };
    }
  }

  /**
   * Java 코드를 실행합니다.
   * @param code 실행할 Java 코드
   * @returns 실행 결과
   */
  static async executeJava(code: string): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    try {
      // 클래스 이름 추출 (public class 다음에 오는 이름)
      const classNameMatch = code.match(/public\s+class\s+(\w+)/);
      if (!classNameMatch) {
        return {
          success: false,
          result: 'Java 코드에서 public class 이름을 찾을 수 없습니다.',
          output: [],
          executionTime: 0
        };
      }
      
      const className = classNameMatch[1];
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `${className}.java`);
      
      // 자바 파일 생성
      fs.writeFileSync(tempFilePath, code);
      
      // 컴파일
      await execPromise(`javac ${tempFilePath}`, { timeout: EXECUTION_TIMEOUT });
      
      // 실행
      const { stdout, stderr } = await execPromise(`java -cp ${tempDir} ${className}`, { 
        timeout: EXECUTION_TIMEOUT 
      });
      
      // 파일 정리
      fs.unlinkSync(tempFilePath);
      try {
        fs.unlinkSync(path.join(tempDir, `${className}.class`));
      } catch (err) {
        // 클래스 파일이 없는 경우 무시
      }
      
      const executionTime = performance.now() - startTime;
      const output = stdout.split('\n').filter(line => line.trim() !== '');
      
      return {
        success: !stderr,
        result: stderr || '실행 완료',
        output,
        executionTime
      };
    } catch (error: any) {
      const executionTime = performance.now() - startTime;
      
      return {
        success: false,
        result: error.message || 'Java 코드 실행 중 오류가 발생했습니다.',
        output: [],
        executionTime
      };
    }
  }

  /**
   * C++ 코드를 실행합니다.
   * @param code 실행할 C++ 코드
   * @returns 실행 결과
   */
  static async executeCpp(code: string): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    try {
      const tempDir = os.tmpdir();
      const timestamp = Date.now();
      const tempFilePath = path.join(tempDir, `cpp_code_${timestamp}.cpp`);
      const executablePath = path.join(tempDir, `cpp_code_${timestamp}${os.platform() === 'win32' ? '.exe' : ''}`);
      
      // C++ 소스 파일 생성
      fs.writeFileSync(tempFilePath, code);
      
      // 컴파일
      await execPromise(`g++ ${tempFilePath} -o ${executablePath}`, { 
        timeout: EXECUTION_TIMEOUT 
      });
      
      // 실행
      const { stdout, stderr } = await execPromise(executablePath, { 
        timeout: EXECUTION_TIMEOUT 
      });
      
      // 파일 정리
      fs.unlinkSync(tempFilePath);
      try {
        if (fs.existsSync(executablePath)) {
          fs.unlinkSync(executablePath);
        }
      } catch (err) {
        // 실행 파일이 없는 경우 무시
      }
      
      const executionTime = performance.now() - startTime;
      const output = stdout.split('\n').filter(line => line.trim() !== '');
      
      return {
        success: !stderr,
        result: stderr || '실행 완료',
        output,
        executionTime
      };
    } catch (error: any) {
      const executionTime = performance.now() - startTime;
      
      return {
        success: false,
        result: error.message || 'C++ 코드 실행 중 오류가 발생했습니다.',
        output: [],
        executionTime
      };
    }
  }
} 