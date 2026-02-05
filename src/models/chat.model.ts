import { ChatType, MemberRole } from "../utils/constants";

export interface Chat {
    id: number;
    type: ChatType;
    last_message_at: string;
    created_at: string;
}

export interface ChatMember {
    id: number;
    type: MemberRole;
    chat_id: number;
    user_id: number;
    joined_at: string;
}
