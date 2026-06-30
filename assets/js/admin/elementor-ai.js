/**
 * WP Travel Machine — AI Style generator for the Elementor editor (Pro).
 *
 * Adds a "Generate styles" button to the Style tab of the Trip/Hotel Grid
 * widgets. It asks the AI for cohesive presets and writes the chosen one into
 * the widget's existing colour / radius / gap controls via Elementor's
 * settings command — it never injects raw CSS.
 */
(function ($) {
    'use strict';

    var cfg = window.wptmElAI || {};

    /* Resolve the container of the element currently being edited. */
    function currentContainer() {
        try {
            if (window.elementor && elementor.selection && elementor.selection.elements && elementor.selection.elements.length) {
                return elementor.selection.elements[0];
            }
        } catch (e) {}
        try {
            var pv = elementor.getPanelView().getCurrentPageView();
            if (pv) {
                if (pv.getOption) {
                    var ev = pv.getOption('editedElementView');
                    if (ev && ev.getContainer) { return ev.getContainer(); }
                }
                if (pv.model && pv.model.container) { return pv.model.container; }
            }
        } catch (e) {}
        return null;
    }

    /* Apply a preset to the current widget's settings (panel + preview sync). */
    function applyPreset(p) {
        var container = currentContainer();
        if (!container || !window.$e || !$e.run) { return; }
        $e.run('document/elements/settings', {
            container: container,
            settings: {
                accent: p.accent,
                titleColor: p.titleColor,
                textColor: p.textColor,
                btnBg: p.btnBg,
                btnColor: p.btnColor,
                cardRadius: { unit: 'px', size: parseInt(p.cardRadius, 10) || 0 },
                gap: { unit: 'px', size: parseInt(p.gap, 10) || 0 }
            },
            options: { external: true }
        });
    }

    function renderPresets($wrap, presets) {
        $wrap.empty();
        presets.forEach(function (p) {
            var $btn = $('<button type="button" class="wptm-el-ai__preset"></button>').attr('title', p.name);
            var $sw = $('<span class="wptm-el-ai__sw"></span>');
            ['accent', 'titleColor', 'textColor', 'btnBg'].forEach(function (k) {
                $sw.append($('<i></i>').css('background', p[k]));
            });
            $btn.append($sw).append($('<span class="wptm-el-ai__name"></span>').text(p.name));
            $btn.on('click', function () { applyPreset(p); });
            $wrap.append($btn);
        });
    }

    /* Delegated: the control is re-rendered whenever a widget is selected. */
    $(document).on('click', '.wptm-el-ai__gen', function () {
        var $root = $(this).closest('.wptm-el-ai');
        var $msg = $root.find('.wptm-el-ai__msg');
        var $presets = $root.find('.wptm-el-ai__presets');
        var vibe = ($root.find('.wptm-el-ai__vibe').val() || '').trim();
        if (!vibe) { $msg.show().text('Describe a style first.'); return; }

        var $btn = $(this);
        $btn.prop('disabled', true).text('Generating…');
        $msg.hide().text('');
        $presets.empty();

        $.post(cfg.ajaxUrl, { action: 'wptm_ai_generate_style', nonce: cfg.nonce, vibe: vibe })
            .done(function (r) {
                if (r && r.success && r.data && r.data.presets && r.data.presets.length) {
                    renderPresets($presets, r.data.presets);
                } else {
                    $msg.show().text((r && r.data && r.data.message) ? r.data.message : 'Could not generate a style.');
                }
            })
            .fail(function () { $msg.show().text('Request failed. Please try again.'); })
            .always(function () { $btn.prop('disabled', false).text('Generate styles'); });
    });

})(jQuery);
