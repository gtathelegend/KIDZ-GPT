import hashlib

CACHE = {}

def key(text):
    return hashlib.md5(text.encode()).hexdigest()

def get(text):
    return CACHE.get(key(text))

def set(text, value):
    CACHE[key(text)] = value
