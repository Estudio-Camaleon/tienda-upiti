import { supabase } from "./supabase";

// ───── FAVORITES ─────

export async function getFavorites(userId) {
  const { data } = await supabase
    .from("favorites")
    .select("*, product:products(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function isFavorited(userId, productId) {
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  return !!data;
}

export async function toggleFavorite(userId, productId) {
  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
    return { favorited: false };
  } else {
    // Add favorite
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: userId, product_id: productId });
    if (error) throw error;
    return { favorited: true };
  }
}

// ───── FOLLOWS ─────

export async function getFollowedSellers(userId) {
  const { data } = await supabase
    .from("follows")
    .select("*, followed:profiles!followed_id(*)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function isFollowing(followerId, followedId) {
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("followed_id", followedId)
    .maybeSingle();
  return !!data;
}

export async function toggleFollow(followerId, followedId) {
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
