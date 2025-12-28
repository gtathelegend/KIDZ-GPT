UNSAFE_KEYWORDS = [
    "violence", "blood", "kill", "weapon",
    "adult", "sex", "drugs", "alcohol"
]
BAD_WORDS = ["violence", "blood", "sex", "kill"]
def is_safe(text: str) -> bool:
    lowered = text.lower()
    return not any(word in lowered for word in UNSAFE_KEYWORDS)
