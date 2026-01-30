/**
 * 그룹 채팅 메시지 (API 연동 시 이 파일만 교체)
 * @see docs/API_SPEC.md §7
 */
import type { ChatMessageItem } from '../types';
import { chatMessages } from '../mocks/chatData';

export async function getChatMessages(
  _groupId?: number
): Promise<ChatMessageItem[]> {
  // TODO: GET /api/groups/:groupId/chat/messages
  return Promise.resolve(chatMessages as ChatMessageItem[]);
}
