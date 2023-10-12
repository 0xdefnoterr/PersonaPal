import { Schema, model } from 'mongoose';
import { Persona, persona_model } from './persona';


interface Story {
    story: [{id: string, body: string}];
    channel_id: string;
    guild_id: string;
    persona: Persona;
    created_at: Date;
    updated_at: Date;
}

const story_schema = new Schema<Story>({
    story: [{id: {type: String, required: true}, body: String}],
    channel_id: String,
    guild_id: String,
    persona: persona_model.schema,
    created_at: Date,
    updated_at: Date
})

export const story_model = model<Story>('stories', story_schema);