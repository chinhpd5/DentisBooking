
export enum USER_STATUS {
  DISABLED = 0,
  ACTIVE = 1
}

export enum IS_DELETED {
  NO = 0,
  YES = 1
}

export enum USER_ROLE {
  CUSTOMER= "customer",
  STAFF= "staff", // Kỹ thuật viên
  ADMIN= "admin", // Super admin
  RECEPTIONIST= "receptionist", // Lễ tân
  DOCTOR= "doctor" // bác sỹ
}

export enum STAFF_STATUS {
  DISABLED= 0,
  ACTIVE= 1
}

export enum SEAT_STATUS {
  DISABLED = 0,
  AVAILABLE = 1,
  USING = 2,
  REPAIR = 3,
}

export enum JOB_STATUS {
  DISABLED = 0,
  ACTIVE = 1
}

export enum TRICK_STATUS {
  DISABLED = 0,
  ACTIVE = 1
}