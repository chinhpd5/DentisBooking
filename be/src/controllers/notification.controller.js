import Notification from "../models/notification.model";

export const getNotifications = async (req, res) => {
  try {
    const { seatId, changedBy } = req.query;

    const filters = {};
    if (seatId) {
      filters.seatId = seatId;
    }
    if (changedBy) {
      filters.changedBy = changedBy;
    }

    const notifications = await Notification.find(filters)
      .sort({ createdAt: -1 })
      .populate([
        {
          path: "seatId",
          select: "name locationId",
          populate: { path: "locationId", select: "name" },
        },
        {
          path: "changedBy",
          select: "name role",
        },
      ]);

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách thông báo",
      error: error.message,
    });
  }
};

