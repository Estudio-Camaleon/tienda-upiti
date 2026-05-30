// Archivo: src/app/dashboard/page.js
"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para el Vendedor
  const [myProducts, setMyProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    category: "",
    price: "",
    description: "",
  });
  const [productImage, setProductImage] = useState(null); // Nuevo estado para el archivo de imagen
  const [uploading, setUploading] = useState(false);

  // Estados para el Admin
  const [allUsers, setAllUsers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUser(session.user);

    // Traer el perfil para saber si es Admin o Vendedor
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(profileData);

    if (profileData?.role === "admin") {
      loadAdminData();
    } else {
      loadSellerData(session.user.id);
    }
    setLoading(false);
  }

  // --- LÓGICA DE VENDEDOR ---
  async function loadSellerData(userId) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", userId);
    setMyProducts(data || []);
  }

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setUploading(true);
    let imageUrl = null;

    // 1. Subir la imagen al bucket 'products'
    if (productImage) {
      const fileExt = productImage.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, productImage);

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    // 2. Guardar el producto en la tabla con la URL generada
    const { error } = await supabase.from("products").insert([
      {
        ...newProduct,
        price: Number(newProduct.price),
        image: imageUrl,
        seller_id: user.id,
      },
    ]);

    if (!error) {
      alert("¡Producto subido a tu catálogo!");
      setNewProduct({
        name: "",
        brand: "",
        category: "",
        price: "",
        description: "",
      });
      setProductImage(null); // Limpiamos el archivo
      document.getElementById("file-input").value = ""; // Reseteamos el input visual
      loadSellerData(user.id);
    } else {
      alert("Error al subir: " + error.message);
    }
    setUploading(false);
  };

  // --- LÓGICA DE ADMIN ---
  async function loadAdminData() {
    const { data: usersData } = await supabase.from("profiles").select("*");
    const { data: productsData } = await supabase
      .from("products")
      .select("*, profiles(company_name)");
    setAllUsers(usersData || []);
    setAllProducts(productsData || []);
  }

  // --- LÓGICA COMPARTIDA (Borrar Producto) ---
  const handleDeleteProduct = async (productId) => {
    if (!confirm("¿Seguro que quieres borrar este producto permanentemente?"))
      return;
    await supabase.from("products").delete().eq("id", productId);

    if (profile.role === "admin") loadAdminData();
    else loadSellerData(user.id);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 flex-1 animate-fade-in-up">
      <h1 className="text-3xl font-black text-gray-900 mb-8 border-b pb-4">
        Bienvenido,{" "}
        <span className="text-emerald-600">
          {profile?.first_name || profile?.company_name || "Administrador"}
        </span>{" "}
        👋
      </h1>

      {profile?.role === "admin" ? (
        /* ================= VISTA DE ADMIN ================= */
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              👥 Gestión de Vendedores
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl">
                      Nombre / Empresa
                    </th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3">WhatsApp</th>
                    <th className="px-4 py-3 rounded-tr-xl">Nicho</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-4 font-bold text-gray-900">
                        {u.company_name || `${u.first_name} ${u.last_name}`}
                      </td>
                      <td className="px-4 py-4 text-gray-500">{u.email}</td>
                      <td className="px-4 py-4 text-gray-500">
                        {u.whatsapp_number}
                      </td>
                      <td className="px-4 py-4">
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-xs font-bold">
                          {u.niche || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📦 Auditoría de Productos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allProducts.map((p) => (
                <div
                  key={p.id}
                  className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2 relative group"
                >
                  <span className="absolute top-2 left-2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded shadow-sm z-10">
                    {p.profiles?.company_name}
                  </span>
                  <img
                    src={p.image || "https://placehold.co/150"}
                    alt={p.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <h4 className="font-bold text-sm line-clamp-1">{p.name}</h4>
                  <span className="text-emerald-600 font-black text-sm">
                    ${p.price}
                  </span>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="mt-auto w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* ================= VISTA DE VENDEDOR ================= */
        
        <div className="grid lg:grid-cols-3 gap-8">
            
          {/* Formulario de subida */}
          <section className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit sticky top-24">
            <div className="flex gap-4 mb-6">
  <button onClick={() => router.push("/dashboard/perfil")} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-full text-sm transition-all shadow-sm">
    ⚙️ Editar Mi Perfil
  </button>
  <button onClick={() => router.push(`/vendedor/${user.id}`)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-2 px-6 rounded-full text-sm transition-all shadow-sm">
    👀 Ver mi Perfil Público
  </button>
</div>
            <h2 className="text-xl font-bold mb-4">Subir Nuevo Producto</h2>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre del producto"
                required
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm"
              />
              <input
                type="text"
                placeholder="Marca"
                value={newProduct.brand}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, brand: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm"
              />
              <input
                type="text"
                placeholder="Categoría (Ej: Tecnología)"
                required
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm"
              />
              <input
                type="number"
                placeholder="Precio final"
                required
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm"
              />
              <textarea
                placeholder="Descripción detallada..."
                required
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm h-24 resize-none"
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500">
                  Foto del Producto
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setProductImage(e.target.files[0])}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 mt-2 shadow-sm"
              >
                {uploading ? "Subiendo..." : "Publicar Producto"}
              </button>
            </form>
          </section>

          {/* Catálogo del Vendedor */}
          <section className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
              Mi Catálogo{" "}
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                {myProducts.length} productos
              </span>
            </h2>
            {myProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                Aún no has subido ningún producto.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex gap-4 border border-gray-100 p-3 rounded-2xl hover:shadow-md transition-shadow"
                  >
                    <img
                      src={p.image || "https://placehold.co/150"}
                      alt={p.name}
                      className="w-24 h-24 object-cover rounded-xl shrink-0"
                    />
                    <div className="flex flex-col flex-1">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">
                        {p.category}
                      </span>
                      <h4 className="font-bold text-gray-900 text-sm line-clamp-1">
                        {p.name}
                      </h4>
                      <span className="text-gray-900 font-black text-sm mt-1">
                        ${p.price}
                      </span>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="mt-auto self-start text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
