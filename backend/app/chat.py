"""WebSocket endpoint that streams tokens from the local Ollama model.

Conversation memory is scoped to a single WebSocket connection only — a plain
list of LangChain messages local to this coroutine. There is no cross-session
history, no session IDs, and nothing is persisted: closing the connection
(reload, app restart) discards the conversation, matching the frontend's
current behavior (chat messages aren't saved anywhere either).
"""

import json
import os

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from app.persona import PERSONA_PROMPT

router = APIRouter()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:3b")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


@router.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    llm = ChatOllama(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL)
    messages: list[BaseMessage] = [SystemMessage(content=PERSONA_PROMPT)]

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Malformed message."})
                continue

            user_text = str(payload.get("text", "")).strip()
            if not user_text:
                continue

            messages.append(HumanMessage(content=user_text))

            try:
                full_reply = ""
                async for chunk in llm.astream(messages):
                    token = chunk.content
                    if token:
                        full_reply += token
                        await websocket.send_json({"type": "token", "text": token})
                messages.append(AIMessage(content=full_reply))
                await websocket.send_json({"type": "done"})
            except WebSocketDisconnect:
                # Client vanished mid-stream (reload, backgrounded app, closed
                # tab) — nothing to notify, let the outer handler clean up.
                raise
            except Exception as exc:
                # A genuine failure (Ollama down, model not pulled, etc.) with
                # the client still connected — tell them, but the send itself
                # can still race a disconnect, so guard it too.
                print(f"[chat] LLM error: {exc}")
                try:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": "The companion is unavailable right now. "
                            "Make sure Ollama is running locally and try again.",
                        }
                    )
                except WebSocketDisconnect:
                    raise
    except WebSocketDisconnect:
        pass
