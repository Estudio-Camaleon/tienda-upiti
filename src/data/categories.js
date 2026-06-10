export const CATEGORIES = [
  "Ropa",
  "Accesorios",
  "Calzado",
  "Bolsos y Carteras",
  "Deco y Hogar",
  "Arte",
  "Juguetes",
  "Libros",
  "Música",
  "Electrónica",
  "Salud y Belleza",
  "Deportes",
  "Mascotas",
  "Papelería",
  "Servicios",
  "Otros",
];

/**
 * Category-specific extra fields.
 * Each entry defines an array of fields with:
 *   name       – key stored in specifications JSONB
 *   label      – display label in the form
 *   type       – "text" | "select"
 *   options    – only for type "select", array of choices
 *   placeholder – optional placeholder text
 */
export const CATEGORY_FIELDS = {
  Ropa: [
    {
      name: "talle",
      label: "Talle",
      type: "select",
      options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    },
    {
      name: "color",
      label: "Color",
      type: "text",
      placeholder: "Ej: Rojo, Azul, Negro",
    },
    {
      name: "material",
      label: "Material",
      type: "text",
      placeholder: "Ej: Algodón, Poliéster",
    },
    {
      name: "genero",
      label: "Género",
      type: "select",
      options: ["Hombre", "Mujer", "Unisex", "Niño", "Niña"],
    },
  ],
  Accesorios: [
    {
      name: "material",
      label: "Material",
      type: "text",
      placeholder: "Ej: Cuero, Plata, Acero",
    },
    {
      name: "color",
      label: "Color",
      type: "text",
      placeholder: "Ej: Dorado, Plateado",
    },
  ],
  Calzado: [
    {
      name: "talle",
      label: "Talle",
      type: "select",
      options: [
        "35",
        "36",
        "37",
        "38",
        "39",
        "40",
        "41",
        "42",
        "43",
        "44",
        "45",
      ],
    },
    {
      name: "color",
      label: "Color",
      type: "text",
      placeholder: "Ej: Negro, Blanco, Marrón",
    },
    {
      name: "material",
      label: "Material",
      type: "text",
      placeholder: "Ej: Cuero, Sintético, Lona",
    },
    {
      name: "genero",
      label: "Género",
      type: "select",
      options: ["Hombre", "Mujer", "Unisex"],
    },
  ],
  "Bolsos y Carteras": [
    {
      name: "material",
      label: "Material",
      type: "text",
      placeholder: "Ej: Cuero, Tela, Sintético",
    },
    {
      name: "color",
      label: "Color",
      type: "text",
      placeholder: "Ej: Negro, Marrón",
    },
    {
      name: "medidas",
      label: "Medidas",
      type: "text",
      placeholder: "Ej: 30x20x10 cm",
    },
  ],
  "Deco y Hogar": [
    {
      name: "material",
      label: "Material",
      type: "text",
      placeholder: "Ej: Madera, Cerámica, Vidrio",
    },
    {
      name: "medidas",
      label: "Medidas",
      type: "text",
      placeholder: "Ej: 40x20 cm",
    },
    {
      name: "color",
      label: "Color",
      type: "text",
      placeholder: "Ej: Blanco, Natural",
    },
  ],
  Arte: [
    {
      name: "tecnica",
      label: "Técnica",
      type: "text",
      placeholder: "Ej: Óleo, Acrílico, Acuarela",
    },
    {
      name: "medidas",
      label: "Medidas",
      type: "text",
      placeholder: "Ej: 50x70 cm",
    },
    { name: "anio", label: "Año", type: "text", placeholder: "Ej: 2024" },
  ],
  Juguetes: [
    {
      name: "edad_minima",
      label: "Edad mínima",
      type: "select",
      options: [
        "0+",
        "1+",
        "2+",
        "3+",
        "4+",
        "5+",
        "6+",
        "8+",
        "10+",
        "12+",
        "14+",
        "18+",
      ],
    },
    {
      name: "material",
      label: "Material",
      type: "text",
      placeholder: "Ej: Plástico, Madera, Tela",
    },
  ],
  Libros: [
    {
      name: "autor",
      label: "Autor",
      type: "text",
      placeholder: "Ej: Gabriel García Márquez",
    },
    {
      name: "editorial",
      label: "Editorial",
      type: "text",
      placeholder: "Ej: Sudamericana",
    },
    {
      name: "genero_literario",
      label: "Género literario",
      type: "text",
      placeholder: "Ej: Novela, Poesía, Ensayo",
    },
    { name: "paginas", label: "Páginas", type: "text", placeholder: "Ej: 350" },
  ],
  Música: [
    {
      name: "artista",
      label: "Artista",
      type: "text",
      placeholder: "Ej: Shakira",
    },
    {
      name: "album",
      label: "Álbum",
      type: "text",
      placeholder: "Ej: Fijación Oral",
    },
    {
      name: "genero_musical",
      label: "Género musical",
      type: "text",
      placeholder: "Ej: Rock, Pop, Jazz",
    },
    {
      name: "formato",
      label: "Formato",
      type: "select",
      options: ["CD", "Vinilo", "Digital", "Cassette"],
    },
  ],
  Electrónica: [
    {
      name: "marca",
      label: "Marca",
      type: "text",
      placeholder: "Ej: Samsung, Apple",
    },
    {
      name: "modelo",
      label: "Modelo",
      type: "text",
      placeholder: "Ej: Galaxy S24",
    },
    {
      name: "garantia",
      label: "Garantía",
      type: "text",
      placeholder: "Ej: 6 meses, 1 año",
    },
  ],
  "Salud y Belleza": [
    {
      name: "marca",
      label: "Marca",
      type: "text",
      placeholder: "Ej: Nivea, L'Oréal",
    },
    {
      name: "tipo",
      label: "Tipo",
      type: "text",
      placeholder: "Ej: Crema, Shampoo, Perfume",
    },
    {
      name: "ingredientes",
      label: "Ingredientes",
      type: "text",
      placeholder: "Principales ingredientes",
    },
  ],
  Deportes: [
    {
      name: "marca",
      label: "Marca",
      type: "text",
      placeholder: "Ej: Nike, Adidas",
    },
    {
      name: "deporte",
      label: "Deporte",
      type: "text",
      placeholder: "Ej: Fútbol, Running, Yoga",
    },
    {
      name: "talle",
      label: "Talle",
      type: "select",
      options: ["XS", "S", "M", "L", "XL", "XXL"],
    },
  ],
  Mascotas: [
    {
      name: "tipo_mascota",
      label: "Tipo de mascota",
      type: "select",
      options: ["Perro", "Gato", "Pez", "Ave", "Roedor", "Otro"],
    },
    {
      name: "edad_recomendada",
      label: "Edad recomendada",
      type: "select",
      options: ["Cachorro", "Adulto", "Senior", "Todas las edades"],
    },
  ],
  Papelería: [
    {
      name: "tipo",
      label: "Tipo",
      type: "text",
      placeholder: "Ej: Cuaderno, Lápiz, Agenda",
    },
    {
      name: "marca",
      label: "Marca",
      type: "text",
      placeholder: "Ej: Faber-Castell, Maped",
    },
    {
      name: "cantidad_hojas",
      label: "Cantidad de hojas",
      type: "text",
      placeholder: "Ej: 80, 100, 200",
    },
  ],
  Servicios: [
    {
      name: "tipo_servicio",
      label: "Tipo de servicio",
      type: "text",
      placeholder: "Ej: Fotografía, Diseño, Reparación",
    },
    {
      name: "duracion",
      label: "Duración",
      type: "text",
      placeholder: "Ej: 2 horas, 1 día",
    },
    {
      name: "cobertura",
      label: "Cobertura",
      type: "text",
      placeholder: "Ej: Zona norte, Todo el país",
    },
  ],
};

/**
 * Returns extra fields for a given category, or empty array if none.
 */
export function getCategoryFields(category) {
  return CATEGORY_FIELDS[category] || [];
}
