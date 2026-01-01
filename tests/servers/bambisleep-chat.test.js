/**
 * BambiSleep™ Church MCP Control Tower
 * BambiSleep-Chat Handler Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  triggerHandlers,
  ttsHandlers,
  chatHandlers,
  collarHandlers,
  textEffectsHandlers,
  sessionHandlers
} from '../../src/servers/bambisleep-chat.js';

describe('BambiSleep-Chat Handlers', () => {
  
  // ============ TRIGGER HANDLERS ============
  
  describe('triggerHandlers', () => {
    
    describe('getAllTriggers', () => {
      it('should return all triggers with categories', () => {
        const result = triggerHandlers.getAllTriggers();
        
        assert.ok(result.triggers, 'Should have triggers array');
        assert.ok(result.categories, 'Should have categories object');
        assert.ok(result.totalCount > 0, 'Should have trigger count');
        assert.ok(result.triggers.length === result.totalCount, 'Count should match array length');
      });
      
      it('should include all three categories', () => {
        const result = triggerHandlers.getAllTriggers();
        const categories = new Set(result.triggers.map(t => t.category));
        
        assert.ok(categories.has('primary'), 'Should have primary category');
        assert.ok(categories.has('mental'), 'Should have mental category');
        assert.ok(categories.has('physical'), 'Should have physical category');
      });
    });
    
    describe('getTriggersByCategory', () => {
      it('should return triggers for valid category', () => {
        const result = triggerHandlers.getTriggersByCategory('primary');
        
        assert.strictEqual(result.category, 'primary');
        assert.ok(result.triggers.length > 0, 'Should have triggers');
        assert.ok(result.description, 'Should have description');
      });
      
      it('should return error for invalid category', () => {
        const result = triggerHandlers.getTriggersByCategory('invalid');
        
        assert.ok(result.error, 'Should have error');
        assert.ok(result.validCategories, 'Should list valid categories');
      });
    });
    
    describe('detectTriggers', () => {
      it('should detect triggers in text', () => {
        const result = triggerHandlers.detectTriggers('Good Girl, you are doing well');
        
        assert.strictEqual(result.count, 1);
        assert.strictEqual(result.triggers[0].name, 'Good Girl');
      });
      
      it('should detect multiple triggers', () => {
        const result = triggerHandlers.detectTriggers('Bambi Sleep now, Good Girl');
        
        assert.ok(result.count >= 2, 'Should detect at least 2 triggers');
      });
      
      it('should be case insensitive', () => {
        const result = triggerHandlers.detectTriggers('GOOD GIRL');
        
        assert.strictEqual(result.count, 1);
      });
      
      it('should handle empty input', () => {
        const result = triggerHandlers.detectTriggers('');
        
        assert.strictEqual(result.count, 0);
        assert.deepStrictEqual(result.triggers, []);
      });
      
      it('should handle null input', () => {
        const result = triggerHandlers.detectTriggers(null);
        
        assert.strictEqual(result.count, 0);
      });
    });
    
    describe('processMessage', () => {
      it('should wrap triggers in HTML spans', () => {
        const result = triggerHandlers.processMessage('Good Girl, sleep now');
        
        assert.ok(result.processed.includes('<span'), 'Should contain span');
        assert.ok(result.processed.includes('Good Girl'), 'Should contain trigger');
      });
      
      it('should respect wrapTriggers option', () => {
        const result = triggerHandlers.processMessage('Good Girl', { wrapTriggers: false });
        
        assert.strictEqual(result.processed, 'Good Girl');
      });
      
      it('should use custom CSS class', () => {
        const result = triggerHandlers.processMessage('Good Girl', { cssClass: 'my-class' });
        
        assert.ok(result.processed.includes('my-class'));
      });
    });
    
    describe('setActiveTriggers / getActiveTriggers', () => {
      it('should set and get active triggers', () => {
        const sessionId = 'test_session_1';
        triggerHandlers.setActiveTriggers(sessionId, ['Good Girl', 'Bambi Sleep']);
        
        const result = triggerHandlers.getActiveTriggers(sessionId);
        
        assert.strictEqual(result.count, 2);
        assert.ok(result.activeTriggers.includes('GOOD GIRL'));
        assert.ok(result.activeTriggers.includes('BAMBI SLEEP'));
      });
      
      it('should filter out invalid triggers', () => {
        const sessionId = 'test_session_2';
        triggerHandlers.setActiveTriggers(sessionId, ['Good Girl', 'Invalid Trigger']);
        
        const result = triggerHandlers.getActiveTriggers(sessionId);
        
        assert.strictEqual(result.count, 1);
      });
    });
  });

  // ============ TTS HANDLERS ============
  
  describe('ttsHandlers', () => {
    
    describe('cleanTextForTTS', () => {
      it('should remove URLs', () => {
        const result = ttsHandlers.cleanTextForTTS('Check https://example.com now');
        
        assert.ok(result.cleaned.includes('link'));
        assert.ok(!result.cleaned.includes('https'));
      });
      
      it('should remove punctuation', () => {
        const result = ttsHandlers.cleanTextForTTS('Hello! How are you?');
        
        assert.ok(!result.cleaned.includes('!'));
        assert.ok(!result.cleaned.includes('?'));
      });
      
      it('should normalize whitespace', () => {
        // Test that excessive whitespace is cleaned up
        const result = ttsHandlers.cleanTextForTTS('Hello    world   test');
        
        assert.ok(!result.cleaned.includes('    '), 'Should not have multiple spaces');
      });
      
      it('should remove markdown', () => {
        const result = ttsHandlers.cleanTextForTTS('**bold** and *italic*');
        
        assert.ok(!result.cleaned.includes('*'));
        assert.ok(result.cleaned.includes('bold'));
        assert.ok(result.cleaned.includes('italic'));
      });
      
      it('should convert to lowercase', () => {
        const result = ttsHandlers.cleanTextForTTS('HELLO WORLD');
        
        assert.strictEqual(result.cleaned, 'hello world');
      });
      
      it('should handle empty input', () => {
        const result = ttsHandlers.cleanTextForTTS('');
        
        assert.strictEqual(result.cleaned, '');
      });
    });
    
    describe('splitIntoSentences', () => {
      it('should split on sentence boundaries', () => {
        const result = ttsHandlers.splitIntoSentences('First sentence. Second sentence.');
        
        assert.ok(result.sentences.length >= 1);
      });
      
      it('should preserve trigger phrases', () => {
        const result = ttsHandlers.splitIntoSentences('Say Bambi Sleep. Then wake up.');
        
        const joined = result.sentences.join(' ');
        // "Bambi Sleep" should not be split
        assert.ok(
          result.sentences.some(s => s.toLowerCase().includes('bambi sleep')) ||
          joined.toLowerCase().includes('bambi sleep')
        );
      });
      
      it('should handle empty input', () => {
        const result = ttsHandlers.splitIntoSentences('');
        
        assert.strictEqual(result.count, 0);
      });
    });
    
    describe('processForTTS', () => {
      it('should return sentence pairs', () => {
        const result = ttsHandlers.processForTTS('**Hello** world. How are you?');
        
        assert.ok(result.sentencePairs.length > 0);
        assert.ok(result.sentencePairs[0].display);
        assert.ok(result.sentencePairs[0].tts);
      });
      
      it('should handle empty message', () => {
        const result = ttsHandlers.processForTTS('');
        
        assert.strictEqual(result.count, 0);
      });
    });
  });

  // ============ CHAT HANDLERS ============
  
  describe('chatHandlers', () => {
    
    describe('addMessage', () => {
      it('should add message to history', () => {
        const sessionId = 'chat_test_1';
        const message = {
          text: 'Hello Bambi',
          username: 'TestUser',
          isAI: false
        };
        
        const result = chatHandlers.addMessage(sessionId, message);
        
        assert.ok(result.id, 'Should have ID');
        assert.strictEqual(result.text, 'Hello Bambi');
        assert.strictEqual(result.username, 'TestUser');
        assert.ok(result.timestamp, 'Should have timestamp');
        assert.ok(Array.isArray(result.triggers), 'Should detect triggers');
      });
      
      it('should detect triggers in message', () => {
        const sessionId = 'chat_test_2';
        const message = {
          text: 'Good Girl, you did well',
          username: 'TestUser'
        };
        
        const result = chatHandlers.addMessage(sessionId, message);
        
        assert.ok(result.triggers.length > 0);
      });
    });
    
    describe('getHistory', () => {
      it('should return chat history', () => {
        const sessionId = 'chat_test_3';
        chatHandlers.addMessage(sessionId, { text: 'Message 1', username: 'User1' });
        chatHandlers.addMessage(sessionId, { text: 'Message 2', username: 'User2', isAI: true });
        
        const result = chatHandlers.getHistory(sessionId);
        
        assert.ok(result.messages.length >= 2);
        assert.strictEqual(result.sessionId, sessionId);
      });
      
      it('should filter by AI messages', () => {
        const sessionId = 'chat_test_4';
        chatHandlers.addMessage(sessionId, { text: 'User msg', username: 'User', isAI: false });
        chatHandlers.addMessage(sessionId, { text: 'AI msg', username: 'AI', isAI: true });
        
        const result = chatHandlers.getHistory(sessionId, { includeUser: false });
        
        assert.ok(result.messages.every(m => m.isAI));
      });
      
      it('should respect limit', () => {
        const sessionId = 'chat_test_5';
        for (let i = 0; i < 10; i++) {
          chatHandlers.addMessage(sessionId, { text: `Message ${i}`, username: 'User' });
        }
        
        const result = chatHandlers.getHistory(sessionId, { limit: 5 });
        
        assert.ok(result.returnedCount <= 5);
      });
    });
    
    describe('clearHistory', () => {
      it('should clear chat history', () => {
        const sessionId = 'chat_test_6';
        chatHandlers.addMessage(sessionId, { text: 'Message', username: 'User' });
        
        const result = chatHandlers.clearHistory(sessionId);
        
        assert.ok(result.cleared);
        
        const history = chatHandlers.getHistory(sessionId);
        assert.strictEqual(history.messages.length, 0);
      });
    });
    
    describe('generateUsername', () => {
      it('should generate random username', () => {
        const username = chatHandlers.generateUsername();
        
        assert.ok(username.length > 0);
        assert.ok(/[A-Za-z]+\d+/.test(username), 'Should be word + number');
      });
      
      it('should generate different usernames', () => {
        const usernames = new Set();
        for (let i = 0; i < 10; i++) {
          usernames.add(chatHandlers.generateUsername());
        }
        // Should have some variety (not all identical)
        assert.ok(usernames.size > 1);
      });
    });
  });

  // ============ COLLAR HANDLERS ============
  
  describe('collarHandlers', () => {
    
    describe('activate / deactivate', () => {
      it('should activate collar', () => {
        const result = collarHandlers.activate('collar_test_1');
        
        assert.strictEqual(result.active, true);
        assert.ok(result.message.includes('activated'));
      });
      
      it('should deactivate collar', () => {
        collarHandlers.activate('collar_test_2');
        const result = collarHandlers.deactivate('collar_test_2');
        
        assert.strictEqual(result.active, false);
        assert.ok(result.message.includes('deactivated'));
      });
    });
    
    describe('toggle', () => {
      it('should toggle collar status', () => {
        const sessionId = 'collar_test_3';
        
        const first = collarHandlers.toggle(sessionId);
        assert.strictEqual(first.active, true);
        
        const second = collarHandlers.toggle(sessionId);
        assert.strictEqual(second.active, false);
      });
    });
    
    describe('getStatus', () => {
      it('should return collar status', () => {
        const sessionId = 'collar_test_4';
        collarHandlers.activate(sessionId);
        
        const result = collarHandlers.getStatus(sessionId);
        
        assert.strictEqual(result.sessionId, sessionId);
        assert.strictEqual(result.active, true);
      });
      
      it('should default to inactive', () => {
        const result = collarHandlers.getStatus('nonexistent_session');
        
        assert.strictEqual(result.active, false);
      });
    });
  });

  // ============ TEXT EFFECTS HANDLERS ============
  
  describe('textEffectsHandlers', () => {
    
    describe('processHighlights', () => {
      it('should process bold text', () => {
        const result = textEffectsHandlers.processHighlights('**bold text**');
        
        assert.ok(result.processed.includes('<span'));
        assert.ok(result.processed.includes('bold text'));
        assert.strictEqual(result.hasBold, true);
      });
      
      it('should detect ALL CAPS in bold', () => {
        const result = textEffectsHandlers.processHighlights('**GOOD GIRL**');
        
        assert.strictEqual(result.hasCaps, true);
        assert.ok(result.processed.includes('caps-trigger'));
      });
      
      it('should not flag lowercase bold as caps', () => {
        const result = textEffectsHandlers.processHighlights('**hello world**');
        
        assert.strictEqual(result.hasCaps, false);
        assert.strictEqual(result.hasBold, true);
      });
      
      it('should handle text without bold', () => {
        const result = textEffectsHandlers.processHighlights('plain text');
        
        assert.strictEqual(result.processed, 'plain text');
        assert.strictEqual(result.hasBold, false);
        assert.strictEqual(result.hasCaps, false);
      });
    });
  });

  // ============ SESSION HANDLERS ============
  
  describe('sessionHandlers', () => {
    
    describe('create', () => {
      it('should create new session', () => {
        const result = sessionHandlers.create();
        
        assert.ok(result.sessionId.startsWith('session_'));
        assert.ok(result.username);
        assert.deepStrictEqual(result.activeTriggers, []);
        assert.strictEqual(result.collarActive, false);
      });
    });
    
    describe('getInfo', () => {
      it('should return session info', () => {
        const session = sessionHandlers.create();
        const result = sessionHandlers.getInfo(session.sessionId);
        
        assert.strictEqual(result.sessionId, session.sessionId);
        assert.strictEqual(result.exists, true);
      });
      
      it('should return exists:false for unknown session', () => {
        const result = sessionHandlers.getInfo('unknown_session');
        
        assert.strictEqual(result.exists, false);
      });
    });
    
    describe('destroy', () => {
      it('should destroy session', () => {
        const session = sessionHandlers.create();
        const result = sessionHandlers.destroy(session.sessionId);
        
        assert.strictEqual(result.destroyed, true);
        
        const info = sessionHandlers.getInfo(session.sessionId);
        assert.strictEqual(info.exists, false);
      });
    });
    
    describe('getAllSessions', () => {
      it('should return all sessions', () => {
        sessionHandlers.create();
        sessionHandlers.create();
        
        const result = sessionHandlers.getAllSessions();
        
        assert.ok(result.sessions.length >= 2);
        assert.ok(result.totalCount >= 2);
      });
    });
  });
});
