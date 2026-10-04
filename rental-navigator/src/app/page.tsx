'use client';

import { useState } from 'react';
import { 
  Scale, MapPin, Building, ChevronRight, AlertCircle, 
  Loader2, ArrowRight, ShieldCheck, HelpCircle, FileText, 
  X, ExternalLink, CalendarClock, Activity
} from 'lucide-react';
import { format } from 'date-fns';

export default function Home() {
  // State
  const [address, setAddress] = useState('');
  const [jurisdictionData, setJurisdictionData] = useState<any>(null);
  const [question, setQuestion] = useState('');
  const [answerData, setAnswerData] = useState<any>(null);
  const [validationData, setValidationData] = useState<any>(null);
  const [rawEvidence, setRawEvidence] = useState<any[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState({ geocode: false, answer: false, timeline: false });
  const [targetDate, setTargetDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [timelineMode, setTimelineMode] = useState(false);
  const [timelineData, setTimelineData] = useState<any>(null);

  const SUGGESTED_QUESTIONS = [
    "Can my landlord raise my rent?",
    "Is this property subject to rent control?",
    "How much can my landlord charge as a security deposit?",
    "How much notice is required before eviction?",
    "Can my landlord enter without notice?"
  ];

  // 1. Resolve Address
  const handleGeocode = async (e?: React.FormEvent, presetAddr?: string) => {
    if (e) e.preventDefault();
    const addr = presetAddr || address;
    if (!addr.trim()) return;

    setIsLoading(prev => ({ ...prev, geocode: true }));
    setError(null);
    setJurisdictionData(null);
    setAnswerData(null);
    setTimelineData(null);
    setTimelineMode(false);

    if (presetAddr) setAddress(presetAddr);

    try {
      const res = await fetch('/api/jurisdiction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve address');
      setJurisdictionData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(prev => ({ ...prev, geocode: false }));
    }
  };

  // 2. Get Answer
  const handleAsk = async (e?: React.FormEvent, presetQ?: string, date?: string) => {
    if (e) e.preventDefault();
    const q = presetQ || question;
    if (!q || !jurisdictionData) return;

    setIsLoading(prev => ({ ...prev, answer: true }));
    setError(null);
    setAnswerData(null);
    setTimelineMode(false);

    if (presetQ) setQuestion(presetQ);

    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: jurisdictionData.formatted_address,
          jurisdictions: jurisdictionData.jurisdictions,
          question: q,
          targetDate: date || targetDate
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get answer');
      setAnswerData(data.answer);
      setValidationData(data.validation);
      setRawEvidence(data.evidence);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(prev => ({ ...prev, answer: false }));
    }
  };

  // 3. Compare Timeline
  const handleTimeline = async (futureDate: string) => {
    setTargetDate(futureDate);
    if (!jurisdictionData || !rawEvidence[0]?.topic) return;

    setIsLoading(prev => ({ ...prev, timeline: true }));
    setTimelineMode(true);
    
    try {
      const res = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: jurisdictionData.formatted_address,
          topic: rawEvidence[0].topic,
          dateA: new Date().toISOString(),
          dateB: new Date(futureDate).toISOString()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate timeline');
      setTimelineData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(prev => ({ ...prev, timeline: false }));
    }
  };

  // UI Components
  const EvidenceBadge = () => (
    validationData?.isFullyEvidenceBacked ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-full border border-green-200">
        <ShieldCheck className="w-4 h-4" /> Evidence-backed
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 text-sm font-semibold rounded-full border border-yellow-200">
        <AlertCircle className="w-4 h-4" /> Partially Evidence-backed
      </span>
    )
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setJurisdictionData(null); setAddress(''); setAnswerData(null); }}>
          <Scale className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold tracking-tight">Rental Housing Law Navigator</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        
        {/* Error Toast */}
        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4"/></button>
            </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 1: HOME PAGE (Address Input) */}
        {/* ------------------------------------------------------------------ */}
        {!jurisdictionData && (
          <div className="flex flex-col items-center justify-center mt-12 md:mt-24 space-y-8 max-w-3xl mx-auto text-center animate-in fade-in zoom-in duration-500">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Know the rental rules for <span className="text-blue-600">THIS address.</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 font-light">
              Get address-specific housing-law information, backed by authoritative sources.
            </p>

            <form onSubmit={(e) => handleGeocode(e)} className="w-full relative shadow-sm hover:shadow-md transition">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter property address..."
                className="w-full pl-14 pr-36 py-5 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-lg transition"
              />
              <button 
                type="submit"
                disabled={isLoading.geocode || !address}
                className="absolute right-2 top-2 bottom-2 px-8 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading.geocode ? <Loader2 className="h-5 w-5 animate-spin"/> : 'Search'}
              </button>
            </form>

            <div className="pt-8">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Try Demo Mode</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => handleGeocode(undefined, "123 Main St, San Francisco, CA")} className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition shadow-md flex items-center gap-2">
                  <Building className="w-4 h-4" /> Try San Francisco Demo
                </button>
                <button onClick={() => handleGeocode(undefined, "Apple Park, Cupertino")} className="px-6 py-3 bg-white border border-gray-200 rounded-full font-medium hover:border-blue-300 hover:bg-blue-50 transition text-gray-700 shadow-sm flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" /> Try Cupertino Demo
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-12 max-w-lg italic">
              Legal information, not legal advice. Rental laws can depend on property-specific facts and may change. This tool is intended for research purposes.
            </p>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 2: PROPERTY PAGE & QUESTION INTERFACE */}
        {/* ------------------------------------------------------------------ */}
        {jurisdictionData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Left Context Column */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Property</h3>
                <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-gray-700 mt-0.5" />
                    <div>
                        <p className="font-semibold text-gray-900 leading-tight">
                            {jurisdictionData.location.street || jurisdictionData.location.city}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {jurisdictionData.location.city && `${jurisdictionData.location.city}, `}
                            {jurisdictionData.location.state} {jurisdictionData.location.zip}
                        </p>
                    </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Jurisdiction</h3>
                <div className="space-y-3 relative before:absolute before:inset-y-2 before:left-[7px] before:w-0.5 before:bg-gray-100">
                    {jurisdictionData.jurisdictions.map((j: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 relative z-10">
                            <div className="w-4 h-4 rounded-full bg-white border-2 border-blue-500"></div>
                            <span className="font-medium text-gray-900 text-sm">{j.name}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">{j.level}</span>
                        </div>
                    ))}
                </div>
              </div>

            </div>

            {/* Right Interactive Column */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Question Input */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-6">What would you like to know?</h2>
                
                <form onSubmit={(e) => handleAsk(e)} className="relative mb-8">
                    <input 
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Type your question..."
                        className="w-full pl-5 pr-14 py-4 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg transition"
                    />
                    <button 
                        type="submit"
                        disabled={isLoading.answer || !question}
                        className="absolute right-2 top-2 bottom-2 px-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center"
                    >
                        {isLoading.answer ? <Loader2 className="h-5 w-5 animate-spin"/> : <ArrowRight className="h-5 w-5" />}
                    </button>
                </form>

                {!answerData && !isLoading.answer && (
                    <div>
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Suggested questions</p>
                        <div className="flex flex-col gap-2">
                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleAsk(undefined, q)}
                                    className="text-left px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium hover:border-blue-300 hover:bg-blue-50 transition text-gray-700 flex items-center justify-between group"
                                >
                                    {q}
                                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {isLoading.answer && (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-500 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <p className="font-medium animate-pulse">Researching authoritative sources...</p>
                    </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* VIEW 3: ANSWER PAGE */}
              {/* ------------------------------------------------------------------ */}
              {answerData && !isLoading.answer && !timelineMode && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4">
                  
                  {/* Short Answer Header */}
                  <div className="p-6 md:p-8 bg-blue-50/50 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Short Answer</h3>
                        <EvidenceBadge />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                        {answerData.shortAnswer}
                    </h2>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 md:p-8 space-y-8">
                    
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">What Applies to this Property?</h3>
                        <p className="font-medium text-gray-900">
                            {answerData.applicableJurisdictions.join(' • ')} rules apply.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Explanation</h3>
                        <p className="text-gray-700 leading-relaxed">{answerData.explanation}</p>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Scale className="h-4 w-4" /> Evidence & Citations
                        </h3>
                        
                        {answerData.claims.length > 0 ? (
                            <div className="space-y-4">
                                {answerData.claims.map((claim: any, idx: number) => (
                                    <div key={idx} className={`p-4 rounded-xl border ${claim.isValid ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'}`}>
                                        <p className={`font-medium mb-3 ${claim.isValid ? 'text-gray-900' : 'text-red-900 line-through opacity-75'}`}>
                                            "{claim.text}"
                                        </p>
                                        
                                        {!claim.isValid && (
                                            <p className="text-xs font-bold text-red-600 mb-2 uppercase">⚠️ {claim.validationReason}</p>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            {claim.citations.map((citeId: string) => {
                                                const doc = rawEvidence.find(e => e.documentId === citeId);
                                                if (!doc) return null;
                                                return (
                                                    <button 
                                                        key={citeId}
                                                        onClick={() => setSelectedEvidence(doc)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-700 transition shadow-sm"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        {doc.title.split('-')[0].trim()}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No specific claims were generated.</p>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Confidence</h3>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                    answerData.confidence === 'High' ? 'bg-green-500' :
                                    answerData.confidence === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                                <span className="font-semibold text-gray-700">{answerData.confidence} Confidence</span>
                            </div>
                        </div>
                        {answerData.limitations && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Limitations</h3>
                                <p className="text-sm text-gray-600">{answerData.limitations}</p>
                            </div>
                        )}
                    </div>

                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------ */}
              {/* VIEW 4: FUTURE CHANGES / TIMELINE */}
              {/* ------------------------------------------------------------------ */}
              {answerData && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CalendarClock className="h-6 w-6 text-purple-500" />
                                How could this change?
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">See how the rules might change on a future date.</p>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button 
                                onClick={() => { setTimelineMode(false); setTimelineData(null); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${!timelineMode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Today
                            </button>
                            <button 
                                onClick={() => handleTimeline('2027-01-01')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${timelineMode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Future Date
                            </button>
                        </div>
                    </div>

                    {isLoading.timeline && (
                        <div className="py-8 flex flex-col items-center justify-center text-gray-500">
                            <Activity className="h-6 w-6 animate-pulse text-purple-500 mb-2" />
                            <p className="text-sm font-medium">Computing temporal diff...</p>
                        </div>
                    )}

                    {timelineMode && timelineData && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-purple-50 text-purple-900 p-4 rounded-xl mb-6 font-medium text-sm">
                                {timelineData.explanation}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* CURRENT */}
                                <div className="border border-gray-200 rounded-xl overflow-hidden opacity-75">
                                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 font-bold text-xs uppercase tracking-wider text-gray-500">
                                        Current
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {timelineData.rulesOnDateA.map((d: any) => (
                                            <div key={d.id}>
                                                <p className="font-semibold text-sm mb-1">{d.title}</p>
                                                <p className="text-xs text-gray-500 line-clamp-3">{d.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* FUTURE */}
                                <div className="border border-purple-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-purple-100 px-4 py-2 border-b border-purple-200 font-bold text-xs uppercase tracking-wider text-purple-700">
                                        Future (2027)
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {timelineData.rulesOnDateB.map((d: any) => (
                                            <div key={d.id}>
                                                <p className="font-semibold text-sm mb-1">{d.title}</p>
                                                <p className="text-xs text-gray-600 line-clamp-3">{d.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              )}

            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* EVIDENCE DRAWER */}
      {/* ------------------------------------------------------------------ */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedEvidence(null)}></div>
            <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-right duration-300">
                
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold flex items-center gap-2">
                        <Scale className="h-5 w-5 text-blue-600" /> Source Evidence
                    </h3>
                    <button onClick={() => setSelectedEvidence(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Document Title</h4>
                        <p className="font-semibold text-gray-900 text-lg leading-tight">{selectedEvidence.title}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Jurisdiction</h4>
                            <p className="font-medium text-gray-900 text-sm">{selectedEvidence.jurisdiction}</p>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                selectedEvidence.status === 'CURRENT' ? 'bg-green-100 text-green-700' :
                                selectedEvidence.status === 'FUTURE' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-700'
                            }`}>
                                {selectedEvidence.status}
                            </span>
                        </div>
                        <div className="col-span-2">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Applicable Dates</h4>
                            <p className="text-sm text-gray-700 font-mono">
                                {new Date(selectedEvidence.effectiveFrom).toISOString().split('T')[0]} 
                                <span className="mx-2 text-gray-300">→</span> 
                                {selectedEvidence.effectiveUntil ? new Date(selectedEvidence.effectiveUntil).toISOString().split('T')[0] : 'Present'}
                            </p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Relevant Legal Passage</h4>
                        <div className="bg-amber-50/50 border-l-4 border-amber-300 p-5 text-gray-800 font-serif leading-relaxed text-[15px] rounded-r-xl">
                            {selectedEvidence.relevantText}
                        </div>
                    </div>
                    
                    <a 
                        href={selectedEvidence.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="flex items-center justify-center gap-2 w-full py-4 px-4 border-2 border-gray-200 text-sm font-bold uppercase tracking-widest rounded-xl text-gray-600 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition"
                    >
                        View Official Document <ExternalLink className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
