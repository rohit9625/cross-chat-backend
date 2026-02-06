import { ChatType, MemberRole } from "../utils/constants";

export interface Chat {
  id: number;
  type: ChatType;
  last_message_at: string;
  created_at: string;
}

export interface ChatMember {
  userId: number;
  name: string;
  email: string;
}

export interface ChatWithMembers {
  id: number;
  name: string;
  last_message_at: string;
  created_at: string;
  members: ChatMember[];
}
