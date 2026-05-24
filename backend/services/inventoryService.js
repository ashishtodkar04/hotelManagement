const db = require('../config/db');

/**
 * Adjusts inventory stock (can be positive or negative adjustment).
 * @param {Array} adjustments - Array of objects like { dishId, quantityChange } (quantityChange is negative for refunding/restoring, positive for deducting)
 * @param {Object} connOverride - Optional database connection/transaction to reuse
 */
async function adjustInventoryForOrders(adjustments, connOverride = null) {
    if (!adjustments || adjustments.length === 0) return;

    const conn = connOverride || await db.getConnection();
    try {
        if (!connOverride) await conn.beginTransaction();

        for (const adj of adjustments) {
            const { dishId, quantityChange } = adj;
            if (!dishId || !quantityChange) continue;

            // Fetch recipe for this dish
            const [recipe] = await conn.execute(
                'SELECT inventory_item_id, quantity_deducted FROM dish_recipe WHERE dish_id = ?',
                [dishId]
            );

            // Adjust stock for each ingredient
            for (const item of recipe) {
                const change = Number(item.quantity_deducted) * Number(quantityChange);
                if (change !== 0) {
                    await conn.execute(
                        'UPDATE inventory_items SET current_stock = GREATEST(0, current_stock - ?) WHERE id = ?',
                        [change, item.inventory_item_id]
                    );
                }
            }
        }

        if (!connOverride) await conn.commit();
        console.log(`[INVENTORY] Successfully adjusted stock for ${adjustments.length} items.`);
    } catch (err) {
        if (!connOverride) await conn.rollback();
        console.error('[INVENTORY] Stock adjustment failed:', err.message);
        throw err;
    } finally {
        if (!connOverride) conn.release();
    }
}

/**
 * Deducts inventory stock based on the dish recipes for a given set of orders.
 * @param {Array} orders - Array of objects like { dishId, quantity }
 * @param {Object} connOverride - Optional database connection
 */
async function deductInventoryForOrders(orders, connOverride = null) {
    const adjustments = orders.map(o => ({ dishId: o.dishId, quantityChange: o.quantity }));
    await adjustInventoryForOrders(adjustments, connOverride);
}

/**
 * Cancels bookings and restores their stock levels.
 * @param {Array<number>} bookingIds
 * @param {Object} conn
 */
async function cancelBookingsAndRestoreStock(bookingIds, conn) {
    if (!bookingIds || bookingIds.length === 0) return;

    // 1. Fetch all orders for these bookings
    const [orders] = await conn.query(
        "SELECT dish_id, quantity FROM orders WHERE booking_id IN (?)",
        [bookingIds]
    );

    if (orders.length > 0) {
        // 2. Adjust stock levels by adding back the quantities (negative quantityChange to refund/restore)
        const adjustments = orders.map(o => ({
            dishId: Number(o.dish_id),
            quantityChange: -Number(o.quantity)
        }));
        await adjustInventoryForOrders(adjustments, conn);
    }
}

module.exports = {
    adjustInventoryForOrders,
    deductInventoryForOrders,
    cancelBookingsAndRestoreStock
};

