import Delivery from '../models/delivery.js';
import Order from '../models/order.js';

// Get all deliveries (filtered by role)
export const getDeliveries = async (req, res, next) => {
  try {
    let query = {};

    // If driver, show only their deliveries
    if (req.user.role === 'delivery') {
      query.driver = req.user._id;
    } else if (req.user.role === 'customer') {
      // Get orders for customer and find deliveries
      const orders = await Order.find({ customer: req.user._id });
      const orderIds = orders.map(o => o._id);
      query.order = { $in: orderIds };
    }

    const deliveries = await Delivery.find(query)
      .populate('order', 'orderNumber total')
      .populate('driver', 'name phone')
      .sort({ createdAt: -1 });

    res.json(deliveries);
  } catch (error) {
    next(error);
  }
};

// Get delivery by ID
export const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('order')
      .populate('driver', 'name phone email');

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json(delivery);
  } catch (error) {
    next(error);
  }
};

// Track delivery
export const trackDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('order', 'orderNumber')
      .populate('driver', 'name phone');

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json({
      trackingNumber: delivery.trackingNumber,
      status: delivery.status,
      timeline: delivery.timeline,
      estimatedDeliveryTime: delivery.estimatedDeliveryTime,
      driver: delivery.driver,
    });
  } catch (error) {
    next(error);
  }
};

// Update delivery status
export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status, location, note } = req.body;

    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Only driver or admin can update
    if (req.user.role !== 'admin' && delivery.driver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this delivery' });
    }

    if (status) {
      delivery.status = status;

      // Add to timeline
      delivery.timeline.push({
        status,
        location,
        note,
      });

      if (status === 'delivered') {
        delivery.actualDeliveryTime = new Date();
      }
    }

    await delivery.save();

    // Update order status
    if (status === 'delivered') {
      await Order.findByIdAndUpdate(delivery.order, { status: 'delivered' });
    }

    res.json({ message: 'Delivery updated successfully', delivery });
  } catch (error) {
    next(error);
  }
};
