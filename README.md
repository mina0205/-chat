# 심심이 (AI 챗봇)

OpenAI API와 Flask를 기반으로 한 웹 기반 AI 챗봇 애플리케이션입니다. 사용자는 회원가입 및 로그인 후 AI와 대화할 수 있으며, 이전 대화 내용을 저장하고 불러올 수 있습니다. 백엔드는 Python Flask로 구축되었으며, 프론트엔드는 기본적인 HTML, CSS, JavaScript로 구성되어 있습니다.

## ✨ 주요 기능

-   OpenAI GPT-3.5-turbo 모델을 이용한 실시간 채팅
-   사용자 회원가입 및 로그인 (JWT 기반 인증)
-   안전한 비밀번호 저장을 위한 Bcrypt 해싱
-   MongoDB를 이용한 대화 내용 저장 및 조회

## 🛠️ 기술 스택

-   **Backend:** Python, Flask
-   **Frontend:** HTML, CSS, Vanilla JavaScript
-   **Database:** MongoDB
-   **AI:** OpenAI API (gpt-3.5-turbo)
-   **Authentication:** PyJWT (JSON Web Tokens), bcrypt
-   **Deployment:** Gunicorn (추천)

## ⚙️ 설치 및 실행 방법

### 1. 프로젝트 복제

```bash
git clone https://github.com/mina0205/-chat.git
cd 심심이
```

### 2. 가상환경 생성 및 활성화

프로젝트의 의존성을 시스템 전체가 아닌 격리된 환경에 설치하기 위해 가상환경을 생성합니다.

-   **macOS / Linux:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
-   **Windows:**
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```

### 3. 의존성 설치

`requirements.txt` 파일에 명시된 라이브러리들을 설치합니다.

```bash
pip install -r requirements.txt
```

### 4. 환경 변수 설정

프로젝트 루트 디렉토리(`.`)에 `.env` 파일을 생성하고 아래 내용을 자신의 환경에 맞게 수정하여 추가합니다.

```env
# OpenAI API 키
OPENAI_API_KEY=

# MongoDB 연결 정보 (선택 사항)
MONGO_URI=
MONGO_DB_NAME=

# Flask 및 JWT 보안을 위한 시크릿 키
# 아래 명령어로 강력한 키를 생성할 수 있습니다:
# python -c 'import secrets; print(secrets.token_hex(16))'
FLASK_SECRET_KEY="your_strong_secret_key"

# 시스템 프롬프트 파일 경로 (선택 사항)
# 예: prompts/system.txt
SYSTEM_PROMPT_FILE="prompts/system.txt"
```

### 5. 서버 실행

아래 명령어를 실행하여 Flask 개발 서버를 시작합니다.

```bash
python app.py
```

서버가 정상적으로 실행되면, 웹 브라우저에서 `http://127.0.0.1:5001` 주소로 접속할 수 있습니다.