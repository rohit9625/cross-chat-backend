export type TranslationState =
  | "IDLE"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number | null;
  content: string;
  /** Whether this message should be auto-translated */
  auto_translate: boolean;
  /** Current translation lifecycle state */
  translation_status: TranslationState;
  created_at: string;
  updated_at: string;
}

export interface MessageTranslation {
  message_id: number;
  language: string;
  translated_text: string;
}
