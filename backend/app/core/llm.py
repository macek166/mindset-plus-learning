from langchain_openai import ChatOpenAI
from .config import settings

class LLMFactory:
    @staticmethod
    def create_model(temperature: float = 0.0, model_name: str = "gpt-4o"):
        """
        Creates a ChatOpenAI instance with the specified settings.
        Validates API key from settings.
        """
        if not settings.OPENAI_API_KEY:
            # Fallback for dev if key not present, though it will fail on execution if not set
            print("WARNING: OPENAI_API_KEY is not set in environment.")
            
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            openai_api_key=settings.OPENAI_API_KEY
        )

# Global instances for reuse
# "Smart" model for Planning and Evaluation
llm_smart = LLMFactory.create_model(temperature=0.2, model_name="gpt-4o")

# "Fast" model for simple tasks (optional, using smart for now for quality)
llm_fast = LLMFactory.create_model(temperature=0.7, model_name="gpt-4o-mini")
