import { z } from "zod";
import { HOUSEHOLD_NAME_MAX } from "./domain/household";

export const householdNameSchema = z
  .string()
  .trim()
  .min(1, "Escribe un nombre para el hogar.")
  .max(HOUSEHOLD_NAME_MAX, `El nombre no puede pasar de ${HOUSEHOLD_NAME_MAX} caracteres.`);

export const inviteSchema = z.object({
  householdId: z.uuid(),
  email: z.string().trim().toLowerCase().pipe(z.email("Escribe un email válido, por ejemplo nombre@correo.es.")),
});

export const householdIdSchema = z.object({ householdId: z.uuid() });
export const memberSchema = z.object({ householdId: z.uuid(), userId: z.uuid() });
export const memberRoleSchema = memberSchema.extend({ role: z.enum(["OWNER", "MEMBER"]) });
export const leaveSchema = z.object({ householdId: z.uuid(), transferTo: z.uuid().optional() });
export const deleteHouseholdSchema = z.object({ householdId: z.uuid(), confirmName: z.string() });
export const renameSchema = z.object({ householdId: z.uuid(), name: householdNameSchema });
