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

// Get all models for the current user
router.get("/", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const supabase = getScopedSupabase(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

        const { data, error } = await supabase
            .from('models')
            .select('*')
            .order('created_at', { ascending: false }); // No need to filter by user_id explicitly if RLS works, but good practice.
        // Actually, RLS will filter it automatically.

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error("Get models error:", error);
        res.status(500).json({ error: "Failed to fetch models" });
    }
});

// Get single model
router.get("/:id", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const supabase = getScopedSupabase(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

        const { data, error } = await supabase
            .from('models')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ error: "Model not found" });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch model" });
    }
});

// Create new model
router.post("/", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const supabase = getScopedSupabase(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

        const { name, description, gender, photos } = req.body;

        if (!name || !gender) {
            return res.status(400).json({ error: "Name and gender are required" });
        }

        const { data, error } = await supabase
            .from('models')
            .insert([{
                user_id: user.id, // Explicitly setting user_id is good, RLS check will verify it matches auth.uid()
                name,
                description: description || "",
                gender,
                photos: photos || []
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error("Create model error:", error);
        res.status(500).json({ error: "Failed to create model" });
    }
});

// Update model
router.put("/:id", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const supabase = getScopedSupabase(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

        const { data, error } = await supabase
            .from('models')
            .update({
                name: req.body.name,
                description: req.body.description,
                gender: req.body.gender,
                photos: req.body.photos,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to update model" });
    }
});

// Delete model
router.delete("/:id", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const supabase = getScopedSupabase(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

        const { error } = await supabase
            .from('models')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete model" });
    }
});

module.exports = router;
