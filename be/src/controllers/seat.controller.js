import Seat from '../models/seat.model'; 
import Notification from '../models/notification.model';
import { IS_DELETED, SEAT_STATUS  } from  "../utils/constants" 

export const createSeat= async (req, res) => {
  try {
    const data = req.body;

    if (!data.name) {
      return res.status(400).json({
        success: false,
        message: "Tên ghế là bắt buộc",
      });
    }

    const duplicateSeat = await Seat.findOne({
      name: data.name,
      ...(Seat.schema.path("isDeleted") ? { isDeleted: IS_DELETED.NO } : {}),
    });

    if (duplicateSeat) {
      return res.status(400).json({
        success: false,
        message: "Tên ghế đã tồn tại trong hệ thống",
      });
    }

    const newSeat = await Seat.create(data);
    res.status(201).json({
      success: true,
      message: "Tạo ghế thành công",
      data: newSeat,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Không thể tạo ghế",
      error: error.message,
    });
  }
};

export const getAllSeats = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      location
    } = req.query;

    const query = { isDeleted: IS_DELETED.NO };

    if (status) query.status = status;
    if (location) query.locationId = location;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        {
          path: "locationId"
        }
      ],
    };


    const result = await Seat.paginate(query, options);

    res.status(200).json({
      success: true,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
      limit: result.limit,
      data: result.docs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách ghế",
      error: error.message,
    });
  }
};

export const getSeatById = async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id).populate('locationId');
    if (!seat) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy ghế",
      });
    }
    res.status(200).json({
      success: true,
      data: seat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết ghế",
      error: error.message,
    });
  }
};

export const updateSeat = async (req, res) => {
  try {
    const seatId = req.params.id;
    const { name, ...rest } = req.body;

    const existingSeat = await Seat.findById(seatId);
    if (!existingSeat) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy ghế để cập nhật",
      });
    }

    // if (name) {
    //   const duplicateSeat = await Seat.findOne({
    //     _id: { $ne: seatId },
    //     name,
    //     ...(Seat.schema.path("isDeleted") ? { isDeleted: IS_DELETED.NO } : {}),
    //   });

    //   if (duplicateSeat) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Tên ghế đã tồn tại trong hệ thống",
    //     });
    //   }
    // }

    const updatePayload = {
      ...rest,
      ...(name !== undefined ? { name } : {}),
    };

    const seat = await Seat.findByIdAndUpdate(seatId, updatePayload, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Cập nhật ghế thành công",
      data: seat,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi cập nhật ghế",
      error: error.message,
    });
  }
};

export const hardDeleteSeat = async (req, res) => {
  try {
    const seat = await Seat.findByIdAndDelete(req.params.id);

    if (!seat) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy ghế để xóa",
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã xóa ghế khỏi hệ thống thành công",
      deletedData: seat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa ghế",
      error: error.message,
    });
  }
};

export const updateSeatStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(SEAT_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Giá trị trạng thái không hợp lệ",
      });
    }

    const seat = await Seat.findById(id).populate('locationId');
    if (!seat) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy ghế",
      });
    }

    const oldStatus = seat.status;
    seat.status = status;
    await seat.save();

    const userId = req.user?.id;
    if (userId) {
      try {
        await Notification.create({
          seatId: seat._id,
          seatName: seat.name,
          changedBy: userId,
          fromStatus: oldStatus,
          toStatus: status,
        });
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
      }
    }

    // Emit socket event để thông báo real-time cho các client khác
    const io = req.app.get('io');
    if (io) {
      io.emit('seatStatusChanged', {
        seatId: seat._id,
        seatName: seat.name,
        oldStatus: oldStatus,
        newStatus: status,
        location: seat.locationId?.name || 'N/A',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái ghế thành công",
      data: seat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái ghế",
      error: error.message,
    });
  }
};