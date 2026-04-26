import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, parseBody, ok, created, serverError } from '@/lib/api/helpers';
import { createLabelSchema } from '@/lib/validations';
import { z } from 'zod';

/**
 * GET /api/labels?teamId=...
 * Obtiene todas las etiquetas de un equipo.
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (user) => {
    const teamId = req.nextUrl.searchParams.get('teamId');
    if (!teamId) return Response.json({ success: false, error: 'teamId requerido' }, { status: 400 });

    try {
      // Verificar acceso al equipo
      const membership = await db.teamMember.findFirst({
        where: { teamId, userId: user.sub },
      });

      if (!membership) return Response.json({ success: false, error: 'Sin acceso al equipo' }, { status: 403 });

      const labels = await db.label.findMany({
        where: { teamId },
        orderBy: { name: 'asc' },
      });

      return ok(labels);
    } catch (err: any) {
      console.error('[GET_LABELS_ERROR]', err);
      return serverError();
    }
  });
}

/**
 * POST /api/labels
 * Crea una nueva etiqueta para un equipo.
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (user) => {
    const schema = createLabelSchema.extend({ teamId: z.string().cuid() });
    const { data, error } = await parseBody(req, schema);
    if (error) return error;

    try {
      // Verificar acceso al equipo
      const membership = await db.teamMember.findFirst({
        where: { teamId: data.teamId, userId: user.sub },
      });

      if (!membership) return Response.json({ success: false, error: 'Sin acceso al equipo' }, { status: 403 });

      const label = await db.label.create({
        data: {
          name: data.name,
          color: data.color,
          teamId: data.teamId,
        },
      });

      return created(label);
    } catch (err: any) {
      if (err.code === 'P2002') {
        return Response.json({ success: false, error: 'Ya existe una etiqueta con ese nombre en el equipo' }, { status: 409 });
      }
      console.error('[POST_LABEL_ERROR]', err);
      return serverError();
    }
  });
}
