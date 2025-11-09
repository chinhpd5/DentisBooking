import Service from '../models/service.model';
import { IS_DELETED, SERVICE_STATUS } from '../utils/constants';
const type = "job";
export const createJob = async (req, res) => {
  try {
    const data = req.body;
    const newJob = await Service.create({ ...data, type: "job" });
    res.status(201).json({
      success: true,
      message: "Tạo dịch vụ thành công",
      data: newJob,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Không thể tạo dịch vụ",
      error: error.message,
    });
  }
};

export const getListJob = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
    } = req.query;

    const query = { isDeleted: IS_DELETED.NO, type };

    if (status !== undefined) query.status = parseInt(status);

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
    };

    const result = await Service.paginate(query, options);

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
      message: "Lỗi khi lấy danh sách dịch vụ",
      error: error.message,
    });
  }
};

export const getByIdJob = async (req, res) => {
  try {
    const job = await Service.findById(req.params.id);
    if (!job || job.isDeleted === IS_DELETED.YES) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
    }
    res.status(200).json({
      success: true,
      data: job,
    });
  }
  catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết dịch vụ",
      error: error.message,
    });
  }
};  

export const getAllJob = async (req, res) => {
  try {
    const job = await Service.find({ isDeleted: IS_DELETED.NO, type });
    if (!job || job.isDeleted === IS_DELETED.YES) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
    }
    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết dịch vụ",
      error: error.message,
    });
  }
};

export const updateJob = async (req, res) => {
  try {
    console.log(req.body);
    
    const job = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!job) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dịch vụ để cập nhật",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật dịch vụ thành công",
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
        message: "Lỗi khi cập nhật dịch vụ",
      error: error.message,
    });
  }
};

export const softDeleteJob = async (req, res) => {
  try {
    const job = await Service.findById(req.params.id);
    if (!job) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dịch vụ để xóa",
      });
    }

    job.isDeleted = IS_DELETED.YES;
    await job.save();

    res.status(200).json({
      success: true,
      message: "Đã xóa dịch vụ thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa dịch vụ",
      error: error.message,
    });
  }
};

export const hardDeleteJob = async (req, res) => {
  try {
    const job = await Service.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dịch vụ để xóa",
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã xóa dịch vụ khỏi hệ thống thành công",
      deletedData: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa dịch vụ",
      error: error.message,
    });
  }
};

export const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(SERVICE_STATUS).includes(parseInt(status))) {
      return res.status(400).json({
        success: false,
        message: "Giá trị trạng thái không hợp lệ",
      });
    }

    const job = await Service.findById(id);
    if (!job) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
    }

    job.status = parseInt(status);
    await job.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái dịch vụ thành công",
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái dịch vụ",
      error: error.message,
    });
  }
};

export const getAllJobIsFirst = async (req, res) => {
  try {
    const list = await Service.find({
      isDeleted: IS_DELETED.NO,
      isFirst: true,
    });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách dịch vụ cần thực hiện trước thủ thuật thành công",
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách dịch vụ cần thực hiện trước thủ thuật",
      error: error.message,
    });
  }
};