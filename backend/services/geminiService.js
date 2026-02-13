const { GoogleGenAI, Modality } = require("@google/genai");
const fs = require("fs");
const path = require("path");
const { buildProductPrompt, buildModelPreviewPrompt, buildModelAnglePrompt } = require("./promptBuilder");

class GeminiService {
    constructor(apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
        // Nano Banana Pro Preview — professional asset production, up to 4K
        this.imageModel = "gemini-3-pro-image-preview";
    }

    /**
     * Generate image with Nano Banana Pro
     */
    async generateImage(prompt, options = {}) {
        try {
            const config = {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
            };

            // Add imageConfig if aspect ratio or size specified
            if (options.aspectRatio || options.imageSize) {
                config.imageConfig = {};
                if (options.aspectRatio) config.imageConfig.aspectRatio = options.aspectRatio;
                if (options.imageSize) config.imageConfig.imageSize = options.imageSize;
            }

            const response = await this.ai.models.generateContent({
                model: this.imageModel,
                contents: prompt,
                config,
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return {
                        imageData: Buffer.from(part.inlineData.data, "base64"),
                        mimeType: part.inlineData.mimeType,
                    };
                }
            }

            throw new Error("No image in response");
        } catch (error) {
            console.error("Gemini generation error:", error);
            throw error;
        }
    }

    /**
     * Generate a preview portrait of the model (no product)
     */
    async generateModelPreview(params) {
        const { description, gender, referencePhoto } = params;

        const contents = [];

        // Add reference photo if provided
        if (referencePhoto) {
            contents.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: referencePhoto,
                },
            });
        }

        // Use cinematographic prompt builder
        const prompt = buildModelPreviewPrompt({
            description,
            gender,
            hasReferencePhoto: !!referencePhoto,
        });

        contents.push({ text: prompt });

        try {
            const response = await this.ai.models.generateContent({
                model: this.imageModel,
                contents: [{ role: "user", parts: contents }],
                config: {
                    responseModalities: [Modality.TEXT, Modality.IMAGE],
                },
            });

            // Check if response has the expected structure
            if (!response.candidates || !response.candidates[0]) {
                console.error("Invalid response structure:", JSON.stringify(response, null, 2));
                throw new Error("Invalid response from Gemini API");
            }

            const candidate = response.candidates[0];
            console.log("Gemini Candidate:", JSON.stringify(candidate, null, 2));

            if (candidate.finishReason !== "STOP" && candidate.finishReason !== undefined) {
                console.warn("Gemini generation stopped with reason:", candidate.finishReason);
                if (candidate.finishReason === "SAFETY") {
                    throw new Error("Generation blocked by safety settings");
                }
            }

            if (!candidate.content || !candidate.content.parts) {
                console.error("No content/parts in candidate:", JSON.stringify(candidate, null, 2));
                throw new Error("No content generated");
            }

            const parts = candidate.content.parts;

            // Ensure parts is iterable (array)
            if (!Array.isArray(parts)) {
                console.error("Parts is not an array:", parts);
                throw new Error("Invalid response format: parts is not an array");
            }

            for (const part of parts) {
                if (part.inlineData) {
                    return {
                        imageData: Buffer.from(part.inlineData.data, "base64"),
                        mimeType: part.inlineData.mimeType,
                    };
                }
            }
            throw new Error("No image generated for model preview");
        } catch (error) {
            console.error("Error generating model preview:", error);
            throw error;
        }
    }

    /**
     * Generate 4 angles of the model (no product)
     */
    async generateModelAngles(params) {
        const { description, gender, referencePhoto } = params;

        const framings = [
            { label: "chest", prompt: "Chest-level portrait, from chest up, looking at camera" },
            { label: "waist", prompt: "Waist-up shot, upper body visible, natural pose" },
            { label: "knee", prompt: "Knee-level shot, three-quarter body visible" },
            { label: "full", prompt: "Full body shot, head to toe, full length" },
        ];

        const results = [];
        for (const framing of framings) {
            const contents = [];

            if (referencePhoto) {
                contents.push({
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: referencePhoto,
                    },
                });
            }

            // Use cinematographic prompt builder
            const prompt = buildModelAnglePrompt({
                description,
                gender,
                framingPrompt: framing.prompt,
                hasReferencePhoto: !!referencePhoto,
            });

            contents.push({ text: prompt });

            try {
                const response = await this.ai.models.generateContent({
                    model: this.imageModel,
                    contents: [{ role: "user", parts: contents }],
                    config: {
                        responseModalities: [Modality.TEXT, Modality.IMAGE],
                    },
                });

                // Check if response has the expected structure
                if (!response.candidates || !response.candidates[0]) {
                    console.error(`Invalid response structure for angle ${framing.label}:`, JSON.stringify(response, null, 2));
                    continue;
                }

                const candidate = response.candidates[0];

                if (candidate.finishReason !== "STOP" && candidate.finishReason !== undefined) {
                    console.warn(`Gemini angle ${framing.label} stopped with reason:`, candidate.finishReason);
                    if (candidate.finishReason === "SAFETY") {
                        console.error(`Angle ${framing.label} blocked by safety`);
                        continue;
                    }
                }

                if (!candidate.content || !candidate.content.parts) {
                    console.error(`No content/parts for angle ${framing.label}:`, JSON.stringify(candidate, null, 2));
                    continue;
                }

                const parts = candidate.content.parts;

                // Ensure parts is iterable (array)
                if (!Array.isArray(parts)) {
                    console.error(`Parts is not an array for angle ${framing.label}:`, parts);
                    continue;
                }

                for (const part of parts) {
                    if (part.inlineData) {
                        results.push({
                            imageData: Buffer.from(part.inlineData.data, "base64"),
                            mimeType: part.inlineData.mimeType,
                            framing: framing.label,
                        });
                        break;
                    }
                }
            } catch (error) {
                console.error(`Error generating angle ${framing.label}:`, error);
            }
        }

        return results;
    }

    /**
     * Generate product photo session
     * Uses ONLY the preview photo (1 face reference) for face consistency
     */
    async generateProductPhoto(params) {
        const {
            modelDescription, modelPhotos, productType, productImage,
            background, backgroundImage, pose, gender,
            aspectRatio, imageSize
        } = params;

        const contents = [];

        // 1. Add ONLY the preview photo (single face reference for consistency)
        if (modelPhotos && modelPhotos.length > 0) {
            const previewPhoto = modelPhotos.find(p => p.type === "preview") || modelPhotos[0];
            if (previewPhoto && previewPhoto.image) {
                contents.push({
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: previewPhoto.image,
                    },
                });
            }
        }

        // 2. Add Product Image
        if (productImage) {
            contents.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: productImage.toString("base64"),
                },
            });
        }

        // 2b. Add Background Reference Image if provided
        if (backgroundImage) {
            contents.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: backgroundImage.toString("base64"),
                },
            });
        }

        // 3. Build cinematographic prompt
        const prompt = buildProductPrompt({
            modelDescription,
            gender,
            productType,
            background,
            pose,
            hasProductImage: !!productImage,
            hasBackgroundImage: !!backgroundImage,
            hasModelPhotos: !!(modelPhotos && modelPhotos.length > 0),
        });

        contents.push({ text: prompt });

        // 4. Build config with imageConfig
        const config = {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
        };

        if (aspectRatio || imageSize) {
            config.imageConfig = {};
            if (aspectRatio) config.imageConfig.aspectRatio = aspectRatio;
            if (imageSize) config.imageConfig.imageSize = imageSize;
        }

        try {
            const response = await this.ai.models.generateContent({
                model: this.imageModel,
                contents: [{ role: "user", parts: contents }],
                config,
            });

            // Check if response has the expected structure
            if (!response.candidates || !response.candidates[0]) {
                console.error("Invalid response structure:", JSON.stringify(response, null, 2));
                throw new Error("Invalid response from Gemini API");
            }

            const candidate = response.candidates[0];

            // Log for debugging
            console.log("Product Photo Candidate:", JSON.stringify(candidate, null, 2));

            if (candidate.finishReason !== "STOP" && candidate.finishReason !== undefined) {
                console.warn("Gemini product generation stopped with reason:", candidate.finishReason);
                if (candidate.finishReason === "SAFETY") {
                    throw new Error("Generation blocked by safety settings");
                }
            }

            if (!candidate.content || !candidate.content.parts) {
                console.error("No content/parts in candidate:", JSON.stringify(candidate, null, 2));
                throw new Error("No content generated");
            }

            const parts = candidate.content.parts;

            // Ensure parts is iterable (array)
            if (!Array.isArray(parts)) {
                console.error("Parts is not an array:", parts);
                throw new Error("Invalid response format: parts is not an array");
            }

            for (const part of parts) {
                if (part.inlineData) {
                    return {
                        imageData: Buffer.from(part.inlineData.data, "base64"),
                        mimeType: part.inlineData.mimeType,
                    };
                }
            }
            throw new Error("No image generated");

        } catch (error) {
            console.error("Error generating product photo:", error);
            throw error;
        }
    }

    /**
     * Generate multiple variations
     */
    async generateVariations(baseParams, count = 10) {
        const poses = [
            "front facing view, looking at camera, confident expression",
            "three-quarter angle, natural stance, slight smile",
            "side profile, elegant pose, chin slightly raised",
            "slightly turned, confident expression, hands on hips",
            "dynamic movement pose, walking naturally",
            "relaxed casual stance, leaning slightly",
            "professional studio pose, straight posture",
            "lifestyle moment, candid feel, looking away then glancing at camera",
            "close-up detail shot, product focus with face visible",
            "full body wide shot, product fully visible head to toe"
        ];

        const variations = [];
        for (let i = 0; i < Math.min(count, poses.length); i++) {
            const params = { ...baseParams, pose: poses[i] };
            try {
                const result = await this.generateProductPhoto(params);
                variations.push(result);
            } catch (error) {
                console.error(`Error generating variation ${i + 1}:`, error);
            }
        }

        return variations;
    }
}

module.exports = GeminiService;
