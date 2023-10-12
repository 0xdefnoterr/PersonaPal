import { Schema, model } from 'mongoose';
import { Persona, persona_model } from './persona';
import { Story, story_schema } from './story';

interface Guild_S {
    collab_link: string;
    guild_id: string;
    prefix: string;
    persona: Persona;
    stories: Story[];
    created_at: Date;
    updated_at: Date;
}

interface DirectMessage_S {
    collab_link: string;
    user_id: string;
    persona: Persona;
    story: Story;
    created_at: Date;
    updated_at: Date;
}

const guild_schema = new Schema<Guild_S>({
    collab_link: {type: String, required: true},
    guild_id: {type: String, required: true},
    prefix: {type: String, required: true},
    persona: {type: persona_model.schema, required: true},
    stories: [story_schema],
    created_at: Date,
    updated_at: Date
});

const direct_message_schema = new Schema<DirectMessage_S>({
    collab_link: {type: String, required: true},
    user_id: {type: String, required: true},
    persona: {type: persona_model.schema, required: true},
    story: {type: story_schema, required: true},
    created_at: Date,
    updated_at: Date
});

export {Guild_S, DirectMessage_S};
export const guild_model = model<Guild_S>('guilds', guild_schema);
export const direct_message_model = model<DirectMessage_S>('direct_messages', direct_message_schema);

