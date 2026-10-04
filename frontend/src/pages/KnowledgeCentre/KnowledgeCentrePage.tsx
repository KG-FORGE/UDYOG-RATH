import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

const SUGGESTED_QUERIES = [
  'What is Consent to Establish (CTE) under MPCB?',
  'What is the statutory timeline for factory licence renewal?',
  'How does deemed approval work under Maharashtra single window?',
  'What are the fire safety clearance rules for industrial buildings?',
  'What incentives are available for food processing in Ratnagiri?',
  'What is the capital of France?' // deliberately off-topic to demonstrate strict abstention
];

export default function KnowledgeCentrePage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [answerData, setAnswerData] = useState<any | null>(null);
  const [passages, setPassages] = useState<any[]>([]);
  const [corpusSearch, setCorpusSearch] = useState('');
  const [escalated, setEscalated] = useState(false);

  useEffect(() => {
    // Load regulatory corpus
    api.getPassages().then(setPassages).catch((err) => console.error('Corpus load error:', err));
  }, []);

  const handleAsk = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || query;
    if (!q.trim()) return;

    try {
      setLoading(true);
      setAnswerData(null);
      setEscalated(false);
      const res = await api.askAssistant(q);
      setAnswerData(res);
    } catch (err: any) {
      alert('Error fetching regulatory response: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPassages = passages.filter((p) => {
    if (!corpusSearch) return true;
    const term = corpusSearch.toLowerCase();
    return (
      p.title?.toLowerCase().includes(term) ||
      p.authority?.toLowerCase().includes(term) ||
      p.summary?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container" style={{ padding: '24px 0 60px 0' }}>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Regulatory Knowledge Centre & Assistant</h1>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
          Deterministic regulatory search grounded strictly in verified Maharashtra facilitation acts, departmental rules, and statutory timelines.
        </p>
      </div>

      {/* Core Principle Banner */}
      <div className="gov-instruction-box gov-instruction-info" style={{ marginBottom: '24px' }}>
        <strong>Core Principle: Rules decide, AI only explains.</strong> Every legal requirement shown in UDYOGRATH originates from a deterministic, versioned rules engine. This assistant quotes and explains curated regulatory summaries with authoritative citations. When confidence is insufficient, it strictly abstains rather than halluncinating legal guidance.
      </div>

      {/* Question Form Panel */}
      <div className="gov-panel" style={{ marginBottom: '24px' }}>
        <div className="gov-panel-header">Ask Regulatory Compliance Assistant</div>
        <div className="gov-panel-body" style={{ padding: '20px' }}>
          <form onSubmit={handleAsk}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about approvals, Consent to Establish, Fire NOC, Factory Licence, timelines, RTS appeals..."
                style={{ flex: 1, padding: '10px 14px', fontSize: '14px', border: '1px solid var(--border)' }}
              />
              <button
                type="submit"
                className="gov-btn gov-btn-primary"
                style={{ padding: '10px 24px', fontSize: '14px' }}
                disabled={loading}
              >
                {loading ? 'Searching Corpus...' : 'Search Regulatory Rules'}
              </button>
            </div>
          </form>

          {/* Quick Suggestions Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--muted)' }}>Try Sample Queries:</span>
            {SUGGESTED_QUERIES.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(sq);
                  handleAsk(undefined, sq);
                }}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  color: 'var(--navy)'
                }}
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Answer & Citations Box */}
      {answerData && (
        <div
          className="gov-panel"
          style={{
            marginBottom: '32px',
            borderLeft: `4px solid ${
              answerData.abstain
                ? 'var(--danger)'
                : answerData.confidence === 'High'
                ? 'var(--success)'
                : 'var(--blue)'
            }`
          }}
        >
          <div
            className="gov-panel-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>Regulatory Explanation & Citation Dossier</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Confidence Level:</span>
              <span
                className="gov-badge"
                style={{
                  backgroundColor:
                    answerData.confidence === 'High'
                      ? 'var(--success)'
                      : answerData.confidence === 'Medium'
                      ? 'var(--blue)'
                      : 'var(--danger)',
                  color: '#FFFFFF'
                }}
              >
                {answerData.confidence || 'Abstained'}
              </span>
            </div>
          </div>

          <div className="gov-panel-body" style={{ padding: '20px' }}>
            {answerData.abstain ? (
              <div>
                <div className="gov-alert gov-alert-danger" style={{ marginBottom: '16px' }}>
                  <strong>Strict Legal Abstention Triggered:</strong> {answerData.answer}
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--muted)' }}>
                  Under UDYOGRATH safety guidelines, the AI assistant is strictly prohibited from guessing or fabricating answers when the topic is out-of-domain or falls below regulatory retrieval confidence thresholds.
                </p>
                {escalated ? (
                  <div className="gov-alert gov-alert-success">
                    Ticket #HD-8902 has been generated and forwarded to the Maharashtra State Single Window Facilitation Helpdesk for manual administrative response.
                  </div>
                ) : (
                  <button
                    type="button"
                    className="gov-btn gov-btn-secondary"
                    onClick={() => setEscalated(true)}
                  >
                    Escalate Query to Department Helpdesk / Officer
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '20px', color: 'var(--text)' }}>
                  {answerData.answer}
                </div>

                {/* Citations List */}
                {answerData.citations && answerData.citations.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--navy)' }}>
                      Authoritative Regulatory Citations ({answerData.citations.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {answerData.citations.map((c: any, cIdx: number) => (
                        <div
                          key={cIdx}
                          style={{
                            padding: '10px 12px',
                            backgroundColor: 'var(--bg)',
                            border: '1px solid var(--border)',
                            fontSize: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong>[{cIdx + 1}] {c.title}</strong>
                            <span className="gov-badge gov-badge-draft">Summary, not legal text</span>
                          </div>
                          <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>
                            Competent Authority: <strong>{c.authority}</strong> | Section: <strong>{c.section || 'General Rule'}</strong>
                          </div>
                          <p style={{ margin: '4px 0', color: 'var(--text)' }}>{c.summary}</p>
                          {c.url && (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--blue)', textDecoration: 'underline' }}
                            >
                              Verify on Official Government Portal &rarr;
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Regulatory Knowledge Corpus Browser */}
      <div className="gov-panel">
        <div
          className="gov-panel-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>Curated Maharashtra Regulatory Knowledge Corpus ({filteredPassages.length} of {passages.length} records)</span>
        </div>
        <div className="gov-panel-body" style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={corpusSearch}
              onChange={(e) => setCorpusSearch(e.target.value)}
              placeholder="Filter corpus by keyword (e.g. fire, mpcb, boiler, labour, subsidy, deemed)..."
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '12px',
              maxHeight: '600px',
              overflowY: 'auto'
            }}
          >
            {filteredPassages.map((p, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border)',
                  padding: '12px',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--navy)' }}>{p.title}</h4>
                    <span className="gov-badge gov-badge-draft" style={{ fontSize: '10px' }}>
                      {p.authority}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                    {p.summary}
                  </p>
                </div>
                <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--muted)' }}>
                  Tag: <em>Summary, not legal text</em>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
