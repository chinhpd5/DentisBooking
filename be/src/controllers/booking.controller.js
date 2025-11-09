import Booking from '../models/booking.model';
import Service from '../models/service.model.js';
import Staff from '../models/staff.model.js';
import StaffAssignment from '../models/staff-assignment.js';
import Customer from '../models/customer.model.js';
import { BOOKING_STATUS, IS_DELETED, SERVICE_TYPE, USER_ROLE } from '../utils/constants';

// Helper function to check time conflict in StaffAssignment
const hasStaffAssignmentConflict = async (staffId, timeStart, timeEnd, excludeBookingId = null) => {
  const query = {
    staffId,
    $or: [
      // New booking starts during existing assignment
      { timeStart: { $lte: timeStart }, timeEnd: { $gt: timeStart } },
      // New booking ends during existing assignment
      { timeStart: { $lt: timeEnd }, timeEnd: { $gte: timeEnd } },
      // New booking completely contains existing assignment
      { timeStart: { $gte: timeStart }, timeEnd: { $lte: timeEnd } },
    ],
  };
  
  if (excludeBookingId) {
    query.bookingId = { $ne: excludeBookingId };
  }
  
  const conflict = await StaffAssignment.findOne(query);
  return !!conflict;
};

// Helper function to check time conflict in Booking for doctor
const hasBookingConflict = async (doctorId, timeStart, timeEnd, excludeBookingId = null) => {
  const query = {
    doctorId,
    isDeleted: IS_DELETED.NO,
    $or: [
      // New booking starts during existing booking
      { appointmentDate: { $lte: timeStart }, timeEnd: { $gt: timeStart } },
      // New booking ends during existing booking
      { appointmentDate: { $lt: timeEnd }, timeEnd: { $gte: timeEnd } },
      // New booking completely contains existing booking
      { appointmentDate: { $gte: timeStart }, timeEnd: { $lte: timeEnd } },
    ],
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  const conflict = await Booking.findOne(query);
  return !!conflict;
};

// Helper function to auto-assign staff for jobIds
const autoAssignStaffForJobs = async (bookingId, service, appointmentDate, timeEnd) => {
  if (!service.jobIds || service.jobIds.length === 0 || !service.countStaff) {
    return [];
  }
  
  const countStaff = service.countStaff || 1;
  
  // Populate jobIds to get job details
  const populatedService = await Service.findById(service._id).populate('jobIds');
  if (!populatedService || !populatedService.jobIds) {
    return [];
  }
  
  const jobIds = populatedService.jobIds;
  
  // Get all available staff (STAFF role)
  const availableStaff = await Staff.find({
    role: USER_ROLE.STAFF,
    isDeleted: IS_DELETED.NO,
    status: 1, // ACTIVE
  });
  
  if (availableStaff.length === 0) {
    throw new Error('Không có KTV nào khả dụng');
  }
  
  // Extract all job IDs (ObjectId strings or objects)
  const allJobIds = jobIds.map(job => job._id || job);
  
  // Calculate total time for all jobs (sum of all job times in seconds)
  const totalJobTime = jobIds.reduce((total, job) => {
    return total + (job.time || 0); // job.time is in seconds
  }, 0);
  
  // Calculate timeStart and timeEnd based on appointmentDate and total job time
  const timeStart = new Date(appointmentDate);
  const timeEndDate = new Date(timeStart.getTime() + totalJobTime * 1000); // Convert seconds to milliseconds
  
  // Find available staff for the entire time period (all jobs)
  const assignedStaff = [];
  for (const staff of availableStaff) {
    if (assignedStaff.length >= countStaff) break;
    
    const hasConflict = await hasStaffAssignmentConflict(
      staff._id,
      timeStart,
      timeEndDate,
      bookingId
    );
    
    if (!hasConflict) {
      assignedStaff.push(staff);
    }
  }
  
  if (assignedStaff.length < countStaff) {
    throw new Error(`Không đủ KTV khả dụng. Cần ${countStaff} KTV nhưng chỉ có ${assignedStaff.length} KTV khả dụng`);
  }
  
  // Create staff assignments - each staff gets all jobIds
  const assignments = [];
  for (const staff of assignedStaff) {
    const assignment = await StaffAssignment.create({
      staffId: staff._id,
      serviceIds: allJobIds, // Lưu tất cả jobIds vào mỗi assignment
      timeStart: timeStart,
      timeEnd: timeEndDate, // timeStart + tổng thời gian của tất cả services trong serviceIds
      bookingId,
    });
    assignments.push(assignment._id);
  }
  
  return assignments;
};

export const createBooking = async (req, res) => {
  try {

    const data = req.body;
    console.log('data', data);
    
    // Get service to check type and jobIds
    const service = await Service.findById(data.serviceId);
    if (!service) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy dịch vụ',
      });
    }
    
    const serviceType = data.type || service.type;
    
    // Check for conflicts based on service type
    if (serviceType === SERVICE_TYPE.TRICK) {
      // For trick, check doctor conflict in Booking
      if (data.doctorId) {
        const hasConflict = await hasBookingConflict(
          data.doctorId,
          data.appointmentDate,
          data.timeEnd
        );
        
        if (hasConflict) {
          console.log('hasConflict', hasConflict);
          
          return res.status(409).json({
            success: false,
            message: 'Bác sĩ đã có lịch hẹn trong khoảng thời gian này',
          });
        }
      }
    } else if (serviceType === SERVICE_TYPE.JOB) {
      // For job, check staff conflict in StaffAssignment
      if (data.doctorId) {
        const hasConflict = await hasStaffAssignmentConflict(
          data.doctorId,
          data.appointmentDate,
          data.timeEnd
        );
        
        if (hasConflict) {
          return res.status(409).json({
            success: false,
            message: 'KTV đã có lịch hẹn trong khoảng thời gian này',
          });
        }
      }
    }
    
    // Prepare booking data - exclude doctorDate and doctorId for job type
    const bookingData = {
      ...data,
      type: serviceType,
    };
    
    // For job type, don't save doctorDate and doctorId to booking
    if (serviceType === SERVICE_TYPE.JOB) {
      delete bookingData.doctorDate;
      delete bookingData.doctorId;
    }
    
    // Calculate doctorDate for trick type (if not provided)
    if (serviceType === SERVICE_TYPE.TRICK && !bookingData.doctorDate) {
      const timeEndDate = new Date(data.timeEnd);
      const serviceTimeMs = (service.time || 0) * 1000;
      bookingData.doctorDate = new Date(timeEndDate.getTime() - serviceTimeMs);
    }
    
    const booking = await Booking.create(bookingData);
    
    // Handle staff assignments based on service type
    if (serviceType === SERVICE_TYPE.JOB) {
      // For job type, create StaffAssignment from doctorId (which is actually staffId)
      if (data.doctorId) {
        try {
          const assignment = await StaffAssignment.create({
            staffId: data.doctorId,
            serviceIds: [data.serviceId],
            timeStart: new Date(data.appointmentDate),
            timeEnd: new Date(data.timeEnd),
            bookingId: booking._id,
          });
          
          booking.staffAssignments = [assignment._id];
          await booking.save();
        } catch (error) {
          await Booking.findByIdAndDelete(booking._id);
          return res.status(400).json({
            success: false,
            message: error.message || 'Không thể tạo phân công KTV',
          });
        }
      }
    } else if (serviceType === SERVICE_TYPE.TRICK && service.jobIds && service.jobIds.length > 0 && service.countStaff) {
      // Auto-assign staff for jobs if it's a trick with jobIds and countStaff
      try {
        const staffAssignmentIds = await autoAssignStaffForJobs(
          booking._id,
          service,
          data.appointmentDate,
          data.timeEnd
        );
        
        // Update booking with staff assignments
        booking.staffAssignments = staffAssignmentIds;
        await booking.save();
      } catch (error) {
        // If auto-assignment fails, delete the booking
        await Booking.findByIdAndDelete(booking._id);
        return res.status(400).json({
          success: false,
          message: error.message || 'Không thể tự động phân công KTV',
        });
      }
    }
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('customerId', 'name phone email')
      .populate('doctorId', 'name role phone email')
      .populate('serviceId', 'name time description status')
      .populate({ 
        path: 'staffAssignments',
        populate: [
          { path: 'staffId', select: 'name role phone email status' },
          { path: 'serviceIds', select: 'name time description status' }
        ]
      });

    res.status(201).json({
      success: true,
      message: 'Tạo lịch hẹn thành công',
      data: populatedBooking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Không thể tạo lịch hẹn',
      error: error.message,
    });
  }
};

export const getListBooking = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '', // search by note
      status,
      doctorId,
      fromDate,
      toDate,
    } = req.query;

    const query = { isDeleted: IS_DELETED.NO };

    if (status !== undefined) query.status = status;
    if (doctorId) query.doctorId = doctorId;

    if (fromDate || toDate) {
      query.appointmentDate = {};
      if (fromDate) query.appointmentDate.$gte = new Date(fromDate);
      if (toDate) query.appointmentDate.$lte = new Date(toDate);
    }

    if (search) {
      // Search for customers by name or phone
      const searchTerm = search.trim();
      const customers = await Customer.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { phone: { $regex: searchTerm, $options: 'i' } },
        ],
      }).select('_id');
      
      const customerIds = customers.map(c => c._id);
      
      query.$or = [
        { note: { $regex: searchTerm, $options: 'i' } },
        ...(customerIds.length > 0 ? [{ customerId: { $in: customerIds } }] : []),
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'customerId', select: 'name phone email' },
        { path: 'doctorId', select: 'name role phone email' },
        { path: 'serviceId', select: 'name time description status' },
        { 
          path: 'staffAssignments',
          populate: [
            { path: 'staffId', select: 'name role phone email status' },
            { path: 'serviceIds', select: 'name time description status' }
          ]
        },
      ],
    };

    const result = await Booking.paginate(query, options);

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
      message: 'Lỗi khi lấy danh sách lịch hẹn',
      error: error.message,
    });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name phone email')
      .populate('doctorId', 'name role phone email')
      .populate('serviceId', 'name time description status')
      .populate({ 
        path: 'staffAssignments',
        populate: [
          { path: 'staffId', select: 'name role phone email status' },
          { path: 'serviceIds', select: 'name time description status' }
        ]
      });

    if (!booking || booking.isDeleted === IS_DELETED.YES) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết lịch hẹn',
      error: error.message,
    });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('customerId', 'name phone email')
      .populate('doctorId', 'name role phone email')
      .populate('serviceId', 'name time description status')
      .populate({ 
        path: 'staffAssignments',
        populate: [
          { path: 'staffId', select: 'name role phone email status' },
          { path: 'serviceIds', select: 'name time description status' }
        ]
      });

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn để cập nhật',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật lịch hẹn thành công',
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi cập nhật lịch hẹn',
      error: error.message,
    });
  }
};

export const softDeleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn để xóa',
      });
    }

    booking.isDeleted = IS_DELETED.YES;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Đã xóa lịch hẹn thành công',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch hẹn',
      error: error.message,
    });
  }
};

export const hardDeleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(400).json({
        success: false, 
        message: 'Không tìm thấy lịch hẹn để xóa',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã xóa lịch hẹn khỏi hệ thống thành công',
      deletedData: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch hẹn',
      error: error.message,
    });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comingTime, doingTime, completeTime } = req.body;

    if (!Object.values(BOOKING_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị trạng thái không hợp lệ',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn',
      });
    }

    const oldStatus = booking.status;
    const newStatus = status;
    
    // Nếu booking đã bị hủy, không cho phép đổi sang trạng thái khác
    if (oldStatus === BOOKING_STATUS.CANCELLED && newStatus !== BOOKING_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Booking đã hủy không thể đổi sang trạng thái khác',
      });
    }
    
    const currentTime = new Date();

    // Tự động lưu thời gian khi chuyển trạng thái
    // Chuyển từ "Đã đặt" sang "Đã đến" → lưu comingTime
    if (oldStatus === BOOKING_STATUS.BOOKED && newStatus === BOOKING_STATUS.ARRIVED) {
      booking.comingTime = comingTime ? new Date(comingTime) : currentTime;
    }
    // Chuyển từ "Đã đến" sang "Đang làm" → lưu doingTime
    else if (oldStatus === BOOKING_STATUS.ARRIVED && newStatus === BOOKING_STATUS.IN_PROGRESS) {
      booking.doingTime = doingTime ? new Date(doingTime) : currentTime;
    }
    // Chuyển từ "Đang làm" sang "Hoàn thành" → lưu completeTime
    else if (oldStatus === BOOKING_STATUS.IN_PROGRESS && newStatus === BOOKING_STATUS.COMPLETED) {
      booking.completeTime = completeTime ? new Date(completeTime) : currentTime;
    }

    booking.status = newStatus;
    
    await booking.save();

    const populatedBooking = await Booking.findById(id)
      .populate('customerId', 'name phone email')
      .populate('doctorId', 'name role phone email')
      .populate('serviceId', 'name time description status')
      .populate({ 
        path: 'staffAssignments',
        populate: [
          { path: 'staffId', select: 'name role phone email status' },
          { path: 'serviceIds', select: 'name time description status' }
        ]
      });

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái lịch hẹn thành công',
      data: populatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái lịch hẹn',
      error: error.message,
    });
  }
};

export const addStaffToBooking = async (req, res) => {
  try {
    const { id } = req.params; // booking id
    const { staffId, serviceIds, timeStart, timeEnd } = req.body;

    const booking = await Booking.findById(id);
    if (!booking || booking.isDeleted === IS_DELETED.YES) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy lịch hẹn' });
    }

    // Populate staffAssignments to check if staff is already assigned
    await booking.populate({
      path: 'staffAssignments',
      populate: { path: 'staffId' }
    });

    // Check if staff is already assigned
    const existingAssignment = booking.staffAssignments.find(
      (assignment) => assignment.staffId && assignment.staffId._id.toString() === staffId
    );

    if (!existingAssignment) {
      // Create new StaffAssignment
      const assignment = await StaffAssignment.create({
        staffId,
        serviceIds: serviceIds || [],
        timeStart: timeStart ? new Date(timeStart) : booking.appointmentDate,
        timeEnd: timeEnd ? new Date(timeEnd) : booking.timeEnd,
        bookingId: id,
      });

      booking.staffAssignments.push(assignment._id);
      await booking.save();
    }

    const refreshed = await Booking.findById(id)
      .populate('customerId', 'name phone email')
      .populate('doctorId', 'name role phone email')
      .populate('serviceId', 'name time description status')
      .populate({ 
        path: 'staffAssignments',
        populate: [
          { path: 'staffId', select: 'name role phone email status' },
          { path: 'serviceIds', select: 'name time description status' }
        ]
      });

    res.status(200).json({ success: true, message: 'Đã thêm nhân sự vào lịch hẹn', data: refreshed });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Không thể thêm nhân sự', error: error.message });
  }
};

export const getTodaySchedule = async (req, res) => {
  try {
    const { date, staffId, role } = req.query;
    
    // Use provided date or default to today
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Build query for bookings
    const bookingQuery = {
      isDeleted: IS_DELETED.NO,
      status: { $ne: BOOKING_STATUS.CANCELLED }, // Exclude cancelled bookings
      $or: [
        { appointmentDate: { $gte: targetDate, $lt: nextDay } },
        { doctorDate: { $gte: targetDate, $lt: nextDay } },
      ],
    };

    // Filter by staffId if provided
    if (staffId) {
      if (role === USER_ROLE.DOCTOR) {
        bookingQuery.doctorId = staffId;
      }
    }

    const bookings = await Booking.find(bookingQuery)
      .populate('customerId', 'name phone email address')
      .populate('doctorId', 'name role phone email status')
      .populate('serviceId', 'name time description status type')
      .populate({ 
        path: 'staffAssignments',
        populate: [
          { path: 'staffId', select: 'name role phone email status' },
          { path: 'serviceIds', select: 'name time description status' }
        ]
      });

    // Build query for staff assignments
    const assignmentQuery = {
      timeStart: { $gte: targetDate, $lt: nextDay },
    };

    // Filter by staffId if provided
    if (staffId && role === USER_ROLE.STAFF) {
      assignmentQuery.staffId = staffId;
    }

    const staffAssignments = await StaffAssignment.find(assignmentQuery)
      .populate('staffId', 'name role phone email status')
      .populate('serviceIds', 'name time description status')
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'customerId', select: 'name phone email address' },
          { path: 'serviceId', select: 'name time description status type' }
        ]
      });

    res.status(200).json({
      success: true,
      data: {
        bookings,
        staffAssignments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch',
      error: error.message,
    });
  }
};

export const removeStaffFromBooking = async (req, res) => {
  try {
    const { id } = req.params; // booking id
    const { staffId } = req.body;
    const booking = await Booking.findById(id);
    if (!booking || booking.isDeleted === IS_DELETED.YES) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy lịch hẹn' });
    }

    const assignment = await StaffAssignment.findOne({ bookingId: id, staffId });
    if (!assignment) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy phân công' });
    }
    await assignment.deleteOne();
    booking.staffAssignments = booking.staffAssignments.filter(assignment => assignment._id.toString() !== staffId);
    await booking.save();
    res.status(200).json({ success: true, message: 'Đã xóa nhân sự khỏi lịch hẹn', data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Không thể xóa nhân sự', error: error.message });
  }
};


