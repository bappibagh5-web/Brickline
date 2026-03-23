import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const FunnelContext = createContext(null);

export function FunnelProvider({ children }) {
  const [answers, setAnswers] = useState({});

  const setAnswer = useCallback((key, value) => {
    if (!key) return;
    setAnswers((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const hydrateAnswers = useCallback((nextAnswers) => {
    if (!nextAnswers || typeof nextAnswers !== 'object') return;
    setAnswers((prev) => ({
      ...prev,
      ...nextAnswers
    }));
  }, []);

  const value = useMemo(
    () => ({
      answers,
      setAnswer,
      hydrateAnswers
    }),
    [answers, hydrateAnswers, setAnswer]
  );

  return <FunnelContext.Provider value={value}>{children}</FunnelContext.Provider>;
}

export function useFunnel() {
  const context = useContext(FunnelContext);
  if (!context) {
    throw new Error('useFunnel must be used within FunnelProvider');
  }
  return context;
}
