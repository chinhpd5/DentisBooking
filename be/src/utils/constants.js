export const IS_DELETED = Object.freeze({
  NO: 0,
  YES: 1,
});

export const SEAT_STATUS = Object.freeze({
  DISABLED: 0,
  AVAILABLE: 1,
  USING: 2,
  REPAIR: 3,
});

// export const TRICK_STATUS = Object.freeze({
//   DISABLED: 0,
//   ACTIVE: 1,
// });

export const USER_STATUS = Object.freeze({
  DISABLED: 0,
  ACTIVE: 1,
});

export const USER_ROLE = Object.freeze({
  CUSTOMER: "customer",
  STAFF: "staff", // Kỹ thuật viên
  ADMIN: "admin", // Super admin
  RECEPTIONIST: "receptionist", // Lễ tân
  DOCTOR: "doctor" // bác sỹ
});

export const SERVICE_STATUS = Object.freeze({
  DISABLED: 0,
  ACTIVE: 1
});

export const STAFF_STATUS = Object.freeze({
  DISABLED: 0,
  ACTIVE: 1
});

// Keep backward compatibility
export const JOB_STATUS = SERVICE_STATUS;
export const TRICK_STATUS = SERVICE_STATUS;

export const BOOKING_STATUS = Object.freeze({
  BOOKED: "booked",              // Đã đặt
  ARRIVED: "arrived",            // Đã đến
  IN_PROGRESS: "inProgress",    // Đang làm
  COMPLETED: "completed",        // Hoàn thành
  CANCELLED: "cancelled",        // Hủy
  CHANGED: "changed",            // Thay đổi lịch
})

export const SERVICE_TYPE = Object.freeze({
  JOB: "job",
  TRICK: "trick",
})