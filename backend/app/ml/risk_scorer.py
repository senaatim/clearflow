"""
Risk Scoring Algorithm for ClearFlow

This module implements a rule-based risk scoring system that evaluates
portfolio risk based on multiple factors:
- Asset diversification (25%)
- Sector concentration (20%)
- Position sizes (20%)
- Historical volatility (20%)
- Asset correlation (15%)
"""

from typing import Any
from app.schemas.common import RiskScore


class RiskScorer:
    """Rule-based portfolio risk scorer."""

    # Weights for each risk factor
    WEIGHTS = {
        "diversification": 0.25,
        "concentration": 0.20,
        "position_size": 0.20,
        "volatility": 0.20,
        "correlation": 0.15,
    }

    # Risk tolerance thresholds
    RISK_THRESHOLDS = {
        "conservative": 4.0,
        "moderate": 6.5,
        "aggressive": 8.5,
    }

    def calculate_portfolio_risk(self, portfolio: Any) -> RiskScore:
        """
        Calculate comprehensive risk score for a portfolio.

        Args:
            portfolio: Portfolio object with assets

        Returns:
            RiskScore with overall and factor-specific scores
        """
        assets = getattr(portfolio, 'assets', [])

        if not assets:
            return RiskScore(
                overall=5.0,
                diversification=5.0,
                concentration=5.0,
                position_size=5.0,
                volatility=5.0,
                correlation=5.0,
                recommendation="Add assets to your portfolio for risk analysis.",
            )

        # Calculate individual risk factors
        diversification_score = self._calculate_diversification_risk(assets)
        concentration_score = self._calculate_concentration_risk(assets)
        position_size_score = self._calculate_position_size_risk(assets)
        volatility_score = self._calculate_volatility_risk(assets)
        correlation_score = self._calculate_correlation_risk(assets)

        # Calculate weighted overall score
        overall = (
            diversification_score * self.WEIGHTS["diversification"] +
            concentration_score * self.WEIGHTS["concentration"] +
            position_size_score * self.WEIGHTS["position_size"] +
            volatility_score * self.WEIGHTS["volatility"] +
            correlation_score * self.WEIGHTS["correlation"]
        )

        # Generate recommendation based on overall score
        recommendation = self._generate_recommendation(
            overall,
            diversification_score,
            concentration_score,
            position_size_score,
            volatility_score,
            correlation_score,
        )

        return RiskScore(
            overall=round(overall, 1),
            diversification=round(diversification_score, 1),
            concentration=round(concentration_score, 1),
            position_size=round(position_size_score, 1),
            volatility=round(volatility_score, 1),
            correlation=round(correlation_score, 1),
            recommendation=recommendation,
        )

    def _calculate_diversification_risk(self, assets: list) -> float:
        """
        Calculate risk based on asset type diversification.
        More diverse = lower risk score.
        """
        if not assets:
            return 5.0

        # Count unique asset types
        asset_types = set()
        for asset in assets:
            asset_type = getattr(asset, 'asset_type', None)
            if asset_type:
                asset_types.add(asset_type.value if hasattr(asset_type, 'value') else str(asset_type))

        num_types = len(asset_types)

        # Scoring: 1 type = 9, 2 types = 7, 3 types = 5, 4+ types = 3
        if num_types >= 5:
            return 2.0
        elif num_types >= 4:
            return 3.0
        elif num_types >= 3:
            return 5.0
        elif num_types >= 2:
            return 7.0
        else:
            return 9.0

    def _calculate_concentration_risk(self, assets: list) -> float:
        """
        Calculate risk based on sector concentration.
        Higher concentration in single sector = higher risk.
        """
        if not assets:
            return 5.0

        # Calculate sector weights
        total_value = sum(getattr(asset, 'current_value', 0) or (getattr(asset, 'quantity', 0) * getattr(asset, 'average_cost', 0)) for asset in assets)

        if total_value == 0:
            return 5.0

        sector_values: dict[str, float] = {}
        for asset in assets:
            category = getattr(asset, 'category', 'Unknown')
            value = getattr(asset, 'current_value', 0) or (getattr(asset, 'quantity', 0) * getattr(asset, 'average_cost', 0))
            sector_values[category] = sector_values.get(category, 0) + value

        # Find max sector concentration
        max_concentration = max(sector_values.values()) / total_value * 100

        # Score based on concentration
        if max_concentration > 50:
            return 9.0
        elif max_concentration > 40:
            return 7.5
        elif max_concentration > 30:
            return 6.0
        elif max_concentration > 20:
            return 4.0
        else:
            return 2.5

    def _calculate_position_size_risk(self, assets: list) -> float:
        """
        Calculate risk based on individual position sizes.
        Large positions in single assets = higher risk.
        """
        if not assets:
            return 5.0

        total_value = sum(getattr(asset, 'current_value', 0) or (getattr(asset, 'quantity', 0) * getattr(asset, 'average_cost', 0)) for asset in assets)

        if total_value == 0:
            return 5.0

        # Find max position weight
        max_weight = 0
        for asset in assets:
            value = getattr(asset, 'current_value', 0) or (getattr(asset, 'quantity', 0) * getattr(asset, 'average_cost', 0))
            weight = value / total_value * 100
            max_weight = max(max_weight, weight)

        # Score based on max position size
        if max_weight > 30:
            return 9.0
        elif max_weight > 20:
            return 7.0
        elif max_weight > 15:
            return 5.5
        elif max_weight > 10:
            return 4.0
        else:
            return 2.5

    def _calculate_volatility_risk(self, assets: list) -> float:
        """
        Calculate risk based on asset volatility.
        Uses asset type as proxy for volatility.
        """
        if not assets:
            return 5.0

        # Volatility scores by asset type
        volatility_scores = {
            "crypto": 9.5,
            "stock": 6.5,
            "etf": 5.0,
            "reit": 5.5,
            "bond": 2.5,
        }

        total_value = sum(getattr(asset, 'current_value', 0) or (getattr(asset, 'quantity', 0) * getattr(asset, 'average_cost', 0)) for asset in assets)

        if total_value == 0:
            return 5.0

        # Weighted average volatility
        weighted_vol = 0
        for asset in assets:
            asset_type = getattr(asset, 'asset_type', 'stock')
            type_str = asset_type.value if hasattr(asset_type, 'value') else str(asset_type)
            value = getattr(asset, 'current_value', 0) or (getattr(asset, 'quantity', 0) * getattr(asset, 'average_cost', 0))
            weight = value / total_value
            vol_score = volatility_scores.get(type_str, 5.0)
            weighted_vol += weight * vol_score

        return weighted_vol

    def _calculate_correlation_risk(self, assets: list) -> float:
        """
        Calculate risk based on estimated asset correlations.
        Higher correlation = less diversification benefit = higher risk.
        """
        if len(assets) < 2:
            return 5.0

        # Simplified: count assets in same sector as proxy for correlation
        categories = [getattr(asset, 'category', 'Unknown') for asset in assets]
        unique_categories = len(set(categories))
        total_assets = len(assets)

        # If all in same category, high correlation risk
        diversity_ratio = unique_categories / total_assets

        if diversity_ratio < 0.2:
            return 8.5
        elif diversity_ratio < 0.4:
            return 6.5
        elif diversity_ratio < 0.6:
            return 5.0
        elif diversity_ratio < 0.8:
            return 3.5
        else:
            return 2.5

    def _generate_recommendation(
        self,
        overall: float,
        diversification: float,
        concentration: float,
        position_size: float,
        volatility: float,
        correlation: float,
    ) -> str:
        """Generate personalized recommendation based on risk factors."""
        recommendations = []

        if diversification > 7:
            recommendations.append("diversify across more asset types (stocks, bonds, ETFs)")

        if concentration > 7:
            recommendations.append("reduce sector concentration by spreading investments")

        if position_size > 7:
            recommendations.append("reduce large individual positions to limit single-stock risk")

        if volatility > 7:
            recommendations.append("add lower-volatility assets like bonds for stability")

        if correlation > 7:
            recommendations.append("add uncorrelated assets to improve diversification")

        if overall <= 4:
            base = "Your portfolio has low risk. "
        elif overall <= 6.5:
            base = "Your portfolio has moderate risk. "
        else:
            base = "Your portfolio has elevated risk. "

        if recommendations:
            return base + "Consider: " + "; ".join(recommendations[:2]) + "."
        else:
            return base + "Your risk factors are well-balanced."
