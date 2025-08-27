from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
import os
import openai
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime
import certifi


load_dotenv()

app = Flask(__name__)

# Mongo 연결
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
client = None
db = None
messages_collection = None

if MONGO_URI and MONGO_DB_NAME:
    try:
        client = MongoClient(MONGO_URI,
                             serverSelectionTimeoutMS=5000,
                             tlsCAFile=certifi.where())
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        db = client[MONGO_DB_NAME]
        messages_collection = db["message"]
        print("✅ MongoDB connected successfully.")
    except Exception as e:
        print(f"⚠️ WARNING: Could not connect to MongoDB: {e}")
        print("Database features will be disabled.")
else:
    print("⚠️ WARNING: MONGO_URI or MONGO_DB_NAME is not set.")
    print("Database features will be disabled.")


# OpenAI API 키 설정 (.env에 OPENAI_API_KEY=... 저장)
openai.api_key = os.getenv("OPENAI_API_KEY")

# ** 시스템 프롬프트 로더 **
def load_system_prompt() -> str:
    """
    우선순위: SYSTEM_PROMPT_FILE(파일) > SYSTEM_PROMPT(문자열) > 기본값
    - SYSTEM_PROMPT_FILE이 상대경로면 app.py 위치(BASE_DIR) 기준으로 처리
    """
    base_dir = Path(__file__).resolve().parent

    # 파일 읽기
    file_var = os.getenv("SYSTEM_PROMPT_FILE")
    if file_var:
        prompt_path = Path(file_var)
        if not prompt_path.is_absolute():
            prompt_path = base_dir / prompt_path  # 상대경로 → app.py 기준
        try:
            return prompt_path.read_text(encoding="utf-8")
        except FileNotFoundError:
            # 파일이 없으면 경고 출력 후 다음 우선순위로
            print(f"[WARN] SYSTEM_PROMPT_FILE not found: {prompt_path}")

# 메세지 저장(예)
def save_conversation(user_id: str, history: list):
    if messages_collection is not None:
        try:
            messages_collection.insert_one({
                "user_id": user_id,
                "messages": history,
                "created_at": datetime.utcnow()
            })
        except Exception as e:
            print(f"⚠️ WARNING: Failed to save conversation to DB: {e}")

# 기본 페이지 라우트
@app.route("/")
def index():
    return render_template("index.html")

# 챗봇 응답 처리 라우트
@app.route("/chat", methods=["POST"])
def chat():

    # 프론트에서 보낸 최신 사용자 메세지
    user_message = request.json.get("message")

    # 이전 대화 히스토리(없으면 빈 리스트). 프론트에서 관리 후 보내는 방식.
    received_history = request.json.get("history", []) 
    user_id = request.json.get("user_id", "anonymous")

    #    - 개발 중 프롬프트 파일만 수정해도 반영되게 하려면 매 요청마다 로드하는 게 편함
    system_prompt = load_system_prompt()

    system_message = {"role": "system", "content": system_prompt}

    # OpenAI로 보낼 전체 메시지 목록 구성
    # - 시스템 메시지 + 과거 히스토리 + (최신 사용자 메시지)
    messages_for_openai = [system_message] + received_history + [{"role": "user", "content": user_message}]


    try:
        # openai 호출
        # ai 모델은 필요에 따라 변경 가능
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages_for_openai # Pass the full history
        )
        
        # 모델의 첫번쨰 응답 추출
        bot_message = response.choices[0].message["content"]
        
        # DB에 저장
        full_history = received_history + [
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": bot_message}
        ]
        save_conversation(user_id, full_history)

        return jsonify({"reply": bot_message})
    except Exception as e:
        #서버에 콘솔 에러 출력
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("AN ERROR OCCURRED:", e)
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        return jsonify({"error": str(e)}), 500

# new chat 처리 라우트
@app.route("/new-chat", methods=["POST"])
def new_chat():
    user_id = request.json.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    if messages_collection is not None:
        try:
            result = messages_collection.delete_many({"user_id": user_id})
            print(f"Deleted {result.deleted_count} conversations for user_id: {user_id}")
            return jsonify({"message": "Conversations deleted successfully"})
        except Exception as e:
            print(f"⚠️ WARNING: Failed to delete conversations: {e}")
            return jsonify({"error": str(e)}), 500
    else:
        # DB not connected, but we can still let the frontend reset.
        return jsonify({"message": "No database connection, frontend reset only"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
