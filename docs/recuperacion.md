# Copias de seguridad y recuperación ante fallos

## Copias de seguridad

- **Neon** guarda un historial que permite restaurar la base de datos a cualquier momento de los últimos días (en el plan gratuito, 24 horas; más en los de pago). Revisa el periodo de tu plan en la consola de Neon.
- **Copia manual adicional** (recomendada antes de cada migración importante y una vez al mes):
  ```bash
  pg_dump "$DIRECT_URL" --format=custom --file=recetin-$(date +%F).dump
  ```
  Guárdala fuera de Neon (por ejemplo, en tu disco o en una carpeta cifrada en la nube).

## Restaurar

- **Error reciente** (datos borrados por error, migración fallida): en Neon, _Branches › Restore_ al momento anterior al problema. Puedes restaurar primero en una rama nueva para comprobarlo.
- **Desde una copia manual:**
  ```bash
  pg_restore --clean --if-exists --no-owner --dbname "$DIRECT_URL" recetin-AAAA-MM-DD.dump
  ```

## Si se filtra un secreto

| Secreto                       | Qué hacer                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`          | Genera uno nuevo y cámbialo en Vercel. Se cierran todas las sesiones: todo el mundo tendrá que volver a entrar. |
| `DATABASE_URL` / `DIRECT_URL` | Cambia la contraseña del rol en Neon y actualiza las dos variables.                                             |
| `RESEND_API_KEY`              | Revócala en Resend y crea otra.                                                                                 |
| `GOOGLE_CLIENT_SECRET`        | En Google Cloud, en la credencial OAuth, crea un secreto nuevo y borra el viejo.                                |

## Si la app no arranca

El log de Vercel muestra `Configuración incompleta. Revisa tu .env:` con la lista de variables que faltan o no son válidas.
