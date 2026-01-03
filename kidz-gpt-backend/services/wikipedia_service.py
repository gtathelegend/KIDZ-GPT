"""
Wikipedia image fetching service.
Searches Wikipedia for a topic and returns a suitable image URL.
"""

import httpx
import asyncio


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
