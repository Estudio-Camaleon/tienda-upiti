import { supabase } from "./supabase";

const LS_FAVORITES = "upiti_favorites";
const LS_FOLLOWS = "upiti_follows";

// ───── Anonymous (localStorage) helpers ─────

function getLocalFavorites() {
  try {
    return JSON.parse(localStorage.getItem(LS_FAVORITES) || "[]");
  } catch {
    return [];
  }
}

function getLocalFollows() {
  try {
    return JSON.parse(localStorage.getItem(LS_FOLLOWS) || "[]");
  } catch {
    return [];
  }
}

// ───── FAVORITES ─────

export async function getFavorites(userId) {
  if (!userId) return getLocalFavorites();
  const { data } = await supabase
    .from("favorites")
    .select("*, product:products(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function isFavorited(userId, productId) {
  if (!userId) {
    return getLocalFavorites().includes(Number(productId));
  }
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  return !!data;
}

export async function toggleFavorite(userId, productId) {
  if (!userId) {
    const stored = getLocalFavorites();
    const pid = Number(productId);
    const idx = stored.indexOf(pid);
    if (idx === -1) {
      stored.push(pid);
      localStorage.setItem(LS_FAVORITES, JSON.stringify(stored));
      return { favorited: true };
    } else {
      stored.splice(idx, 1);
      localStorage.setItem(LS_FAVORITES, JSON.stringify(stored));
      return { favorited: false };
    }
  }
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
    return { favorited: false };
  } else {
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: userId, product_id: productId });
    if (error) throw error;
    return { favorited: true };
  }
}

// ───── FOLLOWS ─────

export async function getFollowedSellers(userId) {
  if (!userId) return getLocalFollows();
  const { data } = await supabase
    .from("follows")
    .select("*, followed:profiles!followed_id(*)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function isFollowing(followerId, followedId) {
  if (!followerId) {
    return getLocalFollows().includes(followedId);
  }
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("followed_id", followedId)
    .maybeSingle();
  return !!data;
}

export async function toggleFollow(followerId, followedId) {
  if (!followerId) {
    const stored = getLocalFollows();
    const idx = stored.indexOf(followedId);
    if (idx === -1) {
      stored.push(followedId);
      localStorage.setItem(LS_FOLLOWS, JSON.stringify(stored));
      return { following: true };
    } else {
      stored.splice(idx, 1);
      localStorage.setItem(LS_FOLLOWS, JSON.stringify(stored));
      return { following: false };
    }
  }
  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("followed_id", followedId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
    return { following: false };
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: followerId, followed_id: followedId });
    if (error) throw error;
    return { following: true };
  }
}

export async function getFollowerCount(sellerId) {
  const { count, error } = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("followed_id", sellerId);
  if (error) return 0;
  return count || 0;
}
