import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { IS_DELETED, USER_STATUS } from "../utils/constants";

export const register = async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Tên đăng nhập đã tồn tại, vui lòng chọn tên khác",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      username,
      password: hashedPassword,
      role: role || USER_ROLE.STAFF,
      active: USER_STATUS.ACTIVE,
      isDeleted: IS_DELETED.NO,
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      data: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi đăng ký tài khoản",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({
      username,
      isDeleted: IS_DELETED.NO,
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản",
      });
    }

    if (user.status != USER_STATUS.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị khóa hoặc chưa kích hoạt",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu không chính xác",
      });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    // const refreshToken = jwt.sign(
    //   { id: user._id },
    //   process.env.JWT_REFRESH_SECRET,
    //   { expiresIn: "7d" } // 7 ngày
    // );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: userResponse,
        accessToken,
        // refreshToken,
      },
    });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({
      success: false,
      message: "Lỗi khi đăng nhập",
      error: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      role, 
      active 
    } = req.query;

    const query = { isDeleted: IS_DELETED.NO };
    if (role) query.role = role;
    if (active) query.active = active;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: "staffId",
      select: "-password", 
    };

    const result = await User.paginate(query, options);

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
      message: "Lỗi khi lấy danh sách người dùng",
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").populate("staffId");
    if (!user || user.isDeleted === IS_DELETED.YES) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết người dùng",
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {

    const { username, password, ...rest } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, rest, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng để cập nhật",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật người dùng thành công",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi cập nhật người dùng",
      error: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng để xóa",
      });
    }

    user.isDeleted = IS_DELETED.YES;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Đã xóa người dùng (xóa mềm) thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa người dùng",
      error: error.message,
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (!Object.values(USER_STATUS).includes(active)) {
      return res.status(400).json({
        success: false,
        message: "Giá trị trạng thái không hợp lệ",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    user.active = active;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái người dùng thành công",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái người dùng",
      error: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu cũ không chính xác",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi đổi mật khẩu",
      error: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { id } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản",
      });
    }

    const hashedPassword = await bcrypt.hash("123456", 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi đặt lại mật khẩu",
      error: error.message,
    });
  }
};