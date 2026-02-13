const express = require("express");
const router = express.Router();
const multer = require("multer");
const GeminiService = require("../services/geminiService");
const { createClient } = require('@supabase/supabase-js');

// Use memory storage for uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Helper to get scoped client
const getScopedSupabase = (token) => {
    return createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });
};

// Initialize Gemini service
let geminiService = null;
const getGeminiService = () => {
    if (!geminiService && process.env.GEMINI_API_KEY) {
        geminiService = new GeminiService(process.env.GEMINI_API_KEY);
    }
    return geminiService;
};

// Helper: Upload to Supabase Storage using scoped client
const uploadToSupabase = async (supabase, buffer, filename, contentType) => {
    const { data, error } = await supabase.storage
        .from('images')
        .upload(filename, buffer, {
            contentType,
            upsert: true
        });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filename);

    return publicUrl;
};

// Generate single product photo
router.post("/", upload.fields([{ name: 'productImage', maxCount: 1 }, { name: 'backgroundImage', maxCount: 1 }]), async (req, res) => {
    try {
        // Authenticate user
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const supabase = getScopedSupabase(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

        const service = getGeminiService();
        if (!service) return res.status(400).json({ error: "API key not configured" });

        const { modelId, productType, background, pose, gender, aspectRatio, imageSize } = req.body;
        const productImage = req.files?.productImage?.[0]?.buffer || null;
        const backgroundImage = req.files?.backgroundImage?.[0]?.buffer || null;

        // Fetch user's model from Supabase
        const { data: model, error: modelError } = await supabase
            .from('models')
            .select('*')
            .eq('id', modelId)
            // .eq('user_id', user.id) // RLS handles this
            .single();

        if (modelError || !model) return res.status(404).json({ error: "Model not found" });

        // Generate image
        const result = await service.generateProductPhoto({
            modelDescription: model.description,
            modelPhotos: model.photos,
            productType,
            productImage,
            backgroundImage,
            background,
            pose,
            gender,
            aspectRatio,
            imageSize,
        });

        // Upload generated image to Supabase
        const filename = `${user.id}/${Date.now()}_gen.png`;
        const imageUrl = await uploadToSupabase(supabase, result.imageData, filename, 'image/png');

        // Save to generations table
        const { error: dbError } = await supabase
            .from('generations')
            .insert([{
                user_id: user.id,
                model_id: modelId,
                image_url: imageUrl,
                filename: filename,
                product_type: productType,
                background: background,
                pose: pose,
                parameters: { aspectRatio, imageSize }
            }]);

        if (dbError) console.error("DB Save Error:", dbError);

        res.json({
            success: true,
            image: imageUrl,
            // Return dummy history entry structure for frontend compatibility
            historyEntry: {
                id: Date.now(),
                image_url: imageUrl,
                modelName: model.name,
                productType
            }
        });
    } catch (error) {
        console.error("Generation error:", error);
        res.status(500).json({ error: error.message || "Generation failed" });
    }
});

// Generate model preview (portrait without product)
router.post("/preview", upload.single("referencePhoto"), async (req, res) => {
    try {
        const service = getGeminiService();
        if (!service) return res.status(400).json({ error: "API key not configured" });

        const { description, gender } = req.body;
        const referencePhoto = req.file ? req.file.buffer.toString("base64") : null;

        const result = await service.generateModelPreview({
            description,
            gender,
            referencePhoto,
        });

        // Return base64 for preview (no save needed yet)
        res.json({
            success: true,
            image: result.imageData.toString("base64"),
            mimeType: result.mimeType,
        });
    } catch (error) {
        console.error("Preview generation error:", error);
        res.status(500).json({ error: error.message || "Preview generation failed" });
    }
});

// Generate 4 angles of model (no product)
router.post("/angles", upload.single("referencePhoto"), async (req, res) => {
    try {
        const service = getGeminiService();
        if (!service) return res.status(400).json({ error: "API key not configured" });

        const { description, gender } = req.body;
        const referencePhoto = req.file ? req.file.buffer.toString("base64") : null;

        const results = await service.generateModelAngles({
            description,
            gender,
            referencePhoto,
        });

        const images = results.map(r => ({
            image: r.imageData.toString("base64"),
            mimeType: r.mimeType,
            framing: r.framing,
        }));

        res.json({
            success: true,
            count: images.length,
            images,
        });
    } catch (error) {
        console.error("Angles generation error:", error);
        res.status(500).json({ error: error.message || "Angles generation failed" });
    }
});
// Generate variations (multiple images)
router.post("/variations", upload.fields([{ name: 'productImage', maxCount: 1 }, { name: 'backgroundImage', maxCount: 1 }]), async (req, res) => {
    try {
        // Authenticate user
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const supabase = getScopedSupabase(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

        const service = getGeminiService();
        if (!service) return res.status(400).json({ error: "API key not configured" });

        const { modelId, productType, background, pose, gender, aspectRatio, imageSize, count } = req.body;
        const productImage = req.files?.productImage?.[0]?.buffer || null;
        const backgroundImage = req.files?.backgroundImage?.[0]?.buffer || null;
        const variationCount = parseInt(count) || 2; // Default to 2 if not strict 10 (or use specific logic)

        // Fetch user's model from Supabase
        const { data: model, error: modelError } = await supabase
            .from('models')
            .select('*')
            .eq('id', modelId)
            .single();

        if (modelError || !model) return res.status(404).json({ error: "Model not found" });

        // Generate variations
        // We can pass 'count' to generateVariations method if we modify it to accept dynamic count, 
        // currently it takes baseParams and uses a loop.
        // geminiService.generateVariations(baseParams, count)
        const variations = await service.generateVariations({
            modelDescription: model.description,
            modelPhotos: model.photos,
            productType,
            productImage,
            backgroundImage,
            background,
            pose, // This might be ignored or used as base
            gender,
            aspectRatio,
            imageSize,
        }, variationCount);

        const savedImages = [];

        // Upload and save each variation
        for (let i = 0; i < variations.length; i++) {
            const result = variations[i];
            const filename = `${user.id}/${Date.now()}_var_${i}.png`;

            try {
                const imageUrl = await uploadToSupabase(supabase, result.imageData, filename, 'image/png');

                // Save to generations table
                const { data: stringData, error: dbError } = await supabase
                    .from('generations')
                    .insert([{
                        user_id: user.id,
                        model_id: modelId,
                        image_url: imageUrl,
                        filename: filename,
                        product_type: productType,
                        background: background,
                        pose: result.framing || pose || `Variation ${i + 1}`,
                        is_variation: true,
                        variation_index: i,
                        parameters: { aspectRatio, imageSize }
                    }])
                    .select()
                    .single();

                if (dbError) {
                    console.error(`DB Save Error for variation ${i}:`, dbError);
                    continue;
                }

                savedImages.push({
                    image: imageUrl,
                    historyEntry: {
                        id: stringData.id,
                        filename: filename,
                        image_url: imageUrl
                    }
                });

            } catch (err) {
                console.error(`Error saving variation ${i}:`, err);
            }
        }

        res.json({
            success: true,
            count: savedImages.length,
            images: savedImages
        });

    } catch (error) {
        console.error("Variations generation error:", error);
        res.status(500).json({ error: error.message || "Variations generation failed" });
    }
});

module.exports = router;
