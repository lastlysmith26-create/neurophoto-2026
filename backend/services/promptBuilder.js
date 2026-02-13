/**
 * Cinematographic Prompt Builder
 * 
 * Generates hyper-realistic prompts for Nano Banana Pro by simulating
 * real-world camera physics, lighting design, and material science.
 * Eliminates "plastic" AI look by adding micro-texture details.
 */

// Camera rigs pool
const CAMERA_RIGS = [
    "Arri Alexa 65",
    "RED V-Raptor 8K",
    "Sony Venice 2",
    "Canon EOS R5 Mark II",
    "Phase One XF IQ4",
    "Hasselblad X2D 100C",
];

// Lens options
const LENSES = [
    { name: "Zeiss Supreme Prime 85mm", aperture: "f/1.4", focal: "85mm" },
    { name: "Canon RF 70-200mm L", aperture: "f/2.8", focal: "135mm" },
    { name: "Sigma Art 105mm", aperture: "f/1.4", focal: "105mm" },
    { name: "Sony FE 85mm GM II", aperture: "f/1.4", focal: "85mm" },
    { name: "Zeiss Otus 55mm", aperture: "f/1.4", focal: "55mm" },
    { name: "Canon RF 50mm L", aperture: "f/1.2", focal: "50mm" },
    { name: "Leica Summilux-M 75mm", aperture: "f/1.4", focal: "75mm" },
];

// Lighting setups
const LIGHTING_SETUPS = {
    studio: [
        "Rembrandt lighting with key light at 45°, fill at -30°, 5600K daylight balanced softbox, subtle rim light from behind at 4200K, global illumination bounce from white v-flat",
        "Butterfly lighting setup, large octabox directly above model, 5000K color temperature, silver reflector below for subtle fill, volumetric haze at 15% density",
        "Split lighting with single Profoto D2 at 90°, 5600K, dramatic shadow side with minimal fill, hair light from behind at 3200K warm tungsten",
        "Broad commercial lighting, two large strip softboxes at 60° angles, 5400K neutral, white seamless background with gradient falloff, beauty dish for face",
        "Clamshell lighting setup, main beauty dish above at 45° down, reflector panel below, 5200K, even glamour illumination, subtle edge lights for separation",
    ],
    outdoor: [
        "Golden hour natural light, sun at 15° above horizon, warm 3200K backlight creating rim glow, natural bounce from surroundings, lens flare at edge of frame",
        "Overcast soft daylight, 6500K diffused sky acting as giant softbox, natural fill from all directions, subtle warm reflector at -15°, gentle atmospheric haze",
        "Blue hour twilight, 7500K ambient, portable LED panel at 4500K for face fill, city lights creating bokeh orbs in background, moisture in air creating bloom",
        "Harsh midday sun with diffusion scrim overhead, creating controlled soft light at 5600K, negative fill on shadow side for contrast, ground reflection bounce",
        "Dappled forest light, mixed 5000-6000K through canopy, natural gobo shadows, practical edge light through leaves, humid atmosphere creating depth",
    ],
    urban: [
        "Neon-lit night scene, mixed 3500-6500K practical lights, face lit by warm 3800K tungsten shopfront, cool 6000K LED accent from side, wet street reflections",
        "Modern interior with large window light at 5500K, architectural shadows creating pattern, practical warm 2800K accent lamps, reflective surfaces adding fill",
        "Street photography lighting, overcast 6000K sky with building bounce, subtle warm practicals from storefronts at 3200K, urban texture environment",
    ],
    beach: [
        "Tropical golden light, low sun at 20° creating long shadows, 3500K warm rim light, sand acting as natural reflector below, salt spray in air creating soft bloom",
        "Caribbean open shade, blue sky fill at 7000K with warm 3200K reflector for face, ocean reflections adding dancing light patterns, humid atmospheric glow",
    ],
    default: [
        "Soft studio lighting, large diffused key light at 45° angle, 5200K neutral temperature, subtle fill from reflector, clean even illumination, professional quality",
    ]
};

// Texture detail templates
const TEXTURE_DETAILS = [
    "visible skin micro-pores, subtle subsurface scattering on skin showing warm undertones, individual eyelash detail, fine peach fuzz on cheeks catching rim light, natural skin imperfections",
    "realistic skin texture with visible pore structure, subsurface scattering revealing blood flow undertones, micro-wrinkles near eyes, individual hair strands catching backlight, natural moles and freckles",
    "photorealistic skin rendering with subsurface light scatter, visible micro-texture, pore detail in T-zone, natural lip texture with moisture highlights, catch-light reflections in iris",
    "ultra-detailed skin with dermal translucency, visible vellus hair in rim light, natural under-eye texture, realistic lip surface with fine lines, corneal reflections showing environment",
];

// Fabric texture templates
const FABRIC_TEXTURES = [
    "fabric weave visible at close inspection, natural draping with gravity-accurate folds, thread-level detail on seams, realistic fabric interaction with body contours",
    "material texture showing fiber structure, authentic wrinkle patterns from wear, subtle sheen appropriate to material type, realistic button and zipper detail",
    "visible textile grain, natural fabric creasing at joints, accurate material weight behavior, thread count visible in macro areas, realistic stitching detail",
];

// Environmental imperfections (adds realism)
const ENV_IMPERFECTIONS = [
    "subtle dust motes visible in light beams, minor lens breathing, natural depth of field falloff with gentle bokeh circles",
    "atmospheric particulates catching light, micro chromatic aberration at frame edges, organic bokeh with cat-eye effect in corners",
    "faint volumetric haze in atmosphere, natural vignetting from lens optics, film-grain-like sensor noise at ISO 200",
    "environmental micro-particles in air, subtle lens distortion characteristics, natural highlight rolloff with smooth clipping",
];

// Shot composition by pose type
const SHOT_COMPOSITIONS = {
    "front facing view": { angle: "eye-level", height: "1.5m", type: "MCU (Medium Close-Up)" },
    "three-quarter angle": { angle: "slight low angle at 10°", height: "1.3m", type: "MS (Medium Shot)" },
    "side profile": { angle: "eye-level profile", height: "1.5m", type: "CU (Close-Up)" },
    "dynamic movement": { angle: "low angle at 25°", height: "0.8m", type: "MFS (Medium Full Shot)" },
    "relaxed casual": { angle: "slight high angle at 10°", height: "1.7m", type: "MS (Medium Shot)" },
    "professional studio": { angle: "eye-level", height: "1.5m", type: "MCU (Medium Close-Up)" },
    "lifestyle moment": { angle: "candid eye-level", height: "1.4m", type: "MS (Medium Shot)" },
    "close-up detail": { angle: "eye-level", height: "1.5m", type: "ECU (Extreme Close-Up)" },
    "full body": { angle: "slight low angle at 5°", height: "1.0m", type: "FS (Full Shot)" },
    default: { angle: "eye-level", height: "1.5m", type: "MS (Medium Shot)" },
};

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Detect environment type from background string
 */
function detectEnvironment(background) {
    const bg = (background || "").toLowerCase();
    if (bg.includes("студи") || bg.includes("studio") || bg.includes("белый") || bg.includes("white") || bg.includes("фотостуди")) {
        return "studio";
    }
    if (bg.includes("улиц") || bg.includes("город") || bg.includes("urban") || bg.includes("street") || bg.includes("кафе") || bg.includes("ресторан") || bg.includes("интерьер") || bg.includes("indoor") || bg.includes("офис") || bg.includes("магазин")) {
        return "urban";
    }
    if (bg.includes("пляж") || bg.includes("beach") || bg.includes("мор") || bg.includes("ocean") || bg.includes("тропи") || bg.includes("tropical")) {
        return "beach";
    }
    if (bg.includes("парк") || bg.includes("сад") || bg.includes("лес") || bg.includes("nature") || bg.includes("outdoor") || bg.includes("garden") || bg.includes("forest")) {
        return "outdoor";
    }
    return "studio"; // default
}

/**
 * Detect shot composition from pose string
 */
function detectComposition(pose) {
    const p = (pose || "").toLowerCase();
    for (const [key, comp] of Object.entries(SHOT_COMPOSITIONS)) {
        if (key !== "default" && p.includes(key.split(" ")[0])) {
            return comp;
        }
    }
    if (p.includes("полный") || p.includes("full") || p.includes("wide")) {
        return SHOT_COMPOSITIONS["full body"];
    }
    if (p.includes("крупн") || p.includes("close") || p.includes("detail")) {
        return SHOT_COMPOSITIONS["close-up detail"];
    }
    if (p.includes("динамич") || p.includes("movement") || p.includes("dynamic")) {
        return SHOT_COMPOSITIONS["dynamic movement"];
    }
    return SHOT_COMPOSITIONS.default;
}

/**
 * Build a cinematographic prompt for product photography
 * 
 * @param {Object} params
 * @param {string} params.modelDescription - Model appearance description
 * @param {string} params.gender - 'male' or 'female'
 * @param {string} params.productType - Type of product
 * @param {string} params.background - Background/environment description  
 * @param {string} params.pose - Pose description
 * @param {boolean} params.hasProductImage - Whether product image is provided
 * @param {boolean} params.hasBackgroundImage - Whether background reference is provided
 * @param {boolean} params.hasModelPhotos - Whether model reference photos exist
 * @returns {string} Cinematographic prompt
 */
function buildProductPrompt(params) {
    const {
        modelDescription,
        gender,
        productType,
        background,
        pose,
        hasProductImage,
        hasBackgroundImage,
        hasModelPhotos,
    } = params;

    const env = detectEnvironment(background);
    const composition = detectComposition(pose);
    const camera = pickRandom(CAMERA_RIGS);
    const lens = pickRandom(LENSES);
    const lightingPool = LIGHTING_SETUPS[env] || LIGHTING_SETUPS.default;
    const lighting = pickRandom(lightingPool);
    const texture = pickRandom(TEXTURE_DETAILS);
    const fabric = pickRandom(FABRIC_TEXTURES);
    const imperfection = pickRandom(ENV_IMPERFECTIONS);

    const genderDesc = gender === "male"
        ? "Handsome male model"
        : "Beautiful female model";

    const parts = [
        // Core scene
        `Hyper-realistic professional e-commerce product photography for a premium fashion marketplace.`,

        // Model
        `${genderDesc}, ${modelDescription}.`,

        // Product
        `Wearing/presenting product: ${productType}.`,

        // Pose & composition
        `Pose: ${pose}.`,
        `Shot type: ${composition.type}, camera angle: ${composition.angle}, camera height: ${composition.height}.`,

        // Camera & optics
        `Shot on ${camera} with ${lens.name} at ${lens.focal} ${lens.aperture}.`,

        // Environment
        `Environment: ${background}.`,

        // Lighting
        `Lighting: ${lighting}.`,

        // Texture & realism (KEY anti-plastic measures)
        `Skin detail: ${texture}.`,
        `Clothing detail: ${fabric}.`,

        // Environmental imperfections (adds authenticity)
        `Environmental realism: ${imperfection}.`,

        // Anti-AI directives
        `CRITICAL STYLE DIRECTIVES: This must look like a real photograph taken by a professional photographer, NOT an AI-generated image. Avoid any plastic, waxy, or unnaturally smooth skin. Avoid overly perfect symmetry. Include natural asymmetry in face and body. Skin should have realistic warmth with visible texture. Eyes must have realistic moisture and reflective catchlights. Hair should have individual strand detail with natural flyaways. The overall image must be indistinguishable from a real high-end fashion photograph.`,
    ];

    // Reference photo directives
    if (hasModelPhotos) {
        parts.push("IMPORTANT: The model in the generated image MUST look exactly like the person in the provided reference photo. Preserve exact facial features, skin tone, eye color, face shape, and body proportions. This is the single most important requirement.");
    }

    if (hasProductImage) {
        parts.push("IMPORTANT: Integrate the provided product image naturally — the model should be wearing/holding it with realistic fabric draping and body interaction.");
    }

    if (hasBackgroundImage) {
        parts.push("IMPORTANT: Use the provided background reference image as the environment. Match the lighting conditions, color palette, and atmosphere of the reference background.");
    }

    return parts.join(" ");
}

/**
 * Build prompt for model preview generation
 */
function buildModelPreviewPrompt(params) {
    const { description, gender, hasReferencePhoto } = params;

    const camera = pickRandom(CAMERA_RIGS);
    const lens = pickRandom(LENSES.filter(l => parseInt(l.focal) >= 75));
    const texture = pickRandom(TEXTURE_DETAILS);

    const genderDesc = gender === "male" ? "Male" : "Female";

    const parts = [
        `Hyper-realistic professional portrait photograph.`,
        `Gender: ${genderDesc}.`,
        `Appearance: ${description}.`,
        `Shot on ${camera} with ${lens.name} at ${lens.focal} ${lens.aperture}.`,
        `Lighting: Soft Rembrandt lighting, key light at 45° with large octabox, 5200K neutral color temperature, subtle warm fill from reflector, gentle rim light for hair separation.`,
        `Framing: Waist-up portrait, model looking at camera with confident natural expression.`,
        `Skin detail: ${texture}.`,
        `CRITICAL: This must look like a REAL photograph, not AI-generated. Natural skin texture with visible pores, realistic eye moisture and catchlights, individual hair strand detail. Avoid any plastic, waxy, or airbrushed look. Include natural facial asymmetry.`,
    ];

    if (hasReferencePhoto) {
        parts.push("IMPORTANT: The generated person must look EXACTLY like the person in the reference photo. Preserve all facial features, skin tone, eye color, bone structure, and body type with absolute fidelity.");
    }

    return parts.filter(Boolean).join(" ");
}

/**
 * Build prompt for model angle generation
 */
function buildModelAnglePrompt(params) {
    const { description, gender, framingPrompt, hasReferencePhoto } = params;

    const camera = pickRandom(CAMERA_RIGS);
    const lens = pickRandom(LENSES);
    const texture = pickRandom(TEXTURE_DETAILS);

    const genderDesc = gender === "male" ? "Male" : "Female";

    const parts = [
        `Hyper-realistic professional portrait photograph.`,
        `Gender: ${genderDesc}.`,
        `Appearance: ${description}.`,
        `Shot on ${camera} with ${lens.name} at ${lens.focal} ${lens.aperture}.`,
        `Lighting: Professional studio lighting, large softbox key light, 5400K neutral, clean white background with subtle gradient.`,
        `Framing: ${framingPrompt}.`,
        `Skin detail: ${texture}.`,
        `CRITICAL: Photo-realistic output. Natural skin texture, realistic eye detail, individual hair strands. No AI artifacts, no plastic look.`,
    ];

    if (hasReferencePhoto) {
        parts.push("IMPORTANT: The generated person must look EXACTLY like the person in the reference photo. Preserve all facial features with absolute fidelity.");
    }

    return parts.filter(Boolean).join(" ");
}

module.exports = {
    buildProductPrompt,
    buildModelPreviewPrompt,
    buildModelAnglePrompt,
    detectEnvironment,
    detectComposition,
};
