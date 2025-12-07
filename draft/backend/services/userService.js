const supabase = require("../supabase/supabase_client");
const { v4: uuidv4 } = require("uuid");

module.exports = {
    // CREATE user + preference
    createUser: async (user) => {
        try {
            // Optional: check if user already exists by name or email (if needed)
            // const { data: existing, error: checkError } = await supabase.from("users").select("*").eq("name", user.name).single();
            // if (checkError && checkError.code !== "PGRST116") throw checkError;
            // if (existing) throw new Error("User already exists");

            // Insert preference first
            const { data: prefData, error: prefError } = await supabase
                .from("preferences")
                .insert([
                    {
                        default_prompt: user.default_prompt || null,
                        theme: user.theme || null,
                    },
                ])
                .select();

            if (prefError || !prefData)
                throw prefError || new Error("Failed to create preference");

            // Insert user with reference to preference
            const { data: newUserData, error: newUserError } = await supabase
                .from("users")
                .insert([
                    {
                        user_id: user.userId,
                        name: user.name,
                        preference_id: prefData[0].preference_id,
                    },
                ]).select(`
      *,
      preferences:preferences(*)  
    `);

            if (newUserError || !newUserData)
                throw newUserError || new Error("Failed to create user");

            return newUserData[0];
        } catch (err) {
            // Abort operation: nothing is partially inserted
            throw err;
        }
    },

    // READ all users (with preference)
    getUsers: async () => {
        const { data, error } = await supabase.from("users").select(`
      *,
      preferences:preferences(*),
      favourites:favourites(*)
    `);

        if (error) throw error;
        return data;
    },

    // GET user by user_id (with preference)
    getUserById: async (user_id) => {
        const { data, error } = await supabase
            .from("users")
            .select(
                `
      *,
      preferences:preferences(*),
      favourites:favourites(*)  
    `
            )
            .eq("user_id", user_id)
            .single();

        if (error) throw error;
        return data;
    },

    // UPDATE user + preference
    updateUser: async (user_id, data) => {
        try {
            //find user
            const { data: existingUser, error: fetchError } = await supabase
                .from("users")
                .select(
                    `
            *,
            preferences:preferences(*),
            favourites:favourites(*)  
          `
                )
                .eq("user_id", user_id)
                .single();

            if (fetchError) throw fetchError;
            if (!existingUser) throw new Error("User not found");
            // Update preference first
            if (data.preference) {
                const { data: updatedPref, error: prefError } = await supabase
                    .from("preferences")
                    .update({
                        default_prompt: data.preference.default_prompt,
                        theme: data.preference.theme,
                    })
                    .eq("preference_id", existingUser.preferences.preference_id)
                    .select("*");

                if (prefError) throw prefError;
            }

            // Update user
            const { data: updatedUser, error: userError } = await supabase
                .from("users")
                .update({
                    name: data.name,
                })
                .eq("user_id", user_id).select(`
            *,
            preferences:preferences(*),
            favourites:favourites(*)
          `);

            if (userError) throw userError;

            return updatedUser[0];
        } catch (err) {
            // Abort operation
            throw err;
        }
    },

    // DELETE user + preference
    deleteUser: async (user_id) => {
        try {
            // Get user to find preference_id
            const { data: userData, error: fetchError } = await supabase
                .from("users")
                .select("*")
                .eq("user_id", user_id)
                .single();

            if (fetchError) throw fetchError;

            const preference_id = userData.preference_id;

            // Delete user first
            const { error: userError } = await supabase
                .from("users")
                .delete()
                .eq("user_id", user_id);

            if (userError) throw userError;

            // Delete preference
            const { data: prefData, error: prefError } = await supabase
                .from("preferences")
                .delete()
                .eq("preference_id", preference_id)
                .select("*");

            if (prefError) throw prefError;

            // Delete favourites
            const { data: favData, error: favError } = await supabase
                .from("favourites")
                .delete()
                .eq("user_id", user_id)
                .select("*");

            if (favError) throw favError;

            // Return deleted user + preference info + favourites
            return {
                deletedUser: {
                    ...userData,
                    preference: prefData?.[0] || null,
                    favourites: favData || [],
                },
            };
        } catch (err) {
            // Abort operation if any step fails
            throw err;
        }
    },
};
