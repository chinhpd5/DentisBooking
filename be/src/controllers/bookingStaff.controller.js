import BookingStaff from '../models/bookingStaff.model';
import Booking from '../models/booking.model';
import Staff from '../models/staff.model';

export const createBookingStaff = async (req, res) => {
  try {
    const { bookingId, staffId } = req.body;

    if (!bookingId || !staffId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu bookingId hoặc staffId',
      });
    }

    // Validate references exist (best-effort)
    const [booking, staff] = await Promise.all([
      Booking.findById(bookingId),
      Staff.findById(staffId),
    ]);

    if (!booking) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy lịch hẹn' });
    }
    if (!staff) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy nhân sự' });
    }

    const doc = await BookingStaff.create({ bookingId, staffId });

    const populated = await BookingStaff.findById(doc._id)
      .populate('bookingId', 'appointmentDate note status')
      .populate('staffId', 'name role phone email status');

    res.status(201).json({
      success: true,
      message: 'Gán nhân sự vào lịch hẹn thành công',
      data: populated,
    });
  } catch (error) {
    // Handle duplicate key error from unique index (bookingId + staffId)
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Nhân sự đã được gán cho lịch hẹn này',
      });
    }
    res.status(400).json({
      success: false,
      message: 'Không thể gán nhân sự cho lịch hẹn',
      error: error.message,
    });
  }
};

export const getAllBookingStaff = async (req, res) => {
  try {
    const { bookingId, staffId } = req.query;

    const query = {};
    if (bookingId) query.bookingId = bookingId;
    if (staffId) query.staffId = staffId;

    const list = await BookingStaff.find(query)
      .sort({ createdAt: -1 })
      .populate('bookingId', 'appointmentDate note status')
      .populate('staffId', 'name role phone email status');

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phân công',
      error: error.message,
    });
  }
};

export const getBookingStaffById = async (req, res) => {
  try {
    const doc = await BookingStaff.findById(req.params.id)
      .populate('bookingId', 'appointmentDate note status')
      .populate('staffId', 'name role phone email status');

    if (!doc) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy phân công' });
    }

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết phân công',
      error: error.message,
    });
  }
};

export const deleteBookingStaff = async (req, res) => {
  try {
    const doc = await BookingStaff.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy phân công để xóa' });
    }
    res.status(200).json({ success: true, message: 'Đã xóa phân công thành công', deletedData: doc });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phân công',
      error: error.message,
    });
  }
};

export const addManyStaffToBooking = async (req, res) => {
  try {
    const { bookingId, staffIds } = req.body;
    if (!bookingId || !Array.isArray(staffIds)) {
      return res.status(400).json({ success: false, message: 'Thiếu bookingId hoặc staffIds' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy lịch hẹn' });
    }

    const docs = staffIds.map((sid) => ({ bookingId, staffId: sid }));
    await BookingStaff.insertMany(docs, { ordered: false }).catch(() => {});

    const refreshed = await BookingStaff.find({ bookingId })
      .populate('bookingId', 'appointmentDate note status')
      .populate('staffId', 'name role phone email status');

    res.status(200).json({ success: true, message: 'Đã gán nhiều nhân sự cho lịch hẹn', data: refreshed });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Không thể gán nhiều nhân sự', error: error.message });
  }
};



