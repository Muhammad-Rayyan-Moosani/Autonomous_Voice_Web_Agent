import json
from services.llm import llm_service
from agent.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE

def plan_action(transcript, context_str):
    """
    Takes transcript and context, uses LLM to plan actions.
    Returns structured JSON.
    """
    try:
        # 1. Parse context (it's sent as a JSON string from the extension)
        context = json.loads(context_str)
        
        # 2. Prepare user prompt
        user_prompt = USER_PROMPT_TEMPLATE.format(
            transcript=transcript,
            url=context.get('url', 'Unknown'),
            title=context.get('title', 'Unknown')
        )
        
        # 3. Get LLM completion
        raw_response = llm_service.get_completion(SYSTEM_PROMPT, user_prompt)
        
        if not raw_response:
            return {
                "response": "I'm sorry, I couldn't process that request.",
                "actions": []
            }
        
        # 4. Clean and parse JSON from LLM response (handling potential markdown blocks)
        cleaned_response = raw_response.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:-3].strip()
        elif cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:-3].strip()
            
        return json.loads(cleaned_response)
        
    except Exception as e:
        print(f"Planner Error: {e}")
        return {
            "response": "An error occurred while planning the action.",
            "actions": [],
            "error": str(e)
        }