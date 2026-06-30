/**
 * WP Travel Machine — AI Chat Widget
 */
(function() {
    'use strict';
    const WPTM = window.wptmData || {};

    function initAIChat() {
        const widget = document.querySelector('.wptm-ai-chat');
        if (!widget) return;

        const toggle = widget.querySelector('.wptm-ai-chat__toggle');
        const win = widget.querySelector('.wptm-ai-chat__window');
        const closeBtn = widget.querySelector('.wptm-ai-chat__close');
        const input = widget.querySelector('.wptm-ai-chat__input textarea');
        const sendBtn = widget.querySelector('.wptm-ai-chat__input button');
        const messages = widget.querySelector('.wptm-ai-chat__messages');

        if (!toggle || !win) return;

        // Keep wheel/touch scrolling inside a scrollable area — never let it leak
        // to the page once the inner element hits its top/bottom edge.
        function trapScroll(el) {
            if (!el) return;
            el.addEventListener('wheel', function(e) {
                if (el.scrollHeight <= el.clientHeight) return;
                var atTop = el.scrollTop <= 0;
                var atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
                if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) e.preventDefault();
                e.stopPropagation();
            }, { passive: false });
        }
        trapScroll(messages);
        trapScroll(input);

        toggle.addEventListener('click', function() {
            win.classList.toggle('open');
            if (win.classList.contains('open') && !messages.children.length) {
                addMessage('bot', 'Hi! 👋 I\'m your AI travel assistant. How can I help you find the perfect trip?');
            }
            if (win.classList.contains('open') && input) input.focus();
        });

        if (closeBtn) closeBtn.addEventListener('click', () => win.classList.remove('open'));
        // Escape closes the window when it's open.
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && win.classList.contains('open')) win.classList.remove('open');
        });

        function escapeHtml(s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        // Escape first (so any HTML in the reply is inert), then turn markdown
        // links and bare http(s) URLs into safe anchors. Only http/https allowed.
        function linkify(raw) {
            var html = escapeHtml(raw);
            html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function(_, label, url) {
                return '<a href="' + url + '" target="_blank" rel="noopener noreferrer nofollow">' + label + '</a>';
            });
            html = html.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, function(_, pre, url) {
                var trail = (url.match(/[.,!?)]+$/) || [''])[0];
                if (trail) url = url.slice(0, -trail.length);
                return pre + '<a href="' + url + '" target="_blank" rel="noopener noreferrer nofollow">' + url + '</a>' + trail;
            });
            return html;
        }

        function addMessage(type, text) {
            const msg = document.createElement('div');
            msg.className = 'wptm-ai-chat__msg wptm-ai-chat__msg--' + type;
            // Bot replies may contain links; user text is inserted verbatim.
            if (type === 'bot') { msg.innerHTML = linkify(text); }
            else { msg.textContent = text; }
            messages.appendChild(msg);
            messages.scrollTop = messages.scrollHeight;
        }

        // Append server-rendered trip/hotel cards below a reply. The markup comes
        // from our own partials (dynamic text escaped server-side), so it's trusted.
        function addCards(html) {
            if (!html) return;
            const wrap = document.createElement('div');
            wrap.className = 'wptm-ai-chat__recs';
            wrap.innerHTML = html;
            messages.appendChild(wrap);
            messages.scrollTop = messages.scrollHeight;
        }

        let isSending = false;
        function sendMessage() {
            if (isSending) return; // Ignore rapid Enter/clicks while a reply is pending.
            const text = input.value.trim();
            if (!text) return;
            isSending = true;
            addMessage('user', text);
            input.value = '';
            input.style.height = 'auto';
            sendBtn.disabled = true;

            const typing = document.createElement('div');
            typing.className = 'wptm-ai-chat__msg wptm-ai-chat__msg--bot';
            typing.innerHTML = '<span class="wptm-spinner"></span>';
            messages.appendChild(typing);
            messages.scrollTop = messages.scrollHeight;

            wptmAjax('wptm_ai_chat', { message: text, nonce: WPTM.aiNonce }, function(r) {
                typing.remove();
                isSending = false;
                sendBtn.disabled = false;
                if (r.success && (r.data.reply || r.data.cards)) {
                    if (r.data.reply) addMessage('bot', r.data.reply);
                    addCards(r.data.cards);
                } else {
                    // Surface the server's reason (bad key, rate limit, etc.) when present.
                    addMessage('bot', (r.data && r.data.message) ? r.data.message : 'Sorry, I couldn\'t process that. Please try again.');
                }
                if (input) input.focus();
            });
        }

        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (input) {
            // Enter sends; Shift+Enter inserts a newline.
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            });
            // Auto-grow up to the CSS max-height, then scroll internally.
            input.addEventListener('input', function() {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            });
        }
    }

    /* AI Trip Recommender — [wptm_ai_recommend] shortcode */
    function initAIRecommend() {
        var box = document.querySelector('.wptm-ai-recommend');
        if (!box) return;
        var form = box.querySelector('.wptm-ai-recommend__form');
        var results = box.querySelector('.wptm-ai-recommend__results');
        var statusEl = box.querySelector('.wptm-ai-recommend__status');
        if (!form) return;

        function setStatus(msg, isError) {
            if (!statusEl) return;
            statusEl.textContent = msg || '';
            statusEl.style.display = msg ? '' : 'none';
            statusEl.classList.toggle('is-error', !!isError);
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var prefs = (form.querySelector('[name="preferences"]') || {}).value || '';
            var budget = (form.querySelector('[name="budget"]') || {}).value || '';
            prefs = prefs.trim();
            if (!prefs) { setStatus('Tell us what you\'re looking for first.', true); return; }

            var btn = form.querySelector('[type="submit"]');
            var orig = btn ? btn.textContent : '';
            if (btn) { btn.disabled = true; btn.textContent = 'Finding trips…'; }
            setStatus('');
            results.innerHTML = '';

            // The server resolves the AI's picks to real trips/hotels and returns
            // ready-to-inject card markup (its dynamic text is escaped server-side).
            wptmAjax('wptm_ai_recommend', { preferences: prefs, budget: budget, nonce: WPTM.aiNonce }, function(r) {
                if (btn) { btn.disabled = false; btn.textContent = orig; }
                if (!r.success) {
                    setStatus((r.data && r.data.message) ? r.data.message : 'Sorry, recommendations are unavailable right now.', true);
                    return;
                }
                var html = r.data && r.data.html;
                if (!html) {
                    setStatus('No recommendations found. Try describing your trip differently.', true);
                    return;
                }
                results.innerHTML = html;
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        initAIChat();
        initAIRecommend();
    });
})();
