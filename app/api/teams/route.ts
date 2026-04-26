import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, parseBody, created, serverError } from '@/lib/api/helpers';
import { createTeamSchema } from '@/lib/validations';

/**
 * POST /api/teams
 * Crea un nuevo equipo y asigna al usuario creador como OWNER.
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (user) => {
    const { data, error } = await parseBody(req, createTeamSchema);
    if (error) return error;

    try {
      // Generar un slug básico basado en el nombre
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 7);

      const team = await db.team.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          members: {
            create: {
              userId: user.sub,
              teamRole: 'OWNER',
            },
          },
        },
        include: {
          members: true,
        },
      });

      return created(team);
    } catch (err: any) {
      console.error('[POST_TEAM_ERROR]', err);
      return serverError();
    }
  });
}
