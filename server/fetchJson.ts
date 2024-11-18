export async function fetchJson({ url }: { url: any }) {
  const res = await fetch(url);
  return await res.json();
}
