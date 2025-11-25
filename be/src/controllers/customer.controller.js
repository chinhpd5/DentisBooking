import Customer from "../models/customer.model";
export const createCustomer = async (req, res) => {
  try {
    const data = req.body;

    const existingCustomer = await Customer.findOne({ phone: data.phone });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại đã tồn tại",
      });
    }

    const newCustomer = await Customer.create(data);
    res.status(201).json({
      success: true,
      message: "Tạo khách hàng thành công",
      data: newCustomer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Không thể tạo khách hàng",
      error: error.message,
    });
}
};

export const getAllCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const query = {};

    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { phone: { $regex: searchTerm, $options: "i" } },
        { address: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const result = await Customer.paginate(query, options);
    
    res.status(200).json({
      success: true,
      data: result.docs,
      totalDocs: result.totalDocs,
      limit: result.limit,
      totalPages: result.totalPages,
      currentPage: result.page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách khách hàng",
      error: error.message,
    });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy khách hàng",
      });
    }
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết khách hàng",
      error: error.message,
    });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedCustomer = await Customer.findByIdAndUpdate(id, data, {  
      new: true,
      runValidators: true,
    });
    if (!updatedCustomer) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy khách hàng để cập nhật",
      });
    }
    res.status(200).json({
      success: true,
      message: "Cập nhật khách hàng thành công",
      data: updatedCustomer,
    });
  } catch (error) {
    res.status(400).json({
      success: false, 
      message: "Lỗi khi cập nhật khách hàng",
      error: error.message,
    });
  }
};

export const deleteCustomer = async (req, res) => {
  try { 
    const { id } = req.params;
    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy khách hàng để xóa",
      });
    }
    res.status(200).json({
      success: true,
      message: "Xóa khách hàng thành công",
      data: deletedCustomer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa khách hàng",
      error: error.message,
    });
  }
};

export const getCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const customer = await Customer.findOne({ phone });
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy khách hàng",
      });
    }
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy khách hàng theo số điện thoại",
      error: error.message,
    });
  }
};