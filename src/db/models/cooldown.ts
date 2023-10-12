import { Schema, model } from "mongoose";

export interface Cooldown {
    command: string;
    time: Date,
}

interface UserCooldown {
    commands: Cooldown[];
    user_id: string;
    guild_id: string;
}

const cooldown_schema = new Schema<UserCooldown>({
    commands: [{command: String, time: Date}],
    user_id: {type: String, required: true},
    guild_id: {type: String, required: false}
});


export const cd_model = model<UserCooldown>('cooldowns', cooldown_schema);
