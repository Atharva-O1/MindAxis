from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import AssessmentResult
from app.security import get_current_anonymous_id

router = APIRouter(prefix="/assessments", tags=["assessments"])

AssessmentType = Literal["PHQ-9", "GAD-7"]


class AssessmentBody(BaseModel):
    type: AssessmentType
    score: int
    max_score: int


def _serialize(result: AssessmentResult) -> dict:
    return {
        "id": str(result.id),
        "type": result.type,
        "score": result.score,
        "max_score": result.max_score,
        "completed_at": result.completed_at.isoformat(),
    }


@router.get("")
def list_results(
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    results = (
        db.query(AssessmentResult)
        .filter(AssessmentResult.anonymous_id == anonymous_id)
        .order_by(AssessmentResult.completed_at.desc())
        .all()
    )
    return [_serialize(result) for result in results]


@router.post("")
def create_result(
    body: AssessmentBody,
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    result = AssessmentResult(
        anonymous_id=anonymous_id,
        type=body.type,
        score=body.score,
        max_score=body.max_score,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return _serialize(result)
