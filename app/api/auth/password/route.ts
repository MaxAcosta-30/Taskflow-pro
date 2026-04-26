import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth/helpers';
import { parseBody, ok, serverError } from '@/lib/api/helpers';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

/**
 * PATCH /api/auth/password
 * Cambia la contraseña del usuario.
 */
export async function PATCH(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return unauthorized();

  const { data, error } = await parseBody(req, updatePasswordSchema);
  if (error) return error;

  try {
    const user = await db.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.passwordHash) {
      return Response.json({ success: false, error: 'Usuario no válido' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValid) {
      return Response.json({ success: false, error: 'La contraseña actual es incorrecta' }, { status: 400 });
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, 12);

    await db.user.update({
      where: { id: payload.sub },
      data: { passwordHash: newPasswordHash },
    });

    return ok({ message: 'Contraseña actualizada correctamente' });
  } catch (err: any) {
    console.error('[PATCH_PASSWORD_ERROR]', err);
    return serverError();
  }
}
