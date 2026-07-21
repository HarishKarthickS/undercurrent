# Product overview

## Student-first living daily world

Students use three phone-first child-facing spaces: **Today** recommends one next moment from local time, grade, routine controls, and enabled modes; **World** grows a non-competitive collection of launch cards and discoveries; and **My Moments** is a readable combined timeline. The bottom navigation and daily art direction stay consistent on phone, tablet, and desktop. A deterministic daily world theme, greeting, and collectible make the experience feel fresh without changing during the day.

Parents can configure routine hours, session-style recommendations, voice and activity availability, and a daily session limit. The Parent Center adds a customizable Today workspace, planning and goal controls, in-app daily and weekly family briefs, and consent-gated transcript and transcript-aware AI settings. The approved student device remains unlocked for 12 hours; its visible student shell never routes a returning child back to the public landing page.

## Morning Ripple studio

Morning Ripple is an adaptive four-stage ritual: an arrival moment, feeling and energy check-in, a rotating interactive path, and a launch card with a cosmetic collectible. Completed entries store the student's chosen path, optional activity note, intention, theme, and collectible for the student’s Morning Cards timeline and the household-authorized parent control center. Curated age-banded content is always available; parent settings can enable optional AI prompt experimentation, set available paths, and choose a content-sensitivity tone.

Completed non-safety sessions receive a student-readable recap. Original ordinary-session turns remain encrypted at rest and can be reopened by the student or the household-authorized parent through the reflection archive. Safety-trigger content is never included in recaps or transcript views.

## Purpose

Undercurrent gives a child a short space to teach a curious character about something from their day. The design emphasizes process over correctness: the companion asks one short follow-up instead of assigning a score, declaring an answer correct, or presenting itself as a friend or therapist. Parents see routines, effort moments, upcoming review topics, and topic-level signals rather than a report card.

## The user journey

1. An invited guardian signs in and lists that household's profiles.
2. A parent creates a student profile with name, grade, optional morning/evening routine text, consent confirmation, and a local consent reference.
3. The child opens Today and follows Pip's ranked Morning Ripple or Evening Discovery invitation, or chooses a permitted alternative.
4. A morning turn stays lightweight and returns a fixed prompt; it does not call the AI service or persist conversation turns.
5. An evening turn first passes deterministic safety screening. If clear, it may be encrypted, assessed twice by the AI provider, converted into a scaffolded follow-up, and recorded as learning metadata.
6. The student sees cosmetic keepsakes and safe summaries; the household-authorized parent can review recaps, saved eligible transcripts, Morning Ripple entries, and safety-event metadata.

## Session behavior

| Behavior | Morning | Evening |
| --- | --- | --- |
| Opening prompt | “Pick a feeling for your day.” | “What is one thing you could teach me from today?” |
| Turn response | Fixed, light prompt | Safety screen, then AI-backed learning response when configured |
| AI required | No | Yes |
| Encrypted turn storage | No | Yes for ordinary child and companion turns |
| Limit | No explicit service cap | Six turns or eight minutes, then terminal |

An evening session is terminal after a safety event or the session cap. The UI lets the child end a session explicitly. The API also accepts an optional free-text end reason up to 64 characters.

## Parent visibility

The dashboard returns a student summary, session count, topics, due reviews, recent effort moments, safety alerts, suggested conversation starters, and a short routine note. Household-authorized parents may also open saved student recaps and eligible encrypted ordinary-session transcripts. Trends are deliberately conservative: they are `still_gathering` until two signals exist, then are derived from the latest versus oldest recorded understanding value. They are not educational diagnoses, grades, or proof of mastery.

## Consent and safety

Creating a profile creates a granted `learning_companion` consent record. Every session operation confirms both household ownership and that consent status before proceeding. Safety screening is deterministic and happens before a child message reaches the AI provider. It recognizes a deliberately narrow set of phrases covering immediate self-harm, unsafe-at-home, and medical-emergency signals. On a match, the service ends the session, stores only event metadata, and sends a parent safety alert through the configured mail transport.

## Product limitations

- Closed-demo terms acknowledgement is not verified parental identity or verified parental consent.
- The API can create account-verification and magic-link tokens, but it returns those tokens to the caller and does not send verification or magic-link email.
- SMTP safety alerts use a JSON transport when no SMTP URL exists; no real email is delivered in that configuration.
- The safety matcher is not a substitute for professional safeguarding procedures and will not recognize every concerning message.
- The application contains no retention, deletion, consent-withdrawal, or account-recovery workflow.

See [Security, privacy, and safety](security-privacy-safety.md) for implementation detail and [Operations](operations.md) for launch requirements.
