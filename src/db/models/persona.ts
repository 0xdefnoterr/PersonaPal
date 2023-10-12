import { Schema, model } from 'mongoose';

export interface Persona {
    name: string;
    guild_id: string;
    tags: string[];
    personality: string;
    description: string;
    avatar_url: string;
}

const persona_schema = new Schema<Persona>({
    name: {type: String, required: true},
    guild_id: String,
    tags: [String],
    personality: String,
    description: String,
    avatar_url: String
});

export const persona_model = model<Persona>('persona', persona_schema);