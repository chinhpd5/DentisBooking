import Location from "../models/location.model";
import Seat from "../models/seat.model";
import { IS_DELETED } from "../utils/constants";

export const createLocation = async (req, res) => {
  try {
    const data = req.body;
    const newLocation = await Location.create(data);
    res.status(201).json({
      success: true,
      message: "Tạo tầng thành công",
      data: newLocation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Không thể tạo tầng",
      error: error.message,
    });
  }
};

export const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách tầng",
      error: error.message,
    });
  }
};
export const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tầng",
      });
    }
    res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết tầng",
      error: error.message,
    });
  }
};    
export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedLocation = await Location.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!updatedLocation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tầng để cập nhật",
      });
    }
    res.status(200).json({
      success: true,
      message: "Cập nhật tầng thành công",
      data: updatedLocation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi cập nhật tầng",
      error: error.message,
    });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem có seat nào đang sử dụng location này không
    const seatsUsingLocation = await Seat.findOne({
      locationId: id,
      isDeleted: IS_DELETED.NO,
    });

    if (seatsUsingLocation) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa tầng này. Đang có ghế đang sử dụng tầng này.",
      });
    }

    const deletedLocation = await Location.findByIdAndDelete(id);
    if (!deletedLocation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tầng để xóa",
      });
    }
    res.status(200).json({
      success: true,
      message: "Xóa tầng thành công",
      data: deletedLocation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa tầng",
      error: error.message,
    });
  }
};