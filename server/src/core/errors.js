export class NotFoundError extends Error {
  status = 404;
}

export class ValidationError extends Error {
  status = 400;
}
