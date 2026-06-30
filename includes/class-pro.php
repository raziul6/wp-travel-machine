<?php
/**
 * The single "Upgrade to Pro" page.
 *
 * Pro features are hidden throughout the UI (see wptm_is_pro() gates); the only
 * place the upgrade is advertised is this one dedicated page — the standard,
 * wp.org-friendly freemium pattern. The menu disappears once Pro is active.
 *
 * @package WPTravelMachine
 */

namespace WPTravelMachine;

if ( ! defined( 'ABSPATH' ) ) exit;

class Pro {

    const SLUG = 'wptm-pro';

    public function __construct() {
        add_action( 'admin_menu', array( $this, 'register_menu' ), 99 );
    }

    /**
     * Feature comparison rows for the upgrade table: [ label, in_free, in_pro ].
     *
     * A row with both flags set to null is a category header (rendered as a
     * full-width band by admin/views/pro.php).
     *
     * @return array
     */
    public static function comparison() {
        $cat  = function ( $label ) { return array( $label, null, null ); };
        $free = function ( $label ) { return array( $label, true, true ); };
        $pro  = function ( $label ) { return array( $label, false, true ); };

        return array(
            $cat( __( 'Content', 'wp-travel-machine' ) ),
            $free( __( 'Trips & Hotels — itinerary, pricing tiers, gallery, FAQ, map', 'wp-travel-machine' ) ),
            $free( __( 'Unlimited trips, hotels & bookings', 'wp-travel-machine' ) ),
            $free( __( 'Taxonomies — destinations, activities, types, facilities', 'wp-travel-machine' ) ),
            $free( __( 'Reviews & star ratings', 'wp-travel-machine' ) ),
            $free( __( 'Single pages — gallery + lightbox, map, sticky booking bar', 'wp-travel-machine' ) ),
            $free( __( 'Related trips / hotels', 'wp-travel-machine' ) ),

            $cat( __( 'Booking engine', 'wp-travel-machine' ) ),
            $free( __( 'Availability calendar — date-range & single date', 'wp-travel-machine' ) ),
            $free( __( 'Pricing tiers (Adult/Child/…) & taxes', 'wp-travel-machine' ) ),
            $free( __( 'Session-less cart & server-side price validation', 'wp-travel-machine' ) ),
            $pro( __( 'Coupons / discount codes', 'wp-travel-machine' ) ),
            $pro( __( 'Pickup points — priced add-on at checkout', 'wp-travel-machine' ) ),

            $cat( __( 'Payments', 'wp-travel-machine' ) ),
            $free( __( 'Manual / bank transfer', 'wp-travel-machine' ) ),
            $pro( __( 'Stripe (cards, SCA / 3-D Secure)', 'wp-travel-machine' ) ),
            $pro( __( 'PayPal', 'wp-travel-machine' ) ),
            $pro( __( 'Razorpay', 'wp-travel-machine' ) ),
            $pro( __( 'Printable invoices + company details', 'wp-travel-machine' ) ),

            $cat( __( 'Display & page building', 'wp-travel-machine' ) ),
            $free( __( 'Shortcodes, Gutenberg blocks & Elementor widgets', 'wp-travel-machine' ) ),
            $free( __( 'Grid / List layout + style controls', 'wp-travel-machine' ) ),
            $free( __( 'Search form, AJAX filters & pagination', 'wp-travel-machine' ) ),
            $free( __( 'Wishlist, Compare & enquiry form', 'wp-travel-machine' ) ),

            $cat( __( 'System & admin', 'wp-travel-machine' ) ),
            $free( __( 'Dashboard, bookings management & reports', 'wp-travel-machine' ) ),
            $free( __( 'Branded emails, demo importer & setup wizard', 'wp-travel-machine' ) ),
            $free( __( 'SEO schema, REST API & developer hooks', 'wp-travel-machine' ) ),

            $cat( __( 'AI — runs on your own provider API key', 'wp-travel-machine' ) ),
            $free( __( 'Natural-language search', 'wp-travel-machine' ) ),
            $free( __( 'Chat assistant — conversational text replies', 'wp-travel-machine' ) ),
            $pro( __( 'Chat — inline bookable trip/hotel cards', 'wp-travel-machine' ) ),
            $pro( __( 'Smart recommendations — bookable cards + score', 'wp-travel-machine' ) ),
            $pro( __( 'AI Trip Builder — write a whole trip in one click', 'wp-travel-machine' ) ),
            $pro( __( 'AI itinerary generator', 'wp-travel-machine' ) ),
            $pro( __( 'AI customer-reply drafting', 'wp-travel-machine' ) ),
            $pro( __( 'AI Style generator (blocks & Elementor)', 'wp-travel-machine' ) ),
        );
    }

    /**
     * Add the "Upgrade" submenu — only while Pro is inactive.
     */
    public function register_menu() {
        if ( wptm_is_pro() ) {
            return; // Nothing to upgrade once Pro is active.
        }
        add_submenu_page(
            'wptm-dashboard',
            __( 'Upgrade to Pro', 'wp-travel-machine' ),
            '<span class="wptm-pro-menu">' . __( 'Upgrade', 'wp-travel-machine' ) . ' ✦</span>',
            'manage_options',
            self::SLUG,
            array( $this, 'render_page' )
        );
    }

    public function render_page() {
        include WPTM_PLUGIN_DIR . 'admin/views/pro.php';
    }
}
