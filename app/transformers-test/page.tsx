'use client'; // This component will use client-side features

import React, { useState, useEffect, useRef } from 'react';
import { pipeline, env } from '@huggingface/transformers';

// Configure Transformers.js environment for browser usage
// This tells Transformers.js where to store models (e.g., IndexedDB in the browser)
// and can optionally configure WebGPU for faster inference.
env.allowLocalModels = false; // Generally, don't allow local disk access in browser
// env.useWebGPU = true; // Optional: uncomment to try to use WebGPU if available for faster inference

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
        // This will download the model the first time it's run.
        // Using 'Xenova/distilbert-base-uncased-finetuned-sst-2-english' as it's a common and relatively small model for sentiment analysis.
        const newClassifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
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
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Transformers.js Sentiment Analysis Test</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="inputText" className="block text-gray-700 text-sm font-bold mb-2">
          Enter Text:
        </label>
        <textarea
          id="inputText"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
          placeholder="Type something to analyze its sentiment, e.g., 'This is a fantastic movie!'"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={!isModelReady && loading} // Disable while initial model loading
        ></textarea>
      </div>

      <button
        onClick={analyzeSentiment}
        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
          isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={isButtonDisabled}
      >
        {loading && isModelReady ? 'Analyzing...' : (loading && !isModelReady ? 'Loading Model...' : 'Analyze Sentiment')}
      </button>

      {sentiment && (
        <div className="mt-8 p-4 border rounded shadow-sm bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Analysis Result:</h2>
          {sentiment.map((item, index) => (
            <p key={index} className="text-lg">
              <span className="font-medium">Label:</span> {item.label} (Score: {(item.score * 100).toFixed(2)}%)
            </p>
          ))}
          {/* Display overall sentiment based on the highest scoring label */}
          {sentiment.length > 0 && (
            <p className={`text-2xl mt-4 font-bold ${sentiment[0].label === 'POSITIVE' ? 'text-green-600' : 'text-red-600'}`}>
              Overall Sentiment: {sentiment[0].label}
            </p>
          )}
        </div>
      )}

      {loading && !isModelReady && (
        <div className="mt-8 text-center text-gray-500">
          <p>Loading AI model for the first time... This might take a moment. Please be patient.</p>
          <p>The model will be cached for faster subsequent use.</p>
        </div>
      )}
    </div>
  );
}
