const db = require('../config/db');

/**
 * Deducts inventory stock based on the dish recipes for a given set of orders.
 * @param {Array} orders - Array of objects like { dishId, quantity }
 */
async function deductInventoryForOrders(orders) {
    if (!orders || orders.length === 0) return;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        for (const order of orders) {
            const { dishId, quantity } = order;
            if (!dishId || !quantity) continue;

            // Fetch recipe for this dish
            const [recipe] = await conn.execute(
                'SELECT inventory_item_id, quantity_deducted FROM dish_recipe WHERE dish_id = ?',
                [dishId]
            );

            // Deduct stock for each ingredient
            for (const item of recipe) {
                const totalDeduction = Number(item.quantity_deducted) * Number(quantity);
                if (totalDeduction > 0) {
                    await conn.execute(
                        'UPDATE inventory_items SET current_stock = GREATEST(0, current_stock - ?) WHERE id = ?',
                        [totalDeduction, item.inventory_item_id]
                    );
                }
            }
        }

        await conn.commit();
        console.log(`[INVENTORY] Successfully deducted stock for ${orders.length} items.`);
    } catch (err) {
        await conn.rollback();
        console.error('[INVENTORY] Auto-deduction failed:', err.message);
    } finally {
        conn.release();
    }
}

module.exports = { deductInventoryForOrders };
