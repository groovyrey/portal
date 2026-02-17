'use client'; // This component will use client-side features

import React, { useState, useEffect, useRef } from 'react';

// Define the type for the sentiment analysis result
interface SentimentResult {
  label: string;
  score: number;
}

export default function TransformersTestPage() {
  const [inputText, setInputText] = useState<string>('');
  const [sentiment, setSentiment] = useState<SentimentResult[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Initial loading for model
  const [error, setError] = useState<string | null>(null);

  // Use a ref to store the pipeline to prevent re-initialization on re-renders
  const classifierRef = useRef<any>(null);

  useEffect(() => {
    // Load the sentiment-analysis pipeline only once on component mount
    async function loadPipeline() {
      try {
        setLoading(true);
        setError(null);
        
        // Dynamically import the Transformers.js library
        const { pipeline: loadedPipeline, env: loadedEnv } = await import('@huggingface/transformers');

        // Configure Transformers.js environment after dynamic import
        loadedEnv.allowLocalModels = false;
        // loadedEnv.useWebGPU = true; // Optional: uncomment to try to use WebGPU if available for faster inference

        // This will download the model the first time it's run.
        // Using 'Xenova/distilbert-base-uncased-finetuned-sst-2-english' as it's a common and relatively small model for sentiment analysis.
        const newClassifier = await loadedPipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        classifierRef.current = newClassifier;
      } catch (err: any) {
        console.error('Failed to load Transformers.js pipeline:', err);
        setError(`Failed to load AI model: ${err.message}. Please check console for details.`);
      } finally {
        setLoading(false);
      }
    }

    if (!classifierRef.current) {
      loadPipeline();
    }
  }, []); // Empty dependency array means this effect runs once on mount

  const analyzeSentiment = async () => {
    if (!classifierRef.current) {
      setError('AI model not loaded yet. Please wait for initialization.');
      return;
    }
    if (!inputText.trim()) {
      setSentiment(null); // Clear previous sentiment if input is empty
      setError('Please enter some text to analyze.');
      return;
    }

    try {
      setLoading(true); // Set loading state for analysis
      setError(null);
      // Run sentiment analysis on the input text
      const output: SentimentResult[] = await classifierRef.current(inputText);
      setSentiment(output);
      console.log('Sentiment analysis output:', output);
    } catch (err: any) {
      console.error('Failed to analyze sentiment:', err);
      setError(`Failed to analyze sentiment: ${err.message}`);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  const isModelReady = classifierRef.current !== null;
  const isButtonDisabled = loading || !isModelReady || !inputText.trim();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl transform transition-all duration-300 hover:scale-105">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800">Transformers.js Sentiment Analyzer</h1>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 shadow-md" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="inputText" className="block text-gray-700 text-lg font-semibold mb-3">
            Enter Text for Analysis:
          </label>
          <textarea
            id="inputText"
            className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500 transition-all duration-200 h-40 resize-y"
            placeholder="Type something to analyze its sentiment, e.g., 'This is a fantastic movie, I loved every moment of it!'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!isModelReady && loading}
          ></textarea>
        </div>

        <button
          onClick={analyzeSentiment}
          className={`w-full px-6 py-3 bg-blue-600 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
            isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isButtonDisabled}
        >
          {loading && isModelReady ? 'Analyzing...' : (loading && !isModelReady ? 'Loading AI Model...' : 'Analyze Sentiment')}
        </button>

        {sentiment && (
          <div className="mt-10 p-8 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">Analysis Result:</h2>
            {sentiment.map((item, index) => (
              <p key={index} className="text-xl text-gray-800 mb-2">
                <span className="font-semibold text-blue-700">Label:</span> {item.label}{' '}
                <span className="text-gray-600">(Score: {(item.score * 100).toFixed(2)}%)</span>
              </p>
            ))}
            {sentiment.length > 0 && (
              <p className={`text-4xl mt-6 font-extrabold text-center ${sentiment[0].label === 'POSITIVE' ? 'text-green-700' : 'text-red-700'}`}>
                Overall Sentiment: {sentiment[0].label}
              </p>
            )}
          </div>
        )}

        {loading && !isModelReady && (
          <div className="mt-10 text-center text-gray-600 text-lg p-4 bg-blue-50 rounded-lg shadow-sm">
            <p className="font-semibold mb-2">Loading AI model for the first time...</p>
            <p>This might take a moment. Please be patient.</p>
            <p className="text-sm mt-2">The model will be cached in your browser for faster subsequent use.</p>
          </div>
        )}
      </div>
    </div>
  );
}