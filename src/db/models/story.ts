import { Schema } from 'mongoose';
import { Persona, persona_schema } from './persona';


interface Story {
    conversation: string;
    channel_id: string;
    guild_id: string;
    persona: Persona;
    created_at: Date;
    updated_at: Date;
}

const story_schema = new Schema<Story>({
    conversation: String,
    channel_id: String,
    guild_id: String,
    persona: persona_schema,
    created_at: Date,
    updated_at: Date
})

export {Story, story_schema};