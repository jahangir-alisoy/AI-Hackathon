export const handle = (action) => async (request, response) => {
  try {
    const result = await action(request, response);
    if (result === undefined) response.status(204).end();
    else response.json(result);
  } catch (error) {
    const status = error.status ?? 500;
    if (status === 500) console.error(error);
    response.status(status).json({ error: error.message });
  }
};
