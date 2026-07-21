import { useEffect, useMemo, useState } from 'react';
import { AppIcon, StudentMark } from '#web/shared/components/index.js';

const bandForGrade = (grade) => {
  const value = String(grade ?? '').trim().toLowerCase();
  const number = Number.parseInt(value.replace(/^grade\s*/, ''), 10);
  if (['pre-k', 'prek', 'kindergarten', 'k'].includes(value) || (Number.isInteger(number) && number <= 2)) return 'early';
  if (Number.isInteger(number) && number >= 7) return 'independent';
  return 'explorer';
};

const bands = {
  early: { title: 'Guided reader', copy: 'Short phrases, big tap choices, and a little more read-aloud support.' },
  explorer: { title: 'Independent explorer', copy: 'Playful choices, short reflections, and room to explain an idea.' },
  independent: { title: 'More independent', copy: 'Quieter visuals, more ownership, and direct reflection prompts.' }
};

function ChildrenDirectory({ profiles, onAddChild, onOpenProfile }) {
  return <section className="children-directory" aria-labelledby="children-directory-title">
    <header className="children-directory-header">
      <div><p className="eyebrow">Family control center</p><h1 id="children-directory-title" className="font-display">Your children</h1><p>Choose a trail to continue, or add another child when you are ready.</p></div>
      <button type="button" className="primary-button children-add-button" onClick={onAddChild}><AppIcon name="sparkles" size="sm" decorative /> Add a child</button>
    </header>
    {profiles.length > 0 ? <div className="children-profile-grid">{profiles.map((profile) => <button key={profile.id} type="button" className="children-profile-card" onClick={() => onOpenProfile?.(profile)}><span className="children-profile-initial" aria-hidden="true">{profile.name.slice(0, 1).toUpperCase()}</span><span className="children-profile-copy"><small>Approved profile</small><strong>{profile.name}</strong><span>Grade {profile.grade || 'not set'}</span></span><AppIcon name="arrow-right" size="sm" decorative /></button>)}</div> : <section className="children-empty" aria-live="polite"><span><AppIcon name="family" size="lg" decorative /></span><div><h2 className="font-display">Start your family trail</h2><p>Add the first child profile to create a calm, parent-visible learning space.</p></div><button type="button" className="secondary-button" onClick={onAddChild}>Add your first child <AppIcon name="arrow-right" size="xs" decorative /></button></section>}
  </section>;
}

export function OnboardingFlow({ name, grade, routineMorning, routineEvening, experienceBandOverride, demoTermsAcknowledged, parentReady, busy, notice, localProfiles = [], onChange, onSubmit, onChooseLocalProfile }) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const suggestedBand = useMemo(() => bandForGrade(grade), [grade]);
  const selectedBand = experienceBandOverride || suggestedBand;
  const steps = ['Your explorer', 'A gentle rhythm', 'Ready to hand off'];

  useEffect(() => {
    if (!showCreate) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setShowCreate(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showCreate]);

  const update = (event) => {
    onChange(event);
    setErrors((current) => ({ ...current, [event.target.name]: undefined }));
  };
  const changeValue = (field, value) => onChange({ target: { name: field, value, type: 'text' } });
  const openCreate = () => { setStep(0); setErrors({}); setShowCreate(true); };
  const validate = () => {
    const next = {};
    if (step === 0 && name.trim().length < 2) next.name = 'Enter the child’s first name using at least 2 characters.';
    if (step === 0 && !grade.trim()) next.grade = 'Choose a grade or learning stage.';
    if (step === 0 && !demoTermsAcknowledged) next.demoTermsAcknowledged = 'Acknowledge the closed-demo terms before creating a profile.';
    setErrors(next);
    return !Object.keys(next).length;
  };
  const advance = (event) => { event.preventDefault(); if (validate()) setStep((current) => Math.min(2, current + 1)); };
  const submit = async (event) => { event.preventDefault(); if (!validate()) return; await onSubmit(event); };

  return <><ChildrenDirectory profiles={localProfiles} onAddChild={openCreate} onOpenProfile={onChooseLocalProfile} />
    {showCreate && <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}><section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="create-child-title"><header className="profile-modal-header"><div><p className="eyebrow">New family trail</p><h1 id="create-child-title" className="font-display">Add a child</h1></div><button type="button" className="profile-modal-close" onClick={() => setShowCreate(false)} aria-label="Close child profile form"><AppIcon name="close" size="sm" decorative /></button></header>
      <form className="profile-create-form" onSubmit={step === 2 ? submit : advance} noValidate>
        <div className="setup-progress" aria-label={`Setup step ${step + 1} of 3`}>{steps.map((label, index) => <div className={index === step ? 'setup-step active' : index < step ? 'setup-step done' : 'setup-step'} key={label}><span>{index < step ? <AppIcon name="check" size="xs" decorative /> : index + 1}</span><small>{label}</small></div>)}</div>
        {step === 0 && <><p className="eyebrow">Step 1 · Your explorer</p><h2 className="font-display">Who will share ideas with Pip?</h2><p className="form-intro">Only the details needed to make the first welcome feel familiar.</p><label className="field-label">Child’s first name<input name="name" value={name} onChange={update} aria-invalid={Boolean(errors.name)} placeholder="Ari" autoComplete="off" />{errors.name && <span className="field-error">{errors.name}</span>}</label><label className="field-label">Grade or learning stage<select name="grade" value={grade} onChange={update} aria-invalid={Boolean(errors.grade)}><option value="">Choose one</option><option value="K">Kindergarten</option><option value="1">Grade 1</option><option value="2">Grade 2</option><option value="3">Grade 3</option><option value="4">Grade 4</option><option value="5">Grade 5</option><option value="6">Grade 6</option><option value="7">Grade 7+</option><option value="learning stage">Another learning stage</option></select>{errors.grade && <span className="field-error">{errors.grade}</span>}</label><section className="band-preview"><p className="eyebrow">Pip will begin here</p><strong>{bands[suggestedBand].title}</strong><small>{bands[suggestedBand].copy}</small></section><label className="consent-check"><input type="checkbox" name="demoTermsAcknowledged" checked={demoTermsAcknowledged} onChange={update} aria-invalid={Boolean(errors.demoTermsAcknowledged)} /><span>I acknowledge the closed-demo terms. This is not a public child service and does not provide verified parental consent.</span></label>{errors.demoTermsAcknowledged && <p className="field-error consent-error">{errors.demoTermsAcknowledged}</p>}<button className="primary-button full-button" type="submit">Choose the rhythm <AppIcon name="arrow-right" size="xs" decorative /></button></>}
        {step === 1 && <><p className="eyebrow">Step 2 · A gentle rhythm</p><h2 className="font-display">When does a small moment fit?</h2><p className="form-intro">These are soft anchors, not reminders or commitments. You can change them anytime.</p><div className="rhythm-choices"><button type="button" className={routineMorning ? 'selected' : ''} onClick={() => changeValue('routineMorning', routineMorning ? '' : 'After breakfast')}><StudentMark name="morning" decorative /><strong>Morning ripple</strong><small>{routineMorning || 'A tiny arrival before the day begins'}</small></button><button type="button" className={routineEvening ? 'selected' : ''} onClick={() => changeValue('routineEvening', routineEvening ? '' : 'After dinner')}><StudentMark name="discovery" decorative /><strong>Evening discovery</strong><small>{routineEvening || 'Share one small idea after the day'}</small></button></div><label className="field-label">Optional morning anchor<input name="routineMorning" value={routineMorning} onChange={update} placeholder="After breakfast" /></label><label className="field-label">Optional evening anchor<input name="routineEvening" value={routineEvening} onChange={update} placeholder="After dinner" /></label><div className="setup-actions"><button className="secondary-button" type="button" onClick={() => setStep(0)}>Back</button><button className="primary-button" type="submit">Confirm the welcome <AppIcon name="arrow-right" size="xs" decorative /></button></div></>}
        {step === 2 && <><p className="eyebrow">Step 3 · Ready to hand off</p><h2 className="font-display">Does this welcome feel right?</h2><section className="band-chooser"><p>Your child’s starting experience</p>{Object.entries(bands).map(([id, detail]) => <button type="button" className={selectedBand === id ? 'selected' : ''} onClick={() => changeValue('experienceBandOverride', id === suggestedBand ? '' : id)} key={id}><strong>{detail.title}</strong><small>{detail.copy}</small></button>)}</section><p className="setup-note">Next, send an approved-device invitation from Family, or come back later. Your Parent Today page will keep this step visible until your child opens their first moment.</p><div className="setup-actions"><button className="secondary-button" type="button" onClick={() => setStep(1)}>Back</button><button disabled={busy || !parentReady} className="primary-button" type="submit">Create {name || 'explorer'}’s trail <AppIcon name="arrow-right" size="xs" decorative /></button></div>{!parentReady && <p className="form-help" role="status">Sign in as a parent before creating a child profile.</p>}{notice && <p role="alert" className="notice-card">{notice}</p>}</>}
      </form>
    </section></div>}
  </>;
}
