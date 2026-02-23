/**
 * Convierte URLs en texto pegado al formato markdown [url](url)
 * para que se muestren como enlaces en los comentarios.
 * No modifica URLs que ya estén dentro de un enlace markdown ](url).
 */
export function convertUrlsToMarkdownLinks(text: string): string {
  // URLs con protocolo: no reemplazar si ya están en ](url)
  const withProtocol = text.replace(
    /(?<!\]\()(https?:\/\/[^\s<>"'\])]+)/g,
    (url) => `[${url}](${url})`
  );
  // URLs que empiezan por www.
  return withProtocol.replace(
    /(?<!\]\()(www\.[^\s<>"'\])]+)/g,
    (match) => `[${match}](https://${match})`
  );
}
