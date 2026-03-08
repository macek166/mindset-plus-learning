import json
from ..core.llm import llm_client
from ..services.database import db_service

class ConceptExtractor:
    async def extract_and_save(self, user_text: str, node_content: str, user_id: str, node_id: str):
        """
        Extracts concepts from the user's successful essay/test and saves them to the DB.
        """
        prompt = f"""
        You are an expert knowledge curator. 
        Analyze the following successful student answer and the original lesson content.
        Extract key concepts that the student has demonstrated mastery of.
        
        Return a JSON object with a list of "concepts". Each concept must have:
        - "term": The name of the concept (Term, Person, Theory, or Skill).
        - "definition": A concise, 1-sentence definition based on the context.
        - "category": One of "TERM", "PERSON", "THEORY", "SKILL".
        
        LESSON CONTENT:
        {node_content}
        
        STUDENT ANSWER:
        {user_text}
        
        JSON OUTPUT ONLY.
        """
        
        try:
            # Call LLM
            response = await llm_client.generate(prompt)
            
            # Parse JSON
            # Clean possible markdown fencing
            cleaned_response = response.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned_response)
            concepts = data.get("concepts", [])
            
            if not concepts:
                print("No concepts extracted.")
                return

            # Prepare records for DB
            records = []
            for c in concepts:
                records.append({
                    "user_id": user_id,
                    "node_id": node_id,
                    "term": c["term"],
                    "definition": c["definition"],
                    "category": c["category"].upper() # Ensure backend matches DB enum content if possible, mainly validation
                })
            
            # Insert into Supabase
            if records:
                db_service.client.table("saved_concepts").insert(records).execute()
                print(f"✅ Successfully saved {len(records)} concepts to Knowledge Base.")
                
        except Exception as e:
            print(f"❌ Error in ConceptExtractor: {e}")
            # Non-blocking error, we don't want to fail the user's test just because extraction failed
            pass

concept_extractor = ConceptExtractor()
