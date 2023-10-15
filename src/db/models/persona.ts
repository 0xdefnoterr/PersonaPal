import { Schema, model } from 'mongoose';

export interface Persona {
    name: string;
    guild_id: string;
    tags: string[];
    personality: string;
    post_history: string;
    system_prompt: string;
    greeting: string;
    dialogue: string;
    avatar_url: string;
}

const persona_schema = new Schema<Persona>({
    name: {type: String, required: true},
    guild_id: {type: String, required: true},
    tags: [String],
    greeting: {type: String, required: true},
    personality: {type: String, required: true},
    post_history: {type: String, required: true},
    system_prompt: {type: String, required: true},
    dialogue: {type: String, required: true},
    avatar_url: {type: String, required: true}
});

export {persona_schema};