import bgImage from '../assets/bg.svg';

const Work = () => {
  return (
    <div style={{ backgroundImage: `url(${bgImage})` }} className="container mx-auto bg-transparent px-4 py-12 max-w-7xl">
    <h1 className="text-4xl font-bold text-centers w-full flex justify-center items-center text-gray-900 mb-16">How It Works</h1>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
      <div className="bg-[url('src/assets/png3.png')] bg-cover bg-center rounded-lg h-[20rem] shadow-lg overflow-hidden border border-gray-100">
        
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Upload Your PDF</h2>
        <p className="text-gray-700">
          Simply drag and drop your PDF file. Our user-friendly interface makes it a
          breeze to get your study material into the system.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div className="order-2 lg:order-1 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Answer The Questions</h2>
        <p className="text-gray-700">
          Advanced AI scans your PDF, extracts key information, and generates Multiple Choice,
          True/False, Short Answer or Long Answer style questions.
        </p>
      </div>

      <div className="order-1 lg:order-2 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
       
      <div className="bg-[url('src/assets/png1.png')] bg-cover bg-center rounded-lg h-[20rem] shadow-lg overflow-hidden border border-gray-100">
        
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-24 mb-24">
      <div className="bg-[url('src/assets/png2.png')] bg-cover bg-center rounded-lg h-[20rem] shadow-lg overflow-hidden border border-gray-100">
        
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">See Your Results</h2>
        <p className="text-gray-700">
        Instant feedback at your fingertips! After completing the quiz, instantly receive your results. Identify areas for improvement, and solidify your understanding.
        </p>
      </div>
    </div>
  </div>
  )
}

export default Work
