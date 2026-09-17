export async function getProfileById(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertWalletAddress(supabase, userId, walletAddress) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        wallet_address: walletAddress,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
