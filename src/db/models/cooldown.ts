import { Schema, model } from "mongoose";

export interface Cooldown {
    command: string;
    user_id: string;
    time: Date,
    guild_id: string;
}

const cooldown_schema = new Schema<Cooldown>({
    command: { type: String, required: true},
    time: {type: Date, required: true},
    user_id: {type: String, required: true},
    guild_id: {type: String, required: false}
});


export const cd_model = model<Cooldown>('cooldowns', cooldown_schema);
