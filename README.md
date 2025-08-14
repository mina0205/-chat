# 🤖 심심이 챗봇 (Simsimi Chatbot)

GPT API를 활용하여 개발된 간단한 웹 기반 챗봇 애플리케이션입니다. 이 챗봇은 이전 대화 내용을 기억하지 않는 무상태(stateless) 방식으로 작동합니다.

## ✨ 주요 기능

- 사용자 친화적인 웹 기반 채팅 인터페이스
- OpenAI GPT API를 통한 AI 기반 답변 생성
- 챗봇의 초기 인사말 및 타이핑 애니메이션
- '새 채팅' 버튼을 통한 대화 초기화 (UI 전용)

## 🛠️ 사용 기술

- **프론트엔드:** HTML, CSS, jQuery
- **백엔드:** Python (Flask)
- **AI:** OpenAI GPT API

## 🚀 시작하기

프로젝트를 로컬 환경에서 설정하고 실행하는 방법입니다.

### 📋 전제 조건

- Python 3.x 버전이 설치되어 있어야 합니다.
- OpenAI API 키가 발급되어 있어야 합니다.

### ⚙️ 설치 및 실행

1.  **프로젝트 디렉토리로 이동:**

    ```bash
    cd /Users/mina/Desktop/심심이
    ```

2.  **가상 환경 설정 및 활성화:**

    프로젝트 의존성 관리를 위해 가상 환경을 사용하는 것을 권장합니다.

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **필요한 라이브러리 설치:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **환경 변수 설정 (`.env` 파일):**

    프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가합니다.
    `YOUR_OPENAI_API_KEY`를 실제 값으로 대체하세요.

    ```dotenv
    OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
    ```

    *   **OpenAI API Key:** [OpenAI API Keys](https://platform.openai.com/account/api-keys)에서 발급받을 수 있습니다.

5.  **애플리케이션 실행:**

    ```bash
    python app.py
    ```

    서버가 `http://127.0.0.1:5002`에서 실행됩니다.

## 🌐 챗봇 사용

웹 브라우저를 열고 `http://127.0.0.1:5002`로 접속하여 챗봇과 대화할 수 있습니다.

## ⚠️ 문제 해결

-   **`ModuleNotFoundError`:** 가상 환경이 활성화되었는지 확인하고 `pip install -r requirements.txt`를 다시 실행하세요.
-   **`Address already in use`:** 해당 포트(`5002`)를 사용 중인 다른 프로세스를 종료하거나 `app.py`에서 포트 번호를 변경하세요.
-   **`Incorrect API key provided`:** `.env` 파일의 `OPENAI_API_KEY`가 올바른지 확인하세요.
-   **`You exceeded your current quota`:** OpenAI 계정의 사용량 및 결제 설정을 확인하세요.

## 💡 향후 개선 사항 (선택 사항)

- 사용자 인증 기능 추가
- 실시간 스트리밍 답변 구현
- 더 다양한 UI/UX 개선