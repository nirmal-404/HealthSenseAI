import mongoose from "mongoose";

const symptomEntrySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        duration: {
            value: {
                type: Number,
                required: true,
                min: 0,
            },
            unit: {
                type: String,
                enum: ["minutes", "hours", "days", "weeks", "months"],
                required: true,
            },
        },
        severity: {
            type: String,
            enum: ["mild", "moderate", "severe"],
            default: "mild",
        },
    },
    { _id: false }
);

const symptomCheckSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        rawInput: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        symptoms: {
            type: [symptomEntrySchema],
            validate: {
                validator: (arr: any) => arr.length > 0,
                message: "At least one symptom must be extracted.",
            },
        },

        overallSeverity: {
            type: String,
            enum: ["mild", "moderate", "severe"],
            required: true,
        },

        urgencyLevel: {
            type: String,
            enum: ["low", "medium", "high", "emergency"],
            required: true,
        },

        aiSuggestions: {
            type: String,
            required: true,
        },

        recommendedSpecialties: {
            type: [String],
            default: [],
        },

        followUpQuestions: {
            type: [String],
            default: [],
        },

        threadId: { type: String, index: true },  // LangGraph checkpoint key

        status: {
            type: String,
            enum: ["pending_answers", "completed"],
            default: "completed",
        },

        followUpAnswers: [{ question: String, answer: String }],

        reviewedByDoctor: {
            type: Boolean,
            default: false,
        },

        metadata: {
            modelUsed: { type: String, default: "gemini-1.5-flash" },
            extractionConfidence: { type: Number, min: 0, max: 1 },
            processingTimeMs: { type: Number },
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

symptomCheckSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model("SymptomCheck", symptomCheckSchema);