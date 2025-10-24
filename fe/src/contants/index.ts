
export enum USER_STATUS {
  ACTIVE = 1,
  INACTIVE = 0
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
