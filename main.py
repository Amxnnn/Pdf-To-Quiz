from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader #To extract text from pdf
import google.generativeai as genai
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Literal, Union
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=api_key)

# Define question types as a string literal type
QuestionType = Literal["mcq", "true_false", "short_answer", "long_answer"]

class MCQ(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    type: Literal["mcq"] = "mcq"

class TrueFalse(BaseModel):
    question: str
    correct_answer: bool
    type: Literal["true_false"] = "true_false"

class ShortAnswer(BaseModel):
    question: str
    answer: str
    type: Literal["short_answer"] = "short_answer"

class LongAnswer(BaseModel):
    question: str
    answer: str
    type: Literal["long_answer"] = "long_answer"

class QuizResponse(BaseModel):
    questions: List[Union[MCQ, TrueFalse, ShortAnswer, LongAnswer]]
    question_type: QuestionType

def extract_text_from_pdf(pdf_file):
    try:
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error reading PDF file: {str(e)}")

def generate_questions(text, question_type: QuestionType, num_questions) -> List[MCQ | TrueFalse | ShortAnswer | LongAnswer]:
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        if question_type == "mcq":
            prompt = f"""
            Generate {num_questions} multiple choice questions (MCQs) from the following text. 
            For each question, provide 4 options (A, B, C, D) and mark the correct answer.
            Format each question exactly like this example:
            
            Question: What is the main topic of the text?
            A) Option A
            B) Option B
            C) Option C
            D) Option D
            Correct Answer: A
            
            Important rules:
            1. Each question must have exactly 4 options
            2. Options must be labeled A), B), C), D)
            3. Correct answer must be A, B, C, or D
            4. Make sure the correct answer matches one of the options exactly
            """
        elif question_type == "true_false":
            prompt = f"""
            Generate {num_questions} True/False questions from the following text.
            Format each question exactly like this example:
            
            Question: The text mentions that the sky is blue.
            Correct Answer: True
            
            Important rules:
            1. Each question must be a clear statement that can be verified as True or False
            2. Correct answer must be either True or False
            3. Make sure the answer is clearly supported by the text
            """
        elif question_type == "short_answer":
            prompt = f"""
            Generate {num_questions} short answer questions from the following text.
            Format each question exactly like this example:
            
            Question: What is the main topic of the text?
            Answer: The main topic is climate change and its effects on global ecosystems.
            
            Important rules:
            1. Each question should require a brief, concise answer
            2. Answers should be 1-2 sentences long
            3. Make sure answers are directly supported by the text
            """
        else:  # long_answer
            prompt = f"""
            Generate {num_questions} long answer questions from the following text.
            Format each question exactly like this example:
            
            Question: Explain the main arguments presented in the text about climate change.
            Answer: The text presents several key arguments about climate change. First, it discusses...
            [detailed explanation with multiple points]
            
            Important rules:
            1. Each question should require a detailed, comprehensive answer
            2. Answers should be 3-5 sentences long
            3. Make sure answers cover multiple aspects of the topic
            """
        
        prompt += f"\n\nText: {text[:4000]}" 
        
        logger.info("Sending request to Gemini API")
        response = model.generate_content(prompt)
        logger.info("Received response from Gemini API")
        
        # Parse the response based on question type
        questions = []
        current_question = None
        current_options = []
        current_correct = None
        current_answer = None
        
        for line in response.text.split('\n'):
            line = line.strip()
            if line.startswith('Question:'):
                # Save previous question if exists
                if current_question is not None:
                    if question_type == "mcq" and len(current_options) == 4 and current_correct in ['A', 'B', 'C', 'D']:
                        questions.append(MCQ(
                            question=current_question,
                            options=current_options,
                            correct_answer=current_options[ord(current_correct) - ord('A')]
                        ))
                    elif question_type == "true_false" and current_correct in ['True', 'False']:
                        questions.append(TrueFalse(
                            question=current_question,
                            correct_answer=current_correct == 'True'
                        ))
                    elif question_type in ["short_answer", "long_answer"] and current_answer:
                        question_class = ShortAnswer if question_type == "short_answer" else LongAnswer
                        questions.append(question_class(
                            question=current_question,
                            answer=current_answer
                        ))
                
                current_question = line.replace('Question:', '').strip()
                current_options = []
                current_correct = None
                current_answer = None
            elif question_type == "mcq" and line.startswith(('A)', 'B)', 'C)', 'D)')):
                option_text = line[3:].strip()
                current_options.append(option_text)
            elif question_type == "mcq" and line.startswith('Correct Answer:'):
                current_correct = line.replace('Correct Answer:', '').strip()
            elif question_type == "true_false" and line.startswith('Correct Answer:'):
                current_correct = line.replace('Correct Answer:', '').strip()
            elif question_type in ["short_answer", "long_answer"] and line.startswith('Answer:'):
                current_answer = line.replace('Answer:', '').strip()
        
        # Add the last question
        if current_question is not None:
            if question_type == "mcq" and len(current_options) == 4 and current_correct in ['A', 'B', 'C', 'D']:
                questions.append(MCQ(
                    question=current_question,
                    options=current_options,
                    correct_answer=current_options[ord(current_correct) - ord('A')]
                ))
            elif question_type == "true_false" and current_correct in ['True', 'False']:
                questions.append(TrueFalse(
                    question=current_question,
                    correct_answer=current_correct == 'True'
                ))
            elif question_type in ["short_answer", "long_answer"] and current_answer:
                question_class = ShortAnswer if question_type == "short_answer" else LongAnswer
                questions.append(question_class(
                    question=current_question,
                    answer=current_answer
                ))
        
        # Ensure we have exactly the requested number of questions
        if len(questions) < num_questions:
            logger.warning(f"Generated only {len(questions)} questions, filling with sample questions")
            while len(questions) < num_questions:
                if question_type == "mcq":
                    questions.append(MCQ(
                        question=f"Sample Question {len(questions) + 1}",
                        options=["Option A", "Option B", "Option C", "Option D"],
                        correct_answer="Option A"
                    ))
                elif question_type == "true_false":
                    questions.append(TrueFalse(
                        question=f"Sample Question {len(questions) + 1}",
                        correct_answer=True
                    ))
                elif question_type == "short_answer":
                    questions.append(ShortAnswer(
                        question=f"Sample Question {len(questions) + 1}",
                        answer="Sample answer"
                    ))
                else:
                    questions.append(LongAnswer(
                        question=f"Sample Question {len(questions) + 1}",
                        answer="Sample detailed answer"
                    ))
        
        return questions[:num_questions]  # Return exactly the requested number of questions

    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating questions: {str(e)}")

@app.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(file: UploadFile = File(...), question_type: QuestionType = "mcq", num_questions: int = 10):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    if num_questions < 1 or num_questions > 25:
        raise HTTPException(status_code=400, detail="Number of questions must be between 1 and 25")
    
    try:
        logger.info(f"Processing file: {file.filename}")
        
        text = extract_text_from_pdf(file.file)
        logger.info("Successfully extracted text from PDF")
        
        questions = generate_questions(text, question_type, num_questions)
        logger.info(f"Generated {len(questions)} questions")
        
        # Convert questions to dict format for JSON serialization
        questions_dict = []
        for q in questions:
            try:
                if isinstance(q, MCQ):
                    question_dict = {
                        "type": "mcq",
                        "question": q.question,
                        "options": q.options,
                        "correct_answer": q.correct_answer
                    }
                    logger.debug(f"MCQ question: {question_dict}")
                    questions_dict.append(question_dict)
                elif isinstance(q, TrueFalse):
                    question_dict = {
                        "type": "true_false",
                        "question": q.question,
                        "correct_answer": q.correct_answer
                    }
                    logger.debug(f"True/False question: {question_dict}")
                    questions_dict.append(question_dict)
                elif isinstance(q, (ShortAnswer, LongAnswer)):
                    question_dict = {
                        "type": q.type,
                        "question": q.question,
                        "answer": q.answer
                    }
                    logger.debug(f"{q.type} question: {question_dict}")
                    questions_dict.append(question_dict)
                else:
                    logger.warning(f"Unknown question type: {type(q)}")
            except Exception as e:
                logger.error(f"Error processing question: {str(e)}")
                continue
        
        response_data = {
            "questions": questions_dict,
            "question_type": question_type
        }
        logger.info(f"Response data: {response_data}")
        
        return response_data
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 