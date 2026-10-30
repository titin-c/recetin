/**
 * Error de regla de negocio: su mensaje está pensado para enseñarse tal cual al usuario
 * (en castellano, diciendo qué pasa y qué hacer). Cualquier otro error es un fallo inesperado.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

/** Error de permisos: se trata como «no encontrado» para no revelar que el recurso existe. */
export class ForbiddenError extends DomainError {
  constructor(message = "No existe o no tienes acceso.") {
    super(message);
    this.name = "ForbiddenError";
  }
}
