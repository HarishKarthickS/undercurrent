import { AppIcon, CompanionMascot } from '#web/shared/components/index.js';

const starters = ['I noticed something...', 'Can I ask a why question?', 'Something at school made me curious.'];

export function TalkToPip({ messages = [], text, setText, status, busy, canRecognize, canSynthesize, isListening, isSpeaking, transcript, error, startListening, stopListening, speak, onSubmit, onSubmitTyped, onEnd, terminal }) {
  const thinking = busy || status === 'thinking';
  const controlsDisabled = thinking || isSpeaking;
  return <section className="talk-pip" aria-label="Talk to Pip" aria-busy={thinking || isListening || isSpeaking}>
    <header className="talk-pip-header"><div><div className="talk-pip-brand"><span><AppIcon name="logo" size="sm" decorative /></span><strong>undercurrent</strong></div><p className="eyebrow">Pip&apos;s open chat</p><h1 className="font-display">What is on your mind?</h1><p>Bring a question, a strange idea, or something you noticed. Pip will help you look closer.</p></div><CompanionMascot mood={thinking ? 'thinking' : isListening ? 'listening' : 'welcome'} size="regular" decorative /></header>
    <p className="talk-pip-note"><AppIcon name="info" size="xs" decorative /> Pip is a learning helper, not a person. You never need to share private details.</p>
    {terminal ? terminal : <>
      <div className="talk-thread" aria-live="polite">
        {messages.map((message, index) => <article key={`${message.role}-${index}`} className={`talk-message ${message.role}`}><span>{message.role === 'pip' ? <AppIcon name="logo" size="sm" decorative /> : 'You'}</span><div><p>{message.text}</p>{message.role === 'pip' && <button className="talk-hear" disabled={!canSynthesize || controlsDisabled} onClick={() => speak(message.text)}><AppIcon name="volume" size="xs" decorative /> Hear Pip</button>}</div></article>)}
        {thinking && <article className="talk-message pip talk-typing" role="status"><span><AppIcon name="logo" size="sm" decorative /></span><div><p><i /><i /><i /></p><small>Pip is thinking about what you shared...</small></div></article>}
      </div>
      {error && <p className="voice-alert" role="alert">{error}</p>}
      {isListening && <div className="talk-voice-live" role="status"><span className="activity-dots" aria-hidden="true"><i /><i /><i /></span><div><strong>Pip is listening.</strong><small>{transcript || 'Say your idea, then Pip will take it from there.'}</small></div><button className="text-button" onClick={stopListening}>Stop</button></div>}
      <div className="talk-starters" aria-label="Conversation starters">{starters.map((starter) => <button key={starter} disabled={controlsDisabled || isListening} onClick={() => onSubmit(starter, 'tap')}>{starter}</button>)}</div>
      <form className="talk-composer" onSubmit={onSubmitTyped}><label className="sr-only" htmlFor="talk-to-pip-input">Tell Pip what you are thinking</label><input id="talk-to-pip-input" value={text} onChange={(event) => setText(event.target.value)} placeholder="Tell Pip what you are thinking..." disabled={controlsDisabled || isListening} /><button type="button" className="talk-mic" disabled={(!isListening && controlsDisabled) || !canRecognize} onClick={isListening ? stopListening : startListening}><AppIcon name="mic" size="sm" decorative /><span className="sr-only">{isListening ? 'Stop listening' : 'Talk instead'}</span></button><button className="talk-send" disabled={controlsDisabled || !text.trim()}>{thinking ? 'Pip is thinking...' : 'Send'} <AppIcon name="arrow-right" size="xs" decorative /></button></form>
      <div className="talk-footer"><small>A few thoughtful turns are plenty for now.</small><button className="finish-link" disabled={controlsDisabled} onClick={() => onEnd('child_exit')}>Finish for now</button></div>
    </>}
  </section>;
}
