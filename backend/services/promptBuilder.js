/**
 * Model Agency Prompt Builder
 * 
 * Generates high-end e-commerce and editorial fashion prompts for Nano Banana Pro.
 * Focuses on flawless "retouched" realism, clean catalog lighting, and specific
 * pose instructions based on product type (clothing vs. objects).
 */

// Camera rigs - High-end commercial
const CAMERA_RIGS = [
    "Phase One XF IQ4 150MP",
    "Hasselblad H6D-100c",
    "Canon EOS R5",
    "Sony Alpha 1",
    "Fujifilm GFX 100S",
];

// Lenses - Sharp commercial primes
const LENSES = [
    { name: "Schneider Kreuznach 80mm LS f/2.8", aperture: "f/5.6", focal: "80mm" },
    { name: "Hasselblad HC 100mm f/2.2", aperture: "f/8", focal: "100mm" },
    { name: "Canon RF 85mm f/1.2L", aperture: "f/4", focal: "85mm" },
    { name: "Sony FE 90mm f/2.8 Macro", aperture: "f/5.6", focal: "90mm" },
    { name: "Fujifilm GF 110mm f/2", aperture: "f/4", focal: "110mm" },
];

// Lighting setups - Clean, even, commercial
const LIGHTING_SETUPS = {
    studio: [
        "High-key commercial lighting (invisible softbox effect), clean white fill from both sides, even illumination, no harsh shadows, no visible equipment",
        "Clean e-commerce lighting, cool white daylight 5500K, shadowless white background, professional catalog look, no studio gear in frame",
        "Beauty lighting setup (invisible sources), silver reflector effect below chin, rim lights on hair, bright and airy look, clean background",
        "Soft window light simulation, natural looking commercial light, clean and crisp, no props or stands visible",
        "Ring light effect (source not visible) with soft fill, shadowless face illumination, sharp catchlights in eyes, perfect for makeup or accessory detail",
    ],
    outdoor: [
        "Soft open shade, even natural lighting avoiding direct harsh sun, white reflector fill, bright and airy outdoor catalog look",
        "Golden hour backlighting with strong fill flash on subject, commercial lifestyle photography, bright exposure",
        "Overcast day providing giant softbox effect, even shadowless light, perfect color rendering, clean commercial outdoor look",
    ],
    neon: [
        "Glossy high-fashion neon, purple and teal rim lights, clean key light on face to preserve skin tones, futuristic commercial editorial",
        "Cyberpunk catalog style, crisp neon tube lighting, sharp focus on product, vibrant but controlled color palette",
    ],
    default: [
        "Professional studio strobe lighting, soft and even, 5500K daylight balanced, perfect for product visibility",
    ]
};

// Texture details - Flawless but realistic (Retouched style)
const TEXTURE_DETAILS = [
    "flawless professional skin texture, high-end beauty retouching style, even skin tone, soft natural glow, sharp eyes with perfect catchlights",
    "luxury cosmetic campaign look, smooth but detailed skin texture, perfect makeup application, commercially polished appearance",
    "magazine cover quality skin, refined pores, perfect complexion, professional grooming, hyper-polished look",
    "commercial beauty standard, clean and clear skin, perfect lighting interaction, smooth gradients, no blemishes",
];

// Fabric textures - Sharp and detailed
const FABRIC_TEXTURES = [
    "crisp fabric details, clearly visible weave pattern, high-quality material rendering, sharp focus on textile structure",
    "luxurious fabric sheen, accurate material weight and draping, commercial product fidelity, sharp stitching details",
    "high-resolution textile presentation, perfect color accuracy, tangible texture feeling, clean and pressed look",
];

// Negative prompts - Strict quality control
const NEGATIVE_PROMPTS = [
    "ugly", "bad anatomy", "deformed", "blurry", "pixelated", "low quality",
    "acne", "blemishes", "scars", "wrinkles", "messy skin", "dirty",
    "studio equipment", "lighting stands", "softboxes", "tripods", "cameras visible", "reflectors",
    "text", "watermark", "logo", "borders", "frames", "split screen",
    "bad hands", "missing fingers", "extra fingers", "mutated hands", "poorly drawn face"
];

// ------------------------------------------------------------------
// POSE LIBRARY - 20+ Poses per Category
// ------------------------------------------------------------------

const POSE_LIBRARY = {
    // For Clothing: Full Body
    fashion_standing: [
        "Standing confident, weight on one leg, hands relaxed by sides",
        "Walking towards camera, mid-stride, clothes flowing naturally",
        "Standing tall, one hand in pocket, looking slightly away",
        "Leaning casually against a clean wall, one leg crossed over",
        "Fashion stance, hands on hips, strong silhouette",
        "Dynamic turn, looking back over shoulder",
        "Casual standing, fixing hair / touching face lightly",
        "Standing with feet shoulder width apart, strong power pose",
        "Walking past camera, side view, movement blur on background only",
        "Standing straight, hands clasped loosely in front",
        "One hand on hip, other arm relaxed, weight shifted back",
        "Slight lean forward engaged with camera",
        "Back to camera, turning head to look back (showing back of outfit)",
        "Standing profile, clean silhouette line",
        "Jumping / dynamic movement freeze frame (for sportswear)",
        "Standing crossed legs, casual elegance",
        "Adjusting cuff or collar, natural lifestyle action",
        "Walking away from camera (back view)",
        "Wide stance, confident look, low angle",
        "Standing with arms crossed confidently",
    ],
    // For Clothing: Medium / Waist-Up (Outfit & Details)
    fashion_medium: [
        "Waist-up shot, hands manipulating fabric/buttons",
        "Medium shot, arms folded, confident expression",
        "Waist-up, adjusting collar/neckline, looking at camera",
        "Medium shot, one hand near face, elegant pose",
        "Waist-up, slight turn to side, highlighting silhouette",
        "Medium close-up, focus on upper garment details",
        "Waist-up, laughing/smiling candidly",
        "Medium shot, hands in pockets of jacket/pants",
        "Waist-up, looking down at outfit/product",
        "Medium profile shot, chin up",
        "Back view waist-up, turning head to profile",
        "Medium shot, hands resting on implied surface",
        "Waist-up, dynamic hair flip motion",
        "Medium shot, touching hair, relaxed elbows",
        "Close crop on torso, emphasizing layering",
        "Waist-up, arms relaxed at sides, clean posture",
        "Medium shot, leaning forward slightly",
        "Waist-up, fixing sleeve/accessory",
        "Medium shot, 45-degree angle turn",
        "Waist-up, hands clasped together near chest",
    ],
    // For Beauty / Accessories / Hats / Glasses
    portrait_beauty: [
        "Close-up beauty portrait, hands framing face",
        "Extreme close-up on eyes/face, perfect makeup",
        "Head and shoulders, looking looking up towards light",
        "Close-up, looking over sunglasses",
        "Portrait, hand touching earring/necklace",
        "Close-up, chin resting on hand",
        "Portrait, profile view highlighting jawline",
        "Close-up, looking directly into lens, mesmerizing gaze",
        "Headshot, slight head tilt, soft smile",
        "Close-up, hair covering one eye slightly",
        "Portrait, hands near neck/collar",
        "Close-up, wearing hat, looking out from under brim",
        "Portrait, looking sideways, strong eye contact",
        "Close-up, showing texture of skin and makeup",
        "Portrait, mouth slightly open, relaxed expression",
        "Close-up, hands holding collar/scarf",
        "Head and shoulders, back view turning head",
        "Close-up, wind blowing hair, dynamic look",
        "Portrait, serious high-fashion expression",
        "Close-up, soft focus on peripheral, sharp eyes",
    ],
    // For Objects (Gadgets, Creams, Bottles, etc.)
    product_interaction: [
        "Holding product in open palm, presenting it to camera",
        "Using the product naturally (e.g., applying cream, holding phone)",
        "Holding product close to face/cheek, smiling",
        "Looking at the product in hand with admiration",
        "Holding product out towards camera (forced perspective)",
        "Hands framing the product held in center",
        "Holding product against chest/torso",
        "Fingers gently touching the product texture",
        "Holding product with both hands specifically",
        "Product in foreground, model slightly blurred in background",
        "Interacting with product on a surface (implied)",
        "Holding product up against the light/sky",
        "Taking product out of bag/pocket",
        "Gesturing towards product placed on surface",
        "Holding product in profile view",
        "Mock-using the product (listening to phone, drinking)",
        "Holding product balanced on fingertips",
        "Product resting on model's shoulder/arm",
        "Peeking from behind the product",
        "Holding product securely, focus on grip",
    ]
};

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Intelligent Pose Selector
 * Selects the most appropriate pose category and specific pose based on product type
 */
function getAdaptivePose(productType, requestedPose) {
    const pt = (productType || "").toLowerCase();
    const req = (requestedPose || "").toLowerCase();

    // 1. If user requested a specific non-auto pose, try to match or respect it
    if (req && req !== 'auto' && !req.includes('best') && !req.includes('any')) {
        // If it's a specific custom prompt, return it directly
        return req;
    }

    // 2. Classify Product
    const isAccessory = pt.includes('hat') || pt.includes('cap') || pt.includes('glass') || pt.includes('jewelry') || pt.includes('earring') || pt.includes('necklace') || pt.includes('makeup') || pt.includes('lipstick') || pt.includes('scarf');
    const isObject = pt.includes('phone') || pt.includes('bottle') || pt.includes('cream') || pt.includes('shampoo') || pt.includes('soap') || pt.includes('gadget') || pt.includes('toy') || pt.includes('tool') || pt.includes('cup') || pt.includes('bag') || pt.includes('plunger') || pt.includes('wallet') || pt.includes('watch') || pt.includes('shoe') || pt.includes('sneaker');
    const isClothing = !isAccessory && !isObject; // Default to clothing (shirts, pants, dresses, etc.)

    // 3. Select Category based on classification
    let category = "fashion_standing"; // default

    if (isObject) {
        category = "product_interaction";
    } else if (isAccessory) {
        category = "portrait_beauty";
    } else if (isClothing) {
        // Randomly mix between Standing (70%) and Medium (30%) for variety
        category = Math.random() > 0.3 ? "fashion_standing" : "fashion_medium";
    }

    // 4. Pick random pose from category
    const poseList = POSE_LIBRARY[category];
    const selectedPose = pickRandom(poseList);

    return selectedPose;
}

function detectEnvironment(background) {
    const bg = (background || "").toLowerCase();
    if (bg.includes("neon") || bg.includes("neoh") || bg.includes("cyberpunk") || bg.includes("киберпанк")) return "neon";
    if (bg.includes("outdoor") || bg.includes("park") || bg.includes("nature") || bg.includes("street") || bg.includes("urban") || bg.includes("city")) return "outdoor";
    if (bg.includes("studio") || bg.includes("grey") || bg.includes("white") || bg.includes("black")) return "studio";
    return "studio"; // default
}

function buildSliderDirectives(sliders) {
    if (!sliders) return "";
    const parts = [];

    // Simplified slider logic focusing on quality
    if (parseInt(sliders.similarity) >= 50) parts.push("High facial similarity to reference.");
    if (parseInt(sliders.stylization) >= 50) parts.push("Stylized fashion editorial look.");
    if (parseInt(sliders.realism) >= 50) parts.push("Ultra-photorealistic 8k.");

    return parts.join(" ");
}

/**
 * Main Product Prompt Builder
 */
function buildProductPrompt(params) {
    const {
        modelDescription,
        gender,
        age,
        clothing,
        sliders,
        productType,
        background,
        pose,
        hasProductImage,
        hasBackgroundImage,
        hasModelPhotos,
    } = params;

    const env = detectEnvironment(background);
    const camera = pickRandom(CAMERA_RIGS);
    const lens = pickRandom(LENSES);
    const lightingPool = LIGHTING_SETUPS[env] || LIGHTING_SETUPS.default;
    const lighting = pickRandom(lightingPool);
    const texture = pickRandom(TEXTURE_DETAILS);
    const fabric = pickRandom(FABRIC_TEXTURES);

    // Use the new Adaptive Pose logic
    const finalPose = getAdaptivePose(productType, pose);

    const genderDesc = gender === "male" ? "Handsome male professional model" : "Beautiful female professional model";

    let modelDesc = `${genderDesc}, ${modelDescription}`;
    if (age) modelDesc += `, age ${age}`;
    if (params.height) modelDesc += `, height ${params.height}`;

    const parts = [
        // Style & Quality
        `Professional high-end e-commerce catalog photography. Ultra-realistic, 8k resolution, highly detailed.`,

        // Subject
        `Subject: ${modelDesc}.`,
        `Skin: ${texture}.`,

        // Product & Clothing
        clothing
            ? `Wearing: ${clothing}. Hero product: ${productType}.`
            : `Presenting product: ${productType}.`,
        `Fabric/Material Detail: ${fabric}.`,

        // Pose
        `Action/Pose: ${finalPose}.`,

        // Environment & Lighting
        `Environment: ${background}.`,
        `Lighting: ${lighting}.`,

        // Technical
        `Shot on ${camera} with ${lens.name}. Sharp focus on subject and product.`,

        // STRICT EQUIPMENT BAN FOR STUDIO
        env === 'studio' ? "CRITICAL: INFINITE BACKGROUND. NO STUDIO EQUIPMENT, NO STANDS, NO SOFTBOXES, NO LAMPS VISIBLE IN FRAME." : "",

        // Slider extras
        buildSliderDirectives(sliders),

        // Negative reinforcement in positive prompt (Style guardrails)
        `Style: Clean commercial look, flawless retouching, perfect exposure, neutral color grading, no artifacts.`,
    ];

    // Reference safeguards
    if (hasModelPhotos) parts.push("Maintain exact facial identity of reference model.");
    if (hasProductImage) parts.push("Integrate provided product image naturally.");
    if (hasBackgroundImage) parts.push("Match provided background environment.");

    // Append Negative Prompts to the end (some APIs ignore this, but good for context)
    // Note: Gemini usually takes negative prompts separately, but if we pack everything into one prompt:
    parts.push(`\n\nNEGATIVE PROMPT: ${NEGATIVE_PROMPTS.join(", ")}`);

    return parts.filter(Boolean).join(" ");
}

// ... (Other specific prompt builders can use similar logic or simplified versions) ...

function buildModelPreviewPrompt(params) {
    const { description, gender, hasReferencePhoto } = params;

    const parts = [
        `Professional beauty portrait, ${gender}, ${description}.`,
        `Style: Flawless skin, studio lighting, sharp focus, 8k resolution, high-end commercial look.`,
        `Negative: ${NEGATIVE_PROMPTS.join(", ")}`
    ];

    if (hasReferencePhoto) {
        parts.push("IMPORTANT: The generated person must look EXACTLY like the person in the reference photo. Preserve all facial features, skin tone, eye color, bone structure, and body type with absolute fidelity.");
    }

    return parts.join(" ");
}

function buildModelAnglePrompt(params) {
    const { description, gender, framingPrompt, hasReferencePhoto } = params;

    const parts = [
        `Professional fashion photo, ${gender}, ${description}.`,
        `Pose: ${framingPrompt}.`,
        `Style: Clean studio lighting, 8k resolution, commercial catalog quality.`,
        `Negative: ${NEGATIVE_PROMPTS.join(", ")}`
    ];

    if (hasReferencePhoto) {
        parts.push("IMPORTANT: The generated person must look EXACTLY like the person in the reference photo. Preserve all facial features with absolute fidelity.");
    }

    return parts.join(" ");
}

function buildCollagePrompt(params) {
    const { modelDescription, gender, productType, background, hasModelPhotos, hasProductImage, hasBackgroundImage } = params;

    const parts = [
        `Professional 2x2 fashion collage. 4 frames of same model (${gender}, ${modelDescription}) wearing ${productType}.`,
        `Structure: Frame 1: Close-up beauty. Frame 2: Waist-up. Frame 3: Full body. Frame 4: Action/Profile.`,
        `Style: High-end catalog, flawless skin, perfect lighting, ${background}.`,

        // RE-ADDED STRONG ENFORCEMENT
        `CRITICAL REQUIREMENT: The output must be ONE single image divided into exactly 4 equal quadrants.`,
        `ABSOLUTE CONSISTENCY: Each quadrant MUST show the EXACT SAME person. Identical face, identical features, identical hair, identical body type.`,
        `The viewer must immediately recognize this is the same person in all 4 frames. Any inconsistency in facial identity is completely unacceptable.`,

        `Negative: ${NEGATIVE_PROMPTS.join(", ")}`
    ];

    if (hasModelPhotos) {
        parts.push("MOST IMPORTANT: The person in ALL 4 frames MUST look exactly like the person in the provided reference photo. Preserve exact facial features, skin tone, eye color, and identity with absolute fidelity. This overrides all other directives.");
    }

    if (hasProductImage) {
        parts.push("Integrate the provided product image naturally in all frames.");
    }

    if (hasBackgroundImage) {
        parts.push("Use the provided background reference image as the environment in all 4 frames.");
    }

    return parts.join(" ");
}

// Compatibility exports
function buildModelAngleCollagePrompt(params) {
    return buildCollagePrompt(params);
}

module.exports = {
    buildProductPrompt,
    buildModelPreviewPrompt,
    buildModelAnglePrompt,
    buildModelAngleCollagePrompt,
    buildCollagePrompt,
    detectEnvironment,
    detectComposition: (pose, productType) => { return { type: "Adaptive", angle: "Adaptive", height: "Adaptive" }; } // Shim for backward compat if needed
};
