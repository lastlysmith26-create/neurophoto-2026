const express = require("express");
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Helper to get scoped client
const getScopedSupabase = (token) => {
    return createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });
};

// Get all history
router.get("/", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const supabase = getScopedSupabase(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

        const { data, error } = await supabase
            .from('generations')
            .select('*, models(name)')
            // .eq('user_id', user.id) // RLS handles this
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform for frontend compatibility
        const history = data.map(item => ({
            id: item.id,
            filename: item.filename,
            modelId: item.model_id,
            modelName: item.models?.name || 'Unknown',
            productType: item.product_type,
            background: item.background,
            pose: item.pose,
            gender: item.gender,
            createdAt: item.created_at,
            image_url: item.image_url
        }));

        res.json(history);
    } catch (error) {
        console.error("Get history error:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// Delete history item
router.delete("/:id", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const supabase = getScopedSupabase(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

        // Get filename to delete from storage
        const { data: item } = await supabase
            .from('generations')
            .select('filename')
            .eq('id', req.params.id)
            .single();

        if (item?.filename) {
            await supabase.storage.from('images').remove([item.filename]);
        }

        const { error } = await supabase
            .from('generations')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete item" });
    }
});

// Clear all history
router.delete("/", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const supabase = getScopedSupabase(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

        // Note: Bulk delete from storage is complex if many files. 
        // For now just deleting metadata records. Storage clean up can be a separate maintenance task.

        const { error } = await supabase
            .from('generations')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows visible to user (RLS)

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear history" });
    }
});

module.exports = router;
