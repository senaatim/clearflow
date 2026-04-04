from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from datetime import datetime
import uuid
import io

from app.models.user import User
from app.middleware.subscription import require_subscription, Features
from app.api.deps import get_current_user

router = APIRouter()

# In-memory report store (resets on restart — replace with DB collection when needed)
_reports: dict[str, dict] = {}

REPORT_TITLES = {
    "performance": "Performance Report",
    "tax": "Tax Report",
    "risk": "Risk Report",
    "comprehensive": "Comprehensive Report",
}


@router.get("")
async def list_reports(current_user: User = Depends(get_current_user)):
    user_reports = [r for r in _reports.values() if r["user_id"] == current_user.id]
    user_reports.sort(key=lambda r: r["created_at"], reverse=True)
    return [_serialize(r) for r in user_reports]


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_report(
    data: dict,
    current_user: User = Depends(require_subscription(Features.DOWNLOADABLE_REPORTS)),
):
    report_type = data.get("type", "comprehensive")
    if report_type not in REPORT_TITLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid report type.")

    report_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    report = {
        "id": report_id,
        "user_id": current_user.id,
        "type": report_type,
        "title": REPORT_TITLES[report_type],
        "status": "completed",
        "created_at": now,
        "completed_at": now,
    }
    _reports[report_id] = report
    return _serialize(report)


@router.get("/{report_id}")
async def get_report(report_id: str, current_user: User = Depends(get_current_user)):
    report = _reports.get(report_id)
    if not report or report["user_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return _serialize(report)


@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    format: str = "pdf",
    current_user: User = Depends(get_current_user),
):
    report = _reports.get(report_id)
    if not report or report["user_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    title = report["title"]
    created = report["created_at"]

    if format == "csv":
        content = f"Report,{title}\nGenerated,{created}\nUser,{current_user.email}\n"
        media_type = "text/csv"
        filename = f"{title}.csv"
    else:
        content = (
            f"%PDF-1.4\n"
            f"% ClearFlow Report\n"
            f"% Title: {title}\n"
            f"% Generated: {created}\n"
            f"% User: {current_user.email}\n"
        )
        media_type = "application/pdf"
        filename = f"{title}.pdf"

    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _serialize(r: dict) -> dict:
    return {
        "id": r["id"],
        "user_id": r["user_id"],
        "type": r["type"],
        "title": r["title"],
        "status": r["status"],
        "created_at": r["created_at"],
        "completed_at": r.get("completed_at"),
    }
