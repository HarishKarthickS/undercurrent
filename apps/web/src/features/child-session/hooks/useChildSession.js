import { useEffect, useState } from 'react';

export function useChildSession({ session, busy, onSubmitTurn, onEnd }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle');
  const [morningStep, setMorningStep] = useState('mood');
  const [mood, setMood] = useState('');
  const [response, setResponse] = useState(session.openingPrompt);
  const [quest, setQuest] = useState(session.quest ?? null);
  const [messages, setMessages] = useState([{ role: 'pip', text: session.openingPrompt }]);
  useEffect(() => { setResponse(session.openingPrompt); setStatus('idle'); setText(''); setQuest(session.quest ?? null); setMessages([{ role: 'pip', text: session.openingPrompt }]); }, [session.sessionId, session.openingPrompt, session.quest]);
  async function submit(words, inputMode) { if (!words.trim() || busy) return; const answer = words.trim(); setMessages((current) => [...current, { role: 'student', text: answer, inputMode }]); setStatus('thinking'); try { const result = await onSubmitTurn(answer, inputMode); if (result?.message) { setResponse(result.message); setMessages((current) => [...current, { role: 'pip', text: result.message }]); if (result.questState) setQuest(result.questState); setStatus(result.terminal ? (result.parentNotification ? 'safety-ended' : 'ended') : 'idle'); } else setStatus('fallback'); } catch { setStatus('fallback'); } }
  async function submitTyped(event) { event.preventDefault(); const answer = text; setText(''); await submit(answer, 'typed'); }
  const chooseMood = (nextMood) => { setMood(nextMood); setMorningStep('sendoff'); };
  async function chooseSendOff(choice) { setResponse(`A ${mood.toLowerCase()} start is welcome. ${choice}. See you at your next routine moment.`); setMorningStep('complete'); setStatus('completed'); await onEnd('completed'); }
  return { text, setText, status, setStatus, morningStep, mood, response, setResponse, quest, messages, submit, submitTyped, chooseMood, chooseSendOff };
}
