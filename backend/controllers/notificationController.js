const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createNotification = async (req, res) => {
  try {
    const { message, type } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const newNotification = new Notification({ message, type });
    await newNotification.save();

    res.status(201).json(newNotification);

    // Asynchronously prune stale notifications in background without blocking response
    setImmediate(async () => {
      try {
        const stale = await Notification.find().sort({ timestamp: -1 }).skip(100).select('_id').lean();
        if (stale.length) {
          await Notification.deleteMany({ _id: { $in: stale.map(n => n._id) } });
        }
      } catch (e) {
        // Background cleanup catch
      }
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getNotifications,
  createNotification
};