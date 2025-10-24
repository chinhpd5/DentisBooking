import Staff from '../models/staff.model'; 
import { IS_DELETED, STAFF_STATUS  } from  "../utils/constants" 

export const createEmployee = async (req, res) => {
  try {
    const data = req.body;
    const newStaff = await Staff.create(data);
    res.status(201).json({
      success: true,
      message: "Tạo nhân viên thành công",
      data: newStaff,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Không thể tạo nhân viên",
      error: error.message,
    });
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      status,
    } = req.query;

    const query = { isDeleted: IS_DELETED.NO };

    if (role) query.role = role;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const result = await Staff.paginate(query, options);

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
      message: "Lỗi khi lấy danh sách nhân viên",
      error: error.message,
    });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff || staff.isDeleted === IS_DELETED.YES) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }
    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết nhân viên",
      error: error.message,
    });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên để cập nhật",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật nhân viên thành công",
      data: staff,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi cập nhật nhân viên",
      error: error.message,
    });
  }
};

export const sortDeleteEmployee = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên để xóa",
      });
    }

    staff.isDeleted = IS_DELETED.YES;
    await staff.save();

    res.status(200).json({
      success: true,
      message: "Đã xóa nhân viên thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa nhân viên",
      error: error.message,
    });
  }
};

export const hardDeleteEmployee = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên để xóa",
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã xóa nhân viên khỏi hệ thống thành công",
      deletedData: staff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa nhân viên",
      error: error.message,
    });
  }
};

export const updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(STAFF_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Giá trị trạng thái không hợp lệ",
      });
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    staff.status = status;
    await staff.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái nhân viên thành công",
      data: staff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái nhân viên",
      error: error.message,
    });
  }
};