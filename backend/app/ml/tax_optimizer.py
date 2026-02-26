"""
Tax Optimization Calculator for ClearFlow

Provides tax-loss harvesting recommendations and tax impact calculations.
"""

from typing import Any
from app.schemas.common import TaxHarvestingOpportunity


# Similar asset replacements for wash sale avoidance
SIMILAR_ASSETS = {
    "AAPL": "XLK",  # Apple -> Tech ETF
    "MSFT": "VGT",  # Microsoft -> Vanguard Tech ETF
    "GOOGL": "QQQ",  # Google -> Nasdaq ETF
    "AMZN": "XLY",  # Amazon -> Consumer Discretionary ETF
    "TSLA": "DRIV",  # Tesla -> EV ETF
    "NVDA": "SMH",  # Nvidia -> Semiconductor ETF
    "META": "SOCL",  # Meta -> Social Media ETF
    "JPM": "XLF",  # JPMorgan -> Financial ETF
    "JNJ": "XLV",  # J&J -> Healthcare ETF
    "XOM": "XLE",  # Exxon -> Energy ETF
}


class TaxOptimizer:
    """Tax optimization calculator."""

    # Tax rates (simplified US rates)
    SHORT_TERM_RATE = 0.32  # Ordinary income rate
    LONG_TERM_RATE = 0.15   # Long-term capital gains
    LOSS_OFFSET_LIMIT = 3000  # Annual loss offset limit

    def find_harvesting_opportunities(
        self,
        assets: list,
        min_loss: float = 100,
    ) -> list[TaxHarvestingOpportunity]:
        """
        Find tax-loss harvesting opportunities in a portfolio.

        Args:
            assets: List of asset objects
            min_loss: Minimum loss amount to consider ($)

        Returns:
            List of harvesting opportunities sorted by potential savings
        """
        opportunities = []

        for asset in assets:
            # Calculate gain/loss
            gain_loss = getattr(asset, 'gain_loss', None)

            if gain_loss is None:
                quantity = getattr(asset, 'quantity', 0)
                avg_cost = getattr(asset, 'average_cost', 0)
                current_price = getattr(asset, 'current_price', avg_cost)

                cost_basis = quantity * avg_cost
                current_value = quantity * current_price
                gain_loss = current_value - cost_basis

            # Only interested in losses
            if gain_loss < -min_loss:
                unrealized_loss = abs(gain_loss)
                symbol = getattr(asset, 'symbol', 'Unknown')

                # Calculate potential tax savings
                # Assume short-term for simplicity
                tax_savings = unrealized_loss * self.SHORT_TERM_RATE

                # Find similar replacement
                replacement = SIMILAR_ASSETS.get(symbol)

                # Check wash sale risk (simplified)
                wash_sale_risk = self._check_wash_sale_risk(asset)

                opportunities.append(TaxHarvestingOpportunity(
                    asset_id=getattr(asset, 'id', 'unknown'),
                    symbol=symbol,
                    unrealized_loss=round(unrealized_loss, 2),
                    potential_tax_savings=round(tax_savings, 2),
                    suggested_replacement=replacement,
                    wash_sale_risk=wash_sale_risk,
                ))

        # Sort by potential savings (highest first)
        opportunities.sort(key=lambda x: x.potential_tax_savings, reverse=True)

        return opportunities

    def _check_wash_sale_risk(self, asset: Any) -> bool:
        """
        Check if there's wash sale risk for an asset.

        A wash sale occurs if you buy substantially identical securities
        within 30 days before or after selling at a loss.
        """
        # Simplified check: always recommend waiting 31 days
        # In production, this would check recent transactions
        return False

    def calculate_tax_impact(
        self,
        proceeds: float,
        cost_basis: float,
        holding_period: str = "short",
    ) -> dict:
        """
        Calculate tax impact of a sale.

        Args:
            proceeds: Sale proceeds
            cost_basis: Original cost basis
            holding_period: "short" (<1 year) or "long" (>1 year)

        Returns:
            Tax impact calculation
        """
        gain_loss = proceeds - cost_basis

        if gain_loss > 0:
            # Gain
            tax_rate = self.SHORT_TERM_RATE if holding_period == "short" else self.LONG_TERM_RATE
            tax_liability = gain_loss * tax_rate
        else:
            # Loss
            # Losses can offset gains, then up to $3000 of ordinary income
            tax_benefit = min(abs(gain_loss), self.LOSS_OFFSET_LIMIT) * self.SHORT_TERM_RATE
            tax_liability = -tax_benefit

        return {
            "proceeds": proceeds,
            "cost_basis": cost_basis,
            "gain_loss": round(gain_loss, 2),
            "holding_period": holding_period,
            "tax_rate": self.SHORT_TERM_RATE if holding_period == "short" else self.LONG_TERM_RATE,
            "tax_liability": round(tax_liability, 2),
            "net_proceeds": round(proceeds - tax_liability, 2),
        }

    def optimize_sale_timing(
        self,
        assets_to_sell: list[dict],
        target_amount: float,
    ) -> dict:
        """
        Optimize which assets to sell to minimize tax impact.

        Args:
            assets_to_sell: List of assets with value, gain_loss, holding_period
            target_amount: Target amount to raise

        Returns:
            Optimized sale plan
        """
        # Sort by tax efficiency (prefer long-term gains and losses)
        sorted_assets = sorted(
            assets_to_sell,
            key=lambda x: (
                # Prioritize: losses > long-term gains > short-term gains
                0 if x.get("gain_loss", 0) < 0 else (
                    1 if x.get("holding_period") == "long" else 2
                ),
                abs(x.get("gain_loss", 0)),
            )
        )

        # Select assets to sell
        selected = []
        running_total = 0
        total_tax = 0

        for asset in sorted_assets:
            if running_total >= target_amount:
                break

            value = asset.get("value", 0)
            gain_loss = asset.get("gain_loss", 0)
            holding_period = asset.get("holding_period", "short")

            # Calculate tax for this asset
            if gain_loss > 0:
                tax_rate = self.SHORT_TERM_RATE if holding_period == "short" else self.LONG_TERM_RATE
                tax = gain_loss * tax_rate
            else:
                tax = gain_loss * self.SHORT_TERM_RATE  # Tax benefit

            selected.append({
                **asset,
                "tax_impact": round(tax, 2),
            })

            running_total += value
            total_tax += tax

        return {
            "target_amount": target_amount,
            "actual_amount": round(running_total, 2),
            "assets_to_sell": selected,
            "total_tax_impact": round(total_tax, 2),
            "net_proceeds": round(running_total - total_tax, 2),
            "recommendations": self._generate_timing_recommendations(selected),
        }

    def _generate_timing_recommendations(self, selected_assets: list) -> list[str]:
        """Generate recommendations for sale timing."""
        recommendations = []

        # Check for short-term positions close to becoming long-term
        for asset in selected_assets:
            if asset.get("holding_period") == "short" and asset.get("gain_loss", 0) > 0:
                recommendations.append(
                    f"Consider waiting for {asset.get('symbol', 'this position')} to become long-term (lower tax rate)"
                )

        # General advice
        if any(a.get("gain_loss", 0) > 0 for a in selected_assets):
            recommendations.append(
                "Consider offsetting gains with tax-loss harvesting"
            )

        if not recommendations:
            recommendations.append(
                "Current sale timing is tax-efficient"
            )

        return recommendations[:3]  # Limit to 3 recommendations
