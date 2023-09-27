function ceasar(ns: NS, data: [string, number]) {
  const text = data[0];
  const shift = data[1];

  for (let i = 0; i < text.length; i++) {
    const encrypted = text.charCodeAt(i);
    const decrypted = (encrypted - shift) % 26;
  }
}
