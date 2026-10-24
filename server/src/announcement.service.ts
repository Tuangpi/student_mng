import type { AuthUser } from './middleware/auth.js';
import { prisma } from './db.js';
import { AppError } from './error.js';
import { createAuditLog } from './audit.js';

function visibleWhere(user: AuthUser) {
  const audiences: Record<string, string> = {
    parent: 'parents',
    student: 'students',
    teacher: 'staff',
    accountant: 'staff',
    principal: 'staff',
    'school-admin': 'staff',
    'super-admin': 'staff',
  };
  if (!Object.hasOwn(audiences, user.role)) throw new AppError('Forbidden', 403);
  const audience = audiences[user.role];
  return { schoolId: user.schoolId, audience: { in: ['all', audience] } };
}

export async function listAnnouncements(
  user: AuthUser,
  audience?: 'all' | 'parents' | 'students' | 'staff'
) {
  const announcements = await prisma.announcement.findMany({
    where: { AND: [visibleWhere(user), ...(audience ? [{ audience }] : [])] },
    orderBy: { publishedAt: 'desc' },
    include: {
      reads: { where: { userId: user.userId }, select: { readAt: true } },
      createdBy: {
        select: { id: true, email: true, role: true, firstName: true, lastName: true },
      },
    },
  });
  return announcements.map(({ reads, ...announcement }) => ({
    ...announcement,
    readAt: reads[0]?.readAt ?? null,
  }));
}

export async function createAnnouncement(
  schoolId: string,
  title: string,
  content: string,
  audience: 'all' | 'parents' | 'students' | 'staff',
  createdById: string
) {
  const announcement = await prisma.announcement.create({
    data: {
      schoolId,
      title,
      content,
      audience,
      createdById,
    },
    include: {
      createdBy: {
        select: { id: true, email: true, role: true, firstName: true, lastName: true },
      },
    },
  });

  await createAuditLog({
    schoolId,
    userId: createdById,
    action: 'ANNOUNCEMENT_CREATE',
    entity: 'Announcement',
    entityId: announcement.id,
    metadata: { title, audience },
  });

  return announcement;
}

export async function getAnnouncement(announcementId: string, user: AuthUser) {
  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, ...visibleWhere(user) },
    include: {
      reads: { where: { userId: user.userId }, select: { readAt: true } },
      createdBy: {
        select: { id: true, email: true, role: true, firstName: true, lastName: true },
      },
    },
  });
  if (!announcement) throw new AppError('Announcement not found', 404);
  const { reads, ...data } = announcement;
  return { ...data, readAt: reads[0]?.readAt ?? null };
}

export async function markAnnouncementRead(announcementId: string, user: AuthUser) {
  await getAnnouncement(announcementId, user);
  const receipt = await prisma.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId,
        userId: user.userId,
      },
    },
    update: {},
    create: {
      announcementId,
      userId: user.userId,
      schoolId: user.schoolId,
    },
  });
  return { readAt: receipt.readAt };
}

export async function getUnreadAnnouncementCount(user: AuthUser) {
  return prisma.announcement.count({
    where: {
      ...visibleWhere(user),
      reads: { none: { userId: user.userId } },
    },
  });
}

export async function deleteAnnouncement(announcementId: string, schoolId: string, userId: string) {
  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, schoolId },
  });

  if (!announcement) {
    throw new AppError('Announcement not found', 404);
  }

  await prisma.announcement.delete({
    where: { id: announcementId },
  });

  await createAuditLog({
    schoolId,
    userId,
    action: 'ANNOUNCEMENT_DELETE',
    entity: 'Announcement',
    entityId: announcementId,
    metadata: { title: announcement.title },
  });
}
