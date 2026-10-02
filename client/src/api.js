const parse = async (response) => {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body;
};

export const getJson = (path) => fetch(`/api${path}`).then(parse);

export const postJson = (path, body = {}) =>
  fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(parse);
