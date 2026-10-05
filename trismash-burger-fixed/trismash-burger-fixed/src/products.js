// ===== EDITA AQUÍ: nombres, precios, descripciones, imágenes y productos =====
// Las fotos van en public/images/burgers/  (cada producto usa su propia imagen)
export const config = {
  brand: 'Trismash Burger',
  currency: 'Bs',
  whatsapp: '',      // ej: '59170000000' para enviar el pedido por WhatsApp
  heroProduct: 'la-tri',
};

export const products = [
  { id: 'la-primera',  numeral: 'I',   name: 'La Primera',
    description: 'Doble carne smash, doble queso cheddar, salsa Tri, pan de papa y papas.',
    image: 'public/images/burgers/la-primera.png',  prices: { doble: 36, triple: 43 } },
  { id: 'la-culpable', numeral: 'II',  name: 'La Culpable',
    description: 'Doble carne smash, queso cheddar, tocino, pan de papa y papas.',
    image: 'public/images/burgers/la-culpable.png', prices: { doble: 39, triple: 46 } },
  { id: 'la-tri',      numeral: 'III', name: 'La Tri',
    description: 'Doble carne smash, queso cheddar, charque crocante, queso frito, salsa blue cheese y papas.',
    image: 'public/images/burgers/la-tri.png',      prices: { doble: 45, triple: 52 } },
  { id: 'la-kenoshi',  numeral: 'IV',  name: 'La Kenoshi',
    description: 'Doble carne smash, salsa barbacoa, tocino, queso cheddar, cebolla caramelizada, pan de papa y papas.',
    image: 'public/images/burgers/la-kenoshi.png',  prices: { doble: 42, triple: 49 } },
  { id: 'la-discusion', numeral: 'V',  name: 'La Discusión',
    description: 'Doble carne smash, doble queso cheddar, mermelada de tocino, piña caramelizada, pan de papa y papas.',
    image: 'public/images/burgers/la-discusion.png', prices: { doble: 43, triple: 50 } },
];
