"""
Wikipedia image fetching service.
Searches Wikipedia for a topic and returns a suitable image URL.
"""

import httpx
import asyncio
from urllib.parse import quote


async def fetch_wikipedia_image(keyword: str) -> str | None:
    """
    Fetch a relevant image from Wikipedia for the given keyword.
    
    Returns the image URL or None if not found.
    
    Args:
        keyword: Search term (e.g., "Pen", "Moon", "Photosynthesis")
    
    Returns:
        URL to the Wikipedia image or None
    """
    if not keyword or not keyword.strip():
        return None
    
    keyword = keyword.strip()
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Step 1: Search for the topic on Wikipedia
            search_url = "https://en.wikipedia.org/w/api.php"
            search_params = {
                "action": "query",
                "list": "search",
                "srsearch": keyword,
                "format": "json",
                "srlimit": 1,  # Get top result
            }
            
            search_response = await client.get(search_url, params=search_params)
            search_response.raise_for_status()
            search_data = search_response.json()
            
            results = search_data.get("query", {}).get("search", [])
            if not results:
                print(f"⚠️ No Wikipedia article found for '{keyword}'")
                return None
            
            # Get the page title of the first result
            page_title = results[0].get("title", "")
            if not page_title:
                return None
            
            print(f"🔍 Found Wikipedia article: {page_title}")
            
            # Step 2: Get images from that page
            page_params = {
                "action": "query",
                "titles": page_title,
                "prop": "pageimages",
                "pithumbsize": 500,  # Get 500px thumbnail
                "format": "json",
            }
            
            page_response = await client.get(search_url, params=page_params)
            page_response.raise_for_status()
            page_data = page_response.json()
            
            pages = page_data.get("query", {}).get("pages", {})
            for page_id, page_info in pages.items():
                thumbnail = page_info.get("thumbnail", {})
                image_url = thumbnail.get("source")
                
                if image_url:
                    print(f"✅ Found image: {image_url}")
                    return image_url
            
            print(f"⚠️ No images found in Wikipedia article '{page_title}'")
            return None
            
    except asyncio.TimeoutError:
        print(f"⏱️ Wikipedia image fetch timed out for '{keyword}'")
        return None
    except httpx.RequestError as e:
        print(f"❌ Failed to fetch from Wikipedia: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error fetching Wikipedia image: {e}")
        return None


def _to_wiki_lang(input_lang: str) -> str:
    lang = str(input_lang or "").strip().lower()
    primary = (lang.split("-")[0] if "-" in lang else lang) or "en"
    supported = {"en", "hi", "bn", "ta", "te"}
    return primary if primary in supported else "en"


async def fetch_topic_image_payload(*, query: str, lang: str = "en") -> dict | None:
    """
    Fetch a topic image payload from Wikipedia for a given query and language.

    Returns a dict like: {"imageUrl": str, "title": str, "pageUrl": str}
    or None if no image found.
    """
    q = (query or "").strip()
    if not q:
        return None

    wiki_lang = _to_wiki_lang(lang)
    wiki_base = f"https://{wiki_lang}.wikipedia.org"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            search_params = {
                "action": "query",
                "format": "json",
                "generator": "search",
                "gsrsearch": q,
                "gsrlimit": 1,
                "utf8": 1,
                "redirects": 1,
                "prop": "pageimages|info",
                "inprop": "url",
                "pithumbsize": 800,
            }
            search_url = f"{wiki_base}/w/api.php"
            search_response = await client.get(search_url, params=search_params)
            search_response.raise_for_status()
            search_data = search_response.json()

            pages_obj = (search_data or {}).get("query", {}).get("pages", {})
            pages = list(pages_obj.values()) if isinstance(pages_obj, dict) else []
            page = pages[0] if pages else None

            page_url = page.get("fullurl") if isinstance(page, dict) else ""
            title = page.get("title") if isinstance(page, dict) else q
            image_url = page.get("thumbnail", {}).get("source") if isinstance(page, dict) else ""

            if image_url:
                return {
                    "imageUrl": image_url,
                    "title": title or q,
                    "pageUrl": page_url or "",
                }

            # Fallback: REST summary often has a thumbnail even when pageimages doesn't.
            encoded_title = quote(str(title or q).replace(" ", "_"))
            summary_url = f"{wiki_base}/api/rest_v1/page/summary/{encoded_title}"
            summary_response = await client.get(summary_url)
            summary_response.raise_for_status()
            summary_data = summary_response.json()
            summary_image = (
                (summary_data or {}).get("thumbnail", {}) or {}
            ).get("source") or ((summary_data or {}).get("originalimage", {}) or {}).get("source") or ""

            if summary_image:
                return {
                    "imageUrl": summary_image,
                    "title": (summary_data or {}).get("title") or title or q,
                    "pageUrl": (
                        (summary_data or {}).get("content_urls", {}) or {}
                    ).get("desktop", {}).get("page")
                    or (
                        (summary_data or {}).get("content_urls", {}) or {}
                    ).get("mobile", {}).get("page")
                    or page_url
                    or "",
                }

    except asyncio.TimeoutError:
        print(f"⏱️ Topic image fetch timed out for '{q}'")
    except httpx.RequestError as e:
        print(f"❌ Failed to fetch topic image from Wikipedia: {e}")
    except Exception as e:
        print(f"❌ Unexpected error fetching topic image: {e}")

    return None


async def fetch_wikipedia_images_batch(keywords: list[str]) -> dict[str, str | None]:
    """
    Fetch images for multiple keywords in parallel.
    
    Args:
        keywords: List of search terms
    
    Returns:
        Dictionary mapping keywords to image URLs (or None if not found)
    """
    tasks = [fetch_wikipedia_image(kw) for kw in keywords]
    results = await asyncio.gather(*tasks)
    return {kw: img for kw, img in zip(keywords, results)}
