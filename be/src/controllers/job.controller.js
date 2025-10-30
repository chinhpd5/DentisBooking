import Job from '../models/job.model';
import { IS_DELETED, JOB_STATUS } from '../utils/constants';

export const createJob = async (req, res) => {
  try {
    const data = req.body;
    const newJob = await Job.create(data);
    res.status(201).json({
      success: true,
      message: "Tạo công việc thành công",
      data: newJob,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Không thể tạo công việc",
      error: error.message,
    });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
    } = req.query;

    const query = { isDeleted: IS_DELETED.NO };

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

    const result = await Job.paginate(query, options);

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
      message: "Lỗi khi lấy danh sách công việc",
      error: error.message,
    });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.isDeleted === IS_DELETED.YES) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc",
      });
    }
    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết công việc",
      error: error.message,
    });
  }
};

export const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc để cập nhật",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật công việc thành công",
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi cập nhật công việc",
      error: error.message,
    });
  }
};

export const softDeleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc để xóa",
      });
    }

    job.isDeleted = IS_DELETED.YES;
    await job.save();

    res.status(200).json({
      success: true,
      message: "Đã xóa công việc thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa công việc",
      error: error.message,
    });
  }
};

export const hardDeleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc để xóa",
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã xóa công việc khỏi hệ thống thành công",
      deletedData: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa công việc",
      error: error.message,
    });
  }
};

export const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(JOB_STATUS).includes(parseInt(status))) {
      return res.status(400).json({
        success: false,
        message: "Giá trị trạng thái không hợp lệ",
      });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc",
      });
    }

    job.status = parseInt(status);
    await job.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái công việc thành công",
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái công việc",
      error: error.message,
    });
  }
};

export const getJobIsFirst = async (req, res) => {
  try {
    const list = await Job.find({
      isDeleted: IS_DELETED.NO,
      isFrist: true,
    });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách công việc cần thực hiện trước thủ thuật thành công",
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách công việc cần thực hiện trước thủ thuật",
      error: error.message,
    });
  }
};