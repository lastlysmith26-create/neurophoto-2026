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

        const { modelId, productType, background, pose, gender, aspectRatio, imageSize, age, clothing, sliders: slidersJson } = req.body;
        const productImage = req.files?.productImage?.[0]?.buffer || null;
        const backgroundImage = req.files?.backgroundImage?.[0]?.buffer || null;
        const sliders = slidersJson ? JSON.parse(slidersJson) : null;

        // Fetch user's model from Supabase
        const { data: model, error: modelError } = await supabase
            .from('models')
            .select('*')
            .eq('id', modelId)
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
            age,
            clothing,
            sliders,
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

        const { description, gender, age, height } = req.body;
        const referencePhoto = req.file ? req.file.buffer.toString("base64") : null;

        const result = await service.generateModelPreview({
            description,
            gender,
            age,
            height,
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

// Generate model angles as 2×2 collage (single image)
router.post("/angles", upload.single("referencePhoto"), async (req, res) => {
    try {
        const service = getGeminiService();
        if (!service) return res.status(400).json({ error: "API key not configured" });

        const { description, gender, age, height } = req.body;
        const referencePhoto = req.file ? req.file.buffer.toString("base64") : null;

        const result = await service.generateModelAngles({
            description,
            gender,
            age,
            height,
            referencePhoto,
        });

        // Return single collage image in same format
        res.json({
            success: true,
            count: 1,
            images: [{
                image: result.imageData.toString("base64"),
                mimeType: result.mimeType,
                framing: "collage",
            }],
        });
    } catch (error) {
        console.error("Angles collage error:", error);
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

        const { modelId, productType, background, pose, gender, aspectRatio, imageSize, age, clothing, sliders: slidersJson } = req.body;
        const productImage = req.files?.productImage?.[0]?.buffer || null;
        const backgroundImage = req.files?.backgroundImage?.[0]?.buffer || null;
        const sliders = slidersJson ? JSON.parse(slidersJson) : null;

        // Fetch user's model from Supabase
        const { data: model, error: modelError } = await supabase
            .from('models')
            .select('*')
            .eq('id', modelId)
            .single();

        if (modelError || !model) return res.status(404).json({ error: "Model not found" });

        // Generate 2×2 collage (single image, consistent face)
        const result = await service.generateCollage({
            modelDescription: model.description,
            modelPhotos: model.photos,
            productType,
            productImage,
            backgroundImage,
            background,
            gender,
            aspectRatio,
            imageSize,
            age,
            clothing,
            sliders,
        });

        // Upload single collage image
        const filename = `${user.id}/${Date.now()}_collage.png`;
        const imageUrl = await uploadToSupabase(supabase, result.imageData, filename, 'image/png');

        // Save to generations table
        const { data: dbData, error: dbError } = await supabase
            .from('generations')
            .insert([{
                user_id: user.id,
                model_id: modelId,
                image_url: imageUrl,
                filename: filename,
                product_type: productType,
                background: background,
                pose: 'collage 2×2',
                is_variation: true,
                parameters: { aspectRatio: '1:1', imageSize }
            }])
            .select()
            .single();

        if (dbError) {
            console.error("DB Save Error for collage:", dbError);
        }

        res.json({
            success: true,
            count: 1,
            images: [{
                image: imageUrl,
                historyEntry: dbData ? {
                    id: dbData.id,
                    filename: filename,
                    image_url: imageUrl
                } : null
            }]
        });

    } catch (error) {
        console.error("Collage generation error:", error);
        res.status(500).json({ error: error.message || "Collage generation failed" });
    }
});

// Generate 4 parallel variations with streaming response (SSE/NDJSON-like)
router.post("/parallel", upload.fields([{ name: 'productImage', maxCount: 1 }, { name: 'backgroundImage', maxCount: 1 }]), async (req, res) => {
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        // Authenticate user
        let user;
        try {
            const token = req.headers.authorization?.split(' ')[1] || req.query.token; // Support token in query for EventSource if needed
            if (!token) throw new Error("Unauthorized");

            const supabase = getScopedSupabase(token);
            const { data, error } = await supabase.auth.getUser();
            if (error || !data.user) throw new Error("Unauthorized");
            user = data.user;
        } catch (e) {
            res.write(`data: ${JSON.stringify({ error: "Unauthorized" })}\n\n`);
            return res.end();
        }

        const supabase = getScopedSupabase(req.headers.authorization?.split(' ')[1]);
        const service = getGeminiService();

        if (!service) {
            res.write(`data: ${JSON.stringify({ error: "API key not configured" })}\n\n`);
            return res.end();
        }

        const { modelId, productType, background, gender, aspectRatio, imageSize, age, clothing, sliders: slidersJson } = req.body;
        const productImage = req.files?.productImage?.[0]?.buffer || null;
        const backgroundImage = req.files?.backgroundImage?.[0]?.buffer || null;
        const sliders = slidersJson ? JSON.parse(slidersJson) : null;

        // Fetch user's model
        const { data: model } = await supabase
            .from('models')
            .select('*')
            .eq('id', modelId)
            .single();

        if (!model) {
            res.write(`data: ${JSON.stringify({ error: "Model not found" })}\n\n`);
            return res.end();
        }

        // Define 4 distinct poses/prompts
        const VARIATION_POSES = [
            "Front view looking at camera",
            "Side profile view",
            "3/4 angle view",
            "Dynamic fashion pose"
        ];

        // Notify start
        res.write(`data: ${JSON.stringify({ type: 'start', count: VARIATION_POSES.length })}\n\n`);

        // Create promises for parallel execution
        const tasks = VARIATION_POSES.map(async (pose, index) => {
            try {
                // Generate
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
                    age,
                    clothing,
                    sliders,
                });

                // Upload
                const filename = `${user.id}/${Date.now()}_var_${Math.random().toString(36).substr(2, 9)}.png`;
                const imageUrl = await uploadToSupabase(supabase, result.imageData, filename, 'image/png');

                // Save DB
                const { data: dbData } = await supabase
                    .from('generations')
                    .insert([{
                        user_id: user.id,
                        model_id: modelId,
                        image_url: imageUrl,
                        filename: filename,
                        product_type: productType,
                        background: background,
                        pose: pose,
                        is_variation: true,
                        parameters: { aspectRatio, imageSize }
                    }])
                    .select()
                    .single();

                // Stream SUCCESS result immediately
                const successData = {
                    type: 'image',
                    index: index, // To know which one finished
                    image: {
                        url: imageUrl,
                        historyEntry: dbData ? {
                            id: dbData.id,
                            filename: filename,
                            image_url: imageUrl
                        } : null
                    }
                };
                res.write(`data: ${JSON.stringify(successData)}\n\n`);

            } catch (err) {
                console.error(`Variation ${index} failed:`, err);
                const errorData = {
                    type: 'error',
                    index: index,
                    message: err.message
                };
                res.write(`data: ${JSON.stringify(errorData)}\n\n`);
            }
        });

        // Wait for all to finish (even if we streamed results already)
        await Promise.all(tasks);

        // End stream
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();

    } catch (error) {
        console.error("Parallel generation stream error:", error);
        res.write(`data: ${JSON.stringify({ error: error.message || "Parallel generation failed" })}\n\n`);
        res.end();
    }
});

module.exports = router;
