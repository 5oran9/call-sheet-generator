# backend/openai_API.py
import os
from dotenv import load_dotenv
from openai import OpenAI

# 1. .env 파일에서 비밀번호(API 키) 꺼내오기
load_dotenv()

# 2. OpenAI 연결하기
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY") 
)

# 3. AI에게 말 걸기
print("AI에게 질문을 보내는 중...")
completion = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "너는 영화 현장 조감독이야."},
        {"role": "user", "content": "촬영 현장에서 비가 오면 가장 먼저 챙겨야 할 장비 3가지만 짧게 말해줘."}
    ]
)

# 4. 대답 출력하기
print("--- AI의 답변 ---")
print(completion.choices[0].message.content)