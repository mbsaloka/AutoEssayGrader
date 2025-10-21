from typing import Dict
import requests
import os

AI_TUNNEL_URL = os.getenv("AI_TUNNEL_URL", "https://3775e9493c9d.ngrok-free.app/grade")
DEFAULT_MODEL = os.getenv("AI_MODEL", "qwen2.5:3b-instruct")
TIMEOUT = int(os.getenv("AI_TIMEOUT", "120"))

async def grade_question_via_tunnel(
    question_text: str,
    reference_answer: str,
    student_answer: str,
    question_points: int,
    model: str = DEFAULT_MODEL
) -> Dict:
    payload = {
        "question": question_text,
        "answer_key": reference_answer,
        "student_answer": student_answer,
        "model": model
    }
    
    try:
        print(f"\n🔹 Calling AI tunnel for question grading...")
        response = requests.post(AI_TUNNEL_URL, json=payload, timeout=TIMEOUT)
        response.raise_for_status()
        result = response.json()
        
        final_score_percentage = result.get("final_score", 0.0)
        rubric_scores = result.get("rubric_scores", {})
        embedding_similarity = result.get("embedding_similarity", 0.0)
        feedback = result.get("feedback", "")
        llm_time = result.get("llm_time", 0.0)
        similarity_time = result.get("similarity_time", 0.0)
        
        final_score = round((final_score_percentage / 100) * question_points, 2)
        
        print(f"✅ AI grading completed:")
        print(f"   - Final Score: {final_score}/{question_points} ({final_score_percentage}%)")
        print(f"   - Rubric Scores: {rubric_scores}")
        print(f"   - Embedding Similarity: {embedding_similarity}")
        print(f"   - LLM Time: {llm_time}s, Similarity Time: {similarity_time}s")
        
        return {
            "final_score": final_score,
            "feedback": feedback,
            "rubric_scores": {
                "pemahaman": rubric_scores.get("pemahaman", 0.0),
                "kelengkapan": rubric_scores.get("kelengkapan", 0.0),
                "kejelasan": rubric_scores.get("kejelasan", 0.0),
                "analisis": rubric_scores.get("analisis", 0.0),
                "rata_rata": rubric_scores.get("rata_rata", 0.0),
            },
            "embedding_similarity": embedding_similarity,
            "llm_time": llm_time,
            "similarity_time": similarity_time
        }
    
    except requests.exceptions.Timeout:
        raise RuntimeError(f"AI tunnel request timed out after {TIMEOUT} seconds")
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Failed to connect to AI tunnel at {AI_TUNNEL_URL}: {e}")
    except Exception as e:
        raise RuntimeError(f"Error processing AI tunnel response: {e}")


async def grade_submission_batch_via_tunnel(submission_data: Dict) -> Dict:
    questions = submission_data.get("questions", [])
    answers = submission_data.get("answers", [])
    
    answers_map = {a["question_id"]: a for a in answers}
    
    results = []
    total_score = 0.0
    total_points = 0
    total_llm_time = 0.0
    total_similarity_time = 0.0
    
    aggregate_pemahaman = []
    aggregate_kelengkapan = []
    aggregate_kejelasan = []
    aggregate_analisis = []
    aggregate_similarity = []
    
    print(f"\n{'='*60}")
    print(f"🚀 Starting batch grading for {len(questions)} questions via AI tunnel")
    print(f"{'='*60}")
    
    for idx, question in enumerate(questions, 1):
        question_id = question["question_id"]
        question_text = question["question_text"]
        reference_answer = question["reference_answer"]
        points = question["points"]
        
        answer_data = answers_map.get(question_id)
        student_answer = answer_data["answer_text"] if answer_data else ""
        
        print(f"\n📝 Grading Question {idx}/{len(questions)} (ID: {question_id}, Points: {points})")
        
        try:
            grading_result = await grade_question_via_tunnel(
                question_text=question_text,
                reference_answer=reference_answer,
                student_answer=student_answer,
                question_points=points
            )
            
            results.append({
                "question_id": question_id,
                "final_score": grading_result["final_score"],
                "feedback": grading_result["feedback"],
                "rubric_scores": grading_result["rubric_scores"],
                "embedding_similarity": grading_result["embedding_similarity"],
                "llm_time": grading_result["llm_time"],
                "similarity_time": grading_result["similarity_time"]
            })
            
            total_score += grading_result["final_score"]
            total_points += points
            total_llm_time += grading_result["llm_time"]
            total_similarity_time += grading_result["similarity_time"]
            
            aggregate_pemahaman.append(grading_result["rubric_scores"]["pemahaman"])
            aggregate_kelengkapan.append(grading_result["rubric_scores"]["kelengkapan"])
            aggregate_kejelasan.append(grading_result["rubric_scores"]["kejelasan"])
            aggregate_analisis.append(grading_result["rubric_scores"]["analisis"])
            aggregate_similarity.append(grading_result["embedding_similarity"])
        
        except Exception as e:
            print(f"❌ Error grading question {question_id}: {e}")
            results.append({
                "question_id": question_id,
                "final_score": 0.0,
                "feedback": f"Grading failed: {str(e)}",
                "rubric_scores": {
                    "pemahaman": 0.0,
                    "kelengkapan": 0.0,
                    "kejelasan": 0.0,
                    "analisis": 0.0,
                    "rata_rata": 0.0
                },
                "embedding_similarity": 0.0,
                "llm_time": 0.0,
                "similarity_time": 0.0
            })
            total_points += points
    
    percentage = round((total_score / total_points * 100), 2) if total_points > 0 else 0.0
    num_questions = len(questions)
    
    avg_pemahaman = round(sum(aggregate_pemahaman) / num_questions, 2) if num_questions > 0 else 0.0
    avg_kelengkapan = round(sum(aggregate_kelengkapan) / num_questions, 2) if num_questions > 0 else 0.0
    avg_kejelasan = round(sum(aggregate_kejelasan) / num_questions, 2) if num_questions > 0 else 0.0
    avg_analisis = round(sum(aggregate_analisis) / num_questions, 2) if num_questions > 0 else 0.0
    avg_similarity = round(sum(aggregate_similarity) / num_questions, 2) if num_questions > 0 else 0.0
    
    print(f"\n{'='*60}")
    print(f"🏁 BATCH GRADING COMPLETED")
    print(f"{'='*60}")
    print(f"📊 Total Score: {total_score}/{total_points} ({percentage}%)")
    print(f"📊 Avg Rubrics - P: {avg_pemahaman}, K: {avg_kelengkapan}, KJ: {avg_kejelasan}, A: {avg_analisis}")
    print(f"📊 Avg Similarity: {avg_similarity}")
    print(f"⏱️  Total Time - LLM: {round(total_llm_time, 3)}s, Similarity: {round(total_similarity_time, 3)}s")
    print(f"{'='*60}\n")
    
    return {
        "results": results,
        "total_score": round(total_score, 2),
        "total_points": total_points,
        "percentage": percentage,
        "aggregate_rubrics": {
            "pemahaman": avg_pemahaman,
            "kelengkapan": avg_kelengkapan,
            "kejelasan": avg_kejelasan,
            "analisis": avg_analisis,
            "avg_embedding_similarity": avg_similarity
        },
        "total_llm_time": round(total_llm_time, 3),
        "total_similarity_time": round(total_similarity_time, 3)
    }

