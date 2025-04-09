import bgImage from '../assets/bg.svg';
import { Link } from 'react-router-dom';


const Landing = () => {
   
  return (
    <div  style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center p-8 max-w-2xl">
        <h1 className="text-5xl font-bold mb-6 text-black ">
          PDF to Quiz Generator
        </h1>
        <p className="text-md text-gray-600 mb-8">
          Transform your PDF documents into interactive quizzes in seconds! 
          Choose from multiple choice, true/false, short answer, or long answer questions.
        </p>
        <div className="space-y-4">
          <Link to="/app"
            className="px-5 py-3  text-white rounded-lg text-xl font-semibold bg-black transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Get Started
          </Link>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-md p-6  shadow-md">
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Multiple Choice</h3>
                <p className="text-gray-600 text-sm ">Test knowledge with 4 options per question</p>
            </div>
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-md p-6  shadow-md">
              <h3 className="text-lg font-semibold text-purple-600 mb-2">True/False</h3>
              <p className="text-gray-600 text-sm ">Quick assessment with binary choices</p>
            </div>
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-md p-5  shadow-md">
              <h3 className="text-lg font-semibold text-indigo-600 mb-2">Detailed Answers</h3>
              <p className="text-gray-600 text-sm ">In-depth understanding with short/long answers</p>
            </div>
          </div>
        </div>
     
      </div>
      
    </div>
    </div>
  )
}

export default Landing
