"""
NGX live price scraper.

Strategy:
  1. doclib.ngxgroup.com REST API  — NGX's own JSON backend.
     Returns real-time price + change% in one paginated call but only
     covers ~96 actively-quoted stocks (some of our tracked symbols may
     not appear on a given day).

  2. afx.kwayisi.org individual stock pages  — reliable HTML fallback
     for any symbol missing from doclib.  Fetched concurrently.

Both sources are cached together for 15 minutes.
On total failure the service falls back to baseline fundamentals.
"""

import re
import time
import logging
import threading
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

logger = logging.getLogger(__name__)

_LIVE_CACHE: Optional[tuple[dict, float]] = None
_CACHE_TTL = 900   # 15 minutes
_FAIL_TS: float = 0.0
_FAIL_BACKOFF = 120  # don't retry failed sources for 2 minutes
_FETCH_LOCK = threading.Lock()  # prevents concurrent fetch storms on cold cache

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/html, */*",
    "Accept-Language": "en-US,en;q=0.9",
}

# The 20 NGX symbols this service tracks
_TRACKED = {
    "DANGCEM","GTCO","MTNN","ZENITHBANK","ACCESSCORP","SEPLAT","AIRTELAFRI",
    "NESTLE","FBNH","TRANSCORP","STANBIC","UBA","WAPCO","OKOMUOIL","PRESCO",
    "BUACEMENT","BUAFOODS","CONOIL","NPFMCRFBK","FIDELITYBK",
}

_DOCLIB_BASE = "https://doclib.ngxgroup.com/REST/api/statistics/equities/"
_AFX_BASE    = "https://afx.kwayisi.org/ngx/"


def _session() -> requests.Session:
    """Return a requests Session with retry/backoff on connection errors."""
    s = requests.Session()
    retry = Retry(
        total=3,
        connect=3,
        read=3,
        backoff_factor=1.5,          # waits 0s, 1.5s, 3s between attempts
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    s.headers.update(_HEADERS)
    return s


# ---------------------------------------------------------------------------
# Source 1 — doclib.ngxgroup.com  (real-time JSON, ~96 stocks per run)
# ---------------------------------------------------------------------------

def _fetch_doclib() -> dict[str, dict]:
    """
    Paginate through the NGX doclib API (pageSize=50) and return all stocks found.
    Fields used: Symbol, ClosePrice, PercChange, PrevClosingPrice, Volume.
    """
    results: dict[str, dict] = {}
    page = 1
    sess = _session()
    while True:
        url = (
            f"{_DOCLIB_BASE}"
            f"?market=&sector=&orderby=&pageSize=50&pageNo={page}"
        )
        try:
            r = sess.get(url, timeout=15)
            r.raise_for_status()
            rows = r.json()
        except Exception as exc:
            # SSL EOF / connection reset = clean end of pages (server closes after last page)
            err = str(exc)
            if any(k in err for k in ("EOF", "SSL", "RemoteDisconnected", "ConnectionReset", "aborted")):
                logger.debug(f"[NGX scraper] doclib end of pages at page {page}")
            else:
                logger.warning(f"[NGX scraper] doclib page {page} failed: {exc}")
            break

        if not isinstance(rows, list) or not rows:
            break

        for item in rows:
            symbol = str(item.get("Symbol") or "").strip().upper()
            if not symbol:
                continue

            try:
                price = float(item["ClosePrice"] or 0)
            except (TypeError, ValueError, KeyError):
                continue
            if price <= 0:
                continue

            # PercChange is the real-time percentage field; compute from
            # close/prev if it's null (happens when price is unchanged).
            chgp = item.get("PercChange") or item.get("CalculateChangePercent")
            if chgp is not None:
                try:
                    chgp = round(float(chgp), 2)
                except (TypeError, ValueError):
                    chgp = 0.0
            else:
                try:
                    prev = float(item.get("PrevClosingPrice") or price)
                    chgp = round((price - prev) / prev * 100, 2) if prev else 0.0
                except (TypeError, ValueError):
                    chgp = 0.0

            try:
                volume = int(float(item.get("Volume") or 0))
            except (TypeError, ValueError):
                volume = 0

            results[symbol] = {
                "price": round(price, 2),
                "change_pct": chgp,
                "volume": volume,
            }

        page += 1
        time.sleep(0.5)  # be polite between pages

    if results:
        logger.info(f"[NGX scraper] doclib → {len(results)} stocks ({page-1} pages)")
    return results


# ---------------------------------------------------------------------------
# Source 2 — afx.kwayisi.org individual stock pages (HTML)
# ---------------------------------------------------------------------------

# HTML fragment we're parsing (from real page):
#   <abbr title="Dangote Cement">DANGCEM</abbr> •
#   <span style=display:inline-block>1,047.00
#     <span class=hi>▪ 0.00</span>
#   </span>
_PRICE_RE  = re.compile(r'display:inline-block>([\d,]+\.?\d*)\s*<span[^>]*>[^<\d\-]*([-\d,.]+)</span>', re.S)
_VOL_RE    = re.compile(r'Traded\s+Volume\s*([\d,.]+)\s*([KMB]?)', re.I)


def _parse_vol(num_str: str, suffix: str) -> int:
    """Convert '29.1' + 'M' → 29_100_000."""
    try:
        n = float(num_str.replace(",", ""))
        mult = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}.get(suffix.upper(), 1)
        return int(n * mult)
    except ValueError:
        return 0


def _fetch_afx_symbol(symbol: str) -> Optional[dict]:
    """Fetch one stock page from afx.kwayisi.org and return price data."""
    try:
        r = _session().get(f"{_AFX_BASE}{symbol}", timeout=12)
        if r.status_code != 200:
            return None

        html = r.text

        m = _PRICE_RE.search(html)
        if not m:
            return None

        price  = float(m.group(1).replace(",", ""))
        change = float(m.group(2).replace(",", ""))
        prev   = price - change
        chgp   = round(change / prev * 100, 2) if prev else 0.0

        vm = _VOL_RE.search(html)
        volume = _parse_vol(vm.group(1), vm.group(2)) if vm else 0

        return {
            "price": round(price, 2),
            "change_pct": chgp,
            "volume": volume,
        }
    except Exception as exc:
        logger.debug(f"[NGX scraper] afx {symbol}: {exc}")
        return None


def _fetch_afx_batch(symbols: set[str]) -> dict[str, dict]:
    """Fetch a set of symbols from afx in parallel (max 5 concurrent)."""
    results: dict[str, dict] = {}
    if not symbols:
        return results

    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(_fetch_afx_symbol, sym): sym for sym in symbols}
        for future in as_completed(futures):
            sym  = futures[future]
            data = future.result()
            if data:
                results[sym] = data

    if results:
        logger.info(f"[NGX scraper] afx → {len(results)}/{len(symbols)} symbols")
    return results


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_live_prices() -> dict[str, dict]:
    """
    Return live NGX prices for all tracked symbols, refreshing when stale.

    Dict shape: { "DANGCEM": {"price": 1047.0, "change_pct": 0.0, "volume": 388188}, ... }
    Returns {} only when every source fails AND there is no stale cache.
    """
    global _LIVE_CACHE, _FAIL_TS

    now = time.time()

    # Fast path: serve from cache without acquiring the lock
    if _LIVE_CACHE and (now - _LIVE_CACHE[1]) < _CACHE_TTL:
        return _LIVE_CACHE[0]

    # Slow path: only one thread fetches at a time — others wait and reuse the result
    with _FETCH_LOCK:
        # Re-check inside the lock in case another thread just populated the cache
        now = time.time()
        if _LIVE_CACHE and (now - _LIVE_CACHE[1]) < _CACHE_TTL:
            return _LIVE_CACHE[0]

        # Don't hammer sources immediately after a failure
        if _FAIL_TS and (now - _FAIL_TS) < _FAIL_BACKOFF:
            logger.debug(f"[NGX scraper] in backoff, {int(_FAIL_BACKOFF - (now - _FAIL_TS))}s remaining")
            return _LIVE_CACHE[0] if _LIVE_CACHE else {}

        # Step 1: batch fetch from doclib
        data = _fetch_doclib()

        # Step 2: fill any gaps from afx individual pages
        missing = _TRACKED - set(data.keys())
        if missing:
            logger.info(f"[NGX scraper] fetching {len(missing)} missing symbols from afx: {missing}")
            afx_data = _fetch_afx_batch(missing)
            data.update(afx_data)

        if data:
            _LIVE_CACHE = (data, now)
            _FAIL_TS = 0.0
            logger.info(f"[NGX scraper] cache updated: {len(data)} total stocks")
            return data

        _FAIL_TS = now
        logger.warning(f"[NGX scraper] all sources failed — backing off {_FAIL_BACKOFF}s")
        if _LIVE_CACHE:
            logger.info("[NGX scraper] serving stale cache")
            return _LIVE_CACHE[0]

        return {}


def invalidate_cache() -> None:
    """Force a fresh fetch on the next call."""
    global _LIVE_CACHE
    _LIVE_CACHE = None


# ---------------------------------------------------------------------------
# NGX All-Share Index (ASI) from afx.kwayisi.org main page
# ---------------------------------------------------------------------------

# afx main page has this in the first table:
#   243,462.13(+1,316.52)+87,849.10 (56.45%)NGN 157.06Tr
_ASI_VALUE_RE  = re.compile(r'([\d,]+\.\d+)\s*\(([\+\-][\d,.]+)\)')
_ASI_YTD_RE    = re.compile(r'\(([\+\-][\d,.]+)\s*\(([\d.]+)%\)\)')
_MCAP_RE       = re.compile(r'NGN\s*([\d.]+)\s*Tr', re.I)

_ASI_CACHE: Optional[tuple[dict, float]] = None
_ASI_TTL = 900
_ASI_LOCK = threading.Lock()


def get_asi_index() -> Optional[dict]:
    """
    Fetch the NGX All-Share Index summary from afx.kwayisi.org.
    Returns dict with value, change, change_pct, ytd_change_pct, market_cap_trn.
    Returns None on failure.
    """
    global _ASI_CACHE

    now = time.time()
    if _ASI_CACHE and (now - _ASI_CACHE[1]) < _ASI_TTL:
        return _ASI_CACHE[0]

    with _ASI_LOCK:
        now = time.time()
        if _ASI_CACHE and (now - _ASI_CACHE[1]) < _ASI_TTL:
            return _ASI_CACHE[0]

        try:
            r = _session().get(_AFX_BASE, timeout=12)
            r.raise_for_status()
            text = r.text

            m = _ASI_VALUE_RE.search(text)
            if not m:
                return _ASI_CACHE[0] if _ASI_CACHE else None

            value  = float(m.group(1).replace(",", ""))
            change = float(m.group(2).replace(",", ""))
            prev   = value - change
            chgp   = round(change / prev * 100, 2) if prev else 0.0

            ytd_chgp: Optional[float] = None
            ym = _ASI_YTD_RE.search(text)
            if ym:
                try:
                    ytd_chgp = float(ym.group(2))
                    if change < 0:
                        ytd_chgp = -ytd_chgp
                except ValueError:
                    pass

            mcap_trn: Optional[float] = None
            mm = _MCAP_RE.search(text)
            if mm:
                try:
                    mcap_trn = float(mm.group(1))
                except ValueError:
                    pass

            result = {
                "name": "NGX All-Share Index",
                "value": round(value, 2),
                "change": round(change, 2),
                "change_pct": chgp,
                "ytd_change_pct": ytd_chgp,
                "market_cap_trn": mcap_trn,
            }
            _ASI_CACHE = (result, now)
            logger.info(f"[NGX scraper] ASI index: {value:,.2f} ({chgp:+.2f}%)")
            return result

        except Exception as exc:
            logger.warning(f"[NGX scraper] ASI index fetch failed: {exc}")
            return _ASI_CACHE[0] if _ASI_CACHE else None
