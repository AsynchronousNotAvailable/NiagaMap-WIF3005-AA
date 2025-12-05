const supabase = require("../supabase/supabase_client");

module.exports = {
    // Add a favourite for a user
    addFavourite: async (user_id, analysis_id) => {
        // Optional: check if the favourite already exists
        const { data: existing, error: fetchError } = await supabase
            .from("favourites")
            .select("*")
            .eq("user_id", user_id)
            .eq("analysis_id", analysis_id)
            .single();

        if (fetchError && fetchError.code !== "PGRST116") throw fetchError; // other errors
        if (existing) throw new Error("Favourite already exists");

        // Insert favourite
        const { data, error } = await supabase
            .from("favourites")
            .insert([{ user_id, analysis_id }])
            .select(`*,
                users:users(*),
                analysis:analysis(*)
                `);

        if (error) throw error;
        return data[0];
    },

    // Optional: get all favourites for a user
    getFavourites: async (user_id) => {
        const { data, error } = await supabase
            .from("favourites")
            .select(
                `
                *,
                users:users(*),
                analysis:analysis(*)
                `
            )
            .eq("user_id", user_id);

        if (error) throw error;
        return data;
    },

    // Optional: remove a favourite
    removeFavourite: async (user_id, analysis_id) => {
        const { data, error } = await supabase
            .from("favourites")
            .delete()
            .eq("user_id", user_id)
            .eq("analysis_id", analysis_id)
            .select(`
                *,
                users:users(*),
                analysis:analysis(*)
                `);
        if (error) throw error;
        return data[0];
    },
};
