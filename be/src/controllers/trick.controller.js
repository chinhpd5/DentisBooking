import Trick from '../models/trick.model';
import Staff from '../models/staff.model';
import Job from '../models/job.model';
import { IS_DELETED, TRICK_STATUS } from '../utils/constants';

export const createTrick = async (req, res) => {
  try {
    const data = req.body;
    const newTrick = await Trick.create(data);
    res.status(201).json({
      success: true,
      message: "Tạo thủ thuật thành công",
      data: newTrick,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Không thể tạo thủ thuật",
      error: error.message,
    });
  }
};

export const getListTrick = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      staffId,
    } = req.query;

    const query = { isDeleted: IS_DELETED.NO };

    if (status !== undefined) query.status = parseInt(status);
    if (staffId) query.staffId = staffId;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        {
          path: "staffIds",
          select: "name role phone email status",
        },
        {
          path: "jobIds",
          select: "name time description status isFrist",
        },
      ],
    };

    const result = await Trick.paginate(query, options);

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
      message: "Lỗi khi lấy danh sách thủ thuật",
      error: error.message,
    });
  }
};

export const getAllTrick = async (req, res) => {
  try {
    const tricks = await Trick.find({ isDeleted: IS_DELETED.NO })
      .populate("staffIds", "name role phone email status")
      .populate("jobIds", "name time description status isFrist");
    res.status(200).json({
      success: true,
      data: tricks,
    });
  }
  catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách thủ thuật",
      error: error.message,
    });
  }
};

export const getTrickById = async (req, res) => {
  try {
    const trick = await Trick.findById(req.params.id)
      .populate("staffIds", "name role phone email status")
      .populate("jobIds", "name time description status isFrist");
    if (!trick || trick.isDeleted === IS_DELETED.YES) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thủ thuật",
      });
    }
    res.status(200).json({
      success: true,
      data: trick,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết thủ thuật",
      error: error.message,
    });
  }
};

export const updateTrick = async (req, res) => {
  try {
    const trick = await Trick.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("staffIds", "name role phone email status")
      .populate("jobIds", "name time description status isFrist");

    if (!trick) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thủ thuật để cập nhật",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thủ thuật thành công",
      data: trick,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi cập nhật thủ thuật",
      error: error.message,
    });
  }
};

export const softDeleteTrick = async (req, res) => {
  try {
    const trick = await Trick.findById(req.params.id);
    if (!trick) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thủ thuật để xóa",
      });
    }

    trick.isDeleted = IS_DELETED.YES;
    await trick.save();

    res.status(200).json({
      success: true,
      message: "Đã xóa thủ thuật thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa thủ thuật",
      error: error.message,
    });
  }
};

export const hardDeleteTrick = async (req, res) => {
  try {
    const trick = await Trick.findByIdAndDelete(req.params.id);

    if (!trick) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thủ thuật để xóa",
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã xóa thủ thuật khỏi hệ thống thành công",
      deletedData: trick,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa thủ thuật",
      error: error.message,
    });
  }
};

export const updateTrickStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const parsedStatus = parseInt(status);
    if (!Object.values(TRICK_STATUS).includes(parsedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Giá trị trạng thái không hợp lệ",
      });
    }

    const trick = await Trick.findById(id);
    if (!trick) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thủ thuật",
      });
    }

    trick.status = parsedStatus;
    await trick.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thủ thuật thành công",
      data: trick,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái thủ thuật",
      error: error.message,
    });
  }
};


