import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChatMessage } from './types';
import DerivativeVisualizer from './components/DerivativeVisualizer';
import { evaluateFunction, generateChartData, numericalDerivative } from './utils/mathUtils';
import { explainPartialDerivative, chatWithMathTutor } from './services/geminiService';

// Icons
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 19.441 18 20.25l-.259-.809a2.25 2.25 0 0 0-1.183-1.183l-.809-.259.809-.259a2.25 2.25 0 0 0 1.183-1.183l.259-.809.259.809a2.25 2.25 0 0 0 1.183 1.183l.809.259-.809.259a2.25 2.25 0 0 0-1.183 1.183Z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>;

const App: React.FC = () => {
  const [funcStr, setFuncStr] = useState<string>('x^2 + y^2');
  const [xVal, setXVal] = useState<number>(1);
  const [yVal, setYVal] = useState<number>(1);
  const [isValidFunc, setIsValidFunc] = useState<boolean>(true);
  
  // AI State
  const [isExplaining, setIsExplaining] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I can help you understand how partial derivatives work. Try moving the sliders or ask me a question!' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Derived Data
  const xData = useMemo(() => generateChartData(funcStr, yVal, 'x', xVal), [funcStr, yVal, xVal]);
  const yData = useMemo(() => generateChartData(funcStr, xVal, 'y', yVal), [funcStr, xVal, yVal]);
  
  const zVal = evaluateFunction(funcStr, xVal, yVal);

  useEffect(() => {
    setIsValidFunc(zVal !== null);
  }, [zVal]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleExplain = async () => {
    setIsExplaining(true);
    try {
      const explanation = await explainPartialDerivative(funcStr, xVal, yVal, 'x'); // explain x for brevity, or ask user? 
      // Let's explain both briefly or just 'x' as default
      const explanationY = await explainPartialDerivative(funcStr, xVal, yVal, 'y');
      
      const combined = `**Partial Derivative with respect to x:**\n${explanation}\n\n---\n\n**Partial Derivative with respect to y:**\n${explanationY}`;
      
      setChatHistory(prev => [...prev, { role: 'model', text: combined }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I couldn't generate an explanation right now.", isError: true }]);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);

    try {
      const response = await chatWithMathTutor(chatHistory, userMsg, { func: funcStr, x: xVal, y: yVal });
      setChatHistory(prev => [...prev, { role: 'model', text: response || "I'm thinking..." }]);
    } catch (error) {
       setChatHistory(prev => [...prev, { role: 'model', text: "Connection error.", isError: true }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Left Panel: Visualization & Controls */}
      <div className="w-full md:w-2/3 p-4 md:p-6 flex flex-col gap-6 overflow-y-auto">
        <header>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Partial Derivatives <span className="text-blue-400">Visualizer</span></h1>
          <p className="text-slate-400 mt-1">Explore how a multivariable function changes as you vary x and y independently.</p>
        </header>

        {/* Function Control */}
        <div className="bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-700">
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-1">Function f(x, y) =</label>
              <div className="relative">
                <input
                  type="text"
                  value={funcStr}
                  onChange={(e) => setFuncStr(e.target.value)}
                  className={`w-full p-3 pr-10 border rounded-lg font-mono text-lg transition-colors bg-slate-900 text-slate-100 
                    ${isValidFunc 
                      ? 'border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none' 
                      : 'border-red-500 focus:ring-red-500/50 bg-red-900/10'}`}
                />
                {!isValidFunc && <span className="absolute right-3 top-3 text-red-400 text-xs font-bold">Invalid</span>}
              </div>
              <p className="text-xs text-slate-500 mt-2">Try typing: <span className="font-mono text-slate-400">sin(x) * cos(y)</span>, <span className="font-mono text-slate-400">exp(-x^2-y^2)</span>, or <span className="font-mono text-slate-400">x^2 - y^2</span></p>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-semibold text-slate-300">Value of x</label>
                <span className="font-mono bg-blue-900/40 text-blue-300 border border-blue-900/50 px-2 rounded">{xVal.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="-3" max="3" step="0.1" 
                value={xVal} onChange={(e) => setXVal(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-semibold text-slate-300">Value of y</label>
                <span className="font-mono bg-green-900/40 text-green-300 border border-green-900/50 px-2 rounded">{yVal.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="-3" max="3" step="0.1" 
                value={yVal} onChange={(e) => setYVal(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DerivativeVisualizer 
            data={xData.data} 
            variable="x" 
            fixedValue={yVal} 
            currentVal={xVal}
            slope={xData.slope}
            funcVal={xData.z0}
          />
          <DerivativeVisualizer 
            data={yData.data} 
            variable="y" 
            fixedValue={xVal} 
            currentVal={yVal}
            slope={yData.slope}
            funcVal={yData.z0}
          />
        </div>
        
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-sm text-center">
          Current Value: <span className="font-mono font-bold text-slate-200">f({xVal.toFixed(2)}, {yVal.toFixed(2)}) = {zVal?.toFixed(4) ?? 'NaN'}</span>
        </div>
      </div>

      {/* Right Panel: AI Tutor */}
      <div className="w-full md:w-1/3 bg-slate-900 md:bg-slate-800 border-l border-slate-700 flex flex-col h-[600px] md:h-screen sticky top-0">
        <div className="p-4 border-b border-slate-700 bg-slate-800 z-10">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <SparklesIcon /> AI Calculus Tutor
          </h2>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-900 md:bg-slate-900/50">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                }`}
              >
                {msg.isError ? (
                   <span className="text-red-400">{msg.text}</span>
                ) : (
                   <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-800">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
             <button 
               onClick={handleExplain}
               disabled={isExplaining}
               className="whitespace-nowrap px-3 py-1.5 bg-indigo-900/30 text-indigo-300 border border-indigo-500/20 text-xs font-semibold rounded-full hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
             >
               {isExplaining ? 'Thinking...' : 'Explain Derivatives Here'}
             </button>
             <button 
                onClick={() => setChatInput("What does the slope represent?")}
                className="whitespace-nowrap px-3 py-1.5 bg-slate-700 text-slate-300 border border-slate-600 text-xs font-semibold rounded-full hover:bg-slate-600 transition-colors"
             >
               What does slope mean?
             </button>
          </div>

          <form onSubmit={handleChatSubmit} className="relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about the graph..."
              className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 text-slate-100 placeholder-slate-500 transition-all text-sm"
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim()}
              className="absolute right-2 top-2 p-1.5 text-blue-400 hover:bg-blue-900/30 rounded-lg disabled:text-slate-600 disabled:hover:bg-transparent transition-colors"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default App;