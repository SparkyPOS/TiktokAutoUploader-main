"""Read-only post listing routes for the self-hosted dashboard."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from api.db import get_session
from api.models import Account
from api.schemas import PostListResponse, PostInfo
from autotok import Client
from autotok.errors import AutotokError, NotLoggedInError

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("/{account_id}", response_model=PostListResponse)
def list_posts(
    account_id: int,
    count: int = Query(default=20, ge=1, le=100),
    cursor: int = Query(default=0, ge=0),
    detailed: bool = False,
    session: Session = Depends(get_session),
):
    acct = session.get(Account, account_id)
    if not acct:
        raise HTTPException(status_code=404, detail="account not found")
    try:
        result = Client.from_account(acct.username).list_posts(count=count, cursor=cursor, detailed=detailed)
    except NotLoggedInError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from None
    except AutotokError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from None
    return PostListResponse(
        account=result["account"],
        count=result["count"],
        cursor=result["cursor"],
        next_cursor=result.get("next_cursor", 0),
        has_more=bool(result.get("has_more", False)),
        posts=[PostInfo(**p) for p in result["posts"]],
    )
