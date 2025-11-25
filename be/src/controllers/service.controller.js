import Service from "../models/service.model";
import { IS_DELETED, SERVICE_STATUS } from "../utils/constants";

export const createService = async (req, res) => {
  try {
    const data = req.body;
    
    if (data.name) {
      const duplicateName = await Service.findOne({
        isDeleted: IS_DELETED.NO,
        name: data.name,
      });
    }

    if (duplicateName) {
      return res.status(400).json({
        success: false,
        message: "Tên dịch vụ đã tồn tại trong hệ thống",
      });
    }
    
    const newService = await Service.create(data);
    res.status(201).json({
      success: true,
      message: "Tạo dịch vụ thành công",
      data: newService,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Không thể tạo dịch vụ",
      error: error.message,
    });
  }
};

export const getListService = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      type,
    } = req.query;

    const query = { isDeleted: IS_DELETED.NO };

    if (status !== undefined) query.status = parseInt(status);
    if (type) query.type = type;

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
        { path: "jobIds", model: "Service", select: "name time" },
        { path: "staffIds", model: "Staff", select: "name role" },
      ],
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

export const getAllService = async (req, res) => {
  try {
    const { type } = req.query;
    const query = { isDeleted: IS_DELETED.NO };
    if (type) query.type = type;

    const list = await Service.find(query)
      .populate("jobIds", "name time")
      .populate("staffIds", "name role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách dịch vụ",
      error: error.message,
    });
  }
};

export const getByIdService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate("jobIds", "name time type")
      .populate("staffIds", "name role");
    
    if (!service || service.isDeleted === IS_DELETED.YES) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
    }
    
    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết dịch vụ",
      error: error.message,
    });
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dịch vụ để cập nhật",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật dịch vụ thành công",
      data: service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi cập nhật dịch vụ",
      error: error.message,
    });
  }
};

export const softDeleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dịch vụ để xóa",
      });
    }

    service.isDeleted = IS_DELETED.YES;
    await service.save();

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

export const hardDeleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dịch vụ để xóa",
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã xóa dịch vụ khỏi hệ thống thành công",
      deletedData: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa dịch vụ",
      error: error.message,
    });
  }
};

export const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(SERVICE_STATUS).includes(parseInt(status))) {
      return res.status(400).json({
        success: false,
        message: "Giá trị trạng thái không hợp lệ",
      });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
    }

    service.status = parseInt(status);
    await service.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái dịch vụ thành công",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái dịch vụ",
      error: error.message,
    });
  }
};

export const getAllServiceIsFirst = async (req, res) => {
  try {
    const { type } = req.query;
    const query = {
      isDeleted: IS_DELETED.NO,
      isFirst: true,
    };
    if (type) query.type = type;

    const list = await Service.find(query)
      .populate("jobIds", "name time")
      .populate("staffIds", "name role");

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

