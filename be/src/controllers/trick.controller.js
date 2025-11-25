import Service from '../models/service.model';
import { IS_DELETED, SERVICE_STATUS } from '../utils/constants';

const type = "trick";

export const createTrick = async (req, res) => {
  try {
    const data = req.body;
    const existingTrick = await Service.findOne({ name: data.name });
    if (existingTrick) {
      return res.status(400).json({
        success: false,
        message: "Thủ thuật đã tồn tại",
      });
    }
    const newTrick = await Service.create({ ...data, type });
    res.status(201).json({
      success: true,
      message: "Tạo dịch vụ thành công",
      data: newTrick,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Không thể tạo dịch vụ",
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
      message: "Lỗi khi lấy danh sách thủ thuật",
      error: error.message,
    });
  }
};

export const getAllTrick = async (req, res) => {
  try {
    const services = await Service.find({ isDeleted: IS_DELETED.NO, type })
      .populate("staffIds", "name role phone email status")
      .populate("jobIds", "name time description status isFrist");
    res.status(200).json({
      success: true,
      data: services,
    });
  }
  catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách dịch vụ",
      error: error.message,
    });
  }
};

export const getTrickById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate("jobIds", "name time description status isFirst")
      .populate("staffIds", "name role phone email status")
    if (!service || service.isDeleted === IS_DELETED.YES) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thủ thuật",
      });
    }
    res.status(200).json({
      success: true,
      data: service,
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
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("staffIds", "name role phone email status")
      .populate("jobIds", "name time description status isFrist");

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

export const softDeleteTrick = async (req, res) => {
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

export const hardDeleteTrick = async (req, res) => {
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

export const updateTrickStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const parsedStatus = parseInt(status);
    if (!Object.values(SERVICE_STATUS).includes(parsedStatus)) {
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

    service.status = parsedStatus;
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


