import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createServer } from './app.js';
import { prisma } from './db.js';
import { createSession } from './auth/session.js';

const app = createServer();
const schools: string[] = [];
const cookies: Record<string, string> = {};
const users: Record<string, string> = {};
const announcements: Record<string, string> = {};
const csrf = 'announcement-test-csrf';

describe('announcement API audience isolation and read receipts', () => {
  beforeAll(async () => {
    for (let i = 0; i < 2; i++) {
      const school = await prisma.school.create({
        data: { name: 'Announcement test', code: randomUUID() },
      });
      schools.push(school.id);
    }
    for (const role of [
      'principal',
      'parent',
      'student',
      'teacher',
      'accountant',
      'school-admin',
      'super-admin',
      'other-parent',
    ]) {
      const user = await prisma.user.create({
        data: {
          schoolId: schools[role === 'other-parent' ? 1 : 0],
          email: `${randomUUID()}@announcement.test`,
          firstName: 'Test',
          lastName: 'Recipient',
          passwordHash: 'unused',
          role: role === 'other-parent' ? 'parent' : role,
        },
      });
      users[role] = user.id;
      const session = await createSession({ userId: user.id, schoolId: user.schoolId });
      cookies[role] = `session_token=${session.token}; csrf-token=${csrf}`;
    }
    for (const audience of ['all', 'parents', 'students', 'staff']) {
      const announcement = await prisma.announcement.create({
        data: {
          schoolId: schools[0],
          title: audience,
          content: 'Test content',
          audience,
          createdById: users.principal,
        },
      });
      announcements[audience] = announcement.id;
    }
  });

  afterAll(async () => {
    for (const schoolId of schools) {
      await prisma.announcementRead.deleteMany({ where: { schoolId } });
      await prisma.announcement.deleteMany({ where: { schoolId } });
      await prisma.auditLog.deleteMany({ where: { schoolId } });
      await prisma.session.deleteMany({ where: { schoolId } });
      await prisma.user.deleteMany({ where: { schoolId } });
      await prisma.school.delete({ where: { id: schoolId } });
    }
    await prisma.$disconnect();
  });

  it.each([
    ['parent', 'parents'],
    ['student', 'students'],
    ['teacher', 'staff'],
    ['principal', 'staff'],
    ['accountant', 'staff'],
    ['school-admin', 'staff'],
    ['super-admin', 'staff'],
  ])('limits %s to global and %s announcements', async (role, audience) => {
    const response = await request(app).get('/api/announcements').set('Cookie', cookies[role]);
    expect(response.status).toBe(200);
    expect(response.body.announcements.map((a: { audience: string }) => a.audience).sort()).toEqual(
      ['all', audience].sort()
    );
    expect(response.body.announcements.every((a: { readAt: unknown }) => a.readAt === null)).toBe(
      true
    );
    const count = await request(app)
      .get('/api/announcements/unread-count')
      .set('Cookie', cookies[role]);
    expect(count.body.count).toBe(2);
  });

  it('does not let audience filters broaden visibility', async () => {
    const denied = await request(app)
      .get('/api/announcements?audience=students')
      .set('Cookie', cookies.parent);
    expect(denied.status).toBe(200);
    expect(denied.body.announcements).toEqual([]);
    const global = await request(app)
      .get('/api/announcements?audience=all')
      .set('Cookie', cookies.parent);
    expect(global.body.announcements.map((a: { id: string }) => a.id)).toEqual([announcements.all]);
    expect(
      (await request(app).get('/api/announcements?audience=invalid').set('Cookie', cookies.parent))
        .status
    ).toBe(400);
  });

  it.each(['parent', 'other-parent'])(
    'denies invisible details and receipts for %s',
    async (role) => {
      const id = announcements.students;
      expect(
        (await request(app).get(`/api/announcements/${id}`).set('Cookie', cookies[role])).status
      ).toBe(404);
      expect(
        (
          await request(app)
            .post(`/api/announcements/${id}/read`)
            .set('Cookie', cookies[role])
            .set('x-csrf-token', csrf)
        ).status
      ).toBe(404);
      expect(await prisma.announcementRead.count({ where: { userId: users[role] } })).toBe(0);
    }
  );

  it('isolates school feeds and unread counts', async () => {
    const feed = await request(app)
      .get('/api/announcements')
      .set('Cookie', cookies['other-parent']);
    expect(feed.body.announcements).toEqual([]);
    const count = await request(app)
      .get('/api/announcements/unread-count')
      .set('Cookie', cookies['other-parent']);
    expect(count.body.count).toBe(0);
  });

  it('requires authentication and CSRF for acknowledgement and publishing', async () => {
    expect((await request(app).get('/api/announcements')).status).toBe(401);
    expect((await request(app).get(`/api/announcements/${announcements.all}`)).status).toBe(401);
    expect((await request(app).get('/api/announcements/unread-count')).status).toBe(401);
    expect(
      (
        await request(app)
          .post(`/api/announcements/${announcements.all}/read`)
          .set('Cookie', cookies.parent)
      ).status
    ).toBe(403);
    expect(
      (
        await request(app)
          .post('/api/announcements')
          .set('Cookie', cookies.principal)
          .send({ title: 'Title', content: 'Content' })
      ).status
    ).toBe(403);
  });

  it('acknowledges once per recipient without GET side effects or leaking receipts', async () => {
    const url = `/api/announcements/${announcements.all}`;
    const detail = await request(app).get(url).set('Cookie', cookies.parent);
    expect(detail.status).toBe(200);
    expect(detail.body.announcement.readAt).toBeNull();
    const first = await request(app)
      .post(`${url}/read`)
      .set('Cookie', cookies.parent)
      .set('x-csrf-token', csrf);
    const retry = await request(app)
      .post(`${url}/read`)
      .set('Cookie', cookies.parent)
      .set('x-csrf-token', csrf);
    expect(first.status).toBe(200);
    expect(retry.body.readAt).toBe(first.body.readAt);
    expect(
      await prisma.announcementRead.count({ where: { announcementId: announcements.all } })
    ).toBe(1);
    expect(
      (await request(app).get('/api/announcements/unread-count').set('Cookie', cookies.parent)).body
        .count
    ).toBe(1);
    expect(
      (await request(app).get('/api/announcements/unread-count').set('Cookie', cookies.student))
        .body.count
    ).toBe(2);
    const feed = await request(app).get('/api/announcements').set('Cookie', cookies.parent);
    const item = feed.body.announcements.find((a: { id: string }) => a.id === announcements.all);
    expect(item.readAt).toBe(first.body.readAt);
    expect(item.reads).toBeUndefined();
  });

  it('enforces receipt tenant foreign keys', async () => {
    await expect(
      prisma.announcementRead.create({
        data: {
          schoolId: schools[0],
          announcementId: announcements.all,
          userId: users['other-parent'],
        },
      })
    ).rejects.toThrow();
  });

  it('validates publishing and denies unauthorized roles', async () => {
    for (const role of ['parent', 'student', 'teacher', 'accountant']) {
      const response = await request(app)
        .post('/api/announcements')
        .set('Cookie', cookies[role])
        .set('x-csrf-token', csrf)
        .send({ title: 'Title', content: 'Content' });
      expect(response.status).toBe(403);
    }
    for (const body of [
      {},
      { title: ' ', content: 'Content' },
      { title: 'Title', content: 'Content', audience: 'invalid' },
      { title: 'Title', content: 'Content', schoolId: schools[1] },
    ]) {
      expect(
        (
          await request(app)
            .post('/api/announcements')
            .set('Cookie', cookies.principal)
            .set('x-csrf-token', csrf)
            .send(body)
        ).status
      ).toBe(400);
    }
    const response = await request(app)
      .post('/api/announcements')
      .set('Cookie', cookies.principal)
      .set('x-csrf-token', csrf)
      .send({ title: ' New announcement ', content: 'Content' });
    expect(response.status).toBe(201);
    expect(response.body.announcement).toMatchObject({
      title: 'New announcement',
      audience: 'all',
      schoolId: schools[0],
      createdById: users.principal,
    });
    expect(
      await prisma.auditLog.count({
        where: { entityId: response.body.announcement.id, action: 'ANNOUNCEMENT_CREATE' },
      })
    ).toBe(1);
  });
});
