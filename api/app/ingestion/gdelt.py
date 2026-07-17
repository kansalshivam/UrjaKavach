from __future__ import annotations

import asyncio
from dataclasses import dataclass

import httpx

GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36"
)
DEFAULT_RATE_LIMIT_COOLDOWN_SECONDS = 15 * 60


@dataclass(frozen=True)
class GdeltArticle:
    title: str
    url: str
    seendate: str | None
    domain: str | None
    language: str | None
    source_country: str | None
    is_synthetic: bool = False


class GdeltRateLimitedError(RuntimeError):
    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(f"GDELT rate limited; retry after {retry_after_seconds} seconds")
        self.retry_after_seconds = retry_after_seconds


async def fetch_gdelt_articles(
    query: str,
    timespan: str = "24h",
    maxrecords: int = 250,
) -> list[GdeltArticle]:
    params = {
        "query": query,
        "mode": "artlist",
        "format": "json",
        "timespan": timespan,
        "maxrecords": str(maxrecords),
        "sort": "datedesc",
    }
    headers = {"User-Agent": USER_AGENT}
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(GDELT_DOC_URL, params=params, headers=headers)
        if response.status_code == 429:
            retry_after = _retry_after_seconds(response)
            raise GdeltRateLimitedError(retry_after)
        response.raise_for_status()
        payload = response.json()

    return [
        GdeltArticle(
            title=item.get("title", ""),
            url=item.get("url", ""),
            seendate=item.get("seendate"),
            domain=item.get("domain"),
            language=item.get("language"),
            source_country=item.get("sourcecountry"),
        )
        for item in payload.get("articles", [])
    ]


def _retry_after_seconds(response: httpx.Response) -> int:
    raw_retry_after = response.headers.get("Retry-After", "").strip()
    if raw_retry_after.isdigit():
        return max(int(raw_retry_after), 1)
    return DEFAULT_RATE_LIMIT_COOLDOWN_SECONDS


def is_article_relevant(title: str, corridor: str) -> bool:
    """Filter GDELT articles to ensure they are topically relevant to their corridor.

    Excludes stock market summaries, indices, and equities wraps, except when they
    contain strong corridor-specific keywords or direct chokepoint actions.
    Supports English, Arabic, Farsi, Chinese (Simplified & Traditional), and Korean scripts.
    """
    title_lower = title.lower()

    # General chokepoint and energy keywords (multilingual)
    general_positive = [
        # English
        "oil", "tanker", "shipping", "blockade", "sanctions", "crude", 
        "brent", "chokepoint", "vessel", "maritime", "cargo", "strait", "fleet", "conflict",
        # Arabic
        "نفط", "بترول", "ناقلة", "شحن", "حصار", "عسكري", "ضربة", "صراع", "مضيق", "الخليج",
        # Farsi
        "نفت", "نفت‌کش", "کشتیرانی", "محاصره", "نظامی", "حمله", "درگیری", "تنگه", "خلیج",
        # Chinese (Simplified & Traditional)
        "石油", "原油", "油轮", "油輪", "航运", "航運", "封锁", "封鎖", "军事", "軍事", "打击", "打擊", "袭击", "襲擊", "冲突", "衝突", "海峡", "海峽", "海湾", "海灣",
        # Korean
        "석유", "원유", "유조선", "해운", "선박", "봉쇄", "군사", "공격", "타격", "갈등", "충돌", "해협", "걸프", "피격"
    ]

    # Corridor-specific positive keywords (multilingual)
    corridor_positive = []
    if corridor == "hormuz":
        corridor_positive = [
            "hormuz", "iran", "irgc", "tehran", "persian", "gulf", "centcom", "iraq",
            "هرمز", "إيران", "ايران", "الحرس الثوري", "طهران", "العراق",
            "ایران", "سپاه", "تهران", "عراق",
            "霍尔木兹", "霍爾木茲", "伊朗", "革命卫队", "革命衛隊", "德黑兰", "德黑蘭", "伊拉克",
            "이란", "혁명수비대", "테헤란", "이라크"
        ]
    elif corridor == "non_hormuz_west_africa":
        corridor_positive = [
            "mandeb", "red sea", "nigeria", "pirate", "houthi", "aden", "suez", "yemen", "africa",
            "مندب", "البحر الأحمر", "نيجيريا", "قرصان", "الحوثي", "عدن", "السويس", "اليمن", "أفريقيا",
            "یمن", "عدن", "حوثی", "سرخ", "نیجریه",
            "曼德", "红海", "尼日利亚", "海盗", "胡塞", "亚丁", "苏伊士", "也门", "非洲",
            "만데브", "홍해", "나이지리아", "해적", "후티", "아덴", "수에즈", "예멘", "아프리카"
        ]
    elif corridor == "non_hormuz_americas":
        corridor_positive = [
            "mexico", "venezuela", "panama", "pipeline", "us oil", "refinery", "shale", "gulf coast", "guyana", "exxon",
            "المكسيك", "فنزويلا", "بنما", "أنبوب", "مصفاة", "غويانا",
            "مکزیک", "ونزوئلا", "پاناما", "خط لوله", "پالایشگاه", "گویان",
            "墨西哥", "委内瑞拉", "巴拿马", "管道", "炼油", "圭亚那", "埃克森",
            "멕시코", "베네수엘라", "파나마", "파이프라인", "정유소", "가이아나", "엑손"
        ]
    elif corridor == "non_hormuz_russia":
        corridor_positive = [
            "russia", "sokol", "urals", "moscow", "kremlin", "putin", "ukraine",
            "روسيا", "سوكول", "أورال", "موسكو", "بوتين", "أوكرانيا",
            "روسیه", "سوکل", "اورال", "مسکو", "پوتین", "اوکراین",
            "俄罗斯", "索科尔", "乌拉尔", "莫斯科", "普京", "乌克兰",
            "러시아", "소콜", "우랄", "모스크바", "푸틴", "우크라이나"
        ]

    has_corridor_pos = any(k in title_lower for k in corridor_positive)
    has_general_pos = any(k in title_lower for k in general_positive)

    # Must contain at least one positive keyword
    if not (has_corridor_pos or has_general_pos):
        return False

    # Stock market index/boilerplate exclusions (multilingual)
    exclusions = [
        # English
        "ihsg", "indonesian stock", "stock market", "wall street", "bursa", 
        "equities close", "market closing", "dow jones", "nasdaq", "stock exchange",
        "brent price freezes", "s&p 500", "ftse",
        # Arabic
        "البورصة", "سوق الأسهم", "إغلاق السوق", "مؤشر",
        # Farsi
        "بورس", "بازار سهام", "شاخص",
        # Chinese
        "股市", "收盘", "证券交易所", "股指", "指数", "沪指", "恒指",
        # Korean
        "증시", "주가", "코스피", "코스닥", "폐장", "마감"
    ]
    has_exclusion = any(ex in title_lower for ex in exclusions)

    if has_exclusion:
        # Keep only if it contains a strong corridor-specific term OR a direct oil/tanker chokepoint term
        strong_markers = corridor_positive + [
            "oil", "tanker", "blockade", "sanctions", "crude", "brent", "chokepoint",
            "نفط", "ناقلة", "حصار", "عقوبات",
            "نفت", "نفت‌کش", "محاصره", "تحریم",
            "石油", "原油", "油轮", "封锁", "制裁",
            "석유", "원유", "유조선", "봉쇄", "제재"
        ]
        if any(sm in title_lower for sm in strong_markers):
            return True
        return False

    return True
