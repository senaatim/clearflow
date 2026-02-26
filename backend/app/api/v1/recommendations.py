from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.recommendation import Recommendation, RecommendationStatus
from app.schemas.recommendation import (
    RecommendationResponse,
    RecommendationUpdate,
)
from app.api.deps import get_current_user
from app.ml.recommender import RecommendationEngine

router = APIRouter()


@router.get("", response_model=list[RecommendationResponse])
async def list_recommendations(
    status: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all recommendations for the current user."""
    query = select(Recommendation).where(Recommendation.user_id == current_user.id)

    if status:
        query = query.where(Recommendation.status == status)
    if type:
        query = query.where(Recommendation.type == type)

    query = query.order_by(Recommendation.created_at.desc()).limit(limit)

    result = await db.execute(query)
    recommendations = result.scalars().all()

    return [RecommendationResponse.model_validate(r) for r in recommendations]


@router.get("/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation(
    recommendation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific recommendation."""
    result = await db.execute(
        select(Recommendation).where(
            Recommendation.id == recommendation_id,
            Recommendation.user_id == current_user.id,
        )
    )
    recommendation = result.scalar_one_or_none()

    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found",
        )

    # Mark as viewed if pending
    if recommendation.status == RecommendationStatus.pending:
        recommendation.status = RecommendationStatus.viewed
        await db.commit()
        await db.refresh(recommendation)

    return RecommendationResponse.model_validate(recommendation)


@router.patch("/{recommendation_id}", response_model=RecommendationResponse)
async def update_recommendation(
    recommendation_id: str,
    updates: RecommendationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a recommendation status."""
    result = await db.execute(
        select(Recommendation).where(
            Recommendation.id == recommendation_id,
            Recommendation.user_id == current_user.id,
        )
    )
    recommendation = result.scalar_one_or_none()

    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found",
        )

    if updates.status:
        recommendation.status = updates.status
        if updates.status in [RecommendationStatus.accepted, RecommendationStatus.dismissed]:
            recommendation.acted_at = datetime.utcnow()

    await db.commit()
    await db.refresh(recommendation)

    return RecommendationResponse.model_validate(recommendation)


@router.post("/{recommendation_id}/accept", response_model=RecommendationResponse)
async def accept_recommendation(
    recommendation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a recommendation."""
    result = await db.execute(
        select(Recommendation).where(
            Recommendation.id == recommendation_id,
            Recommendation.user_id == current_user.id,
        )
    )
    recommendation = result.scalar_one_or_none()

    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found",
        )

    recommendation.status = RecommendationStatus.accepted
    recommendation.acted_at = datetime.utcnow()

    await db.commit()
    await db.refresh(recommendation)

    return RecommendationResponse.model_validate(recommendation)


@router.post("/generate", response_model=list[RecommendationResponse])
async def generate_recommendations(
    portfolio_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate new AI recommendations."""
    # Get user's portfolios
    if portfolio_id:
        result = await db.execute(
            select(Portfolio).where(
                Portfolio.id == portfolio_id,
                Portfolio.user_id == current_user.id,
            )
        )
        portfolios = [result.scalar_one_or_none()]
        if not portfolios[0]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found",
            )
    else:
        result = await db.execute(
            select(Portfolio).where(Portfolio.user_id == current_user.id)
        )
        portfolios = result.scalars().all()

    # Generate recommendations using ML engine
    engine = RecommendationEngine()
    new_recommendations = []

    for portfolio in portfolios:
        if portfolio:
            await db.refresh(portfolio, ["assets"])
            recs = engine.generate_recommendations(current_user, portfolio)

            for rec_data in recs:
                recommendation = Recommendation(
                    user_id=current_user.id,
                    portfolio_id=portfolio.id,
                    type=rec_data["type"],
                    title=rec_data["title"],
                    description=rec_data["description"],
                    details=rec_data.get("details"),
                    confidence_score=rec_data.get("confidence_score"),
                    potential_impact=rec_data.get("potential_impact"),
                    priority=rec_data.get("priority", "medium"),
                )
                db.add(recommendation)
                new_recommendations.append(recommendation)

    await db.commit()

    # Refresh all recommendations
    for rec in new_recommendations:
        await db.refresh(rec)

    return [RecommendationResponse.model_validate(r) for r in new_recommendations]
