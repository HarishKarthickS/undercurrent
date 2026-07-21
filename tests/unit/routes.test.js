import { describe, expect, it, vi } from 'vitest';
import { registerStudentRoutes } from '#api/modules/students/studentsRoutes.js';
import { registerSessionRoutes } from '#api/modules/sessions/sessionsRoutes.js';

function app() { return { get: vi.fn(), post: vi.fn(), put: vi.fn() }; }

describe('route registration', () => {
  it('registers student routes and delegates to the student service', async () => {
    const instance = app(); const students = { create: vi.fn(), list: vi.fn() };
    await registerStudentRoutes(instance, { students });
    expect(instance.post).toHaveBeenCalledTimes(1); expect(instance.get).toHaveBeenCalledTimes(1);
    const create = instance.post.mock.calls[0][2]; const list = instance.get.mock.calls[0][2]; const reply = { status: vi.fn(() => reply), send: vi.fn() };
    await create({ parentSession: { id: 'p' }, body: { name: 'Ada' } }, reply); await list({ parentSession: { id: 'p' } });
    expect(students.create).toHaveBeenCalledWith({ id: 'p' }, { name: 'Ada' }); expect(students.list).toHaveBeenCalledWith({ id: 'p' });
  });

  it('registers all session routes and delegates each handler', async () => {
    const instance = app(); const sessions = { start: vi.fn(), getCuriosityTrail: vi.fn(), turn: vi.fn(), end: vi.fn(), conversations: vi.fn(), conversation: vi.fn() };
    await registerSessionRoutes(instance, { sessions });
    expect(instance.post).toHaveBeenCalledTimes(3); expect(instance.get).toHaveBeenCalledTimes(6); expect(instance.put).toHaveBeenCalledTimes(1);
    const [start] = instance.post.mock.calls; const trail = instance.get.mock.calls[0]; const turn = instance.post.mock.calls[1]; const end = instance.post.mock.calls[2];
    await start[2]({ parentSession: 'p', body: 'start' }); await trail[2]({ parentSession: 'p', params: { studentId: 's' } }); await turn[2]({ parentSession: 'p', body: 'turn' }); await end[2]({ parentSession: 'p', body: 'end' });
    expect(sessions.start).toHaveBeenCalledWith('p', 'start'); expect(sessions.getCuriosityTrail).toHaveBeenCalledWith('p', 's'); expect(sessions.turn).toHaveBeenCalledWith('p', 'turn'); expect(sessions.end).toHaveBeenCalledWith('p', 'end');
    const conversations = instance.get.mock.calls[3][1]; const conversation = instance.get.mock.calls[4][1];
    await conversations({ parentSession: 'p', params: { studentId: 's' } }); await conversation({ parentSession: 'p', params: { studentId: 's', sessionId: 'c' } });
    expect(sessions.conversations).toHaveBeenCalledWith('p', 's'); expect(sessions.conversation).toHaveBeenCalledWith('p', 's', 'c');
  });
});
