# backend/main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import httpx

# 1. 환경변수 로드
load_dotenv()

COLAB_URL = os.getenv("COLAB_URL")
if not COLAB_URL:
    print("경고: COLAB_URL이 설정되지 않았습니다. .env 파일을 확인해주세요.")

app = FastAPI()

# 2. CORS 설정 (프론트엔드인 Next.js가 3000번 포트에서 접근할 수 있게 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")  # 프론트엔드 요청 경로와 일치시킴
async def analyze_proxy(file: UploadFile):
    
    # Colab 주소가 없으면 에러
    if not COLAB_URL:
        raise HTTPException(status_code=500, detail="Colab 서버 주소가 설정되지 않았습니다.")

    print(f"📥 파일 수신: {file.filename}")
    
    try:
        # 1. 프론트엔드에서 보낸 파일 읽기 (바이너리 모드)
        file_content = await file.read()
        
        # 2. Colab(ngrok) 서버로 파일 그대로 전달 (Proxy)
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Colab의 /analyze 엔드포인트로 전송
            # 중요: json이 아니라 files 파라미터 사용
            response = await client.post(
                f"{COLAB_URL}/analyze",
                files={"file": (file.filename, file_content, file.content_type)}
            )
            
            # Colab 서버 에러 체크
            if response.status_code != 200:
                print(f"❌ Colab 오류: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="AI 분석 서버 오류")

        print("✅ Colab 분석 완료. 결과 반환 중...")

        # 3. Colab이 준 엑셀 파일(binary)을 그대로 프론트엔드에 반환
        return Response(
            content=response.content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=Result_{file.filename}.xlsx"
            }
        )

    except httpx.RequestError as e:
        print(f"❌ 연결 오류: {e}")
        raise HTTPException(status_code=503, detail="Colab 서버에 연결할 수 없습니다.")
    except Exception as e:
        print(f"❌ 서버 내부 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))