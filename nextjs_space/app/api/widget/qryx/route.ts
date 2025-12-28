/**
 * Qryx Widget Delivery Endpoint
 * 
 * Serves the chat widget JavaScript with shop-specific configuration
 * Embedded in Shopify stores via Script Tag
 * 
 * Usage:
 * <script src="https://your-app.vercel.app/api/widget/qryx?shop_id=xxx"></script>
 * 
 * PROTECTED: Do not modify without approval (core integration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShopifyShopById, getOrCreateQryxConfig } from '@/lib/db/qryx-helpers';
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('api/widget/qryx');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop_id = searchParams.get('shop_id');

    if (!shop_id) {
      return new NextResponse('Missing shop_id parameter', { status: 400 });
    }

    // Get shop and config
    const shop = await getShopifyShopById(shop_id);
    if (!shop) {
      return new NextResponse('Shop not found', { status: 404 });
    }

    const config = await getOrCreateQryxConfig(shop.id);

    // Generate widget JavaScript with config
    const widgetJS = generateWidgetScript(shop.id, config);

    // Return as JavaScript with proper headers
    return new NextResponse(widgetJS, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    logger.error('Widget delivery error', { error });
    return new NextResponse('Failed to load widget', { status: 500 });
  }
}

// =============================================================================
// WIDGET SCRIPT GENERATOR
// =============================================================================

function generateWidgetScript(shopId: string, config: any): string {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SHOPIFY_APP_URL || 'https://your-app.vercel.app';
  
  return `
(function() {
  'use strict';

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  const QRYX_CONFIG = {
    shopId: '${shopId}',
    apiUrl: '${apiUrl}',
    botName: ${JSON.stringify(config.bot_name)},
    botGreeting: ${JSON.stringify(config.bot_greeting)},
    widgetPosition: ${JSON.stringify(config.widget_position)},
    primaryColor: ${JSON.stringify(config.primary_color)},
    secondaryColor: ${JSON.stringify(config.secondary_color)},
  };

  // ==========================================================================
  // STATE
  // ==========================================================================

  let sessionToken = null;
  let isOpen = false;
  let isLoading = false;
  let messages = [];

  // ==========================================================================
  // INIT
  // ==========================================================================

  function init() {
    // Load session token from localStorage
    sessionToken = localStorage.getItem('qryx_session_token');

    // Create widget elements
    createWidget();

    // Load chat history if session exists
    if (sessionToken) {
      // Could load history here if needed
    }

    console.log('[Qryx] Widget initialized');
  }

  // ==========================================================================
  // UI CREATION
  // ==========================================================================

  function createWidget() {
    // Create container
    const container = document.createElement('div');
    container.id = 'qryx-widget';
    container.innerHTML = \`
      <style>
        #qryx-widget {
          position: fixed;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        #qryx-widget.position-bottom-right {
          bottom: 20px;
          right: 20px;
        }
        
        #qryx-widget.position-bottom-left {
          bottom: 20px;
          left: 20px;
        }
        
        #qryx-chat-button {
          width: 60px;
          height: 60px;
          border-radius: 30px;
          background: \${QRYX_CONFIG.primaryColor};
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        #qryx-chat-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        
        #qryx-chat-button svg {
          width: 28px;
          height: 28px;
        }
        
        #qryx-chat-window {
          display: none;
          width: 380px;
          height: 600px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          flex-direction: column;
          overflow: hidden;
          position: absolute;
          bottom: 80px;
        }
        
        #qryx-widget.position-bottom-right #qryx-chat-window {
          right: 0;
        }
        
        #qryx-widget.position-bottom-left #qryx-chat-window {
          left: 0;
        }
        
        #qryx-chat-window.open {
          display: flex;
        }
        
        #qryx-chat-header {
          background: \${QRYX_CONFIG.primaryColor};
          color: white;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        #qryx-chat-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        #qryx-close-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        #qryx-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f5f5f5;
        }
        
        .qryx-message {
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
        }
        
        .qryx-message.user {
          align-items: flex-end;
        }
        
        .qryx-message.assistant {
          align-items: flex-start;
        }
        
        .qryx-message-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
        }
        
        .qryx-message.user .qryx-message-bubble {
          background: \${QRYX_CONFIG.primaryColor};
          color: white;
        }
        
        .qryx-message.assistant .qryx-message-bubble {
          background: white;
          color: #333;
          border: 1px solid #e0e0e0;
        }
        
        #qryx-chat-input-container {
          padding: 16px;
          border-top: 1px solid #e0e0e0;
          background: white;
        }
        
        #qryx-chat-input-form {
          display: flex;
          gap: 8px;
        }
        
        #qryx-chat-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
        }
        
        #qryx-chat-input:focus {
          border-color: \${QRYX_CONFIG.primaryColor};
        }
        
        #qryx-send-button {
          width: 40px;
          height: 40px;
          border-radius: 20px;
          background: \${QRYX_CONFIG.primaryColor};
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }
        
        #qryx-send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        #qryx-send-button svg {
          width: 20px;
          height: 20px;
        }
        
        .qryx-typing {
          display: inline-flex;
          gap: 4px;
          padding: 10px 14px;
        }
        
        .qryx-typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #999;
          animation: qryx-typing 1.4s infinite;
        }
        
        .qryx-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .qryx-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes qryx-typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
        
        @media (max-width: 480px) {
          #qryx-chat-window {
            width: 100vw;
            height: 100vh;
            border-radius: 0;
            bottom: 0;
            left: 0 !important;
            right: 0 !important;
          }
        }
      </style>
      
      <button id="qryx-chat-button" aria-label="Open chat">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
        </svg>
      </button>
      
      <div id="qryx-chat-window">
        <div id="qryx-chat-header">
          <h3>\${QRYX_CONFIG.botName}</h3>
          <button id="qryx-close-button" aria-label="Close chat">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div id="qryx-chat-messages"></div>
        
        <div id="qryx-chat-input-container">
          <form id="qryx-chat-input-form">
            <input 
              type="text" 
              id="qryx-chat-input" 
              placeholder="Type a message..."
              autocomplete="off"
            />
            <button type="submit" id="qryx-send-button" aria-label="Send message">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </form>
        </div>
      </div>
    \`;

    // Add position class
    container.classList.add('position-' + QRYX_CONFIG.widgetPosition);

    // Append to body
    document.body.appendChild(container);

    // Attach event listeners
    attachEventListeners();

    // Show greeting
    addMessage('assistant', QRYX_CONFIG.botGreeting);
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  function attachEventListeners() {
    const button = document.getElementById('qryx-chat-button');
    const closeButton = document.getElementById('qryx-close-button');
    const form = document.getElementById('qryx-chat-input-form');

    button.addEventListener('click', toggleChat);
    closeButton.addEventListener('click', toggleChat);
    form.addEventListener('submit', handleSubmit);
  }

  function toggleChat() {
    isOpen = !isOpen;
    const chatWindow = document.getElementById('qryx-chat-window');
    
    if (isOpen) {
      chatWindow.classList.add('open');
      document.getElementById('qryx-chat-input').focus();
    } else {
      chatWindow.classList.remove('open');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    const input = document.getElementById('qryx-chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Clear input
    input.value = '';
    
    // Add user message
    addMessage('user', message);
    
    // Show typing indicator
    showTyping();
    
    // Send to API
    isLoading = true;
    
    try {
      const response = await fetch(\`\${QRYX_CONFIG.apiUrl}/api/qryx/chat\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: QRYX_CONFIG.shopId,
          session_token: sessionToken,
          message: message,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Store session token
      if (data.session_token && !sessionToken) {
        sessionToken = data.session_token;
        localStorage.setItem('qryx_session_token', sessionToken);
      }
      
      // Hide typing indicator
      hideTyping();
      
      // Add assistant response
      addMessage('assistant', data.response);
    } catch (error) {
      hideTyping();
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
      console.error('[Qryx] Error:', error);
    } finally {
      isLoading = false;
    }
  }

  // ==========================================================================
  // UI HELPERS
  // ==========================================================================

  function addMessage(role, content) {
    const messagesContainer = document.getElementById('qryx-chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = \`qryx-message \${role}\`;
    
    const bubble = document.createElement('div');
    bubble.className = 'qryx-message-bubble';
    bubble.textContent = content;
    
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    messages.push({ role, content });
  }

  function showTyping() {
    const messagesContainer = document.getElementById('qryx-chat-messages');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'qryx-message assistant';
    typingDiv.id = 'qryx-typing-indicator';
    
    const bubble = document.createElement('div');
    bubble.className = 'qryx-message-bubble';
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'qryx-typing';
    typingIndicator.innerHTML = \`
      <span class="qryx-typing-dot"></span>
      <span class="qryx-typing-dot"></span>
      <span class="qryx-typing-dot"></span>
    \`;
    
    bubble.appendChild(typingIndicator);
    typingDiv.appendChild(bubble);
    messagesContainer.appendChild(typingDiv);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTyping() {
    const typingIndicator = document.getElementById('qryx-typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // ==========================================================================
  // AUTO-INIT
  // ==========================================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
  `.trim();
}

// =============================================================================
// ROUTE CONFIG
// =============================================================================

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
