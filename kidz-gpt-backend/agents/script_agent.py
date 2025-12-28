import json
from vertexai.preview.generative_models import GenerativeModel
from models.schemas import StoryboardSchema
class ScriptAgent:
    def __init__(self):
        self.model = GenerativeModel("gemini-1.5-flash")

    def run(self, intent_json: str, language: str):
        prompt = f"""
        You are an educational animation script generator for children.

        Intent:
        {intent_json}

        Language: {language}

        Rules:
        - Max 5 scenes
        - Simple sentences
        - Visual explanations
        - Output ONLY JSON

        Output format:
        {{
          "scenes": [
            {{
              "scene": 1,
              "background": "...",
              "dialogue": "..."
            }}
          ]
        }}
        """

        response = self.model.generate_content(prompt)
        return response.text

def parse_storyboard(raw_text):
    data = json.loads(raw_text)
    return StoryboardSchema(**data)
