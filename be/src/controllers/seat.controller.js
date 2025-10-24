import Seat from '../models/seat.model'; 
import { IS_DELETED, SEAT_STATUS  } from  "../utils/constants" 

export const createSeat= async (req, res) => {
  try {
    const data = req.body;
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
    if (location) query.location = location;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
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
    const seat = await Seat.findById(req.params.id);
    if (!seat) {
      return res.status(404).json({
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
    const seat = await Seat.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ghế để cập nhật",
      });
    }

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
      return res.status(404).json({
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

    const seat = await Seat.findById(id);
    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ghế",
      });
    }

    seat.status = status;
    await seat.save();

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