from google.adk.agents import LlmAgent
from vertexai.preview.generative_models import GenerativeModel
import json
from models.schemas import IntentSchema

def parse_intent(raw_text):
    data = json.loads(raw_text)
    return IntentSchema(**data)

class IntentAgent:
    def __init__(self):
        self.model = GenerativeModel("gemini-1.5-flash")

    def run(self, text: str, language: str):
        prompt = f"""
        You are an intent extraction agent for kids learning.

        Input text:
        "{text}"

        Rules:
        - Detect topic
        - Detect question type (why, what, how)
        - Assume child age
        - Output ONLY valid JSON

        Output format:
        {{
          "topic": "...",
          "question_type": "...",
          "difficulty": "child"
        }}
        """

        response = self.model.generate_content(prompt)
        return response.text
