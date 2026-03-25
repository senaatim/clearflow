from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import Optional

from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.recommendation import Recommendation, RecommendationStatus
from app.schemas.recommendation import RecommendationResponse, RecommendationUpdate
from app.api.deps import get_current_user
from app.middleware.subscription import require_subscription, Features
from app.ml.recommender import RecommendationEngine

_rec_access = require_subscription(Features.BASIC_RECOMMENDATIONS)

router = APIRouter()


@router.get("", response_model=list[RecommendationResponse])
async def list_recommendations(
    status: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 20,
    current_user: User = Depends(_rec_access),
):
    query = Recommendation.find(Recommendation.user_id == current_user.id)

    if status:
        query = query.find(Recommendation.status == status)
    if type:
        query = query.find(Recommendation.type == type)

    recommendations = await query.sort(-Recommendation.created_at).limit(limit).to_list()
    return [RecommendationResponse.model_validate(r) for r in recommendations]


@router.get("/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation(
    recommendation_id: str,
    current_user: User = Depends(_rec_access),
):
    recommendation = await Recommendation.find_one(
        Recommendation.id == recommendation_id,
        Recommendation.user_id == current_user.id,
    )

    if not recommendation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")

    if recommendation.status == RecommendationStatus.pending:
        recommendation.status = RecommendationStatus.viewed
        await recommendation.save()

    return RecommendationResponse.model_validate(recommendation)


@router.patch("/{recommendation_id}", response_model=RecommendationResponse)
async def update_recommendation(
    recommendation_id: str,
    updates: RecommendationUpdate,
    current_user: User = Depends(_rec_access),
):
    recommendation = await Recommendation.find_one(
        Recommendation.id == recommendation_id,
        Recommendation.user_id == current_user.id,
    )

    if not recommendation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")

    if updates.status:
        recommendation.status = updates.status
        if updates.status in [RecommendationStatus.accepted, RecommendationStatus.dismissed]:
            recommendation.acted_at = datetime.utcnow()

    await recommendation.save()
    return RecommendationResponse.model_validate(recommendation)


@router.post("/{recommendation_id}/accept", response_model=RecommendationResponse)
async def accept_recommendation(
    recommendation_id: str,
    current_user: User = Depends(_rec_access),
):
    recommendation = await Recommendation.find_one(
        Recommendation.id == recommendation_id,
        Recommendation.user_id == current_user.id,
    )

    if not recommendation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")

    recommendation.status = RecommendationStatus.accepted
    recommendation.acted_at = datetime.utcnow()
    await recommendation.save()

    return RecommendationResponse.model_validate(recommendation)


@router.post("/generate", response_model=list[RecommendationResponse])
async def generate_recommendations(
    portfolio_id: Optional[str] = None,
    current_user: User = Depends(_rec_access),
):
    if portfolio_id:
        portfolio = await Portfolio.find_one(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == current_user.id,
        )
        if not portfolio:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
        portfolios = [portfolio]
    else:
        portfolios = await Portfolio.find(Portfolio.user_id == current_user.id).to_list()

    from app.models.asset import Asset
    engine = RecommendationEngine()
    new_recommendations = []

    for portfolio in portfolios:
        if portfolio:
            portfolio.assets = await Asset.find(Asset.portfolio_id == portfolio.id).to_list()
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
                await recommendation.insert()
                new_recommendations.append(recommendation)

    return [RecommendationResponse.model_validate(r) for r in new_recommendations]
