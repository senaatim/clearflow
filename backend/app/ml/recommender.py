"""
AI Recommendation Engine for ClearFlow

Generates personalized investment recommendations based on:
- Portfolio rebalancing needs
- Tax-loss harvesting opportunities
- Risk adjustment suggestions
- Diversification improvements
- Market opportunities
"""

from typing import Any
import random
from datetime import datetime, timedelta
from app.models.user import RiskTolerance


class RecommendationEngine:
    """Rule-based recommendation engine for investment advice."""

    # Target allocations by risk tolerance
    TARGET_ALLOCATIONS = {
        RiskTolerance.conservative: {
            "bonds": 0.40,
            "stocks": 0.30,
            "etf": 0.20,
            "reit": 0.10,
        },
        RiskTolerance.moderate: {
            "stocks": 0.40,
            "etf": 0.25,
            "bonds": 0.20,
            "reit": 0.15,
        },
        RiskTolerance.aggressive: {
            "stocks": 0.50,
            "etf": 0.25,
            "crypto": 0.15,
            "reit": 0.10,
        },
    }

    def generate_recommendations(self, user: Any, portfolio: Any) -> list[dict]:
        """
        Generate AI recommendations for a portfolio.

        Args:
            user: User object with preferences
            portfolio: Portfolio object with assets

        Returns:
            List of recommendation dictionaries
        """
        recommendations = []
        assets = getattr(portfolio, 'assets', [])

        # 1. Check for rebalancing needs
        rebalance_rec = self._check_rebalancing(user, assets)
        if rebalance_rec:
            recommendations.append(rebalance_rec)

        # 2. Check for tax-loss harvesting
        tax_rec = self._check_tax_harvesting(assets)
        if tax_rec:
            recommendations.append(tax_rec)

        # 3. Check risk adjustment
        risk_rec = self._check_risk_adjustment(user, assets)
        if risk_rec:
            recommendations.append(risk_rec)

        # 4. Check diversification
        diversification_rec = self._check_diversification(assets)
        if diversification_rec:
            recommendations.append(diversification_rec)

        # 5. Add market opportunity (simulated)
        opportunity_rec = self._generate_market_opportunity()
        if opportunity_rec:
            recommendations.append(opportunity_rec)

        return recommendations

    def _check_rebalancing(self, user: Any, assets: list) -> dict | None:
        """Check if portfolio needs rebalancing."""
        if not assets:
            return None

        # Calculate current allocation
        total_value = sum(
            getattr(asset, 'current_value', 0) or
            (getattr(asset, 'quantity', 0) * getattr(asset, 'average_cost', 0))
            for asset in assets
        )

        if total_value == 0:
            return None

        # Group by asset type
        type_values: dict[str, float] = {}
        for asset in assets:
            asset_type = getattr(asset, 'asset_type', None)
            type_str = asset_type.value if hasattr(asset_type, 'value') else 'stock'
            value = getattr(asset, 'current_value', 0) or (getattr(asset, 'quantity', 0) * getattr(asset, 'average_cost', 0))
            type_values[type_str] = type_values.get(type_str, 0) + value

        # Get user's risk tolerance target
        risk_tolerance = getattr(user, 'risk_tolerance', RiskTolerance.moderate)
        targets = self.TARGET_ALLOCATIONS.get(risk_tolerance, self.TARGET_ALLOCATIONS[RiskTolerance.moderate])

        # Check for significant deviation (> 5%)
        max_deviation = 0
        deviation_type = ""

        for asset_type, target in targets.items():
            current = type_values.get(asset_type, 0) / total_value
            deviation = abs(current - target) * 100

            if deviation > max_deviation:
                max_deviation = deviation
                deviation_type = asset_type

        if max_deviation > 5:
            return {
                "type": "rebalance",
                "title": "Portfolio Rebalancing Recommended",
                "description": f"Your {deviation_type} allocation is {max_deviation:.1f}% away from target. Consider rebalancing to maintain your risk profile.",
                "confidence_score": 0.85,
                "potential_impact": total_value * max_deviation / 100 * 0.02,  # Estimated benefit
                "priority": "high" if max_deviation > 10 else "medium",
                "details": {
                    "deviation_type": deviation_type,
                    "deviation_percentage": max_deviation,
                    "suggested_action": f"Adjust {deviation_type} allocation",
                },
            }

        return None

    def _check_tax_harvesting(self, assets: list) -> dict | None:
        """Check for tax-loss harvesting opportunities."""
        if not assets:
            return None

        # Find assets with losses
        loss_opportunities = []
        total_losses = 0

        for asset in assets:
            gain_loss = getattr(asset, 'gain_loss', None)
            if gain_loss is None:
                cost_basis = getattr(asset, 'quantity', 0) * getattr(asset, 'average_cost', 0)
                current_value = getattr(asset, 'current_value', cost_basis)
                gain_loss = current_value - cost_basis

            if gain_loss < -100:  # Minimum $100 loss
                loss_opportunities.append({
                    "symbol": getattr(asset, 'symbol', 'Unknown'),
                    "loss": abs(gain_loss),
                })
                total_losses += abs(gain_loss)

        if loss_opportunities and total_losses > 500:
            # Estimate tax savings (32% short-term rate)
            tax_savings = total_losses * 0.32

            return {
                "type": "tax_harvest",
                "title": "Tax-Loss Harvesting Opportunity",
                "description": f"Potential tax savings of ${tax_savings:.0f} by harvesting losses in {len(loss_opportunities)} position(s).",
                "confidence_score": 0.90,
                "potential_impact": tax_savings,
                "priority": "high" if tax_savings > 1000 else "medium",
                "details": {
                    "total_losses": total_losses,
                    "estimated_savings": tax_savings,
                    "positions": loss_opportunities[:3],  # Top 3
                },
            }

        return None

    def _check_risk_adjustment(self, user: Any, assets: list) -> dict | None:
        """Check if portfolio risk matches user preference."""
        if not assets:
            return None

        risk_tolerance = getattr(user, 'risk_tolerance', RiskTolerance.moderate)

        # Simple risk check: count high-volatility assets
        high_risk_count = 0
        low_risk_count = 0

        for asset in assets:
            asset_type = getattr(asset, 'asset_type', None)
            type_str = asset_type.value if hasattr(asset_type, 'value') else 'stock'

            if type_str in ['crypto', 'stock']:
                high_risk_count += 1
            elif type_str in ['bond']:
                low_risk_count += 1

        total = len(assets)
        if total == 0:
            return None

        high_risk_ratio = high_risk_count / total

        # Check mismatch
        if risk_tolerance == RiskTolerance.conservative and high_risk_ratio > 0.5:
            return {
                "type": "risk_alert",
                "title": "Portfolio Risk Exceeds Preference",
                "description": "Your portfolio contains more high-risk assets than your conservative preference suggests. Consider adding bonds or stable ETFs.",
                "confidence_score": 0.80,
                "priority": "high",
                "details": {
                    "current_high_risk_ratio": high_risk_ratio,
                    "suggested_ratio": 0.30,
                },
            }
        elif risk_tolerance == RiskTolerance.aggressive and high_risk_ratio < 0.4:
            return {
                "type": "opportunity",
                "title": "Growth Opportunity Available",
                "description": "Your aggressive risk profile could support more growth-oriented investments for higher potential returns.",
                "confidence_score": 0.75,
                "priority": "medium",
                "details": {
                    "current_high_risk_ratio": high_risk_ratio,
                    "suggested_ratio": 0.60,
                },
            }

        return None

    def _check_diversification(self, assets: list) -> dict | None:
        """Check portfolio diversification."""
        if len(assets) < 2:
            return {
                "type": "opportunity",
                "title": "Improve Diversification",
                "description": "Your portfolio has limited diversification. Adding more assets across different sectors can reduce risk.",
                "confidence_score": 0.85,
                "priority": "medium",
                "details": {
                    "current_assets": len(assets),
                    "recommended_minimum": 5,
                },
            }

        # Check sector concentration
        categories = [getattr(asset, 'category', 'Unknown') for asset in assets]
        unique_categories = len(set(categories))

        if unique_categories < 3 and len(assets) >= 3:
            return {
                "type": "opportunity",
                "title": "Sector Diversification Needed",
                "description": f"Your portfolio is concentrated in {unique_categories} sector(s). Consider adding exposure to other sectors.",
                "confidence_score": 0.80,
                "priority": "medium",
                "details": {
                    "current_sectors": list(set(categories)),
                    "suggested_sectors": ["Healthcare", "Technology", "Finance", "Consumer"],
                },
            }

        return None

    def _generate_market_opportunity(self) -> dict | None:
        """Generate a simulated market opportunity."""
        opportunities = [
            {
                "sector": "Renewable Energy",
                "reason": "Government infrastructure spending and ESG trends",
                "allocation_change": "+2.5%",
            },
            {
                "sector": "Healthcare",
                "reason": "Aging population demographics and innovation",
                "allocation_change": "+3%",
            },
            {
                "sector": "Technology",
                "reason": "AI and cloud computing growth",
                "allocation_change": "+2%",
            },
            {
                "sector": "International Emerging",
                "reason": "Valuations below historical averages",
                "allocation_change": "+4%",
            },
        ]

        # Randomly select one (simulating AI picking best opportunity)
        if random.random() > 0.3:  # 70% chance to generate
            opp = random.choice(opportunities)
            return {
                "type": "opportunity",
                "title": f"Market Opportunity: {opp['sector']}",
                "description": f"{opp['sector']} sector showing strong momentum. {opp['reason']}. Suggested allocation increase: {opp['allocation_change']}",
                "confidence_score": round(random.uniform(0.65, 0.85), 2),
                "priority": "low",
                "details": {
                    "sector": opp["sector"],
                    "allocation_change": opp["allocation_change"],
                    "time_horizon": "6-12 months",
                },
            }

        return None
