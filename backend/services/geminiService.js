const { GoogleGenAI, Modality } = require("@google/genai");
const fs = require("fs");
const path = require("path");
const PQueue = require("p-queue");
const { buildProductPrompt, buildModelPreviewPrompt, buildModelAnglePrompt, buildModelAngleCollagePrompt, buildCollagePrompt } = require("./promptBuilder");

// Global Queue for concurrency control
// Concurrency: 3 ensures we don't hit 429 errors from Google while allowing some parallelism.
const generationQueue = new PQueue({ concurrency: 3, timeout: 300000 });

class GeminiService {
    constructor(apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
        // Nano Banana Pro Preview — professional asset production, up to 4K
        this.imageModel = "gemini-3-pro-image-preview";
        this.queue = generationQueue;
        console.log(`GeminiService initialized with Queue Concurrency: ${this.queue.concurrency}`);
    }

    /**
     * Helper to wrap generation calls in the queue
     */
    async enqueueGeneration(taskFn) {
        return this.queue.add(async () => {
            try {
                return await taskFn();
            } catch (error) {
                if (error.message && error.message.includes('429')) {
                    console.warn("Hit rate limit in queue, throwing...");
                }
                throw error;
            }
        });
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
        return this.enqueueGeneration(async () => {
            return this._generateModelPreviewInternal(params);
        });
    }

    async _generateModelPreviewInternal(params) {
        const { description, gender, age, height, referencePhoto } = params;

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
            age,
            height,
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
     * Generate 2×2 collage of model angles (single image, consistent face)
     */
    async generateModelAngles(params) {
        return this.enqueueGeneration(async () => {
            return this._generateModelAnglesInternal(params);
        });
    }

    async _generateModelAnglesInternal(params) {
        const { description, gender, age, height, referencePhoto } = params;

        const contents = [];

        if (referencePhoto) {
            contents.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: referencePhoto,
                },
            });
        }

        // Build collage prompt for model angles
        const prompt = buildModelAngleCollagePrompt({
            description,
            gender,
            age,
            height,
            hasReferencePhoto: !!referencePhoto,
        });

        contents.push({ text: prompt });

        try {
            const response = await this.ai.models.generateContent({
                model: this.imageModel,
                contents: [{ role: "user", parts: contents }],
                config: {
                    responseModalities: [Modality.TEXT, Modality.IMAGE],
                    imageConfig: {
                        aspectRatio: "1:1",
                    },
                },
            });

            if (!response.candidates || !response.candidates[0]) {
                throw new Error("Invalid response from Gemini API");
            }

            const candidate = response.candidates[0];
            console.log("Model angle collage finishReason:", candidate.finishReason);

            if (candidate.finishReason === "SAFETY") {
                throw new Error("Image was blocked by safety filters");
            }

            if (!candidate.content || !candidate.content.parts) {
                throw new Error("No content in response");
            }

            const parts = Array.isArray(candidate.content.parts) ? candidate.content.parts : [];

            for (const part of parts) {
                if (part.inlineData) {
                    return {
                        imageData: Buffer.from(part.inlineData.data, "base64"),
                        mimeType: part.inlineData.mimeType || "image/png",
                    };
                }
            }

            throw new Error("No image in response");
        } catch (error) {
            console.error("Model angle collage error:", error);
            throw error;
        }
    }

    /**
     * Generate product photo session
     * Uses ONLY the preview photo (1 face reference) for face consistency
     */
    async generateProductPhoto(params) {
        return this.enqueueGeneration(async () => {
            return this._generateProductPhotoInternal(params);
        });
    }

    async _generateProductPhotoInternal(params) {
        const {
            modelDescription, modelPhotos, productType, productImage,
            background, backgroundImage, pose, gender,
            aspectRatio, imageSize, age, clothing, sliders
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
            age,
            clothing,
            sliders,
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
     * Generate 2×2 collage (single image, consistent face)
     */
    async generateCollage(params) {
        return this.enqueueGeneration(async () => {
            return this._generateCollageInternal(params);
        });
    }

    async _generateCollageInternal(params) {
        const {
            modelDescription, modelPhotos, productType, productImage,
            background, backgroundImage, gender,
            aspectRatio, imageSize, age, clothing, sliders
        } = params;

        const contents = [];

        // Add model preview photo for face reference
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

        // Add Product Image
        if (productImage) {
            contents.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: productImage.toString("base64"),
                },
            });
        }

        // Add Background Reference Image
        if (backgroundImage) {
            contents.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: backgroundImage.toString("base64"),
                },
            });
        }

        // Build collage prompt
        const prompt = buildCollagePrompt({
            modelDescription,
            gender,
            age,
            clothing,
            sliders,
            productType,
            background,
            hasProductImage: !!productImage,
            hasBackgroundImage: !!backgroundImage,
            hasModelPhotos: !!(modelPhotos && modelPhotos.length > 0),
        });

        contents.push({ text: prompt });

        // Use 1:1 aspect ratio for 2×2 grid  
        const config = {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
            imageConfig: {
                aspectRatio: "1:1",
            },
        };
        if (imageSize) config.imageConfig.imageSize = imageSize;

        try {
            const response = await this.ai.models.generateContent({
                model: this.imageModel,
                contents: [{ role: "user", parts: contents }],
                config,
            });

            if (!response.candidates || !response.candidates[0]) {
                throw new Error("Invalid response from Gemini API");
            }

            const candidate = response.candidates[0];
            console.log("Collage generation finishReason:", candidate.finishReason);

            if (candidate.finishReason === "SAFETY") {
                throw new Error("Image was blocked by safety filters");
            }

            if (!candidate.content || !candidate.content.parts) {
                throw new Error("No content in response");
            }

            const parts = Array.isArray(candidate.content.parts) ? candidate.content.parts : [];

            for (const part of parts) {
                if (part.inlineData) {
                    return {
                        imageData: Buffer.from(part.inlineData.data, "base64"),
                        mimeType: part.inlineData.mimeType || "image/png",
                    };
                }
            }

            throw new Error("No image in response");
        } catch (error) {
            console.error("Collage generation error:", error);
            throw error;
        }
    }
}

module.exports = GeminiService;
