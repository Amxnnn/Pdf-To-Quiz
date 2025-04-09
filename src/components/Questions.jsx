import React, { useState } from 'react';
import axios from 'axios';
import Border from '../static/Border';
import bgImage from '../assets/bg.svg';
const Questions = () => {
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [questionType, setQuestionType] = useState('mcq');
  const [showAnswers, setShowAnswers] = useState({});
  const [testStats, setTestStats] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5); // Default to 5 questions


  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setQuestions([]);
    setAnswers({});
    setScore(null);
    setShowReview(false);
    setCorrectAnswers({});

    setShowAnswers({});
  };

  const handleQuestionTypeChange = (e) => {
    setQuestionType(e.target.value);
  };

  const handleNumQuestionsChange = (e) => {
    const value = e.target.value === '' ? '' : parseInt(e.target.value);
    setNumQuestions(value);
  };

  const handleNumQuestionsBlur = () => {
    if (numQuestions === '' || isNaN(numQuestions)) {
      setNumQuestions(5); 
    } else if (numQuestions < 1) {
      setNumQuestions(1);
    } else if (numQuestions > 25) {
      setNumQuestions(25);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file');
      return;
    }
    if (numQuestions === '' || isNaN(numQuestions) || numQuestions < 1 || numQuestions > 25) {
      setError('Number of questions must be between 1 and 25');
      return;
    }

    setLoading(true);
    setError('');
    setQuestions([]);
    setScore(null);
    setShowReview(false);
    setCorrectAnswers({});
    setShowAnswers({});

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`http://localhost:8000/generate-quiz?question_type=${questionType}&num_questions=${numQuestions}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Server response:', response.data);

      if (!response.data) {
        console.error('Empty response from server');
        setError('Empty response from server. Please try again.');
        return;
      }

      if (!response.data.questions) {
        console.error('No questions in response:', response.data);
        setError('No questions in response. Please try again.');
        return;
      }

      if (!Array.isArray(response.data.questions)) {
        console.error('Questions is not an array:', response.data.questions);
        setError('Invalid questions format. Please try again.');
        return;
      }

      if (response.data.questions.length === 0) {
        console.error('Empty questions array');
        setError('No questions were generated. Please try again.');
        return;
      }

      // validate question
      const validQuestions = response.data.questions.filter(q => {
        if (!q.type || !q.question) {
          console.error('Invalid question format:', q);
          return false;
        }
        if (q.type === 'mcq' && (!Array.isArray(q.options) || !q.correct_answer)) {
          console.error('Invalid MCQ format:', q);
          return false;
        }
        if (q.type === 'true_false' && typeof q.correct_answer !== 'boolean') {
          console.error('Invalid True/False format:', q);
          return false;
        }
        if ((q.type === 'short_answer' || q.type === 'long_answer') && !q.answer) {
          console.error('Invalid answer format:', q);
          return false;
        }
        return true;
      });

      if (validQuestions.length === 0) {
        console.error('No valid questions after filtering');
        setError('No valid questions were generated. Please try again.');
        return;
      }

      console.log('Setting questions:', validQuestions);
      setQuestions(validQuestions);
    } catch (err) {
      console.error('Error details:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.detail || 'Error generating quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, selectedAnswer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedAnswer,
    }));
  };

  const toggleShowAnswer = (questionIndex) => {
    setShowAnswers(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }));
  };

  const calculateScore = () => {
    if (!questions || questions.length === 0) return;

    let correct = 0;
    let incorrect = 0;
    const correctAnswersMap = {};
    
    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      let isCorrect = false;

      if (question.type === 'mcq') {
        isCorrect = userAnswer === question.correct_answer;
      } else if (question.type === 'true_false') {
        isCorrect = userAnswer === question.correct_answer;
      }
      
      if (isCorrect) {
        correct++;
      } else {
        incorrect++;
      }
      
      correctAnswersMap[index] = {
        userAnswer,
        correctAnswer: question.type === 'mcq' ? question.correct_answer : 
                      question.type === 'true_false' ? question.correct_answer : 
                      question.answer,
        isCorrect
      };
    });
    
    setCorrectAnswers(correctAnswersMap);
    // Only calculate score for MCQ and True/False questions
    const scoredQuestions = questions.filter(q => q.type === 'mcq' || q.type === 'true_false');
    const calculatedScore = scoredQuestions.length > 0 ? (correct / scoredQuestions.length) * 100 : 0;
    setScore(calculatedScore);
    
    setTestStats({
      total: scoredQuestions.length,
      correct,
      incorrect,
      accuracy: calculatedScore
    });
    
    setShowReview(true);
  };

  const getOptionLabel = (optionIndex) => {
    return String.fromCharCode(65 + optionIndex);
  };

  const getAnswerClass = (questionIndex, option) => {
    if (!showReview) return '';
    
    const review = correctAnswers[questionIndex];
    if (!review) return '';
    
    if (option === review.correctAnswer) {
      return 'bg-green-100 border-green-500 animate-pulse';
    } else if (option === review.userAnswer && !review.isCorrect) {
      return 'bg-red-100 border-red-500';
    }
    return '';
  };


  const renderQuestion = (question, index) => {
    if (!question) return null;

    if (question.type === 'mcq') {
      return (
        <div key={index} className="mb-6 p-4 border rounded-lg">
          <p className="font-medium mb-2">{index + 1}. {question.question}</p>
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <label 
                key={optionIndex} 
                className={`flex items-center space-x-2 p-3 border rounded cursor-pointer ${getAnswerClass(index, option)}`}
              >
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={option}
                  onChange={() => handleAnswerSelect(index, option)}
                  className="form-radio h-4 w-4 text-blue-600"
                  disabled={showReview}
                />
                <span className="font-medium">{getOptionLabel(optionIndex)}. {option}</span>
              </label>
            ))}
          </div>
          {showReview && (
            <div className="mt-2 text-sm">
              {correctAnswers[index]?.isCorrect ? (
                <span className="text-green-600 font-bold">✓ Correct! 🎉</span>
              ) : (
                <span className="text-red-600 font-bold">
                  ✗ Incorrect. Correct answer: {correctAnswers[index]?.correctAnswer}
                </span>
              )}
            </div>
          )}
        </div>
      );
    } else if (question.type === 'true_false') {
      return (
        <div key={index} className="mb-6 p-4 border rounded-lg">
          <p className="font-medium mb-2">{index + 1}. {question.question}</p>
          <div className="space-y-2">
            {[true, false].map((option) => (
              <label 
                key={option.toString()} 
                className={`flex items-center space-x-2 p-3 border rounded cursor-pointer ${getAnswerClass(index, option)}`}
              >
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={option}
                  onChange={() => handleAnswerSelect(index, option)}
                  className="form-radio h-4 w-4 text-blue-600"
                  disabled={showReview}
                />
                <span className="font-medium">{option ? 'True' : 'False'}</span>
              </label>
            ))}
          </div>
          {showReview && (
            <div className="mt-2 text-sm">
              {correctAnswers[index]?.isCorrect ? (
                <span className="text-green-600 font-bold">✓ Correct! 🎉</span>
              ) : (
                <span className="text-red-600 font-bold">
                  ✗ Incorrect. Correct answer: {correctAnswers[index]?.correctAnswer ? 'True' : 'False'}
                </span>
              )}
            </div>
          )}
        </div>
      );
    } else {
      // Short answer or long answer
      return (
        <div key={index} className="mb-6 p-4 border rounded-lg">
          <p className="font-medium mb-2">{index + 1}. {question.question}</p>
          <button
            onClick={() => toggleShowAnswer(index)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {showAnswers[index] ? 'Hide Answer' : 'Show Answer'}
          </button>
          {showAnswers[index] && (
            <div className="mt-2 p-3 bg-gray-50 rounded">
              <p className="text-gray-700">{question.answer}</p>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div  style={{ backgroundImage: `url(${bgImage})` }} className="min-h-screen  py-8 px-4">
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-black">
          PDF to Quiz Generator
        </h1>
        <p className="text-center text-gray-600 mb-8">Test your knowledge in a fun way! </p>
        <Border className='bg-white' >
          <div className="text-gray-500 min-h-[250px] pt-3  ">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload PDF File
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[#9CA3AF] hover:file:bg-gray-700   file:text-white
                    "
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={questionType}
                  onChange={handleQuestionTypeChange}
                  className="block w-full p-2 border rounded-md"
                >
                  <option value="mcq">Multiple Choice Questions</option>
                  <option value="true_false">True/False Questions</option>
                  <option value="short_answer">Short Answer Questions</option>
                  <option value="long_answer">Long Answer Questions</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions (1-25)
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={numQuestions}
                  onChange={handleNumQuestionsChange}
                  onBlur={handleNumQuestionsBlur}
                  className="block w-full p-2 border rounded-md"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black  text-white py-3 px-4 rounded-md  hover:bg-[#4C4C4C] disabled:opacity-50"
              >
                {loading ? 'Generating Quiz...' : 'Generate Quiz'}
              </button>
            </form>
          </div>
        </Border>
        {error && (
          <div className="bg-red-100 border mt-4 border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {questions && questions.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Quiz Questions</h2>
              
            </div>

            {questions.map((question, index) => renderQuestion(question, index))}

            {(questionType === 'mcq' || questionType === 'true_false') && (
              <button
                onClick={calculateScore}
                disabled={Object.keys(answers).length !== questions.length || showReview}
                className={`w-full py-3 px-4 rounded-md text-white ${
                  Object.keys(answers).length !== questions.length || showReview
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                }`}
              >
                {Object.keys(answers).length !== questions.length
                  ? 'Please answer all questions'
                  : showReview
                  ? 'Quiz Submitted'
                  : 'Submit Quiz'}
              </button>
            )}
          </div>
        )}

        {score !== null && (questionType === 'mcq' || questionType === 'true_false') && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                Test Results
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Correct Answers</p>
                  <p className="text-2xl font-bold text-green-600">{testStats.correct}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Incorrect Answers</p>
                  <p className="text-2xl font-bold text-red-600">{testStats.incorrect}</p>
                </div>
                <div className="bg-purple-50 p-4 px-8 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-2xl font-bold text-purple-600">{testStats.accuracy.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Questions