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

# ───────────────── Mongo 연결 ─────────────────
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
client = None
db = None
messages_collection = None

if MONGO_URI and MONGO_DB_NAME:
    try:
        client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            tlsCAFile=certifi.where()
        )
        client.admin.command("ping")
        db = client[MONGO_DB_NAME]
        messages_collection = db["message"]
        print("✅ MongoDB connected successfully.")
    except Exception as e:
        print(f"⚠️ WARNING: Could not connect to MongoDB: {e}")
        print("Database features will be disabled.")
else:
    print("⚠️ WARNING: MONGO_URI or MONGO_DB_NAME is not set.")
    print("Database features will be disabled.")

# ───────────────── OpenAI ─────────────────
openai.api_key = os.getenv("OPENAI_API_KEY")

# ───────────────── 시스템 프롬프트 로더 ─────────────────
def load_system_prompt() -> str:
    """
    우선순위: SYSTEM_PROMPT_FILE(파일) > SYSTEM_PROMPT(문자열) > 기본값
    - SYSTEM_PROMPT_FILE이 상대경로면 app.py 위치(BASE_DIR) 기준
    """
    base_dir = Path(__file__).resolve().parent

    file_var = os.getenv("SYSTEM_PROMPT_FILE")
    if file_var:
        prompt_path = Path(file_var)
        if not prompt_path.is_absolute():
            prompt_path = base_dir / prompt_path
        try:
            return prompt_path.read_text(encoding="utf-8")
        except FileNotFoundError:
            print(f"[WARN] SYSTEM_PROMPT_FILE not found: {prompt_path}")

    env_prompt = os.getenv("SYSTEM_PROMPT")
    if env_prompt:
        return env_prompt.replace("\\n", "\n")

    return "(기본 프롬프트)"

# ───────────────── 공용 유틸 ─────────────────
ALLOWED_ROLES = {"system", "user", "assistant"}

def normalize_history(received_history, user_message):
    """
    - dict만 유지 (role/content 없는 항목 제거)
    - role 소문자화 및 허용값만 유지
    - 마지막이 user가 아니거나 content가 다르면 user_message 보강
    """
    hist = []
    for m in (received_history or []):
        if not isinstance(m, dict):
            continue
        role = str(m.get("role", "")).lower()
        content = m.get("content")
        if role in ALLOWED_ROLES and isinstance(content, str) and content.strip():
            hist.append({"role": role, "content": content})

    need_user_append = (
        user_message and (
            not hist or hist[-1]["role"] != "user" or hist[-1]["content"] != user_message
        )
    )
    if need_user_append:
        hist.append({"role": "user", "content": user_message})

    return hist



# ───────────────── 라우트 ─────────────────
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message", "")
    received_history = request.json.get("history", [])
    user_id = request.json.get("user_id", "anonymous")

    system_prompt = load_system_prompt()
    system_message = {"role": "system", "content": system_prompt}

    # ✅ 히스토리 정규화 (대문자 'User' → 'user', 잘못된 항목 제거, 필요 시 user 보강)
    history_for_openai = normalize_history(received_history, user_message)

    # ✅ OpenAI 호출용: system + 정규화된 history (user 중복 추가 없음)
    messages_for_openai = [system_message] + history_for_openai

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages_for_openai
        )
        bot_message = response.choices[0].message["content"]

        return jsonify({"reply": bot_message})
    except Exception as e:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("AN ERROR OCCURRED in /chat:", repr(e))
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        return jsonify({"error": "model_call_failed"}), 500

@app.route("/save-chat", methods=["POST"])
def save_chat():
    user_id = request.json.get("user_id")
    chat_id = request.json.get("chat_id")
    history = request.json.get("history")

    if not all([user_id, chat_id, history]):
        return jsonify({"error": "user_id, chat_id, and history are required"}), 400

    if messages_collection is not None:
        try:
            # Use update_one with upsert=True to save or overwrite the conversation
            messages_collection.update_one(
                {"chat_id": chat_id, "user_id": user_id},
                {
                    "$set": {
                        "messages": history,
                        "saved_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
            return jsonify({"message": "Conversation saved successfully"})
        except Exception as e:
            print(f"⚠️ WARNING: Failed to save conversation: {e}")
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Database not connected"}), 500

@app.route("/get-conversations", methods=["GET"])
def get_conversations():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    if messages_collection is not None:
        try:
            # Sort by most recently saved
            conversations = list(messages_collection.find({"user_id": user_id}).sort("saved_at", -1))
            # Convert ObjectId to string for JSON serialization
            for conv in conversations:
                conv["_id"] = str(conv["_id"])
            return jsonify({"conversations": conversations})
        except Exception as e:
            print(f"⚠️ WARNING: Failed to fetch conversations: {e}")
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Database not connected"}), 500




if __name__ == "__main__":
    app.run(debug=True, port=5001)
