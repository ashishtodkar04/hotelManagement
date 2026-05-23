const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireStaffOrAdmin } = require('../middleware/auth');

// ─── 1. INVENTORY ITEMS ───

// GET all inventory items
router.get('/', requireStaffOrAdmin, async (req, res) => {
    try {
        const [items] = await db.execute('SELECT * FROM inventory_items ORDER BY name ASC');
        res.json({ success: true, items });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST add new inventory item
router.post('/', requireStaffOrAdmin, async (req, res) => {
    try {
        const { name, unit, current_stock, low_stock_threshold } = req.body;
        if (!name || !unit) return res.status(400).json({ error: 'Name and Unit required' });
        
        await db.execute(
            'INSERT INTO inventory_items (name, unit, current_stock, low_stock_threshold) VALUES (?, ?, ?, ?)',
            [name, unit, current_stock || 0, low_stock_threshold || 0]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT update inventory item stock/threshold
router.put('/:id', requireStaffOrAdmin, async (req, res) => {
    try {
        const { current_stock, low_stock_threshold } = req.body;
        await db.execute(
            'UPDATE inventory_items SET current_stock = ?, low_stock_threshold = ? WHERE id = ?',
            [current_stock, low_stock_threshold, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE inventory item
router.delete('/:id', requireStaffOrAdmin, async (req, res) => {
    try {
        await db.execute('DELETE FROM inventory_items WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── 2. DISH RECIPES (MAPPINGS) ───

// GET recipes for a specific dish
router.get('/recipe/:dishId', requireStaffOrAdmin, async (req, res) => {
    try {
        const [recipe] = await db.execute(`
            SELECT dr.id, dr.dish_id, dr.inventory_item_id, dr.quantity_deducted, i.name, i.unit 
            FROM dish_recipe dr
            JOIN inventory_items i ON dr.inventory_item_id = i.id
            WHERE dr.dish_id = ?
        `, [req.params.dishId]);
        res.json({ success: true, recipe });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST update recipe for a dish
router.post('/recipe/:dishId', requireStaffOrAdmin, async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { dishId } = req.params;
        const { ingredients } = req.body; // Array of { inventory_item_id, quantity_deducted }

        await conn.beginTransaction();
        
        // Clear old recipe
        await conn.execute('DELETE FROM dish_recipe WHERE dish_id = ?', [dishId]);

        // Insert new recipe
        for (const item of ingredients) {
            await conn.execute(
                'INSERT INTO dish_recipe (dish_id, inventory_item_id, quantity_deducted) VALUES (?, ?, ?)',
                [dishId, item.inventory_item_id, item.quantity_deducted]
            );
        }

        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, error: err.message });
    } finally {
        conn.release();
    }
});

module.exports = router;
