const API = "";

async function request(method, url, body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

const api = {
  get:    url        => request("GET",    url),
  post:   (url, body)=> request("POST",   url, body),
  put:    (url, body)=> request("PUT",    url, body),
  delete: url        => request("DELETE", url),
};
