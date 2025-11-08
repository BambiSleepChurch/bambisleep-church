import { IntegratedChatService } from './integrated-chat.js';

async function test() {
  const chat = new IntegratedChatService();
  await chat.initialize();
  
  const response = await chat.chat('Hello', { userId: 'test' });
  console.log('Response:', JSON.stringify(response, null, 2));
}

test().catch(console.error);
