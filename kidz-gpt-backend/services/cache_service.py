import hashlib

CACHE = {}

def key(text):
    return hashlib.md5(text.encode()).hexdigest()

def get(text):
    return CACHE.get(key(text))

def set(text, value):
    CACHE[key(text)] = value


def get_by_key(cache_key: str):
    return CACHE.get(cache_key)


def set_by_key(cache_key: str, value):
    CACHE[cache_key] = value
