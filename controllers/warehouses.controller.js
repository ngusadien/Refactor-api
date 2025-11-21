import Warehouse from '../models/warehouse.js';

// Get all warehouses
export const getWarehouses = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { owner: req.user._id };

    const warehouses = await Warehouse.find(query)
      .populate('owner', 'name email')
      .populate('manager', 'name email')
      .populate('inventory.product', 'title sku');

    res.json(warehouses);
  } catch (error) {
    next(error);
  }
};

// Get warehouse by ID
export const getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('manager', 'name email')
      .populate('inventory.product', 'title sku price');

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    res.json(warehouse);
  } catch (error) {
    next(error);
  }
};

// Get warehouse inventory
export const getWarehouseInventory = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id)
      .populate('inventory.product', 'title sku price image');

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    res.json(warehouse.inventory);
  } catch (error) {
    next(error);
  }
};

// Update warehouse stock
export const updateWarehouseStock = async (req, res, next) => {
  try {
    const { productId, quantity, operation, location } = req.body;

    if (!['add', 'remove', 'set'].includes(operation)) {
      return res.status(400).json({ message: 'Invalid operation. Use add, remove, or set' });
    }

    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    // Find inventory item
    const inventoryIndex = warehouse.inventory.findIndex(
      item => item.product.toString() === productId
    );

    if (inventoryIndex === -1 && operation !== 'add') {
      return res.status(404).json({ message: 'Product not found in warehouse inventory' });
    }

    if (operation === 'add') {
      if (inventoryIndex === -1) {
        warehouse.inventory.push({
          product: productId,
          quantity,
          location,
        });
        warehouse.occupied += quantity;
      } else {
        warehouse.inventory[inventoryIndex].quantity += quantity;
        warehouse.occupied += quantity;
        if (location) warehouse.inventory[inventoryIndex].location = location;
      }
    } else if (operation === 'remove') {
      const currentQty = warehouse.inventory[inventoryIndex].quantity;
      if (quantity > currentQty) {
        return res.status(400).json({ message: 'Cannot remove more than current quantity' });
      }
      warehouse.inventory[inventoryIndex].quantity -= quantity;
      warehouse.occupied -= quantity;
    } else if (operation === 'set') {
      const oldQty = warehouse.inventory[inventoryIndex].quantity;
      warehouse.inventory[inventoryIndex].quantity = quantity;
      warehouse.occupied = warehouse.occupied - oldQty + quantity;
      if (location) warehouse.inventory[inventoryIndex].location = location;
    }

    warehouse.inventory[inventoryIndex || warehouse.inventory.length - 1].lastUpdated = new Date();
    await warehouse.save();

    res.json({ message: 'Warehouse stock updated successfully', warehouse });
  } catch (error) {
    next(error);
  }
};
