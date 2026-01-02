from pydantic import BaseModel
from typing import List

class IntentSchema(BaseModel):
    topic: str
    question_type: str
    difficulty: str

class SceneSchema(BaseModel):
    scene: int
    background: str
    dialogue: str

class StoryboardSchema(BaseModel):
    scenes: List[SceneSchema]


class ExplainerSchema(BaseModel):
    title: str
    summary: str
    points: List[str]


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correctAnswer: int
