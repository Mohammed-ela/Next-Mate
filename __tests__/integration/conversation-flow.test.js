// Tests d'intégration conversations basiques
describe('Flux conversations basique', () => {
  test('Création conversation simple', () => {
    const createConversation = (user1, user2) => {
      return {
        id: `conv_${Date.now()}`,
        participants: [user1.id, user2.id],
        messages: [],
        createdAt: new Date()
      };
    };
    
    const user1 = { id: 'user1', name: 'Alice' };
    const user2 = { id: 'user2', name: 'Bob' };
    const conversation = createConversation(user1, user2);
    
    expect(conversation.participants).toContain('user1');
    expect(conversation.participants).toContain('user2');
    expect(conversation.messages).toHaveLength(0);
  });

  test('Ajout message conversation', () => {
    const addMessage = (conversation, senderId, content) => {
      const message = {
        id: `msg_${Date.now()}`,
        senderId,
        content,
        timestamp: new Date()
      };
      return {
        ...conversation,
        messages: [...conversation.messages, message]
      };
    };
    
    const conversation = { id: 'conv1', messages: [] };
    const updatedConv = addMessage(conversation, 'user1', 'Salut !');
    
    expect(updatedConv.messages).toHaveLength(1);
    expect(updatedConv.messages[0].content).toBe('Salut !');
  });
}); 