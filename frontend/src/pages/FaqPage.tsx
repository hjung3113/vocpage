import { useEffect, useState } from 'react';
import { listFaqCategories, listFaqs, type FaqCategory, type Faq } from '../api/faqs';

function highlightText(text: string, keyword: string): string {
  if (!keyword.trim()) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark style="background:var(--accent);color:var(--text-primary);border-radius:2px;padding:0 2px;">$1</mark>',
  );
}

export function FaqPage() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load categories once
  useEffect(() => {
    listFaqCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Load FAQs when category changes
  useEffect(() => {
    setIsLoading(true);
    listFaqs(selectedCategoryId ? { category_id: selectedCategoryId } : undefined)
      .then(setFaqs)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [selectedCategoryId]);

  // Client-side keyword filter
  const filtered = keyword.trim()
    ? faqs.filter(
        (f) =>
          f.question.toLowerCase().includes(keyword.toLowerCase()) ||
          f.answer.toLowerCase().includes(keyword.toLowerCase()),
      )
    : faqs;

  const handleTabClick = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setExpandedId(null);
  };

  const handleAccordionToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
        padding: '32px 24px',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: '24px',
          color: 'var(--text-primary)',
        }}
      >
        자주 묻는 질문
      </h1>

      {/* Category tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => handleTabClick(null)}
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            background: selectedCategoryId === null ? 'var(--brand)' : 'var(--bg-panel)',
            color: selectedCategoryId === null ? 'var(--text-on-brand)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          전체
        </button>
        {categories
          .filter((c) => !c.is_archived)
          .map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleTabClick(cat.id)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: selectedCategoryId === cat.id ? 'var(--brand)' : 'var(--bg-panel)',
                color:
                  selectedCategoryId === cat.id ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {cat.name}
            </button>
          ))}
      </div>

      {/* Keyword search */}
      <input
        type="text"
        placeholder="키워드 검색..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text-primary)',
          fontSize: '14px',
          marginBottom: '24px',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />

      {isLoading && <p style={{ color: 'var(--text-muted)' }}>불러오는 중...</p>}

      {!isLoading && filtered.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>검색 결과가 없습니다.</p>
      )}

      {/* Accordion list */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {filtered.map((faq) => {
          const isExpanded = expandedId === faq.id;
          return (
            <li
              key={faq.id}
              style={{
                borderLeft: isExpanded ? '3px solid var(--brand)' : '3px solid transparent',
                borderBottom: '1px solid var(--border)',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Question */}
              <button
                onClick={() => handleAccordionToggle(faq.id)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '14px 16px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    color: 'var(--brand)',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  Q
                </span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightText(faq.question, keyword),
                  }}
                />
              </button>

              {/* Answer */}
              {isExpanded && (
                <div
                  style={{
                    padding: '12px 16px 16px 36px',
                    background: 'var(--bg-surface)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--accent)',
                      fontWeight: 700,
                      marginRight: '10px',
                    }}
                  >
                    A
                  </span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightText(faq.answer, keyword),
                    }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
